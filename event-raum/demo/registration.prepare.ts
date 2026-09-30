import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { test, expect } from '@pesuto/demotale';

const origin = 'http://127.0.0.1:8792';
test('prepare fictional events and admin on fresh local state', async ({ request }) => {
  const { setupKey } = JSON.parse(await readFile('demo/output/snapshot.json', 'utf8'));
  const status = await (await request.get(`${origin}/api/admin/status`)).json();
  expect(status.setup).toBe(false); // Refuse existing data, including a reused dev server.
  const password = randomBytes(24).toString('hex');
  const post = async (path: string, data: object) => {
    const response = await request.post(`${origin}/api/${path}`, { headers: { Origin: origin }, data });
    expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
    return response;
  };
  await post('admin/setup', { setup_key: setupKey, password });
  const overview = await (await request.get(`${origin}/api/admin/overview`)).json();
  expect(overview.registrations).toHaveLength(0);
  expect(overview.events).toHaveLength(3);
  const sorted = overview.events.sort((a: any, b: any) => a.id - b.id);
  const at = (days: number, hour: number) => {
    const d = new Date(); d.setUTCDate(d.getUTCDate() + days); d.setUTCHours(hour, 0, 0, 0); return d.toISOString();
  };
  const titles = ['Conversations that last', 'Ideas over breakfast', 'Perspectives and connections'];
  for (const [i, event] of sorted.entries()) {
    const response = await request.put(`${origin}/api/admin/events/${event.id}`, {
      headers: { Origin: origin }, data: {
        ...event, title: titles[i],
        description: i === 0 ? 'Meet curious people, exchange ideas and enjoy an evening of good conversation.' : 'A fictional gathering for new ideas and good company.',
        starts_at: at(16 + i * 12, 17), ends_at: at(16 + i * 12, 20), early_until: at(9 + i * 12, 0),
        ...(i === 0 ? { member_price: 2500, guest_price: 4900, companion_price: 3500,
          early_member_price: 2000, early_guest_price: 4200, early_companion_price: 3000,
          discount_code: 'DEMO10', discount_percent: 10 } : {}),
      },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
  }
  await post('admin/logout', {});
  await writeFile('demo/output/fixtures.json', JSON.stringify({
    password, eventId: sorted[0].id, title: titles[0], discountCode: 'DEMO10',
  }) + '\n', { mode: 0o600 });
});
