import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Load the real backend with placeholder UI assets, without requiring a UI build.
const source = (await readFile(new URL('../src/index.js', import.meta.url), 'utf8'))
  .replace("import { page, js, css } from './generated.js';", "const page = 'test page', js = 'test js', css = 'test css';")
  .replace("'./lib.js'", JSON.stringify(new URL('../src/lib.js', import.meta.url).href));
const { AppletState } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function state(env = {}) {
  const settings = new Map();
  const sql = { exec(query, ...args) {
    if (query.startsWith('SELECT value FROM settings')) return settings.has(args[0]) ? [{ value: settings.get(args[0]) }] : [];
    if (query.startsWith('INSERT') && query.includes('INTO settings')) settings.set(args[0], args[1]);
    if (query.startsWith('UPDATE settings SET value')) settings.set(args[1], args[0]);
    return [];
  } };
  const app = new AppletState({ storage: { sql } }, env);
  app.init = () => {}; // Schema/seeding is unrelated to bootstrap authentication.
  return app;
}
function request(path, body) {
  return new Request(`https://example.test/api/admin/${path}`, body === undefined ? {} : {
    method: 'POST', headers: { Origin: 'https://example.test', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}
const password = 'testpass'; // Exactly the 8-character minimum.

test('bootstrap is disabled when the runtime secret is absent or empty', async () => {
  for (const env of [{}, { EVENTRAUM_SETUP_KEY: '' }]) {
    const app = state(env);
    assert.equal((await (await app.fetch(request('status'))).json()).setup_available, false);
    assert.equal((await app.fetch(request('setup', { setup_key: '', password }))).status, 403);
  }
});

test('bootstrap requires the runtime secret, remains one-time, and survives secret removal', async () => {
  const env = { EVENTRAUM_SETUP_KEY: 'runtime-only-test-key' };
  const app = state(env);
  const status = await app.fetch(request('status'));
  const text = await status.text();
  assert.equal(JSON.parse(text).setup_available, true);
  assert.ok(!text.includes(env.EVENTRAUM_SETUP_KEY));
  for (const setup_key of ['wrong', undefined]) {
    assert.equal((await app.fetch(request('setup', { setup_key, password }))).status, 403);
  }
  assert.equal((await app.fetch(request('setup', { setup_key: env.EVENTRAUM_SETUP_KEY, password: 'seven77' }))).status, 403);
  const response = await app.fetch(request('setup', { setup_key: env.EVENTRAUM_SETUP_KEY, password }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Set-Cookie'), /event_session=/);
  assert.equal((await app.fetch(request('setup', { setup_key: env.EVENTRAUM_SETUP_KEY, password }))).status, 403);
  for (const path of ['', 'status']) {
    const asset = await app.fetch(path ? request(path) : new Request('https://example.test/app.js'));
    assert.ok(!(await asset.text()).includes(env.EVENTRAUM_SETUP_KEY));
  }
  delete env.EVENTRAUM_SETUP_KEY;
  const after = await (await app.fetch(request('status'))).json();
  assert.equal(after.setup, true);
  assert.equal(after.setup_available, false);
  assert.equal((await app.fetch(request('login', { password }))).status, 200);
});

test('password changes reject 7 characters and accept 8 characters', async () => {
  const app = state({ EVENTRAUM_SETUP_KEY: 'test-key' });
  await app.fetch(request('setup', { setup_key: 'test-key', password }));
  app.auth = async () => true;
  assert.equal((await app.fetch(request('password', { current: password, next: 'seven77' }))).status, 400);
  assert.equal((await app.fetch(request('password', { current: password, next: 'newpass8' }))).status, 200);
  assert.equal((await app.fetch(request('login', { password: 'newpass8' }))).status, 200);
});

test('UI embedding ignores legacy files and build-time secret environment variables', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eventraum-embed-'));
  try {
    await mkdir(join(dir, 'dist/assets'), { recursive: true });
    await mkdir(join(dir, 'src'));
    await writeFile(join(dir, 'dist/index.html'), '<html></html>');
    await writeFile(join(dir, 'dist/assets/app.js'), 'console.log("ui");');
    await writeFile(join(dir, 'dist/assets/app.css'), 'body{}');
    await writeFile(join(dir, '.setup-key'), 'legacy-file-secret');
    const result = spawnSync(process.execPath, [new URL('../scripts/embed-ui.mjs', import.meta.url).pathname], {
      cwd: dir, env: { ...process.env, APPLET_SETUP_KEY: 'legacy-env-secret', EVENTRAUM_SETUP_KEY: 'runtime-env-secret' }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const generated = await readFile(join(dir, 'src/generated.js'), 'utf8');
    assert.ok(!/legacy-file-secret|legacy-env-secret|runtime-env-secret|setupKey/.test(generated));
    assert.match(generated, /export const page/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
