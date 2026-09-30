import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker, { AppletState } from '../src/index.js';
import { client } from '../src/client.js';
import { page } from '../src/page.js';
import { addDays, dateKey, monday, seedAbsences, validateAbsence, workdays } from '../src/model.js';

const today = dateKey(Date.now());
const origin = 'https://oooh.test';
const input = (overrides = {}) => ({
  person_id: 'alex',
  type: 'Vacation',
  start_date: '2026-10-19',
  end_date: '2026-10-23',
  title: '',
  notes: '',
  cover_id: '',
  ready: false,
  ...overrides,
});
function context() {
  const database = new DatabaseSync(':memory:');
  return {
    storage: {
      sql: {
        exec(query, ...args) {
          const result = database.prepare(query).all(...args);
          return { toArray: () => result };
        },
      },
      transactionSync(fn) {
        database.exec('BEGIN');
        try {
          fn();
          database.exec('COMMIT');
        } catch (error) {
          database.exec('ROLLBACK');
          throw error;
        }
      },
    },
  };
}
const request = (path, method = 'GET', body, headers = {}) =>
  new Request(origin + path, {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
async function call(state, path, method, body, headers) {
  const response = await state.fetch(request(path, method, body, headers));
  return { status: response.status, data: await response.json() };
}

test('browser bundle parses', () => {
  assert.doesNotThrow(() => new Function(client));
});
test('OOOh! branding appears in the document and client', () => {
  assert.ok(page.includes('<title>OOOh! — Out of Office. In good hands.</title>'));
  assert.ok(
    client.includes('OOOh!<span class="brand-caption">OUT OF OFFICE. IN GOOD HANDS.</span>'),
  );
  assert.ok(!page.includes('Away —'));
  assert.ok(!client.includes('<span>Away'));
});
test('date arithmetic and working days use UTC, with weekends excluded', () => {
  assert.equal(monday('2026-09-30'), '2026-09-28');
  assert.equal(monday('2026-10-04'), '2026-09-28');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(workdays('2026-10-02', '2026-10-05'), 2);
  assert.equal(workdays('2026-10-03', '2026-10-04'), 0);
});
test('relative fictional seed has six coherent absences', () => {
  const seeded = seedAbsences('2026-09-30');
  assert.equal(seeded.length, 6);
  for (const absence of seeded)
    assert.equal(validateAbsence(absence, seeded, '2026-09-30'), null, absence.id);
});
test('validates dates, types, lengths, working days, and handover readiness', () => {
  const check = (overrides) => validateAbsence(input(overrides), [], '2026-09-30');
  assert.equal(check({}), null);
  assert.match(check({ start_date: '2026-02-30' }), /valid start/);
  assert.match(check({ end_date: '2026-10-01' }), /valid start/);
  assert.match(check({ start_date: '2026-10-03', end_date: '2026-10-04' }), /weekday/);
  assert.match(check({ end_date: '2027-10-19' }), /91/);
  assert.match(check({ start_date: '2023-10-01', end_date: '2023-10-02' }), /past year/);
  assert.match(check({ type: 'made-up' }), /absence type/);
  assert.match(check({ title: 'x'.repeat(81) }), /80/);
  assert.match(check({ notes: 'x'.repeat(1001) }), /1,000/);
  assert.match(check({ ready: true }), /cover teammate and handover notes/);
  assert.match(check({ cover_id: 'alex' }), /different teammate/);
  assert.equal(check({ cover_id: 'leo', notes: 'A fictional handover.', ready: true }), null);
  assert.equal(
    check({ title: '<img src=x onerror=alert(1)>' }),
    null,
    'notes are plain text, escaped at rendering',
  );
});
test('prevents overlaps and unavailable cover in both directions', () => {
  const existing = [input({ id: 'existing' })];
  assert.match(validateAbsence(input(), existing, '2026-09-30'), /overlap/);
  assert.equal(validateAbsence(input({ id: 'existing' }), existing, '2026-09-30'), null);
  assert.match(
    validateAbsence(input({ person_id: 'leo', cover_id: 'alex' }), existing, '2026-09-30'),
    /cover teammate is away/,
  );
  assert.match(
    validateAbsence(
      input({ person_id: 'leo' }),
      [input({ id: 'existing', cover_id: 'leo' })],
      '2026-09-30',
    ),
    /covering another absence/,
  );
});
test('persistent state seeds once, survives reconstruction, and supports CRUD with stale-write protection', async () => {
  const ctx = context();
  let state = new AppletState(ctx);
  const initial = await call(state, '/api/state');
  assert.equal(initial.status, 200);
  assert.equal(initial.data.team.length, 8);
  assert.equal(initial.data.absences.length, 6);
  let start = addDays(today, 60);
  while ([0, 6].includes(new Date(start + 'T12:00:00Z').getUTCDay())) start = addDays(start, 1);
  const body = input({
    start_date: start,
    end_date: start,
    cover_id: 'leo',
    notes: 'Fictional coverage notes.',
    ready: true,
  });
  const created = await call(state, '/api/absences', 'POST', body);
  assert.equal(created.status, 201);
  const a = created.data.absence;
  assert.equal(a.version, 1);
  const overlap = await call(state, '/api/absences', 'POST', body);
  assert.equal(overlap.status, 400);
  state = new AppletState(ctx);
  assert.equal((await call(state, '/api/state')).data.absences.length, 7);
  const updated = await call(state, '/api/absences/' + a.id, 'PUT', {
    ...a,
    title: 'Updated handover',
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.absence.version, 2);
  assert.equal((await call(state, '/api/absences/' + a.id, 'PUT', a)).status, 409);
  assert.equal((await call(state, '/api/absences/' + a.id + '?version=1', 'DELETE')).status, 409);
  assert.equal((await call(state, '/api/absences/' + a.id + '?version=2', 'DELETE')).status, 200);
  assert.equal((await call(state, '/api/state')).data.absences.length, 6);
  assert.equal((await call(state, '/api/absences/' + a.id, 'DELETE')).status, 404);
});
test('rejects invalid JSON, payloads, routes, and cross-origin writes', async () => {
  const state = new AppletState(context());
  assert.equal(
    (await call(state, '/api/absences', 'POST', {}, { Origin: 'https://other.test' })).status,
    403,
  );
  assert.equal(
    (await call(state, '/api/absences', 'POST', {}, { 'Content-Type': 'text/plain' })).status,
    415,
  );
  assert.equal((await call(state, '/api/absences', 'POST', null)).status, 400);
  assert.equal((await call(state, '/api/absences', 'POST', [])).status, 400);
  assert.equal(
    (await call(state, '/api/absences', 'POST', { notes: 'x'.repeat(6001) })).status,
    413,
  );
  assert.equal(
    (
      await state.fetch(
        new Request(origin + '/api/absences', {
          method: 'POST',
          headers: { Origin: origin, 'Content-Type': 'application/json' },
          body: '{broken',
        }),
      )
    ).status,
    400,
  );
  assert.equal((await call(state, '/api/nope', 'POST', {})).status, 404);
  assert.equal((await call(state, '/api/absences', 'PUT', {})).status, 405);
});
test('serves only expected assets with security headers', async () => {
  for (const [path, type] of [
    ['/', 'text/html'],
    ['/app.js', 'application/javascript'],
    ['/style.css', 'text/css'],
    ['/favicon.svg', 'image/svg+xml'],
  ]) {
    const response = await worker.fetch(request(path));
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('Content-Type').includes(type));
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.ok(response.headers.get('Content-Security-Policy').includes("script-src 'self'"));
  }
  assert.equal((await worker.fetch(request('/unknown'))).status, 404);
  assert.equal((await worker.fetch(request('/', 'POST', {}))).status, 405);
  assert.equal(await (await worker.fetch(request('/', 'HEAD'))).text(), '');
});
