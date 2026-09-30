import { test, expect } from '@pesuto/demotale';

const disclosure = 'Local demo · fictional team · sample data';
const message = 'Launch preview is ready. Please review the checklist.';
const note = 'Preview Friday. Review the checklist and share feedback in #launch.';
const taskTitle = 'Review the launch preview';

test('Sidechat from team updates to done', async ({ page, demo, baseURL }) => {
  expect(baseURL).toBe('http://127.0.0.1:8794');
  // Authenticate off camera with the seed account, sharing cookies with this page.
  const login = await page.request.post('/api/login', {
    data: { email: 'demo@demo.de', password: 'demo@demo.de' },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  // Chromium trusts loopback for Secure cookies; the API client's cookie jar
  // does not. Use the returned cookie explicitly only for local API assertions.
  const cookie = login.headers()['set-cookie'].split(';')[0];
  expect(cookie).toMatch(/^sidechat_session=[a-z0-9-]+$/);
  const saved = async () => {
    const response = await page.request.get('/api/state', { headers: { Cookie: cookie } });
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  const launch = page.getByRole('button', { name: '# launch', exact: true });
  const pinnedNote = page.locator('.card').filter({ has: page.getByRole('heading', { name: '📌 Pinned note' }) });
  const tasks = page.locator('.card').filter({ has: page.getByRole('heading', { name: '✓ Tasks' }) });
  const task = tasks.locator('.task').filter({ hasText: taskTitle });
  const posted = page.locator('.message').filter({ hasText: message });

  await demo.card('Sidechat', 'From team updates to done');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '# general', exact: true })).toBeVisible();
  await demo.hideCard();
  await demo.note(disclosure);

  await demo.step('Keep each conversation in its own channel.', async () => {
    await expect(page.locator('.messages')).toContainText('Welcome to Sidechat!');
    await expect(page.locator('.messages')).not.toContainText('Let’s keep launch tasks');
    await demo.spotlight(page.locator('.messages'), 1_500);
    await demo.clearSpotlight();
    await demo.click(launch);
    await expect(page.getByRole('heading', { name: '# launch', exact: true })).toBeVisible();
    await expect(page.locator('.messages')).toContainText('Let’s keep launch tasks and updates here.');
    await expect(page.locator('.messages')).not.toContainText('Welcome to Sidechat!');
    await demo.spotlight(page.locator('.message'), 1_600);
    await demo.clearSpotlight();
  });

  await demo.step('Post a team update right where it belongs.', async () => {
    const input = page.getByPlaceholder('Message #launch…');
    await demo.click(input);
    await input.fill(message);
    await demo.click(page.getByRole('button', { name: 'Send', exact: true }));
    await expect(posted).toContainText('demo');
    await expect.poll(async () => (await saved()).messages.filter((item: { body: string; channel: string }) => item.body === message && item.channel === 'launch').length).toBe(1);
    await demo.spotlight(posted, 2_000);
    await demo.clearSpotlight();
  });

  await demo.step('Pin the details your team needs to remember.', async () => {
    const input = pinnedNote.locator('textarea');
    await demo.click(input);
    await input.fill(note);
    await demo.click(page.getByRole('button', { name: 'Save note', exact: true }));
    await expect(input).toHaveValue(note);
    await expect.poll(async () => (await saved()).channels.find((channel: { id: string }) => channel.id === 'launch').note).toBe(note);
    await demo.spotlight(pinnedNote, 2_000);
    await demo.clearSpotlight();
  });

  await demo.step('Keep shared tasks beside the conversation.', async () => {
    const input = page.getByPlaceholder('Add a task…');
    await demo.click(input);
    await input.fill(taskTitle);
    await demo.click(page.getByRole('button', { name: 'Add task', exact: true }));
    await expect(task.getByRole('checkbox')).not.toBeChecked();
    await demo.spotlight(task, 1_200);
    await demo.clearSpotlight();
    await demo.click(task.getByRole('checkbox'));
    await expect(task.getByRole('checkbox')).toBeChecked();
    await expect(task).toHaveClass(/done/);
    await expect.poll(async () => (await saved()).tasks.find((item: { title: string }) => item.title === taskTitle).completed).toBe(1);
    await demo.spotlight(tasks, 2_000);
    await demo.clearSpotlight();
  });

  await demo.step('Your messages, notes, and completed tasks survive a reload.', async () => {
    const before = await saved();
    await page.reload();
    await expect(page.getByRole('heading', { name: '# general', exact: true })).toBeVisible();
    await demo.note(disclosure);
    await demo.click(launch);
    await expect(posted).toBeVisible();
    await expect(pinnedNote.locator('textarea')).toHaveValue(note);
    await expect(task.getByRole('checkbox')).toBeChecked();
    const after = await saved();
    expect(after.messages).toEqual(before.messages);
    expect(after.channels).toEqual(before.channels);
    expect(after.tasks).toEqual(before.tasks);
    await demo.spotlight(posted, 1_300);
    await demo.clearSpotlight();
    await demo.spotlight(page.locator('.panel'), 2_000);
    await demo.clearSpotlight();
    await demo.pause(1_000);
  });

  // Approved text-only closing card; no deployment or external navigation.
  await demo.card('Deploy your own app today at applet.one', '', 4_200);
  await expect(page.locator('#__demo-layer .demo-card h1')).toHaveText('Deploy your own app today at applet.one');
  expect(page.url()).toBe('http://127.0.0.1:8794/');
});
