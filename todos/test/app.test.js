import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { app } from './helpers.js';

async function data(response, status = 200) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return response.json();
}

test('root is a real HTML UI; GETs do not create or modify todos', async () => {
  const a = app();
  try {
    const response = await a.request('/');
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.match(html, /<h1>A little less to do\.<\/h1>/);
    assert.match(html, /src="\/app.js"/);
    assert.match(await (await a.request('/app.js')).text(), /textContent = todo.title/);
    assert.equal(await (await a.request('/', 'HEAD')).text(), '');
    assert.deepEqual(await data(await a.request('/api/todos')), { todos: [] });
    assert.deepEqual(await data(await a.request('/api/health')), { ok: true, storage: 'sqlite', todo_count: 0 });
    assert.deepEqual(await data(await a.request('/api/todos')), { todos: [] });
  } finally { a.close(); }
});

test('create, edit, complete, reopen, list, delete; missing records return 404', async () => {
  const a = app();
  try {
    const created = (await data(await a.request('/api/todos', 'POST', { title: ' First task ' }), 201)).todo;
    assert.equal(created.title, 'First task');
    assert.equal(created.completed, false);
    assert.ok(created.created_at > 0);
    const path = '/api/todos/' + created.id;
    const edited = (await data(await a.request(path, 'PATCH', { title: '<img src=x onerror=alert(1)>', completed: true }))).todo;
    assert.equal(edited.title, '<img src=x onerror=alert(1)>');
    assert.equal(edited.completed, true);
    assert.equal(edited.created_at, created.created_at);
    assert.deepEqual((await data(await a.request('/api/todos'))).todos, [edited]);
    assert.equal((await data(await a.request(path, 'PATCH', { completed: false }))).todo.completed, false);
    await data(await a.request(path, 'DELETE'));
    assert.deepEqual((await data(await a.request('/api/todos'))).todos, []);
    await data(await a.request(path, 'DELETE'), 404);
    await data(await a.request(path, 'PATCH', { completed: true }), 404);
  } finally { a.close(); }
});

test('rejects invalid, oversized, cross-site, and unsupported requests without changing data', async () => {
  const a = app();
  try {
    for (const value of [{}, { title: '' }, { title: '  ' }, { title: 'a'.repeat(241) }, { title: 42 }, { title: 'valid', completed: true }, [], null]) {
      await data(await a.request('/api/todos', 'POST', value), 400);
    }
    const created = (await data(await a.request('/api/todos', 'POST', { title: 'Keep' }), 201)).todo;
    for (const value of [{}, { completed: 1 }, { completed: 'false' }, { title: null }, { id: 'changed' }]) {
      await data(await a.request('/api/todos/' + created.id, 'PATCH', value), 400);
    }
    for (const [body, headers] of [
      ['{bad', { 'content-type': 'application/json' }],
      ['x'.repeat(4097), { 'content-type': 'application/json' }],
      ['{"title":"wrong content type"}', { 'content-type': 'text/plain' }],
      ['{"title":"cross-site"}', { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }],
    ]) {
      await data(await a.fetch(new Request('http://localhost/api/todos', { method: 'POST', headers, body })), 400);
    }
    await data(await a.fetch(new Request('http://localhost/api/todos/' + created.id, { method: 'DELETE', headers: { 'sec-fetch-site': 'cross-site' } })), 400);
    await data(await a.request('/api/todos', 'PUT'), 405);
    await data(await a.request('/api/todos', 'OPTIONS'), 405);
    await data(await a.request('/api/todos/not-an-id', 'DELETE'), 404);
    await data(await a.request('/missing'), 404);
    assert.deepEqual((await data(await a.request('/api/todos'))).todos, [created]);
  } finally { a.close(); }
});

test('task limit is explicit and never silently truncates the list', async () => {
  const a = app();
  try {
    for (let i = 0; i < 1000; i++) {
      await data(await a.request('/api/todos', 'POST', { title: 'Task ' + i }), 201);
    }
    await data(await a.request('/api/todos', 'POST', { title: 'One too many' }), 409);
    assert.equal((await data(await a.request('/api/todos'))).todos.length, 1000);
  } finally { a.close(); }
});

test('todos survive closing and reopening the SQLite database', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'todos-test-'));
  const filename = join(directory, 'state.sqlite');
  let a = app(filename);
  try {
    const created = (await data(await a.request('/api/todos', 'POST', { title: 'Persist me' }), 201)).todo;
    await data(await a.request('/api/todos/' + created.id, 'PATCH', { completed: true }));
    a.close(); a = app(filename);
    const rows = (await data(await a.request('/api/todos'))).todos;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, created.id);
    assert.equal(rows[0].completed, true);
  } finally { a.close(); rmSync(directory, { recursive: true }); }
});
