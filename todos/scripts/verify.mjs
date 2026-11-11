// Explicit functional test: mutates only its own uniquely identified test todo.
import assert from 'node:assert/strict';
const base = process.env.TODO_BASE_URL;
if (!base) throw new Error('Set TODO_BASE_URL to the app origin (use a private SSH tunnel for exe.dev)');
const args = process.argv.slice(2);
const keep = args.includes('--keep');
const resume = args.indexOf('--resume');
if (!(args.length === 0 || (args.length === 1 && keep) || (args.length === 2 && resume === 0 && /^[a-f0-9-]{36}$/.test(args[1])))) {
  throw new Error('Use no arguments, --keep, or --resume ID');
}
async function api(path, method = 'GET', body) {
  const response = await fetch(new URL(path, base), {
    method, signal: AbortSignal.timeout(10000), redirect: 'error',
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.ok(response.ok, method + ' ' + path + ': HTTP ' + response.status);
  return response.json();
}
let id;
let leave = false;
try {
  const home = await fetch(new URL('/', base), { signal: AbortSignal.timeout(10000), redirect: 'error' });
  assert.ok(home.ok && home.headers.get('content-type')?.includes('text/html'));
  assert.match(await home.text(), /A little less to do\./);
  assert.equal((await api('/api/health')).ok, true);
  if (resume >= 0) {
    const candidate = (await api('/api/todos')).todos.find(todo => todo.id === args[resume + 1]);
    assert.ok(candidate && candidate.title.startsWith('verification: ') && candidate.title.endsWith(' (edited)'), 'Expected verification record missing or wrong title');
    assert.equal(candidate.completed, true, 'Completed state did not survive restart');
    id = candidate.id;
    console.log('PASS: saved todo and completed state survived restart');
  } else {
    const title = 'verification: ' + crypto.randomUUID();
    const created = (await api('/api/todos', 'POST', { title })).todo;
    id = created.id;
    assert.equal(created.completed, false);
    await api('/api/todos/' + id, 'PATCH', { title: title + ' (edited)', completed: true });
    const listed = (await api('/api/todos')).todos.find(todo => todo.id === id);
    assert.equal(listed.title, title + ' (edited)'); assert.equal(listed.completed, true);
    assert.equal((await api('/api/todos/' + id, 'PATCH', { completed: false })).todo.completed, false);
    await api('/api/todos/' + id, 'PATCH', { completed: true });
    console.log('PASS: HTML, application read health, create, edit, complete, reopen, and readback');
    if (keep) {
      leave = true;
      console.log('RESTART_TEST_ID=' + id);
      console.log('Restart the app, then run: npm run verify -- --resume ' + id);
    }
  }
} finally {
  if (id && !leave) {
    await api('/api/todos/' + id, 'DELETE');
    assert.equal((await api('/api/todos')).todos.some(todo => todo.id === id), false);
    console.log('PASS: verification todo deleted; other todos preserved');
  }
}
