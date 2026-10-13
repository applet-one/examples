import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { AppletState } from '../src/index.js';

const BASE = 'https://daybreak.test';
const DAY = 86400000;
const PASSWORD = 'testingpassword123';

// Adapt real SQLite to the Durable Object SQL cursor API used by the app.
function harness(t) {
  const database = new DatabaseSync(':memory:');
  t.after(() => database.close());
  const sql = {
    exec(query, ...bindings) {
      if (!bindings.length && query.includes('CREATE TABLE')) {
        database.exec(query);
        return { toArray: () => [] };
      }
      const result = database.prepare(query).all(...bindings);
      return { toArray: () => result };
    },
  };
  const app = new AppletState({ storage: { sql } });
  async function call(path, { method = 'GET', body, cookie, headers = {}, rawBody } = {}) {
    const response = await app.fetch(new Request(BASE + path, {
      method,
      headers: {
        Origin: BASE,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
    }));
    return response;
  }
  async function register(name) {
    const response = await call('/api/auth/register', {
      method: 'POST', body: { name, email: `${name.toLowerCase()}@example.com`, password: PASSWORD },
    });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('Set-Cookie').split(';')[0];
    const snapshot = await (await call('/api/bootstrap', { cookie })).json();
    return { ...snapshot.user, cookie };
  }
  async function post(path, body, user) {
    const response = await call(path, { method: 'POST', body, cookie: user?.cookie });
    assert.equal(response.status, 200, JSON.stringify(await response.json()));
  }
  return { database, call, register, post };
}

test('assets initialize the database and retain their response headers', async t => {
  const { call, database } = harness(t);
  for (const [path, type] of [['/', 'text/html'], ['/app.js', 'application/javascript'], ['/style.css', 'text/css']]) {
    const response = await call(path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('Content-Type').startsWith(type));
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.ok((await response.text()).length > 0);
    if (path === '/') assert.ok(response.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'"));
    else assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(database.prepare("SELECT count(*) AS count FROM sqlite_master WHERE type = 'table'").get().count, 7);
});

test('request checks and unknown routes preserve their precedence', async t => {
  const { call, register } = harness(t);
  const cases = [
    ['/missing', {}, 404, 'Not found'],
    ['/api/missing', {}, 401, 'Please sign in.'],
    ['/api/missing', { method: 'PUT' }, 405, 'Method not allowed'],
    ['/api/auth/login', { method: 'POST', headers: { Origin: 'https://other.test' } }, 403, 'Invalid origin'],
    ['/api/auth/login', { method: 'POST' }, 400, 'Expected JSON'],
    ['/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, rawBody: '{' }, 400, 'Invalid JSON'],
    ['/api/missing', { method: 'POST', body: [] }, 400, 'Invalid request'],
    ['/api/missing', { method: 'POST', body: null }, 400, 'Invalid request'],
  ];
  for (const [path, options, status, error] of cases) {
    const response = await call(path, options);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error });
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  const user = await register('Alice');
  assert.equal((await call('/api/missing', { cookie: user.cookie })).status, 404);
});

test('registration, login and logout preserve cookies and session lifecycle', async t => {
  const { call, database } = harness(t);
  const body = { name: ' Alice ', email: ' ALICE@EXAMPLE.COM ', password: PASSWORD };
  const registered = await call('/api/auth/register', { method: 'POST', body });
  assert.equal(registered.status, 200);
  const cookie = registered.headers.get('Set-Cookie');
  assert.match(cookie, /^bestie_session=[a-f0-9]{64}; HttpOnly; SameSite=Lax; Path=\/; Max-Age=2592000; Secure$/);
  const user = (await (await call('/api/bootstrap', { cookie })).json()).user;
  assert.deepEqual(user, { id: user.id, name: 'Alice', email: 'alice@example.com' });
  const stored = database.prepare('SELECT * FROM users').get();
  assert.match(stored.password, /^[a-f0-9]{64}:[a-f0-9]{64}$/);
  assert.equal((await call('/api/auth/register', { method: 'POST', body })).status, 400);
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { ...body, password: 'wrong' } })).status, 401);
  const login = await call('/api/auth/login', { method: 'POST', body });
  assert.equal(login.status, 200);
  assert.equal(database.prepare('SELECT count(*) AS count FROM login_attempts').get().count, 0);
  const loginCookie = login.headers.get('Set-Cookie').split(';')[0];
  const logout = await call('/api/auth/logout', { method: 'POST', body: {}, cookie: loginCookie });
  assert.equal(logout.status, 200);
  assert.equal(logout.headers.get('Set-Cookie'), 'bestie_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure');
  assert.equal((await call('/api/bootstrap', { cookie: loginCookie })).status, 401);
  assert.equal((await call('/api/bootstrap', { cookie })).status, 200);
});

test('login rate limiting starts after eight failures', async t => {
  const { call, register } = harness(t);
  const user = await register('Alice');
  for (let i = 0; i < 8; i++) {
    assert.equal((await call('/api/auth/login', { method: 'POST', body: { email: user.email, password: 'wrong' } })).status, 401);
  }
  const response = await call('/api/auth/login', { method: 'POST', body: { email: user.email, password: PASSWORD } });
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: 'Too many attempts. Try again in 15 minutes.' });
});

test('meeting acceptance splits both slots and declines overlapping pending requests', async t => {
  const { call, register, post, database } = harness(t);
  const alice = await register('Alice');
  const bob = await register('Bob');
  const charlie = await register('Charlie');
  for (const friend of [bob, charlie]) {
    await post('/api/friends/request', { email: friend.email }, alice);
    const snapshot = await (await call('/api/bootstrap', { cookie: friend.cookie })).json();
    await post('/api/friends/respond', { id: snapshot.friendships[0].id, action: 'accept' }, friend);
  }
  const start = Date.now() + 7 * DAY;
  const hour = 3600000;
  for (const user of [alice, bob, charlie]) await post('/api/slots', { start, end: start + 4 * hour }, user);
  await post('/api/meetings/request', { friendId: bob.id, start: start + hour, end: start + 2 * hour }, alice);
  await post('/api/meetings/request', { friendId: charlie.id, start: start + hour, end: start + 3 * hour }, alice);
  await post('/api/meetings/request', { friendId: charlie.id, start: start + 3 * hour, end: start + 4 * hour }, alice);
  const meeting = database.prepare('SELECT * FROM meetings WHERE recipient_id = ?').get(bob.id);
  assert.equal((await call('/api/meetings/respond', { method: 'POST', body: { id: meeting.id, action: 'accept' }, cookie: alice.cookie })).status, 403);
  await post('/api/meetings/respond', { id: meeting.id, action: 'accept' }, bob);
  for (const user of [alice, bob]) {
    const slots = database.prepare('SELECT start_at, end_at FROM slots WHERE user_id = ? ORDER BY start_at').all(user.id);
    assert.deepEqual(slots.map(s => [s.start_at, s.end_at]), [[start, start + hour], [start + 2 * hour, start + 4 * hour]]);
  }
  assert.equal(database.prepare('SELECT count(*) AS count FROM slots WHERE user_id = ?').get(charlie.id).count, 1);
  const meetings = database.prepare('SELECT start_at, status FROM meetings ORDER BY created_at, rowid').all();
  assert.deepEqual(meetings.map(m => m.status), ['accepted', 'declined', 'pending']);
  assert.equal((await call('/api/slots', { method: 'POST', body: { start: start + hour, end: start + 2 * hour }, cookie: alice.cookie })).status, 400);
  assert.equal((await call('/api/meetings/request', { method: 'POST', body: { friendId: bob.id, start: start + hour, end: start + 2 * hour }, cookie: alice.cookie })).status, 400);
});
