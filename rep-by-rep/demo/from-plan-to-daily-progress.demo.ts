import { readFile } from 'node:fs/promises';
import { test, expect } from '@pesuto/demotale';
import { center, disclosure, mobilePresentation, note, origin } from './support.js';

test('Rep by Rep from plan to daily progress', async ({ page, demo, baseURL }) => {
  expect(baseURL).toBe(origin);
  const { password, day } = JSON.parse(await readFile('demo/output/fixtures.json', 'utf8'));
  const login = await page.request.post('/api/login', { headers: { Origin: origin }, data: { password } });
  expect(login.ok()).toBeTruthy();
  const saved = async () => {
    const exercises = await page.request.get('/api/exercises');
    const logs = await page.request.get('/api/logs');
    const presets = await page.request.get('/api/presets');
    expect(exercises.ok() && logs.ok() && presets.ok()).toBeTruthy();
    return { ...(await exercises.json()), ...(await logs.json()), ...(await presets.json()) };
  };
  const shoulder = page.locator('section.card').filter({ has: page.getByRole('heading', { name: 'Shoulder rolls', exact: true }) });
  const ankle = page.locator('section.card').filter({ has: page.getByRole('heading', { name: 'Seated ankle circles', exact: true }) });
  const summary = page.getByRole('region', { name: 'Daily progress' });
  const history = page.locator('.history-card');

  await mobilePresentation(page);
  // Mobile about:blank can shrink or drop the card in Chromium's video. Load the
  // approved local UI first so its viewport metadata is active before the title.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'One rep at a time.' })).toBeVisible();
  expect(await page.evaluate(() => window.innerWidth)).toBe(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await demo.card('Rep by Rep', 'From plan to daily progress');
  await demo.hideCard();
  await demo.note(disclosure);

  await demo.step('Start with an optional example plan.', async () => {
    await demo.click(page.getByRole('button', { name: 'plan', exact: true }));
    const add = page.getByRole('button', { name: 'Add Gentle movement', exact: true });
    await center(add);
    await demo.click(add);
    await expect(page.getByRole('button', { name: 'Already added Gentle movement' })).toBeDisabled();
    await expect(page.locator('.plan-card')).toHaveCount(2);
    expect((await saved()).exercises.map((exercise: { name: string }) => exercise.name)).toEqual(['Shoulder rolls', 'Seated ankle circles']);
    expect((await saved()).presets.find((preset: { id: string }) => preset.id === 'gentle-movement').installed).toBe(true);
    await center(page.locator('.plan-card').first());
    await demo.spotlight(page.locator('.plan-card').first(), 1_500);
    await demo.clearSpotlight();
    await demo.pause(900);
  });

  await demo.step('Adjust targets and scheduled days to match your own plan.', async () => {
    await center(page.getByRole('button', { name: 'Edit Shoulder rolls', exact: true }));
    await demo.click(page.getByRole('button', { name: 'Edit Shoulder rolls', exact: true }));
    const target = page.getByLabel('Target amount', { exact: true });
    await center(target);
    await demo.click(target);
    await target.fill('8');
    await demo.click(page.getByText('Tue', { exact: true }));
    await expect(page.getByRole('checkbox', { name: 'Tue', exact: true })).toBeChecked();
    await demo.pause(900);
    const save = page.getByRole('button', { name: 'Save exercise →', exact: true });
    await center(save);
    await demo.click(save);
    const card = page.locator('.plan-card').filter({ has: page.getByRole('heading', { name: 'Shoulder rolls', exact: true }) });
    await expect(card).toContainText('8 reps · Mon, Tue, Wed, Fri');
    const exercise = (await saved()).exercises.find((item: { name: string }) => item.name === 'Shoulder rolls');
    expect(exercise.target).toBe(8);
    expect(exercise.days).toEqual([1, 2, 3, 5]);
    await center(card);
    await demo.spotlight(card, 1_600);
    await demo.clearSpotlight();
  });

  await demo.step('Record your reps and how the exercise felt.', async () => {
    await demo.click(page.getByRole('button', { name: 'today', exact: true }));
    const date = page.getByLabel('Choose date', { exact: true });
    await center(date);
    await demo.click(date);
    await date.fill(day);
    await expect(summary).toContainText('0 / 2');
    const amount = shoulder.getByLabel('Completed reps', { exact: true });
    await center(amount);
    await demo.click(amount);
    await amount.fill('8');
    await shoulder.getByRole('combobox', { name: /^Pain · 0–10/ }).selectOption('2');
    await demo.type(shoulder.getByLabel('Note (optional)', { exact: true }), note, 45);
    const record = shoulder.getByRole('button', { name: 'Record exercise', exact: true });
    await center(record);
    await demo.click(record);
    await expect(shoulder).toContainText('✓ Recorded');
    await expect(summary).toContainText('1 / 2');
    const log = (await saved()).logs[0];
    expect(log).toMatchObject({ day, exercise_name: 'Shoulder rolls', amount: 8, pain: 2, note, skipped: 0 });
    await center(shoulder);
    await demo.spotlight(shoulder, 1_800);
    await demo.clearSpotlight();
  });

  await demo.step('Skip an exercise and keep your daily record up to date.', async () => {
    const skip = ankle.getByRole('button', { name: 'Skip', exact: true });
    await center(skip);
    await demo.click(skip);
    await expect(ankle.locator('.badge')).toHaveText('Skipped');
    expect((await saved()).logs.find((log: { exercise_name: string }) => log.exercise_name === 'Seated ankle circles')).toMatchObject({ day, amount: 0, pain: null, note: '', skipped: 1 });
    await center(ankle.getByRole('heading', { name: 'Seated ankle circles', exact: true }));
    await demo.spotlight(ankle.locator('.card-head'), 1_600);
    await demo.clearSpotlight();
    await expect(summary).toContainText('2 / 2');
    await expect(summary.getByRole('progressbar')).toHaveAttribute('value', '2');
    await center(summary);
    await demo.spotlight(summary, 1_800);
    await demo.clearSpotlight();
  });

  await demo.step('Review your history—even after reloading.', async () => {
    await demo.click(page.getByRole('button', { name: 'history', exact: true }));
    await expect(history).toContainText(day);
    await expect(history).toContainText('8 recorded · Pain 2/10');
    await expect(history).toContainText(note);
    await expect(history).toContainText('Skipped');
    const before = await saved();
    expect(before.logs).toHaveLength(2);
    await center(history);
    await demo.spotlight(history, 1_500);
    await demo.clearSpotlight();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'One rep at a time.' })).toBeVisible();
    await demo.note(disclosure);
    await demo.click(page.getByRole('button', { name: 'history', exact: true }));
    await expect(history).toContainText('8 recorded · Pain 2/10');
    await expect(history).toContainText(note);
    await expect(history).toContainText('Skipped');
    expect(await saved()).toEqual(before);
    await center(history);
    await demo.spotlight(history, 2_000);
    await demo.clearSpotlight();
    await demo.pause(1_000);
  });

  await demo.card('Deploy your own app today at applet.one', '', 4_200);
  await expect(page.locator('#__demo-layer .demo-card h1')).toHaveText('Deploy your own app today at applet.one');
  expect(page.url()).toBe(`${origin}/`);
});
