import snapshot from './bonn.json';
import { SOURCE, SOURCE_PAGE, TYPES, normalize, choices, events } from './data.js';
import { HTML } from './ui.js';
import { calendar } from './calendar.js';
import { MANIFEST, ICON, SW } from './pwa.js';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const token = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
export class AppletState {
  constructor(ctx) {
    this.ctx = ctx;
    this.data = snapshot;
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS feeds (token TEXT PRIMARY KEY, secret TEXT NOT NULL, selection TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS data_chunks (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');
    const chunks = [...ctx.storage.sql.exec('SELECT value FROM data_chunks ORDER BY id')];
    if (chunks.length) { try { this.data = JSON.parse(chunks.map(r => r.value).join('')); } catch {} }
    this.lastAttempt = 0;
  }
  async refresh() {
    if (Date.now() - Date.parse(this.data.fetched) < 86400000 || Date.now() - this.lastAttempt < 3600000 || this.refreshing) return;
    this.lastAttempt = Date.now();
    this.refreshing = (async () => {
      try {
        const response = await fetch(SOURCE, { signal: AbortSignal.timeout(60000) });
        if (!response.ok) throw new Error(`Bonn source: ${response.status}`);
        const data = normalize(await response.text());
        const text = JSON.stringify(data);
        this.ctx.storage.transactionSync(() => {
          this.ctx.storage.sql.exec('DELETE FROM data_chunks');
          for (let i = 0; i < text.length; i += 32000) this.ctx.storage.sql.exec('INSERT INTO data_chunks VALUES (?, ?)', i / 32000, text.slice(i, i + 32000));
        });
        this.data = data;
      } catch (e) { console.error('Data refresh failed; retaining last successful source', e.message); }
      finally { this.refreshing = null; }
    })();
    await this.refreshing;
  }
  validate(selection) {
    if (!selection || typeof selection.street !== 'string' || typeof selection.house !== 'string' || !Array.isArray(selection.ids) || selection.ids.length > 12) throw new Error('Bitte Adresse und Abholpläne auswählen.');
    const rows = choices(this.data, selection.street, selection.house);
    if (!selection.ids.length || selection.ids.some(id => !rows.some(r => r.id === id))) throw new Error('Der ausgewählte Abholplan passt nicht zu dieser Adresse. Bitte erneut auswählen.');
    const types = selection.ids.map(id => rows.find(r => r.id === id).type);
    if (new Set(types).size !== types.length) throw new Error('Bitte nur einen Abholplan pro Abfallart auswählen.');
    return { street: selection.street, house: selection.house.trim(), ids: selection.ids };
  }
  async fetch(request) {
    this.ctx.waitUntil(this.refresh());
    const url = new URL(request.url), path = url.pathname;
    if (path === '/api/streets') return json({ streets: Object.keys(this.data.streets).sort((a,b) => a.localeCompare(b,'de')), fetched: this.data.fetched, year: 2026, types: TYPES, source: SOURCE_PAGE });
    if (path === '/api/choices') return json({ choices: choices(this.data, url.searchParams.get('street'), url.searchParams.get('house')), fetched: this.data.fetched });
    if (path.startsWith('/calendars/') && request.method === 'GET') {
      const key = path.slice(11).replace(/\.ics$/, '');
      const row = [...this.ctx.storage.sql.exec('SELECT selection FROM feeds WHERE token = ?', key)][0];
      if (!row) return new Response('Calendar not found or revoked', { status: 404 });
      const selection = JSON.parse(row.selection);
      return new Response(calendar(events(this.data, selection), key, this.data.fetched), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=900', 'Content-Disposition': 'inline; filename="bonn-abfall.ics"', 'X-Robots-Tag': 'noindex' } });
    }
    if (request.method !== 'POST') return json({ error: 'Not found' }, 404);
    if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return json({ error: 'Invalid origin' }, 403);
    if (Number(request.headers.get('Content-Length')) > 8192) return json({ error: 'Request too large' }, 413);
    try {
      const raw = await request.text(); if (raw.length > 8192) return json({ error: 'Request too large' }, 413);
      const body = JSON.parse(raw);
      if (path === '/api/schedule') {
        const selection = this.validate(body);
        return json({ events: events(this.data, selection), fetched: this.data.fetched, year: 2026 });
      }
      if (path === '/api/feeds') {
        const selection = this.validate(body.selection);
        if (body.token) {
          const found = [...this.ctx.storage.sql.exec('SELECT secret FROM feeds WHERE token = ?', body.token)][0];
          if (!found || found.secret !== body.secret) return json({ error: 'Subscription access denied' }, 403);
          this.ctx.storage.sql.exec('UPDATE feeds SET selection = ? WHERE token = ?', JSON.stringify(selection), body.token);
          return json({ token: body.token, secret: body.secret });
        }
        const key = token(), secret = token();
        this.ctx.storage.sql.exec('INSERT INTO feeds VALUES (?, ?, ?)', key, secret, JSON.stringify(selection));
        return json({ token: key, secret }, 201);
      }
      if (path === '/api/revoke') {
        this.ctx.storage.sql.exec('DELETE FROM feeds WHERE token = ? AND secret = ?', body.token, body.secret);
        return json({ ok: true });
      }
    } catch (e) { return json({ error: e.message }, 400); }
    return json({ error: 'Not found' }, 404);
  }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/calendars/')) return env.APPLET_STATE.get(env.APPLET_STATE.idFromName('default')).fetch(request);
    if (url.pathname === '/health') return json({ ok: true });
    if (url.pathname === '/manifest.webmanifest') return Response.json(MANIFEST, { headers: { 'Content-Type': 'application/manifest+json' } });
    if (url.pathname === '/icon.svg') return new Response(ICON, { headers: { 'Content-Type': 'image/svg+xml' } });
    if (url.pathname === '/sw.js') return new Response(SW, { headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' } });
    if (url.pathname !== '/') return new Response('Not found', { status: 404 });
    return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" } });
  }
};
