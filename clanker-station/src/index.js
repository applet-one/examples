import { page } from './page.js';
import { style } from './style.js';
import { client } from './client.js';
import { SETUP_KEY } from './setup-key.js';
import { fields as statFields } from '../daemon/stats.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
const err = (message, status = 400) => json({ error: message }, status);
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('');
const random = () => crypto.randomUUID() + crypto.randomUUID();
const valid = (value, max = 160) => typeof value === 'string' && value.length > 0 && value.length <= max;
const sameOrigin = request => !request.headers.get('Origin') || request.headers.get('Origin') === new URL(request.url).origin;
const cookie = (value, secure) => `station=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure ? '; Secure' : ''}`;
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return Array.from(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256))).map(x => x.toString(16).padStart(2, '0')).join('');
}
export class AppletState {
  constructor(ctx, env) { this.sql = ctx.storage.sql; this.env = env || {}; this.live = new Map(); this.viewers = new Map(); }
  init() {
    this.sql.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, salt TEXT, hash TEXT)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS logins (token_hash TEXT PRIMARY KEY, user_id TEXT, expires INTEGER)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS daemons (id TEXT PRIMARY KEY, user_id TEXT, name TEXT, token_hash TEXT, revoked INTEGER DEFAULT 0, heartbeat INTEGER, mode TEXT, backlog INTEGER DEFAULT 0, last_error TEXT)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS agents (daemon_id TEXT, sid TEXT, project TEXT, last_at TEXT, kind TEXT, model TEXT, project_key TEXT, stats TEXT, PRIMARY KEY(daemon_id,sid))');
    const agentColumns = this.list('PRAGMA table_info(agents)').map(column => column.name);
    if (!agentColumns.includes('project_key')) this.sql.exec('ALTER TABLE agents ADD COLUMN project_key TEXT');
    if (!agentColumns.includes('stats')) this.sql.exec('ALTER TABLE agents ADD COLUMN stats TEXT');
    this.sql.exec('CREATE TABLE IF NOT EXISTS changes (seq INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, daemon_id TEXT, at INTEGER)');
    // Legacy tables contain conversations from v1. Do not read them except to offer explicit deletion.
    this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (daemon_id TEXT, sid TEXT, cwd TEXT, created TEXT, name TEXT, last_at TEXT, PRIMARY KEY(daemon_id,sid))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS entries (daemon_id TEXT, sid TEXT, eid TEXT, parent TEXT, kind TEXT, at TEXT, payload TEXT, received INTEGER, PRIMARY KEY(daemon_id,sid,eid))');
    if (!this.lastPrune || Date.now() - this.lastPrune > 3600000) {
      this.sql.exec('DELETE FROM changes WHERE at<?', Date.now() - 30 * 86400000);
      this.sql.exec('DELETE FROM agents WHERE last_at<?', new Date(Date.now() - 30 * 86400000).toISOString());
      this.lastPrune = Date.now();
    }
  }
  one(query, ...args) { return this.sql.exec(query, ...args).toArray()[0]; }
  list(query, ...args) { return this.sql.exec(query, ...args).toArray(); }
  async user(request) {
    const token = /(?:^|;\s*)station=([^;]+)/.exec(request.headers.get('cookie') || '')?.[1];
    if (!token) return null;
    return this.one('SELECT user_id FROM logins WHERE token_hash=? AND expires>?', await hash(token), Date.now())?.user_id;
  }
  notify(uid, daemonId) {
    const cursor = this.one('INSERT INTO changes(user_id,daemon_id,at) VALUES(?,?,?) RETURNING seq', uid, daemonId, Date.now()).seq;
    for (const [ws, user] of this.viewers) if (user === uid) {
      try { if (ws.bufferedAmount > 100000) ws.close(1013, 'Slow subscriber'); else ws.send(JSON.stringify({ type: 'change', cursor })); }
      catch { this.viewers.delete(ws); }
    }
  }
  async fetch(request) {
    this.init();
    const url = new URL(request.url), path = url.pathname, method = request.method;
    if ((path === '/' || path === '/demo') && method === 'GET') return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'" } });
    if (path === '/style.css' && method === 'GET') return new Response(style, { headers: { 'content-type': 'text/css; charset=utf-8' } });
    if (path === '/app.js' && method === 'GET') return new Response(client, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' } });
    if (!sameOrigin(request)) return err('Invalid origin', 403);
    if (path === '/api/setup' && method === 'GET') return json({ ready: !!this.one('SELECT id FROM users LIMIT 1') });
    if (path === '/api/setup' && method === 'POST') {
      if (this.one('SELECT id FROM users LIMIT 1')) return err('Already initialized', 403);
      const b = await request.json(), key = this.env.STATION_SETUP_KEY || SETUP_KEY;
      if (!key || !valid(b.email, 254) || !valid(b.password, 1024) || b.password.length < 12 || b.key !== key) return err('Invalid setup details');
      const id = crypto.randomUUID(), salt = random();
      this.sql.exec('INSERT INTO users VALUES(?,?,?,?)', id, b.email.toLowerCase(), salt, await passwordHash(b.password, salt));
      return json({ ok: true });
    }
    if (path === '/api/login' && method === 'POST') {
      const b = await request.json(), user = this.one('SELECT * FROM users WHERE email=?', String(b.email || '').toLowerCase());
      if (!user || await passwordHash(String(b.password || ''), user.salt) !== user.hash) return err('Invalid credentials', 401);
      const token = random(); this.sql.exec('INSERT INTO logins VALUES(?,?,?)', await hash(token), user.id, Date.now() + 604800000);
      return new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'set-cookie': cookie(token, url.protocol === 'https:') } });
    }
    if (path === '/ingest' && method === 'GET') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return err('WebSocket required', 426);
      const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
      const daemon = token && this.one('SELECT * FROM daemons WHERE token_hash=? AND revoked=0', await hash(token));
      if (!daemon) return err('Unauthorized', 401);
      const pair = new WebSocketPair(), ws = pair[1]; ws.accept(); this.live.set(ws, daemon.id);
      ws.send(JSON.stringify({ type: 'welcome', v: 2, daemonId: daemon.id }));
      ws.addEventListener('message', event => { this.ingest(ws, daemon, event.data).catch(() => { try { ws.send(JSON.stringify({ type: 'error', code: 'invalid', message: 'Invalid activity message' })); } catch {} }); });
      ws.addEventListener('close', () => this.live.delete(ws));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    const uid = await this.user(request);
    if (path === '/api/logout' && method === 'POST') {
      const token = /station=([^;]+)/.exec(request.headers.get('cookie') || '')?.[1];
      if (token && uid) this.sql.exec('DELETE FROM logins WHERE token_hash=?', await hash(token));
      return new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'set-cookie': cookie('', url.protocol === 'https:') + '; Max-Age=0' } });
    }
    if (!uid) return err('Login required', 401);
    if (path === '/updates') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return err('WebSocket required', 426);
      const pair = new WebSocketPair(), ws = pair[1]; ws.accept(); this.viewers.set(ws, uid);
      ws.addEventListener('close', () => this.viewers.delete(ws));
      ws.send(JSON.stringify({ type: 'ready' }));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (path === '/api/snapshot' && method === 'GET') {
      const daemons = this.list('SELECT id,name,heartbeat,mode,backlog,last_error,revoked FROM daemons WHERE user_id=? ORDER BY name', uid)
        .map(d => ({ ...d, status: d.revoked ? 'revoked' : ![...this.live.values()].includes(d.id) ? 'offline' : Date.now() - (d.heartbeat || 0) > 90000 ? 'stalled' : 'connected' }));
      const agents = this.list('SELECT a.daemon_id,a.sid,a.project,a.project_key AS projectKey,a.last_at,a.kind,a.model,a.stats,d.name AS machine FROM agents a JOIN daemons d ON d.id=a.daemon_id WHERE d.user_id=? ORDER BY a.last_at DESC LIMIT 150', uid).map(a => ({ ...a, stats: a.stats ? JSON.parse(a.stats) : null }));
      const archived = !!this.one('SELECT 1 FROM entries e JOIN daemons d ON d.id=e.daemon_id WHERE d.user_id=? LIMIT 1', uid);
      return json({ daemons, agents, archived });
    }
    if (path === '/api/daemons' && method === 'POST') {
      const b = await request.json(); if (!valid(b.name, 80)) return err('Name required');
      const id = crypto.randomUUID(), token = random();
      this.sql.exec('INSERT INTO daemons(id,user_id,name,token_hash) VALUES(?,?,?,?)', id, uid, b.name, await hash(token));
      this.notify(uid, id);
      return json({ id, token, url: `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/ingest` });
    }
    if (path === '/api/daemon-action' && method === 'POST') {
      const b = await request.json();
      if (!this.one('SELECT id FROM daemons WHERE id=? AND user_id=?', b.id, uid)) return err('Not found', 404);
      if (b.action === 'revoke' || b.action === 'remove' || b.action === 'rotate') {
        this.sql.exec('UPDATE daemons SET revoked=1,token_hash=NULL WHERE id=?', b.id);
        for (const [ws, id] of this.live) if (id === b.id) { this.live.delete(ws); ws.close(1008, 'Credential changed'); }
      }
      if (b.action === 'rotate') {
        const token = random(); this.sql.exec('UPDATE daemons SET token_hash=?,revoked=0 WHERE id=?', await hash(token), b.id);
        this.notify(uid, b.id);
        return json({ token, url: `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/ingest` });
      }
      if (b.action === 'remove') {
        this.sql.exec('DELETE FROM agents WHERE daemon_id=?', b.id);
        this.sql.exec('DELETE FROM entries WHERE daemon_id=?', b.id);
        this.sql.exec('DELETE FROM sessions WHERE daemon_id=?', b.id);
        this.sql.exec('DELETE FROM daemons WHERE id=? AND user_id=?', b.id, uid);
      } else if (b.action === 'rename' && valid(b.name, 80)) this.sql.exec('UPDATE daemons SET name=? WHERE id=?', b.name, b.id);
      else if (b.action !== 'revoke') return err('Invalid action');
      this.notify(uid, b.id); return json({ ok: true });
    }
    if (path === '/api/purge-archive' && method === 'POST') {
      this.sql.exec('DELETE FROM entries WHERE daemon_id IN (SELECT id FROM daemons WHERE user_id=?)', uid);
      this.sql.exec('DELETE FROM sessions WHERE daemon_id IN (SELECT id FROM daemons WHERE user_id=?)', uid);
      this.notify(uid, 'archive'); return json({ ok: true });
    }
    return err('Not found', 404);
  }
  async ingest(ws, daemon, data) {
    if (typeof data !== 'string' || data.length > 65536) { ws.close(1009, 'Message too large'); return; }
    if (!this.one('SELECT id FROM daemons WHERE id=? AND revoked=0 AND token_hash=?', daemon.id, daemon.token_hash)) { ws.close(1008, 'Revoked'); return; }
    const message = JSON.parse(data);
    if (message.v !== 2) { ws.send(JSON.stringify({ type: 'error', code: 'version', message: 'Activity-only daemon v2 required; stop and restart the updated daemon' })); ws.close(1008, 'Upgrade daemon'); return; }
    if (message.type === 'hello' || message.type === 'heartbeat') {
      if (message.contentMode !== 'activity-only') throw Error('Mode');
      this.sql.exec('UPDATE daemons SET heartbeat=?,mode=?,backlog=?,last_error=? WHERE id=?', Date.now(), 'activity-only', Math.max(0, Math.min(2000, Number(message.backlog) || 0)), String(message.error || '').slice(0, 160), daemon.id);
      this.notify(daemon.user_id, daemon.id); return;
    }
    if (message.type !== 'batch' || !Number.isSafeInteger(message.seq) || message.seq < 1 || !Array.isArray(message.records) || !message.records.length || message.records.length > 25) throw Error('Batch');
    for (const x of message.records) {
      if (!x || Object.keys(x).some(key => !['type', 'sid', 'project', 'projectKey', 'at', 'kind', 'model', 'stats'].includes(key)) || x.type !== 'pulse' || !valid(x.sid, 150) || !valid(x.project, 100) || !valid(x.at, 80) || Number.isNaN(Date.parse(x.at)) || !valid(x.kind, 40) || (x.projectKey !== undefined && !/^[0-9a-f]{24}$/.test(x.projectKey)) || typeof x.model !== 'string' || x.model.length > 100 || (x.stats !== undefined && (!x.stats || typeof x.stats !== 'object' || Array.isArray(x.stats) || Object.keys(x.stats).some(key => !statFields.includes(key) || typeof x.stats[key] !== 'number' || !Number.isFinite(x.stats[key]) || x.stats[key] < 0 || x.stats[key] > (key === 'costUsd' ? 1e8 : 1e12))))) throw Error('Pulse');
    }
    for (const x of message.records) {
      const previous = this.one('SELECT last_at,project_key,stats FROM agents WHERE daemon_id=? AND sid=?', daemon.id, x.sid);
      const oldStats = previous?.stats ? JSON.parse(previous.stats) : null;
      const stats = x.stats ? Object.fromEntries(statFields.map(key => [key, Math.max(oldStats?.[key] || 0, x.stats[key] || 0)])) : oldStats;
      const incoming = Date.parse(x.at), last = previous ? Date.parse(previous.last_at) : -Infinity;
      if (!previous || incoming > last || (incoming === last && ((x.projectKey && previous.project_key !== x.projectKey) || JSON.stringify(stats) !== JSON.stringify(oldStats)))) {
        this.sql.exec('INSERT INTO agents(daemon_id,sid,project,last_at,kind,model,project_key,stats) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(daemon_id,sid) DO UPDATE SET project=excluded.project,last_at=excluded.last_at,kind=excluded.kind,model=excluded.model,project_key=excluded.project_key,stats=excluded.stats', daemon.id, x.sid, x.project, x.at, x.kind, x.model, x.projectKey || previous?.project_key || `legacy:${x.project}`, stats ? JSON.stringify(stats) : null);
      }
    }
    ws.send(JSON.stringify({ type: 'ack', seq: message.seq })); this.notify(daemon.user_id, daemon.id);
  }
}
export default { fetch(request, env) { return env.APPLET_STATE.get(env.APPLET_STATE.idFromName('default')).fetch(request); } };
