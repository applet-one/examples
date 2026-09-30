import { test, expect } from '@pesuto/demotale';

test('verify fresh sample workspace and local demo account', async ({ request, baseURL }) => {
  // Refuse CLI/environment target overrides before any authentication or mutation.
  expect(baseURL).toBe('http://127.0.0.1:8794');
  // These are the app's public seed credentials, not an existing hosted account.
  const login = await request.post('/api/login', {
    data: { email: 'demo@demo.de', password: 'demo@demo.de' },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  expect((await login.json()).must_reset).toBe(false);
  // The API client omits Secure cookies over HTTP, including loopback. Send the
  // returned cookie explicitly for this isolated local request; keep it off camera.
  const cookie = login.headers()['set-cookie'].split(';')[0];
  expect(cookie).toMatch(/^sidechat_session=[a-z0-9-]+$/);
  const headers = { Cookie: cookie };
  const response = await request.get('/api/state', { headers });
  expect(response.ok(), await response.text()).toBeTruthy();
  const state = await response.json();
  expect(state.title).toBe('Sidechat Team');
  expect(state.currentSlug).toBe('demo');
  expect(state.isAdmin).toBe(false);
  expect(state.channels.map((channel: { id: string }) => channel.id)).toEqual(['general', 'ideas', 'launch']);
  // Refuse previously edited state; do not call the destructive reset endpoint.
  expect(state.channels.map((channel: { note: string }) => channel.note)).toEqual([
    'Welcome! Share updates and useful links here.',
    'A space for thoughts worth coming back to.',
    'Keep launch plans and next steps in view.',
  ]);
  expect(state.messages.map((message: { channel: string; user: string; body: string }) => [message.channel, message.user, message.body])).toEqual([
    ['general', 'Alex', 'Welcome to Sidechat! Use this space to keep the team in sync.'],
    ['launch', 'Sam', 'Let’s keep launch tasks and updates here.'],
  ]);
  expect(state.tasks.map((task: { title: string; completed: number }) => [task.title, task.completed])).toEqual([
    ['Share your weekly update', 0],
    ['Review launch checklist', 0],
  ]);
  const logout = await request.post('/api/logout', { data: {}, headers });
  expect(logout.ok()).toBeTruthy();
});
