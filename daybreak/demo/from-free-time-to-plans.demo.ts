import { readFile } from 'node:fs/promises';
import { test, expect } from '@pesuto/demotale';

type Fixtures = {
  alice: { name: string; email: string; password: string };
  bob: { name: string; email: string; password: string };
  day: string;
};

test('Daybreak from free time to plans', async ({ page, demo }) => {
  const { alice, bob, day } = JSON.parse(await readFile('demo/output/fixtures.json', 'utf8')) as Fixtures;
  const origin = 'http://127.0.0.1:8791';
  // Log Alice in via the page's request context, so cookies are shared with the filmed browser.
  // Preparation and authentication aren't a scene of the approved story.
  const login = await page.request.post(`${origin}/api/auth/login`, {
    headers: { Origin: origin }, data: { email: alice.email, password: alice.password },
  });
  expect(login.ok(), await login.text()).toBeTruthy();

  await demo.card('Daybreak', 'From free time to plans');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Make room for good company.' })).toBeVisible();
  await demo.hideCard();
  await demo.note('Local demo · fictional accounts');

  await demo.step('Alice shares an evening she’s free.', async () => {
    await demo.click(page.locator('[data-action="add-slot"]'));
    const dialog = page.getByRole('dialog', { name: 'Add free time' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('From').fill(`${day}T18:00`);
    await dialog.getByLabel('Until').fill(`${day}T20:00`);
    await demo.click(dialog.getByRole('button', { name: 'Add free time' }));
    await expect(page.getByText('Your free time', { exact: true }).last()).toBeVisible();
    await expect(page.locator('.slot-info').filter({ hasText: 'Your free time' })).toContainText('18:00 – 20:00');
    await demo.spotlight(page.locator('.slot-info').filter({ hasText: 'Your free time' }), 900);
    await demo.clearSpotlight();
  });

  await demo.step('Bob’s free time appears alongside hers.', async () => {
    await demo.click(page.locator('.friend-row').filter({ hasText: bob.name }).getByRole('button', { name: 'View slots' }));
    const bobSlot = page.locator('.slot-info').filter({ hasText: `${bob.name} is free` });
    await expect(bobSlot).toContainText('19:00 – 21:00');
    await demo.spotlight(bobSlot, 900);
    await demo.clearSpotlight();
  });

  await demo.step('Daybreak finds a time that works for both.', async () => {
    const shared = page.locator('.shared-window').filter({ hasText: '19:00 – 20:00' });
    await expect(shared).toContainText('Both of you are free');
    await demo.spotlight(shared, 900);
    await demo.clearSpotlight();
    await demo.click(shared.getByRole('button', { name: 'Request' }));
    await expect(page.getByRole('dialog', { name: 'Make a plan' })).toBeVisible();
    await demo.click(page.getByRole('button', { name: 'Send invitation' }));
    await demo.click(page.locator('nav [data-view="requests"]'));
    await expect(page.getByRole('heading', { name: 'Sent · 1' })).toBeVisible();
    await expect(page.locator('.request-card').filter({ hasText: bob.name })).toBeVisible();
  });

  await demo.step('Bob accepts the invitation.', async () => {
    await demo.click(page.getByRole('button', { name: /Log out/ }));
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await page.getByLabel('Email address').fill(bob.email);
    await page.getByLabel('Password').fill(bob.password);
    await demo.click(page.getByRole('button', { name: /Sign in/ }));
    await expect(page.getByRole('heading', { name: 'Make room for good company.' })).toBeVisible();
    await demo.click(page.locator('nav [data-view="requests"]'));
    const invitation = page.locator('.request-card').filter({ hasText: alice.name });
    await expect(invitation).toBeVisible();
    await demo.click(invitation.getByRole('button', { name: 'Accept' }));
    await expect(page.getByRole('heading', { name: 'Received · 0' })).toBeVisible();
  });

  await demo.step('The plan is booked, and that time is reserved.', async () => {
    await demo.click(page.locator('nav [data-view="meetings"]'));
    await expect(page.getByRole('heading', { name: 'Upcoming · 1' })).toBeVisible();
    await expect(page.getByText(`Time with ${alice.name}`)).toBeVisible();
    await demo.click(page.locator('nav [data-view="calendar"]'));
    await demo.click(page.getByRole('button', { name: day, exact: true }));
    const booked = page.locator('.slot-info').filter({ hasText: `Booked · ${alice.name}` });
    await expect(booked).toContainText('19:00 – 20:00');
    await demo.spotlight(booked, 1_800);
    await demo.clearSpotlight();
    await demo.pause(1_200);
  });
});
