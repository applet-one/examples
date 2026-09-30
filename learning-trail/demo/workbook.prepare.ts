import * as XLSX from 'xlsx';
import { test, expect } from '@pesuto/demotale';

const origin = 'http://127.0.0.1:8793';
test('verify fresh state and round-trip the starter workbook', async ({ request }) => {
  const state = await request.get(`${origin}/api/state`);
  expect(state.ok()).toBeTruthy();
  expect(await state.json()).toEqual({}); // Refuse any existing content or learner progress.
  const template = await request.get(`${origin}/api/template`);
  expect(template.ok()).toBeTruthy();
  const bytes = await template.body();
  const workbook = XLSX.read(bytes, { type: 'buffer' });
  expect(workbook.SheetNames).toEqual(['Skills', 'Activities', 'Checks']);
  const imported = await request.post(`${origin}/api/import`, {
    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    data: bytes,
  });
  expect(imported.ok(), await imported.text()).toBeTruthy();
  const { content } = await imported.json();
  expect(content.skills.map((s: { id: string }) => s.id)).toEqual(['S1', 'S2', 'S3', 'S4']);
  expect(content.skills.map((s: { answer: string }) => s.answer)).toEqual(['1/3', '2', '6', '3']);
  expect(await (await request.get(`${origin}/api/state`)).json()).toEqual({});
});
