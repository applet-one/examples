import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect } from '@pesuto/demotale';
import { origin, recentMonday } from './support.js';

test('create only a fresh disposable physio space', async ({ request, baseURL }) => {
  expect(baseURL).toBe(origin);
  const status = await request.get('/api/status');
  expect(status.ok()).toBeTruthy();
  expect(await status.json()).toEqual({ setup: false, authenticated: false });
  const password = randomBytes(2).toString('hex');
  const setup = await request.post('/api/setup', { headers: { Origin: origin }, data: { password } });
  expect(setup.ok()).toBeTruthy();
  for (const [path, key] of [['exercises', 'exercises'], ['logs', 'logs']]) {
    const response = await request.get(`/api/${path}`);
    expect(response.ok()).toBeTruthy();
    expect((await response.json())[key]).toEqual([]);
  }
  const response = await request.get('/api/presets');
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).presets.map((preset: { id: string; installed: boolean }) => [preset.id, preset.installed])).toEqual([
    ['gentle-movement', false], ['supported-strength', false], ['desk-reset', false],
  ]);
  const logout = await request.post('/api/logout', { headers: { Origin: origin }, data: {} });
  expect(logout.ok()).toBeTruthy();
  await mkdir('demo/output', { recursive: true });
  await writeFile('demo/output/fixtures.json', JSON.stringify({ password, day: recentMonday() }));
});
