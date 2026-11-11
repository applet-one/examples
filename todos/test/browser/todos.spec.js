import { test, expect } from '@playwright/test';

test('browser CRUD, filtering, reload, safe text rendering, and failed-save feedback', async ({ page, request }) => {
  const title = 'verification: browser ' + crypto.randomUUID();
  const edited = title + ' <img src=x onerror=alert(1)>';
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  let id;
  try {
    await page.goto('/');
    await expect(page).toHaveTitle('Todos · Applet One');
    await expect(page.getByRole('heading', { name: 'A little less to do.' })).toBeVisible();
    await page.getByRole('textbox', { name: 'New todo' }).fill(title);
    await page.getByRole('button', { name: 'Add todo', exact: true }).click();
    let row = page.getByRole('listitem').filter({ hasText: title });
    await expect(row).toBeVisible();
    await expect(page.getByText('Saved to server', { exact: true })).toBeVisible();
    id = await row.getAttribute('data-id');
    row = page.locator('[data-id="' + id + '"]');

    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await row.getByRole('textbox', { name: 'Edit todo' }).fill(edited);
    await row.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(row.locator('.title')).toHaveText(edited);
    await expect(row.locator('img')).toHaveCount(0);
    await expect(page.getByText('Saved to server', { exact: true })).toBeVisible();

    await page.route('**/api/todos/' + id, route => {
      if (route.request().method() === 'PATCH') return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Simulated save failure"}' });
      return route.continue();
    });
    await row.getByRole('checkbox').check();
    await expect(page.getByRole('alert')).toHaveText('Simulated save failure');
    await expect(row.getByRole('checkbox')).not.toBeChecked();
    await page.unroute('**/api/todos/' + id);
    await row.getByRole('checkbox').check();
    await expect(page.getByText('Saved to server', { exact: true })).toBeVisible();
    await expect(row.getByRole('checkbox')).toBeChecked();

    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await expect(page.getByRole('listitem').filter({ hasText: edited })).toHaveCount(0);
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    await expect(page.getByRole('listitem').filter({ hasText: edited })).toBeVisible();
    await page.reload();
    row = page.getByRole('listitem').filter({ hasText: edited });
    await expect(row.getByRole('checkbox')).toBeChecked();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('textbox', { name: 'New todo' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/todos-mobile.png', fullPage: true });
    await row.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('listitem').filter({ hasText: edited })).toHaveCount(0);
    await expect(page.getByText('Saved to server', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Loaded from server', { exact: true })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: edited })).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  } finally {
    // Remove only this uniquely identified test item; never clear the shared list.
    if (id) await request.delete('/api/todos/' + id).catch(() => {});
  }
});
