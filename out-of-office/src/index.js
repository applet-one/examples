import { page } from './page.js';
import { style } from './style.js';
import { client } from './client.js';
import { TEAM, dateKey, seedAbsences, validateAbsence } from './model.js';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (data, status = 200) => Response.json(data, { status, headers });
const fail = (error, status = 400) => json({ error }, status);
const records = (db) =>
  db
    .exec('SELECT * FROM absences ORDER BY start_date, person_id')
    .toArray()
    .map((row) => ({ ...row, ready: !!row.ready }));
const insert = (db, a) =>
  db.exec(
    'INSERT INTO absences (id, person_id, start_date, end_date, type, title, cover_id, notes, ready, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    a.id,
    a.person_id,
    a.start_date,
    a.end_date,
    a.type,
    a.title,
    a.cover_id,
    a.notes,
    a.ready ? 1 : 0,
    a.version,
  );

export class AppletState {
  constructor(ctx) {
    this.ctx = ctx;
    ctx.storage.transactionSync(() => {
      const db = ctx.storage.sql;
      db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      db.exec(
        'CREATE TABLE IF NOT EXISTS absences (id TEXT PRIMARY KEY, person_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, cover_id TEXT NOT NULL, notes TEXT NOT NULL, ready INTEGER NOT NULL, version INTEGER NOT NULL)',
      );
      if (!db.exec("SELECT value FROM meta WHERE key = 'seeded'").toArray().length) {
        seedAbsences(dateKey(Date.now())).forEach((a) => insert(db, a));
        db.exec("INSERT INTO meta VALUES ('seeded', '1')");
      }
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    const db = this.ctx.storage.sql;
    if (request.method === 'GET' && url.pathname === '/api/state') {
      return json({ team: TEAM, absences: records(db), today: dateKey(Date.now()) });
    }
    if (!['POST', 'PUT', 'DELETE'].includes(request.method)) return fail('Not found.', 404);
    if (request.headers.get('Origin') !== url.origin) return fail('Invalid request origin.', 403);
    if (!/^\/api\/absences(?:\/[a-zA-Z0-9-]+)?$/.test(url.pathname)) return fail('Not found.', 404);
    const id = url.pathname.split('/')[3];
    const current = id ? db.exec('SELECT * FROM absences WHERE id = ?', id).toArray()[0] : null;
    if (id && !current) return fail('This absence no longer exists. Refresh and try again.', 404);
    if (request.method === 'DELETE') {
      if (!id) return fail('Choose an absence.');
      const version = Number(url.searchParams.get('version'));
      if (version !== current.version)
        return fail('This absence changed. Refresh before removing it.', 409);
      db.exec('DELETE FROM absences WHERE id = ?', id);
      return json({ ok: true });
    }
    if ((request.method === 'PUT' && !id) || (request.method === 'POST' && id))
      return fail('Invalid route.', 405);
    if (!(request.headers.get('Content-Type') || '').startsWith('application/json'))
      return fail('Expected JSON.', 415);
    if (Number(request.headers.get('Content-Length')) > 6000)
      return fail('Request is too large.', 413);
    let input;
    try {
      const text = await request.text();
      if (text.length > 6000) return fail('Request is too large.', 413);
      input = JSON.parse(text);
    } catch {
      return fail('Invalid JSON.');
    }
    // All validation and writes after the body read are synchronous, so concurrent
    // requests cannot interleave between conflict checking and the write.
    const latest = id ? db.exec('SELECT * FROM absences WHERE id = ?', id).toArray()[0] : null;
    if (id && !latest) return fail('This absence no longer exists.', 404);
    if (id && input?.version !== latest.version)
      return fail('Someone changed this absence. Refresh and try again.', 409);
    const absences = records(db);
    const normalized =
      input && typeof input === 'object' && !Array.isArray(input)
        ? { ...input, id: id || null }
        : input;
    const error = validateAbsence(normalized, absences, dateKey(Date.now()));
    if (error) return fail(error);
    if (!id && absences.length >= 250)
      return fail('This demo has reached its limit. Remove an old absence first.', 409);
    const absence = {
      ...normalized,
      id: id || crypto.randomUUID(),
      title: input.title.trim(),
      notes: input.notes.trim(),
      cover_id: input.cover_id || '',
      version: (latest?.version || 0) + 1,
    };
    if (id) {
      db.exec(
        'UPDATE absences SET person_id = ?, start_date = ?, end_date = ?, type = ?, title = ?, cover_id = ?, notes = ?, ready = ?, version = ? WHERE id = ?',
        absence.person_id,
        absence.start_date,
        absence.end_date,
        absence.type,
        absence.title,
        absence.cover_id,
        absence.notes,
        absence.ready ? 1 : 0,
        absence.version,
        id,
      );
    } else insert(db, absence);
    return json({ absence }, id ? 200 : 201);
  }
}

const documentHeaders = {
  ...headers,
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const id = env.APPLET_STATE.idFromName('default');
      try {
        return await env.APPLET_STATE.get(id).fetch(request);
      } catch (error) {
        console.error('State request failed', error);
        return fail('Could not reach the team workspace. Please try again.', 500);
      }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return fail('Method not allowed.', 405);
    const assets = {
      '/': [page, 'text/html; charset=utf-8'],
      '/style.css': [style, 'text/css; charset=utf-8'],
      '/app.js': [client, 'application/javascript; charset=utf-8'],
      '/favicon.svg': [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="17" fill="#ef6039"/><circle cx="30" cy="33" r="15" fill="none" stroke="#fff" stroke-width="7"/><circle cx="45" cy="19" r="5" fill="#fff"/></svg>',
        'image/svg+xml',
      ],
    };
    const asset = assets[url.pathname];
    if (!asset) return new Response('Not found', { status: 404, headers });
    return new Response(request.method === 'HEAD' ? null : asset[0], {
      headers: { ...documentHeaders, 'Content-Type': asset[1] },
    });
  },
};
