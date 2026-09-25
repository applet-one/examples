import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { Writable } from 'node:stream';

export function expandRoot(root) {
  if (typeof root !== 'string' || !root.trim()) throw Error('Enter a Pi sessions folder');
  const input = root.trim();
  if (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}){2}$/i.test(input)) throw Error('That looks like a daemon token, not a sessions folder. Rotate this exposed token in the dashboard.');
  if (input === '~') return os.homedir();
  if (input.startsWith('~/')) return path.resolve(os.homedir(), input.slice(2));
  if (input.startsWith('~')) throw Error('Use ~/ for your home folder (other users are not supported)');
  return path.resolve(input);
}
export function checkUrl(url) {
  const u = new URL(url);
  if (u.protocol !== 'wss:' && !(u.protocol === 'ws:' && ['localhost', '127.0.0.1'].includes(u.hostname))) throw Error('Use wss:// (ws:// is only allowed for localhost)');
  return url;
}
export async function saveConfig(file, config) {
  checkUrl(config.url);
  if (!config.token || config.token.length < 32) throw Error('Paste the full daemon token from the dashboard');
  if (!Array.isArray(config.roots) || !config.roots.length || config.roots.some(root => !path.isAbsolute(root))) throw Error('Session root must be an absolute path');
  if (config.contentMode !== 'activity-only') throw Error('Only activity-only mode is supported');
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + '.' + process.pid + '.tmp';
  try {
    await fs.writeFile(temp, JSON.stringify(config, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await fs.rename(temp, file);
  } finally { await fs.rm(temp, { force: true }); }
}
// A separate readline interface with a sink prevents terminal input being echoed.
async function readSecret() {
  if (!process.stdin.isTTY) throw Error('Setup requires an interactive terminal to hide the token');
  process.stdout.write('Paste daemon token (hidden), then press Enter: ');
  const sink = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const rl = readline.createInterface({ input: process.stdin, output: sink, terminal: true });
  try { return (await rl.question('')).trim(); }
  finally { rl.close(); process.stdout.write('\n'); }
}
export async function interactiveSetup(file) {
  if (!process.stdin.isTTY) throw Error('Setup requires an interactive terminal');
  let existing = {};
  try {
    const st = await fs.stat(file);
    if (st.mode & 0o077) throw Error(`Fix permissions first: chmod 600 ${file}`);
    existing = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  console.log('First, paste the token from Add daemon / Rotate. It will not be echoed.');
  const token = await readSecret();
  if (!token || token.length < 32 || /\s/.test(token) || token.includes('/')) throw Error('No valid daemon token entered. Copy the token (not the URL) from the dashboard and retry setup.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let url, root;
  try {
    const suggestedUrl = existing.url || '';
    url = (await rl.question(`Ingest URL${suggestedUrl ? ` [${suggestedUrl}]` : ''}: `)).trim() || suggestedUrl;
    checkUrl(url);
    const suggestedRoot = existing.roots?.[0] || path.join(os.homedir(), '.pi/agent/sessions');
    root = (await rl.question(`Pi sessions folder [${suggestedRoot}]: `)).trim() || suggestedRoot;
    root = expandRoot(root);
  } finally { rl.close(); }
  await saveConfig(file, { ...existing, url, roots: [root], contentMode: 'activity-only', token });
  console.log(`Saved private config at ${file}. Start with: node daemon/index.js`);
}
