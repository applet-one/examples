import { page } from './ui.js';
import { styles } from './styles.js';
import { presets } from './presets.js';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const error = (message, status = 400) => json({ error: message }, status);
const cookieName = 'rep_session';
const bytes = n => crypto.getRandomValues(new Uint8Array(n));
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
async function digest(text) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))); }
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/../g).map(x => parseInt(x, 16))), iterations: 100000, hash: 'SHA-256' }, key, 256)));
}
const validDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T12:00:00Z`)) && new Date(`${d}T12:00:00Z`).toISOString().slice(0, 10) === d;
const clean = v => typeof v === 'string' ? v.trim() : '';
const integer = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

export class AppletState {
  constructor(ctx) { this.ctx = ctx; }
  init() {
    const db = this.ctx.storage.sql;
    db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    db.exec('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expires INTEGER NOT NULL)');
    db.exec('CREATE TABLE IF NOT EXISTS exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, instructions TEXT NOT NULL, link TEXT NOT NULL, target INTEGER NOT NULL, unit TEXT NOT NULL, days TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0)');
    db.exec('CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, exercise_id INTEGER NOT NULL, exercise_name TEXT NOT NULL, amount INTEGER NOT NULL, pain INTEGER, note TEXT NOT NULL, skipped INTEGER NOT NULL, updated_at TEXT NOT NULL, UNIQUE(day, exercise_id))');
    db.exec('CREATE TABLE IF NOT EXISTS installed_presets (id TEXT PRIMARY KEY)');
  }
  setting(key) { return [...this.ctx.storage.sql.exec('SELECT value FROM settings WHERE key = ?', key)][0]?.value; }
  async auth(request) {
    const token = request.headers.get('Cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
    return [...this.ctx.storage.sql.exec('SELECT hash FROM sessions WHERE hash = ? AND expires > ?', await digest(token), Date.now())].length > 0;
  }
  async body(request) {
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new Error('Expected JSON');
    if (Number(request.headers.get('Content-Length')) > 10000) throw new Error('Request too large');
    const text = await request.text();
    if (text.length > 10000) throw new Error('Request too large');
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
    return value;
  }
  async fetch(request) {
    this.init();
    const url = new URL(request.url), path = url.pathname, method = request.method, db = this.ctx.storage.sql;
    if (path === '/' && method === 'GET') return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'", 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
    if (path === '/styles.css' && method === 'GET') return new Response(styles, { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    if (path === '/app.js' && method === 'GET') return new Response((await import('./client.js')).client, { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    if (!path.startsWith('/api/')) return error('Not found', 404);
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) return error('Method not allowed', 405);
    if (method !== 'GET') {
      const origin = request.headers.get('Origin');
      if (origin !== url.origin) return error('Invalid origin', 403);
    }
    try {
      if (path === '/api/status' && method === 'GET') return json({ setup: !!this.setting('password'), authenticated: await this.auth(request) });
      if (path === '/api/setup' && method === 'POST') {
        if (this.setting('password')) return error('Already set up', 409);
        const { password } = await this.body(request);
        if (typeof password !== 'string' || password.length !== 4) return error('Use exactly 4 characters');
        const salt = hex(bytes(16));
        const hash = await passwordHash(password, salt);
        if (this.setting('password')) return error('Already set up', 409);
        db.exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'salt', salt);
        db.exec('INSERT INTO settings (key, value) VALUES (?, ?)', 'password', hash);
        return this.loginResponse(request);
      }
      if (path === '/api/login' && method === 'POST') {
        if (!this.setting('password')) return error('Set up the app first', 409);
        const blocked = Number(this.setting('blocked') || 0);
        if (blocked > Date.now()) return error('Too many attempts. Try again in 15 minutes.', 429);
        const { password } = await this.body(request);
        const match = typeof password === 'string' && password.length === 4 && (await passwordHash(password, this.setting('salt'))) === this.setting('password');
        if (!match) {
          const count = Number(this.setting('failures') || 0) + 1;
          db.exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'failures', String(count));
          if (count >= 5) { db.exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'blocked', String(Date.now() + 900000)); db.exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'failures', '0'); }
          return error('Incorrect passphrase', 401);
        }
        db.exec('DELETE FROM settings WHERE key IN (?, ?)', 'failures', 'blocked');
        return this.loginResponse(request);
      }
      if (!(await this.auth(request))) return error('Sign in required', 401);
      if (path === '/api/logout' && method === 'POST') {
        const token = request.headers.get('Cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
        if (token) db.exec('DELETE FROM sessions WHERE hash = ?', await digest(token));
        return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` } });
      }
      if (path === '/api/presets' && method === 'GET') {
        const installed = new Set([...db.exec('SELECT id FROM installed_presets')].map(row => row.id));
        return json({ presets: presets.map(p => ({ id: p.id, title: p.title, description: p.description, exercises: p.exercises.map(e => e.name), installed: installed.has(p.id) })) });
      }
      const presetRoute = path.match(/^\/api\/presets\/([a-z-]+)$/);
      if (presetRoute && method === 'POST') {
        const preset = presets.find(p => p.id === presetRoute[1]);
        if (!preset) return error('Starter plan not found', 404);
        if ([...db.exec('SELECT id FROM installed_presets WHERE id = ?', preset.id)].length) return error('Already added to your plan', 409);
        for (const e of preset.exercises) db.exec('INSERT INTO exercises (name, instructions, link, target, unit, days) VALUES (?, ?, ?, ?, ?, ?)', e.name, e.instructions, '', e.target, e.unit, JSON.stringify(e.days));
        db.exec('INSERT INTO installed_presets (id) VALUES (?)', preset.id);
        return json({ ok: true });
      }
      if (path === '/api/exercises' && method === 'GET') return json({ exercises: [...db.exec('SELECT * FROM exercises WHERE archived = 0 ORDER BY id')].map(e => ({ ...e, days: JSON.parse(e.days) })) });
      if (path === '/api/exercises' && method === 'POST') return this.saveExercise(await this.body(request));
      const exercise = path.match(/^\/api\/exercises\/(\d+)$/);
      if (exercise && method === 'PUT') return this.saveExercise(await this.body(request), Number(exercise[1]));
      if (exercise && method === 'DELETE') {
        db.exec('UPDATE exercises SET archived = 1 WHERE id = ?', Number(exercise[1]));
        return json({ ok: true });
      }
      if (path === '/api/logs' && method === 'GET') {
        const day = url.searchParams.get('day');
        if (day && !validDate(day)) return error('Invalid date');
        return json({ logs: day ? [...db.exec('SELECT * FROM logs WHERE day = ? ORDER BY id', day)] : [...db.exec('SELECT * FROM logs ORDER BY day DESC, id DESC LIMIT 200')] });
      }
      if (path === '/api/logs' && method === 'POST') {
        const b = await this.body(request), e = [...db.exec('SELECT * FROM exercises WHERE id = ? AND archived = 0', b.exerciseId)][0];
        if (!e) return error('Exercise not found', 404);
        if (!validDate(b.day) || !integer(b.amount, 0, 10000) || (b.pain !== null && !integer(b.pain, 0, 10)) || typeof b.skipped !== 'boolean' || typeof b.note !== 'string' || b.note.length > 1000) return error('Invalid log');
        db.exec('INSERT INTO logs (day, exercise_id, exercise_name, amount, pain, note, skipped, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(day, exercise_id) DO UPDATE SET exercise_name = excluded.exercise_name, amount = excluded.amount, pain = excluded.pain, note = excluded.note, skipped = excluded.skipped, updated_at = excluded.updated_at', b.day, e.id, e.name, b.amount, b.pain, b.note.trim(), b.skipped ? 1 : 0, new Date().toISOString());
        return json({ ok: true });
      }
      return error('Not found', 404);
    } catch (err) {
      if (err instanceof SyntaxError) return error('Invalid JSON');
      if (err.message === 'Expected JSON' || err.message === 'Request too large' || err.message === 'Expected an object') return error(err.message);
      console.error(err);
      return error('Server error', 500);
    }
  }
  async loginResponse(request) {
    const token = hex(bytes(32));
    this.ctx.storage.sql.exec('INSERT INTO sessions (hash, expires) VALUES (?, ?)', await digest(token), Date.now() + 30 * 86400000);
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${secure}` } });
  }
  saveExercise(b, id) {
    const name = clean(b.name), instructions = clean(b.instructions), link = clean(b.link);
    if (!name || name.length > 100 || instructions.length > 1000 || link.length > 500 || (link && !/^https:\/\//i.test(link)) || !integer(b.target, 1, 10000) || !['reps', 'seconds'].includes(b.unit) || !Array.isArray(b.days) || !b.days.length || b.days.length > 7 || new Set(b.days).size !== b.days.length || !b.days.every(d => integer(d, 0, 6))) return error('Check exercise fields (links must use HTTPS)');
    const db = this.ctx.storage.sql, days = JSON.stringify(b.days);
    if (id) {
      if (![...db.exec('SELECT id FROM exercises WHERE id = ? AND archived = 0', id)].length) return error('Exercise not found', 404);
      db.exec('UPDATE exercises SET name = ?, instructions = ?, link = ?, target = ?, unit = ?, days = ? WHERE id = ?', name, instructions, link, b.target, b.unit, days, id);
    } else db.exec('INSERT INTO exercises (name, instructions, link, target, unit, days) VALUES (?, ?, ?, ?, ?, ?)', name, instructions, link, b.target, b.unit, days);
    return json({ ok: true });
  }
}

export default {
  fetch(request, env) {
    const id = env.APPLET_STATE.idFromName('default');
    return env.APPLET_STATE.get(id).fetch(request);
  },
};
