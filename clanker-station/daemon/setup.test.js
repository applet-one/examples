import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveConfig, checkUrl, expandRoot } from './setup.js';

test('setup writes gitignored-style private local config without exposing token as an argument', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'station-setup-'));
  const file = path.join(dir, 'config.json');
  const config = { url: 'wss://example.test/ingest', token: 'a'.repeat(64), roots: [path.join(dir, 'sessions')], contentMode: 'activity-only' };
  try {
    await saveConfig(file, config);
    assert.equal((await fs.stat(file)).mode & 0o077, 0);
    assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), config);
    await saveConfig(file, { ...config, token: 'b'.repeat(64) });
    assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).token, 'b'.repeat(64));
    assert.equal((await fs.stat(file)).mode & 0o077, 0);
    await assert.rejects(saveConfig(file, { ...config, url: 'ws://remote.test/ingest' }), /wss/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
test('session roots expand home and relative paths', () => {
  assert.equal(expandRoot('~/.pi/agent/sessions'), path.join(os.homedir(), '.pi/agent/sessions'));
  assert.equal(expandRoot('./sessions'), path.resolve('sessions'));
  assert.equal(expandRoot('/tmp/sessions'), '/tmp/sessions');
  assert.throws(() => expandRoot('~someone/sessions'), /other users/);
  assert.throws(() => expandRoot('ab494492-a0bd-4709-9518-2bf2af54f81d89157145-e408-4ce4-b82f-cc0ab33cc16a'), /looks like a daemon token/);
});
test('plaintext websocket is restricted to localhost', () => {
  assert.equal(checkUrl('ws://localhost:8787/ingest'), 'ws://localhost:8787/ingest');
  assert.throws(() => checkUrl('https://example.test/ingest'), /wss/);
});
