import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { client } from './client.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
test('activity updates do not replace the shell or a one-time token', async () => {
  const handlers = {}, app = { innerHTML: '', addEventListener(type, fn) { handlers[type] = fn; } }, elements = {};
  for (const key of ['#machines', '#project-count', '#signal-count', '#lanes', '#more-lanes', '#detail', '#archive', '#notice', '#copy-url', '#copy-token', '#done']) elements[key] = { innerHTML: '', textContent: '' };
  elements['#machine-filter'] = { innerHTML: '', value: '' };
  let socket;
  class Socket { constructor() { socket = this; } close() {} }
  const fetch = async (url, options) => ({ ok: true, text: async () => JSON.stringify(
    url.endsWith('/setup') ? { ready: true } :
    url.endsWith('/snapshot') ? { daemons: [], agents: [], archived: false } :
    url.endsWith('/daemons') && options?.method === 'POST' ? { token: 'secret-once', url: 'wss://example.test/ingest' } : {}
  ) });
  vm.runInNewContext(client, {
    document: { querySelector: key => key === '#app' ? app : key === '#flight-deck' ? (app.innerHTML.includes('id="flight-deck"') ? {} : null) : elements[key] },
    location: { origin: 'https://example.test' }, WebSocket: Socket,
    FormData: class { constructor() { return [['name', 'laptop']]; } },
    fetch, setTimeout, confirm: () => true, prompt: () => 'laptop',
    navigator: { clipboard: { writeText: async () => {} } },
  });
  await tick(); assert.ok(socket);
  const shell = app.innerHTML;
  assert.ok(shell.indexOf('id="machines"') < shell.indexOf('id="add"'));
  assert.ok(shell.indexOf('class="visual-grid"') < shell.indexOf('class="detail-card" id="detail"'));
  assert.ok(shell.indexOf('class="detail-card" id="detail"') < shell.indexOf('class="key-card"'));
  socket.onmessage({ data: '{"type":"change"}' }); await tick();
  assert.equal(app.innerHTML, shell);
  await handlers.click({ target: { id: 'add', closest: () => null } });
  assert.match(app.innerHTML, /secret-once/);
  socket.onmessage({ data: '{"type":"change"}' }); await tick();
  assert.match(app.innerHTML, /secret-once/);
  elements['#done'].onclick(); await tick();
  assert.doesNotMatch(app.innerHTML, /secret-once/);
});

test('synthetic demo shows three workers without API requests or machine controls', async () => {
  const app = { innerHTML: '', addEventListener() {} }, elements = {};
  for (const key of ['#machines', '#project-count', '#signal-count', '#lanes', '#more-lanes', '#detail', '#archive', '#size-guide']) elements[key] = { innerHTML: '', textContent: '' };
  elements['#machine-filter'] = { innerHTML: '', value: '' };
  let requests = 0;
  vm.runInNewContext(client, {
    document: { querySelector: key => key === '#app' ? app : key === '#flight-deck' ? (app.innerHTML.includes('id="flight-deck"') ? {} : null) : elements[key] },
    location: { pathname: '/demo', origin: 'https://example.test' },
    fetch: () => { requests++; throw Error('demo made a network request'); },
    WebSocket: class { constructor() { throw Error('demo opened a socket'); } }, setTimeout,
  });
  await tick();
  assert.equal(requests, 0);
  assert.match(app.innerHTML, /SAMPLE FLIGHT DECK/);
  assert.doesNotMatch(app.innerHTML, /id="add"|id="logout"/);
  assert.equal((elements['#machines'].innerHTML.match(/class="machine"/g) || []).length, 3);
  assert.doesNotMatch(elements['#machines'].innerHTML, /data-action=/);
  assert.equal(elements['#project-count'].textContent, 6);
  assert.equal(elements['#signal-count'].textContent, 12);
  assert.match(elements['#detail'].innerHTML, /clanker-station/);
  assert.match(elements['#detail'].innerHTML, /Forge · build worker/);
  assert.match(elements['#detail'].innerHTML, /224K/);
  assert.match(elements['#lanes'].innerHTML, /--dot-size:20px/);
  assert.match(elements['#lanes'].innerHTML, /--dot-size:38px/);
});

test('dot diameter follows visible token totals; missing usage remains neutral', async () => {
  const handlers = {}, app = { innerHTML: '', addEventListener(type, fn) { handlers[type] = fn; } }, elements = {};
  for (const key of ['#machines', '#project-count', '#signal-count', '#lanes', '#more-lanes', '#detail', '#archive', '#notice', '#size-guide']) elements[key] = { innerHTML: '', textContent: '' };
  elements['#machine-filter'] = { innerHTML: '', value: '' };
  const agents = [
    { daemon_id: 'a', sid: 'small', project: 'test', projectKey: 'a', machine: 'A', last_at: new Date().toISOString(), stats: { usageRecords: 1, totalTokens: 100 } },
    { daemon_id: 'b', sid: 'large', project: 'test', projectKey: 'b', machine: 'B', last_at: new Date().toISOString(), stats: { usageRecords: 1, totalTokens: 10000 } },
    { daemon_id: 'a', sid: 'unknown', project: 'other', projectKey: 'c', machine: 'A', last_at: new Date().toISOString(), stats: null },
  ];
  const fetch = async url => ({ ok: true, text: async () => JSON.stringify(url.endsWith('/setup') ? { ready: true } : { daemons: [{ id: 'a', name: 'A', status: 'offline', backlog: 0 }, { id: 'b', name: 'B', status: 'offline', backlog: 0 }], agents, archived: false }) });
  vm.runInNewContext(client, {
    document: { querySelector: key => key === '#app' ? app : key === '#flight-deck' ? (app.innerHTML.includes('id="flight-deck"') ? {} : null) : elements[key] },
    location: { origin: 'https://example.test' }, WebSocket: class { close() {} }, fetch, setTimeout,
  });
  await tick();
  assert.match(elements['#lanes'].innerHTML, /--dot-size:20px[^>]*100 tokens/);
  assert.match(elements['#lanes'].innerHTML, /--dot-size:38px[^>]*10K tokens/i);
  assert.match(elements['#lanes'].innerHTML, /unreported[^>]*--dot-size:24px/);
  assert.match(elements['#size-guide'].innerHTML, /Small 100 → large 10K tokens/i);
  elements['#machine-filter'].value = 'b';
  handlers.change({ target: { id: 'machine-filter', value: 'b' } });
  assert.match(elements['#lanes'].innerHTML, /--dot-size:29px/);
  assert.match(elements['#size-guide'].innerHTML, /equal-sized dots/);
});
