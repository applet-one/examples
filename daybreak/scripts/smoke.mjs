import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://127.0.0.1:8787';
const suffix = Date.now();
async function call(path, method = 'GET', body, cookie = '') {
  const response = await fetch(base + '/api/' + path, { method, headers: { Origin: base, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
const alice = await call('auth/register', 'POST', { name: 'Alice Test', email: `alice-${suffix}@example.com`, password: 'testingpassword123' });
const bob = await call('auth/register', 'POST', { name: 'Bob Test', email: `bob-${suffix}@example.com`, password: 'testingpassword123' });
assert.equal(alice.status, 200); assert.equal(bob.status, 200);
const ac = alice.cookie, bc = bob.cookie;
assert.equal((await call('bootstrap', 'GET', null, ac)).data.user.name, 'Alice Test');
assert.equal((await call('bootstrap', 'GET', null, bc)).data.friends.length, 0);
assert.equal((await call('friends/request', 'POST', { email: `bob-${suffix}@example.com` }, ac)).status, 200);
const pending = (await call('bootstrap', 'GET', null, bc)).data.friendships[0];
assert.equal(pending.status, 'pending');
assert.equal((await call('bootstrap', 'GET', null, bc)).data.slots.length, 0);
assert.equal((await call('friends/respond', 'POST', { id: pending.id, action: 'accept' }, bc)).status, 200);
const start = Date.now() + 7 * 86400000, end = start + 4 * 3600000;
assert.equal((await call('slots', 'POST', { start, end }, ac)).status, 200);
assert.equal((await call('slots', 'POST', { start: start + 3600000, end }, bc)).status, 200);
let snapshot = (await call('bootstrap', 'GET', null, ac)).data;
assert.equal(snapshot.slots.length, 2);
assert.equal((await call('meetings/request', 'POST', { friendId: snapshot.friends[0].id, start, end }, ac)).status, 400);
assert.equal((await call('meetings/request', 'POST', { friendId: snapshot.friends[0].id, start: start + 3600000, end: start + 2 * 3600000 }, ac)).status, 200);
const meeting = (await call('bootstrap', 'GET', null, bc)).data.meetings[0];
assert.equal((await call('meetings/respond', 'POST', { id: meeting.id, action: 'accept' }, ac)).status, 403);
assert.equal((await call('meetings/respond', 'POST', { id: meeting.id, action: 'accept' }, bc)).status, 200);
snapshot = (await call('bootstrap', 'GET', null, ac)).data;
assert.equal(snapshot.meetings[0].status, 'accepted');
assert.equal(snapshot.slots.filter(s => s.user_id === snapshot.user.id).length, 2);
assert.equal((await call('slots', 'POST', { start: start + 3600000, end: start + 2 * 3600000 }, ac)).status, 400);
assert.equal((await call('meetings/request', 'POST', { friendId: snapshot.friends[0].id, start: start + 3600000, end: start + 2 * 3600000 }, ac)).status, 400);
assert.equal((await call('auth/login', 'POST', { email: `alice-${suffix}@example.com`, password: 'wrongpassword' })).status, 401);
assert.equal((await call('auth/logout', 'POST', {}, ac)).status, 200);
assert.equal((await call('bootstrap', 'GET', null, ac)).status, 401);
console.log('Smoke test passed: signup, login, friendship, private slots, overlap rules, meeting acceptance, reservation, logout.');
