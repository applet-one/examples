import { page } from './page.js';
import { client } from './client.js';
import { style } from './style.js';
import { passwordReset } from './password-reset.js';

const DAY = 86400000;
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const fail = (message, status = 400) => json({ error: message }, status);
const rows = (db, sql, ...args) => db.exec(sql, ...args).toArray();
const one = (db, sql, ...args) => db.exec(sql, ...args).toArray()[0];
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const digest = async value => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const emailOf = input => String(input || '').trim().toLowerCase();
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

async function hashPassword(password, salt = random()) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `${salt}:${hex(new Uint8Array(bits))}`;
}
async function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = (await hashPassword(password, salt)).split(':')[1];
  const a = Uint8Array.from(expected.match(/../g) || [], x => parseInt(x, 16));
  const b = Uint8Array.from(actual.match(/../g) || [], x => parseInt(x, 16));
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
function cookie(token, request, maxAge = 60 * 60 * 24 * 30) {
  return `bestie_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
function cleanUser(user) { return { id: user.id, name: user.name, email: user.email }; }
function init(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS friendships (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, addressee_id TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS slots (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS meetings (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, recipient_id TEXT NOT NULL, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (email TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS applied_resets (id TEXT PRIMARY KEY);`);
  if (passwordReset && !one(db, 'SELECT id FROM applied_resets WHERE id = ?', passwordReset.id)) {
    db.exec('UPDATE users SET password = ? WHERE email = ?', passwordReset.hash, passwordReset.email);
    const user = one(db, 'SELECT id FROM users WHERE email = ?', passwordReset.email);
    if (user) db.exec('DELETE FROM sessions WHERE user_id = ?', user.id);
    db.exec('INSERT INTO applied_resets (id) VALUES (?)', passwordReset.id);
  }
}
function available(db, userId, start, end) {
  // A booking must fit within one current free slot. Accepted meetings carve slots into pieces.
  return !!one(db, 'SELECT id FROM slots WHERE user_id = ? AND start_at <= ? AND end_at >= ? LIMIT 1', userId, start, end);
}
function friendship(db, a, b) {
  return one(db, "SELECT * FROM friendships WHERE status = 'accepted' AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))", a, b, b, a);
}
function reserve(db, userId, start, end) {
  const slot = one(db, 'SELECT * FROM slots WHERE user_id = ? AND start_at <= ? AND end_at >= ? LIMIT 1', userId, start, end);
  db.exec('DELETE FROM slots WHERE id = ?', slot.id);
  if (slot.start_at < start) db.exec('INSERT INTO slots VALUES (?, ?, ?, ?)', crypto.randomUUID(), userId, slot.start_at, start);
  if (slot.end_at > end) db.exec('INSERT INTO slots VALUES (?, ?, ?, ?)', crypto.randomUUID(), userId, end, slot.end_at);
}

export class AppletState {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    const db = this.ctx.storage.sql;
    init(db);
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/app.js') return new Response(client, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
    if (request.method === 'GET' && url.pathname === '/style.css') return new Response(style, { headers: { 'Content-Type': 'text/css; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
    if (request.method === 'GET' && url.pathname === '/') return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'" } });
    if (!url.pathname.startsWith('/api/')) return fail('Not found', 404);
    if (request.method !== 'GET') {
      if (request.method !== 'POST' && request.method !== 'DELETE') return fail('Method not allowed', 405);
      if (request.headers.get('Origin') !== url.origin) return fail('Invalid origin', 403);
    }
    const token = /(?:^|;\s*)bestie_session=([a-f0-9]{64})/.exec(request.headers.get('Cookie') || '')?.[1];
    const session = token ? one(db, 'SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?', await digest(token), Date.now()) : null;
    const user = session ? one(db, 'SELECT * FROM users WHERE id = ?', session.user_id) : null;
    let body = {};
    if (request.method === 'POST') {
      if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) return fail('Expected JSON');
      try { body = await request.json(); } catch { return fail('Invalid JSON'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request');
    }
    try {
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const email = emailOf(body.email), name = String(body.name || '').trim(), password = body.password;
        if (!validEmail(email) || name.length < 2 || name.length > 60 || typeof password !== 'string' || password.length < 10 || password.length > 256) return fail('Enter a name, valid email, and password of at least 10 characters.');
        if (one(db, 'SELECT id FROM users WHERE email = ?', email)) return fail('This email is already registered.');
        const hash = await hashPassword(password), id = crypto.randomUUID(), sessionToken = random();
        db.exec('INSERT INTO users VALUES (?, ?, ?, ?, ?)', id, name, email, hash, Date.now());
        db.exec('INSERT INTO sessions VALUES (?, ?, ?)', await digest(sessionToken), id, Date.now() + 30 * DAY);
        const response = json({ ok: true }); response.headers.set('Set-Cookie', cookie(sessionToken, request)); return response;
      }
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const email = emailOf(body.email), password = body.password;
        if (!validEmail(email) || typeof password !== 'string') return fail('Incorrect email or password.', 401);
        const attempt = one(db, 'SELECT * FROM login_attempts WHERE email = ?', email);
        if (attempt?.attempts >= 8 && attempt.until_at > Date.now()) return fail('Too many attempts. Try again in 15 minutes.', 429);
        const found = one(db, 'SELECT * FROM users WHERE email = ?', email);
        if (!found || !(await verifyPassword(password, found.password))) {
          const count = attempt?.until_at > Date.now() ? attempt.attempts + 1 : 1;
          db.exec('INSERT INTO login_attempts VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET attempts = excluded.attempts, until_at = excluded.until_at', email, count, Date.now() + 15 * 60000);
          return fail('Incorrect email or password.', 401);
        }
        db.exec('DELETE FROM login_attempts WHERE email = ?', email);
        const sessionToken = random();
        db.exec('INSERT INTO sessions VALUES (?, ?, ?)', await digest(sessionToken), found.id, Date.now() + 30 * DAY);
        const response = json({ ok: true }); response.headers.set('Set-Cookie', cookie(sessionToken, request)); return response;
      }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        if (token) db.exec('DELETE FROM sessions WHERE token_hash = ?', await digest(token));
        const response = json({ ok: true }); response.headers.set('Set-Cookie', cookie('', request, 0)); return response;
      }
      if (!user) return fail('Please sign in.', 401);
      if (url.pathname === '/api/bootstrap' && request.method === 'GET') {
        const friendships = rows(db, `SELECT f.*, a.name AS requester_name, a.email AS requester_email, b.name AS addressee_name, b.email AS addressee_email
          FROM friendships f JOIN users a ON a.id = f.requester_id JOIN users b ON b.id = f.addressee_id
          WHERE f.requester_id = ? OR f.addressee_id = ? ORDER BY f.created_at DESC`, user.id, user.id);
        const friends = friendships.filter(f => f.status === 'accepted').map(f => f.requester_id === user.id
          ? { id: f.addressee_id, name: f.addressee_name, email: f.addressee_email }
          : { id: f.requester_id, name: f.requester_name, email: f.requester_email });
        const ids = [user.id, ...friends.map(f => f.id)];
        const slots = rows(db, `SELECT id, user_id, start_at, end_at FROM slots WHERE user_id IN (${ids.map(() => '?').join(',')}) AND end_at > ? ORDER BY start_at`, ...ids, Date.now() - DAY);
        const meetings = rows(db, `SELECT m.*, a.name AS requester_name, b.name AS recipient_name FROM meetings m
          JOIN users a ON a.id = m.requester_id JOIN users b ON b.id = m.recipient_id
          WHERE m.requester_id = ? OR m.recipient_id = ? ORDER BY m.start_at`, user.id, user.id);
        return json({ user: cleanUser(user), friendships, friends, slots, meetings });
      }
      if (url.pathname === '/api/friends/request' && request.method === 'POST') {
        const email = emailOf(body.email), target = one(db, 'SELECT id FROM users WHERE email = ?', email);
        if (!target) return fail('No account found with that email.');
        if (target.id === user.id) return fail('You cannot add yourself.');
        if (one(db, 'SELECT id FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)', user.id, target.id, target.id, user.id)) return fail('A friendship or request already exists.');
        db.exec('INSERT INTO friendships VALUES (?, ?, ?, ?, ?)', crypto.randomUUID(), user.id, target.id, 'pending', Date.now());
        return json({ ok: true });
      }
      if (url.pathname === '/api/friends/respond' && request.method === 'POST') {
        const f = one(db, 'SELECT * FROM friendships WHERE id = ? AND status = ?', body.id, 'pending');
        if (!f) return fail('Request not found.', 404);
        if (body.action === 'accept' && f.addressee_id === user.id) db.exec("UPDATE friendships SET status = 'accepted' WHERE id = ?", f.id);
        else if ((body.action === 'decline' && f.addressee_id === user.id) || (body.action === 'cancel' && f.requester_id === user.id)) db.exec('DELETE FROM friendships WHERE id = ?', f.id);
        else return fail('Not allowed.', 403);
        return json({ ok: true });
      }
      if (url.pathname === '/api/slots' && request.method === 'POST') {
        const start = body.start, end = body.end;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < Date.now() - 60000 || end <= start || end - start > DAY || start > Date.now() + 366 * DAY) return fail('Choose a future slot of up to 24 hours.');
        if (one(db, 'SELECT id FROM slots WHERE user_id = ? AND start_at < ? AND end_at > ?', user.id, end, start)) return fail('This overlaps an existing free slot.');
        if (one(db, "SELECT id FROM meetings WHERE status = 'accepted' AND (requester_id = ? OR recipient_id = ?) AND start_at < ? AND end_at > ?", user.id, user.id, end, start)) return fail('This overlaps a booked meeting.');
        db.exec('INSERT INTO slots VALUES (?, ?, ?, ?)', crypto.randomUUID(), user.id, start, end);
        return json({ ok: true });
      }
      if (url.pathname.startsWith('/api/slots/') && request.method === 'DELETE') {
        db.exec('DELETE FROM slots WHERE id = ? AND user_id = ?', url.pathname.slice('/api/slots/'.length), user.id);
        return json({ ok: true });
      }
      if (url.pathname === '/api/meetings/request' && request.method === 'POST') {
        const { friendId, start, end } = body;
        if (!friendship(db, user.id, friendId)) return fail('Only friends can meet.', 403);
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < Date.now() - 60000 || end <= start || end - start > DAY || !available(db, user.id, start, end) || !available(db, friendId, start, end)) return fail('This time is no longer free for both of you.');
        if (one(db, "SELECT id FROM meetings WHERE status = 'pending' AND ((requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?)) AND start_at < ? AND end_at > ?", user.id, friendId, friendId, user.id, end, start)) return fail('A request for this time already exists.');
        db.exec('INSERT INTO meetings VALUES (?, ?, ?, ?, ?, ?, ?)', crypto.randomUUID(), user.id, friendId, start, end, 'pending', Date.now());
        return json({ ok: true });
      }
      if (url.pathname === '/api/meetings/respond' && request.method === 'POST') {
        const m = one(db, "SELECT * FROM meetings WHERE id = ? AND status = 'pending'", body.id);
        if (!m) return fail('Request not found.', 404);
        if (body.action === 'accept' && m.recipient_id === user.id) {
          if (m.start_at < Date.now() || !friendship(db, m.requester_id, m.recipient_id) || !available(db, m.requester_id, m.start_at, m.end_at) || !available(db, m.recipient_id, m.start_at, m.end_at)) return fail('This time is no longer free for both of you.');
          reserve(db, m.requester_id, m.start_at, m.end_at);
          reserve(db, m.recipient_id, m.start_at, m.end_at);
          db.exec("UPDATE meetings SET status = 'accepted' WHERE id = ?", m.id);
          db.exec("UPDATE meetings SET status = 'declined' WHERE id != ? AND status = 'pending' AND start_at < ? AND end_at > ? AND (requester_id IN (?, ?) OR recipient_id IN (?, ?))", m.id, m.end_at, m.start_at, m.requester_id, m.recipient_id, m.requester_id, m.recipient_id);
        } else if ((body.action === 'decline' && m.recipient_id === user.id) || (body.action === 'cancel' && m.requester_id === user.id)) {
          db.exec("UPDATE meetings SET status = ? WHERE id = ?", body.action === 'cancel' ? 'cancelled' : 'declined', m.id);
        } else return fail('Not allowed.', 403);
        return json({ ok: true });
      }
      return fail('Not found', 404);
    } catch (error) {
      console.error('Request failed', error);
      return fail('Something went wrong. Please try again.', 500);
    }
  }
}

export default {
  fetch(request, env) {
    return env.APPLET_STATE.get(env.APPLET_STATE.idFromName('default')).fetch(request);
  },
};
