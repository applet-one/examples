import { assets } from '../generated/assets.js';
import { emptyState, member, snapshot, createMember, mutate, fail, HttpError } from './model.js';

const headers = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" };
const json = (value, status = 200) => Response.json(value, { status, headers });
async function digest(token) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
async function readBody(request) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') fail(400, 'Use application/json.');
  const reader = request.body?.getReader();
  if (!reader) fail(400, 'JSON body required.');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16384) fail(413, 'Request too large.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  let body;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail(400, 'Invalid JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'JSON object required.');
  return body;
}
export class AppletState {
  constructor(ctx) {
    this.ctx = ctx;
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)');
  }
  load() { const row = this.sql.exec('SELECT data FROM workspace WHERE id = 1').toArray()[0]; return row ? JSON.parse(row.data) : emptyState(); }
  save(state) {
    state.version++;
    this.sql.exec('INSERT INTO workspace (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data', JSON.stringify(state));
  }
  broadcast(state) {
    for (const ws of this.ctx.getWebSockets()) {
      try {
        const attachment = ws.deserializeAttachment();
        const user = state.members.find(m => m.id === attachment?.userId && m.hash === attachment?.hash && !m.revoked);
        if (!user) { ws.close(4001, 'Access revoked'); continue; }
        ws.send(JSON.stringify(snapshot(state, user)));
      } catch { try { ws.close(1011, 'Reconnect'); } catch {} }
    }
  }
  async fetch(request) {
    try { return await this.route(request); }
    catch (error) {
      if (!(error instanceof HttpError)) console.error('Workspace request failed:', error.message);
      return json({ error: error instanceof HttpError ? error.message : 'Something went wrong. Please retry.' }, error.status || 500);
    }
  }
  async route(request) {
    const url = new URL(request.url), path = url.pathname;
    if (!path.startsWith('/api/')) {
      const asset = assets[path];
      if (!asset) fail(404, 'Not found.');
      if (!['GET', 'HEAD'].includes(request.method)) fail(405, 'Method not allowed.');
      return new Response(request.method === 'HEAD' ? null : asset.content, { headers: { ...headers, 'content-type': asset.type } });
    }
    if (request.method === 'GET' && path === '/api/bootstrap') return json({ initialized: this.load().members.length > 0 });
    const socket = path === '/api/live' && request.method === 'GET';
    if (socket || request.method === 'POST') {
      const origin = request.headers.get('origin');
      if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') fail(403, 'Cross-site request rejected.');
    }
    if (!['GET', 'POST'].includes(request.method)) fail(405, 'Method not allowed.');
    const token = socket ? url.searchParams.get('token') : request.headers.get('authorization')?.replace(/^Bearer /, '');
    const hash = token ? await digest(token) : null;
    const body = request.method === 'POST' ? await readBody(request) : null;
    // All state checks and writes happen synchronously after the last await.
    // Concurrent first visitors cannot both claim the admin role.
    const state = this.load();
    if (path === '/api/setup' && request.method === 'POST') {
      if (state.members.length) fail(409, 'This workspace has already been claimed. Ask the admin for an invite link.');
      if (!hash || !/^[a-f0-9]{64}$/.test(token)) fail(400, 'A secure token is required.');
      const user = createMember(state, body.name, hash, true);
      this.save(state); this.broadcast(state);
      return json(snapshot(state, user), 201);
    }
    const user = member(state, hash);
    if (!user) fail(401, 'This link is invalid or has been revoked. Ask the admin for a new invite.');
    if (socket) {
      if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') fail(426, 'WebSocket required.');
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ userId: user.id, hash });
      pair[1].send(JSON.stringify(snapshot(state, user)));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (path === '/api/state' && request.method === 'GET') return json(snapshot(state, user));
    if (request.method !== 'POST') fail(404, 'Not found.');
    if (['/api/invite', '/api/links/restore'].includes(path)) {
      if (!user.admin) fail(403, 'Only the admin can manage invite links.');
      // Retain collaborator tokens for admin-only link management; authenticate by hash.
      const fresh = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
      const freshHash = await digest(fresh);
      // Reload after hashing to avoid overwriting concurrent task changes.
      const latest = this.load(), admin = member(latest, hash);
      if (!admin?.admin) fail(403, 'Admin access required.');
      let added;
      if (path !== '/api/invite') {
        added = latest.members.find(m => m.id === body.id);
        if (!added) fail(404, 'Collaborator not found.');
        if (added.admin) fail(400, 'The admin link cannot be changed here.');
        if (!added.revoked) fail(409, 'This collaborator already has access.');
        if (latest.members.filter(m => !m.revoked).length >= 100) fail(409, 'This workspace supports 100 active people.');
        added.revoked = false;
        added.hash = freshHash;
      } else added = createMember(latest, body.name, freshHash);
      added.linkToken = fresh;
      this.save(latest); this.broadcast(latest);
      return json({ state: snapshot(latest, admin), token: fresh, memberId: added.id }, path === '/api/invite' ? 201 : 200);
    }
    mutate(state, user, path, body);
    this.save(state); this.broadcast(state);
    return json(snapshot(state, user));
  }
  webSocketMessage(ws) {
    const state = this.load();
    const attachment = ws.deserializeAttachment();
    const user = state.members.find(m => m.id === attachment?.userId && m.hash === attachment?.hash && !m.revoked);
    if (!user) ws.close(4001, 'Access revoked');
    else ws.send(JSON.stringify(snapshot(state, user)));
  }
  webSocketClose(ws, code) { ws.close(code); }
  webSocketError(ws) { ws.close(1011, 'Reconnect'); }
}
export default { fetch(request, env) { return env.APPLET_STATE.get(env.APPLET_STATE.idFromName('default')).fetch(request); } };
