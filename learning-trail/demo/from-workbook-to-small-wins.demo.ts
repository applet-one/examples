import { mkdir } from 'node:fs/promises';
import { test, expect } from '@pesuto/demotale';

const disclosure = 'Local demo · sample content · fictional learner';
test('Learning Trail from workbook to small wins', async ({ page, demo }) => {
  const state = async () => {
    const response = await page.request.get('/api/state');
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  const learner = page.locator('#learner');
  const check = page.getByRole('button', { name: 'Check', exact: true });
  const answer = page.getByRole('textbox', { name: 'Your answer' });
  const atStep = async (step: number) => {
    await expect(learner).toContainText(`Step ${step} of 4`);
    await expect.poll(async () => (await state()).progress?.index).toBe(step - 1);
  };

  await demo.card('Learning Trail', 'From workbook to small wins');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your next small step starts here.' })).toBeVisible();
  await expect(learner).toContainText('Step 1 of 4');
  await demo.hideCard();
  await demo.note(disclosure);

  await demo.step('Turn an Excel workbook into a ready-to-learn trail.', async () => {
    await demo.click(page.getByRole('button', { name: 'Educator studio' }));
    const downloadReady = page.waitForEvent('download');
    await demo.click(page.getByRole('link', { name: 'Download Excel learning path' }));
    const download = await downloadReady;
    expect(download.suggestedFilename()).toBe('learning-trail-template.xlsx');
    await mkdir('demo/output/downloads', { recursive: true });
    const file = 'demo/output/downloads/learning-trail-template.xlsx';
    await download.saveAs(file);
    await page.locator('#file').setInputFiles(file);
    await expect(page.locator('#validation')).toContainText('Draft is valid. All references resolve');
    await expect.poll(async () => (await state()).content?.skills.length).toBe(4);
    await page.locator('#validation').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await demo.spotlight(page.locator('#validation'), 1_600);
    await demo.clearSpotlight();
  });

  await demo.step('Review the learning routes, then publish a fixed snapshot.', async () => {
    const route = page.locator('#preview .skill').nth(1);
    await expect(route).toContainText('Pass → Find a missing numerator');
    await expect(route).toContainText('Stuck → alternate');
    await expect(route).toContainText('Stuck again → Fractions mean equal parts');
    await demo.spotlight(route, 2_000);
    await demo.clearSpotlight();
    await demo.click(page.getByRole('button', { name: 'Publish version' }));
    await expect(page.locator('#published')).toContainText('Published immutable version');
    const saved = await state();
    expect(saved.published).toHaveLength(1);
    expect(saved.published[0].content).toEqual(saved.content);
    await demo.spotlight(page.locator('#published'), 1_600);
    await demo.clearSpotlight();
  });

  await demo.step('Each correct answer opens the next small step.', async () => {
    await demo.click(page.getByRole('button', { name: 'For learners' }));
    await demo.spotlight(learner, 1_000);
    await demo.clearSpotlight();
    await demo.type(answer, '1/3');
    await demo.click(check, { settleMs: 80 });
    await expect(page.locator('#feedback')).toContainText('You spotted it');
    await atStep(2);
    await expect(learner).toContainText('Make equivalent fractions');
    await demo.spotlight(learner, 1_500);
    await demo.clearSpotlight();
  });

  await demo.step('A wrong answer offers another explanation; getting stuck again revisits the basics.', async () => {
    await demo.type(answer, '1');
    await demo.click(check);
    await expect(page.locator('#feedback')).toContainText('Draw two same-size rectangles');
    await expect.poll(async () => (await state()).progress?.attempts).toBe(1);
    await page.locator('#feedback').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await demo.spotlight(page.locator('#feedback'), 2_600);
    await demo.clearSpotlight();
    await answer.fill('');
    await demo.type(answer, '3');
    await demo.click(check, { settleMs: 80 });
    await expect(page.locator('#feedback')).toContainText('Let’s revisit an earlier step together.');
    await atStep(1);
    await expect(learner).toContainText('Fractions mean equal parts');
    expect((await state()).progress.attempts).toBe(0);
    await demo.spotlight(learner, 1_500);
    await demo.clearSpotlight();
  });

  await demo.step('Pick up where you left off—progress is saved.', async () => {
    await demo.type(answer, '1/3');
    await demo.click(check);
    await atStep(2);
    const before = (await state()).progress;
    expect(before.answers).toEqual(['1/3', '1', '3', '1/3']);
    await demo.pause(1_000);
    await page.reload();
    await atStep(2);
    await expect(learner).toContainText('Make equivalent fractions');
    expect((await state()).progress).toEqual(before);
    await demo.note(disclosure);
    await demo.spotlight(learner, 2_000);
    await demo.clearSpotlight();
    await demo.pause(1_000);
  });

  // Approved text-only closing card: no website navigation or deployment.
  await demo.card('Deploy your own app today at applet.one', '', 4_200);
  await expect(page.locator('#__demo-layer .demo-card h1')).toHaveText('Deploy your own app today at applet.one');
  expect(page.url()).toBe('http://127.0.0.1:8793/');
});
