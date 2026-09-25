#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes, createHmac } from 'node:crypto';
import WebSocket from 'ws';
import { activity, parseLines } from './activity.js';
import { emptyStats, updateStats } from './stats.js';
import { interactiveSetup, checkUrl, expandRoot } from './setup.js';

const configPath = process.env.STATION_CONFIG || fileURLToPath(new URL('../config.json', import.meta.url));
const statePath = path.join(path.dirname(configPath), 'state.json');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function atomic(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + '.' + process.pid + '.tmp';
  try { await fs.writeFile(temp, JSON.stringify(data), { flag: 'wx', mode: 0o600 }); await fs.rename(temp, file); }
  finally { await fs.rm(temp, { force: true }); }
}
async function loadConfig() {
  const stat = await fs.stat(configPath);
  if (stat.mode & 0o077) throw Error(`Config must be mode 0600: ${configPath}`);
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  if (!config.token || config.token.startsWith('PASTE_') || !Array.isArray(config.roots) || !config.roots.length) throw Error('No daemon token configured. Run node daemon/index.js setup.');
  checkUrl(config.url);
  config.roots = config.roots.map(expandRoot);
  return config;
}
async function walk(root) {
  const files = [];
  async function visit(dir) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await visit(p);
      else if (e.isFile() && e.name.endsWith('.jsonl')) files.push(p);
      // Symlinks are never traversed.
    }
  }
  try { await visit(root); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return files;
}
export function opaqueProjectKey(directory, salt) {
  return createHmac('sha256', salt).update(directory).digest('hex').slice(0, 24);
}
export function enqueue(state, pulse, locked = 0) {
  const index = state.queue.findIndex((x, i) => i >= locked && x.sid === pulse.sid);
  if (index >= 0) state.queue[index] = pulse; // Last saved event is all the dashboard needs.
  else if (state.queue.length < 2000) state.queue.push(pulse);
  else state.error = 'Activity queue full; scanning paused';
}
export async function scan(config, state, locked = 0) {
  const files = (await Promise.all(config.roots.map(walk))).flat();
  const stats = await Promise.all(files.map(p => fs.stat(p)));
  const cutoff = Date.now() - (config.lookbackDays ?? 1) * 86400000;
  const selected = files.map((p, i) => ({ p, st: stats[i] })).filter(x => state.files[x.p] || x.st.mtimeMs >= cutoff)
    .sort((a, b) => b.st.mtimeMs - a.st.mtimeMs).slice(0, config.maxSessions ?? 30);
  for (const { p, st } of selected) {
    const identity = `${st.dev}:${st.ino}:${st.birthtimeMs}`;
    let file = state.files[p];
    if (!file || file.identity !== identity || st.size < file.offset) file = state.files[p] = { identity, offset: 0, sid: '', project: '', projectKey: '', stats: emptyStats(), discard: false };
    let latest = null, remaining = config.maxBytesPerScan ?? 1048576;
    while (file.offset < st.size && remaining > 0 && state.queue.length < 2000) {
      const size = Math.min(131072, st.size - file.offset, remaining), bytes = Buffer.alloc(size);
      const handle = await fs.open(p, 'r');
      try { await handle.read(bytes, 0, size, file.offset); } finally { await handle.close(); }
      if (file.discard) {
        const end = bytes.indexOf(10);
        if (end < 0) { file.offset += size; remaining -= size; continue; }
        file.offset += end + 1; remaining -= end + 1; file.discard = false; continue;
      }
      const { records, consumed } = parseLines(bytes);
      if (!consumed && size === 131072) { file.discard = true; file.offset += size; remaining -= size; state.error = 'Skipped oversized JSONL line'; continue; }
      if (!consumed) break; // Wait for a newline, including a partial UTF-8 character.
      for (const item of records) {
        if (item.error) { state.error = `Skipped ${item.error} JSONL line`; continue; }
        const raw = item.value;
        if (raw.type === 'session') {
          const header = activity(raw, file.sid || path.basename(p, '.jsonl'), file.project);
          file.sid = header.sid; file.project = header.project;
          file.projectKey = opaqueProjectKey(raw.cwd || path.dirname(p), state.projectSalt);
        } else {
          if (!file.sid) file.sid = path.basename(p, '.jsonl').slice(0, 150);
          if (!file.projectKey) file.projectKey = opaqueProjectKey(path.dirname(p), state.projectSalt);
          updateStats(file.stats, raw);
          latest = activity(raw, file.sid, file.project, new Date(st.mtimeMs).toISOString(), file.projectKey, file.stats) || latest;
        }
      }
      file.offset += consumed; remaining -= consumed;
    }
    if (latest) enqueue(state, latest, locked);
  }
}
function connect(config) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(config.url, { headers: { Authorization: `Bearer ${config.token}` }, maxPayload: 65536 });
    ws.once('open', () => resolve(ws)); ws.once('error', reject);
  });
}
export function migrate(old) {
  if (old.version === 2 && old.projectSalt && old.statsVersion === 1) return old;
  // Re-scan recent files once to add directory keys and file-local aggregates.
  // Old conversation queues, if any, are discarded rather than transmitted.
  return { version: 2, statsVersion: 1, installationId: old.installationId || randomUUID(), projectSalt: old.projectSalt || randomBytes(32).toString('hex'), files: {}, queue: [], seq: 0 };
}
export async function run(config) {
  let state;
  try { state = JSON.parse(await fs.readFile(statePath, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; state = {}; }
  if (state.version !== 2 || !state.projectSalt || state.statsVersion !== 1) {
    // Discard old queued content or keyless pulses and re-scan for bounded summaries.
    // The directory HMAC salt never leaves this host.
    state = migrate(state);
    await atomic(statePath, state);
  }
  if (!Array.isArray(state.queue) || !state.files) throw Error('Invalid state file');
  let ws, awaiting = null, backoff = 1000, lastHeartbeat = 0, saving = Promise.resolve();
  const save = () => { const snapshot = structuredClone(state); saving = saving.then(() => atomic(statePath, snapshot)); return saving; };
  for (;;) {
    try {
      if (state.queue.length < 2000) await scan(config, state, awaiting?.count || 0);
      else state.error = 'Activity queue full; scanning paused';
      await save(); // Persist progress and summaries before sending.
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        ws = await connect(config); awaiting = null; backoff = 1000;
        ws.on('error', () => {});
        ws.on('message', async data => {
          let message; try { message = JSON.parse(String(data)); } catch { return; }
          if (message.type === 'ack' && awaiting && message.seq === state.seq + 1) {
            state.queue.splice(0, awaiting.count); state.seq = message.seq; awaiting = null; state.error = ''; await save();
          }
          if (message.type === 'error') { state.error = `${message.code}: ${message.message}`; awaiting = null; await save(); ws.close(); }
        });
        ws.send(JSON.stringify({ v: 2, type: 'hello', contentMode: 'activity-only', installationId: state.installationId, backlog: state.queue.length }));
      }
      if (Date.now() - lastHeartbeat > 30000) {
        ws.send(JSON.stringify({ v: 2, type: 'heartbeat', contentMode: 'activity-only', backlog: state.queue.length, error: state.error || '' })); lastHeartbeat = Date.now();
      }
      if (!awaiting && state.queue.length) {
        const records = state.queue.slice(0, 25);
        ws.send(JSON.stringify({ v: 2, type: 'batch', seq: state.seq + 1, records }));
        awaiting = { at: Date.now(), count: records.length };
      }
      if (awaiting && Date.now() - awaiting.at > 15000) { ws.terminate(); ws = null; awaiting = null; }
      await sleep(config.scanIntervalMs || 3000);
    } catch (e) {
      state.error = String(e.message).replace(config.token, '[token]'); await save();
      console.error('Station:', state.error);
      if (ws) ws.terminate(); ws = null; awaiting = null;
      await sleep(backoff + Math.random() * 500); backoff = Math.min(backoff * 2, 60000);
    }
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'setup') { try { await interactiveSetup(configPath); } catch (e) { console.error(e.message); process.exitCode = 1; } }
  else if (process.argv[2] === 'health') {
    try { const state = JSON.parse(await fs.readFile(statePath, 'utf8')); console.log(JSON.stringify({ version: state.version || 1, files: Object.keys(state.files).length, backlog: state.queue.length, lastAck: state.seq, error: state.error || '' })); }
    catch (e) { console.error(e.message); process.exitCode = 1; }
  } else { try { await run(await loadConfig()); } catch (e) { console.error(e.message); process.exitCode = 1; } }
}
