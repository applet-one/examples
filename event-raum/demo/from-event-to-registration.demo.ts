import { readFile } from 'node:fs/promises';
import { test, expect } from '@pesuto/demotale';
import type { Locator } from '@playwright/test';

const origin = 'http://127.0.0.1:8792';
test('eventraum from event to registration', async ({ page, demo }) => {
  const { password, eventId, title, discountCode } = JSON.parse(await readFile('demo/output/fixtures.json', 'utf8'));
  let reference = '', accessCode = '';
  const summary = page.locator('.summary-card');
  const show = async (locator: Locator, hold = 1400) => {
    await locator.scrollIntoViewIfNeeded();
    await demo.spotlight(locator, hold);
    await demo.clearSpotlight();
  };

  await demo.card('eventraum', 'From event to registration');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Gute Begegnungen/ })).toBeVisible();
  await demo.hideCard();
  await demo.note('Local pilot · Fictional data · No online payments');
  await demo.pause(1200);

  await demo.step('Find an event and see the details at a glance.', async () => {
    await demo.click(page.locator('.hero-actions').getByRole('button', { name: 'Events entdecken' }));
    await expect(page.locator('.event-card')).toHaveCount(3);
    await demo.pause(1000);
    await demo.click(page.locator('.event-card').filter({ hasText: title }));
    await expect(page).toHaveURL(`${origin}/events/${eventId}`);
    await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
    await expect(page.locator('.detail-meta')).toContainText('Salon Mitte');
    await expect(page.getByRole('button', { name: 'Als Mitglied' })).toBeVisible();
    await show(page.locator('.detail-meta'));
  });

  await demo.step('Early-bird prices update instantly for members and companions.', async () => {
    await demo.click(page.getByRole('button', { name: 'Als Mitglied' }));
    await page.getByLabel('Mitgliedsnummer').fill('DEMO-1042');
    await demo.click(page.getByRole('button', { name: 'Begleitperson hinzufügen' }));
    await expect(summary.locator('.summary-line')).toHaveCount(2);
    await expect(summary).toContainText('2 Personen');
    await expect(summary.locator('.summary-line').first()).toContainText('20,00');
    await expect(summary.locator('.summary-line').nth(1)).toContainText('30,00');
    await expect(summary.locator('.summary-total')).toContainText('50,00');
    await expect(summary.getByText('Early Bird', { exact: true })).toHaveCount(2);
    await show(summary, 1800);
  });

  await demo.step('A discount code lowers the price before you request a place.', async () => {
    const panels = page.locator('.person-panel');
    for (const [i, person] of [
      { first: 'Alice', last: 'Morgan', email: 'alice@example.invalid', company: 'Demo Studio' },
      { first: 'Bob', last: 'Chen', email: 'bob@example.invalid', company: 'Demo Studio' },
    ].entries()) {
      const panel = panels.nth(i);
      await panel.getByLabel('Vorname', { exact: false }).fill(person.first);
      await panel.getByLabel('Nachname', { exact: false }).fill(person.last);
      await panel.getByLabel('E-Mail-Adresse', { exact: false }).fill(person.email);
      await panel.getByLabel('Unternehmen', { exact: false }).fill(person.company);
      if (i > 0) await panel.getByRole('checkbox', { name: /Regel zur Teilnahme als Gast/ }).check();
    }
    const billing = page.locator('.form-block').filter({ has: page.getByRole('heading', { name: 'Rechnungsanschrift', exact: true }) });
    for (const [label, value] of Object.entries({
      'Name / Unternehmen': 'Demo Studio', 'Straße und Hausnummer': 'Beispielweg 12',
      Postleitzahl: '10115', Ort: 'Berlin', Land: 'Deutschland',
    })) await billing.getByLabel(label, { exact: false }).fill(value);
    await page.getByLabel('Rabattcode (optional)').fill(discountCode);
    await expect(summary.locator('.discount-line')).toContainText('5,00');
    await expect(summary.locator('.summary-total')).toContainText('45,00');
    await show(summary, 1800);
    await page.getByRole('checkbox', { name: /Ich stimme der Verarbeitung/ }).check();
    const registered = page.waitForResponse(r => r.url() === `${origin}/api/register` && r.request().method() === 'POST');
    await demo.click(page.getByRole('button', { name: 'Anmeldung anfragen' }));
    const response = await registered;
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.registration.status).toBe('pending');
    expect(data.registration.payment_status).toBe('awaiting_payment');
    expect(data.registration.total).toBe(4500);
    reference = data.registration.id; accessCode = data.access_code;
    await expect(page.getByRole('heading', { name: 'Deine Anfrage ist eingegangen.' })).toBeVisible();
    await expect(page.locator('.success-page')).toContainText('es wurde keine Zahlung ausgelöst');
    await show(page.locator('.access-card'), 1800);
  });

  await demo.step('Use your reference and access code to check your registration.', async () => {
    await demo.click(page.locator('.success-page').getByRole('button', { name: 'Anmeldung verwalten' }));
    await page.getByLabel('Referenznummer').fill(reference);
    await page.getByLabel('Zugangscode', { exact: false }).fill(accessCode);
    await demo.click(page.getByRole('button', { name: 'Anmeldung anzeigen' }));
    const result = page.locator('.result-card');
    await expect(result).toContainText(title);
    await expect(result).toContainText('Zahlung offen');
    await expect(result).toContainText('2 Personen');
    await expect(result).toContainText('45,00');
    await expect(result).toContainText('Es wurde keine Zahlung verarbeitet.');
    await show(result, 1800);
  });

  await demo.step('The event team sees pending registrations in its protected dashboard.', async () => {
    // API login is invisible: the admin password never enters the filmed UI.
    const login = await page.request.post(`${origin}/api/admin/login`, {
      headers: { Origin: origin }, data: { password },
    });
    expect(login.ok()).toBeTruthy();
    await demo.click(page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('button', { name: 'Für Veranstalter' }));
    await expect(page.getByRole('heading', { name: /Alles auf einen/ })).toBeVisible();
    await demo.pause(1000);
    await demo.click(page.locator('.admin-sidebar').getByRole('button', { name: /Anmeldungen/ }));
    const row = page.getByRole('row').filter({ hasText: reference });
    await expect(row).toContainText('Alice Morgan');
    await expect(row).toContainText(title);
    await expect(row).toContainText('45,00');
    await expect(row).toContainText('Zahlung offen');
    const overview = await (await page.request.get(`${origin}/api/admin/overview`)).json();
    expect(overview.registrations).toHaveLength(1);
    expect(overview.registrations[0].status).toBe('pending');
    await show(row, 2400);
    await demo.pause(1500);
  });
});
