import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test, expect } from '@pesuto/demotale';

const origin = 'http://127.0.0.1:8791';
const dayInBerlin = (time: number) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(time);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const berlinTime = (day: string, hour: number) => {
  const [y, m, d] = day.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d, hour);
  for (const offset of [2, 1]) {
    const candidate = utc - offset * 3600_000;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(candidate);
    const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    if (`${p.year}-${p.month}-${p.day}` === day && Number(p.hour) === hour) return candidate;
  }
  throw new Error(`Cannot represent ${day} ${hour}:00 in Berlin`);
};

test('prepare fictional friends on disposable local state', async ({ request, page }) => {
  const password = randomBytes(18).toString('hex');
  const suffix = randomBytes(6).toString('hex');
  const alice = { name: 'Alice Morgan', email: `alice-${suffix}@example.com`, password };
  const bob = { name: 'Bob Chen', email: `bob-${suffix}@example.com`, password };
  const day = dayInBerlin(Date.now() + 10 * 86400_000);
  const post = async (api: typeof request, path: string, data: object) => {
    const response = await api.post(`${origin}/api/${path}`, { headers: { Origin: origin }, data });
    expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
    return response.json();
  };
  await post(request, 'auth/register', alice);
  await post(page.request, 'auth/register', bob);
  await post(request, 'friends/request', { email: bob.email });
  const friendsResponse = await page.request.get(`${origin}/api/bootstrap`);
  expect(friendsResponse.ok()).toBeTruthy();
  const friends = await friendsResponse.json();
  expect(friends.friendships).toHaveLength(1);
  await post(page.request, 'friends/respond', { id: friends.friendships[0].id, action: 'accept' });
  await post(page.request, 'slots', { start: berlinTime(day, 19), end: berlinTime(day, 21) });
  const path = resolve('demo/output/fixtures.json');
  await mkdir(resolve('demo/output'), { recursive: true });
  await writeFile(path, JSON.stringify({ alice, bob, day }) + '\n', { mode: 0o600 });
});
