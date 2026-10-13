import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCSV, matches, choices, events } from '../src/data.js';
import { calendar, fold } from '../src/calendar.js';
const data = JSON.parse(await readFile(new URL('../src/bonn.json', import.meta.url), 'utf8'));
test('CSV supports BOM, quoted delimiters, escaped quotes, and line breaks', () => {
  assert.deepEqual([...parseCSV('\uFEFFa;b\r\n"hello; world";"say ""hi""\nagain"\r\n')], [['a','b'],['hello; world','say "hi"\nagain']]);
});
test('address matching respects parity, boundaries, suffixes and exclusions', () => {
  const r = { even: ['2','20'], odd: ['1','9'], excluded: '4, 6A' };
  assert.equal(matches(r,'20'),true); assert.equal(matches(r,'21'),false);
  assert.equal(matches(r,'4'),false); assert.equal(matches(r,'6a'),false); assert.equal(matches(r,'6b'),true);
  assert.equal(matches(r,'0'),false); assert.equal(matches(r,'8foo'),false);
});
test('actual address resolves distinct plans; unavailable addresses return no guesses', () => {
  const rows = choices(data,'Heerstr.','12');
  assert.ok(rows.some(r=>r.type==='residual'&&r.frequency==='02-wöchentl.'));
  assert.ok(rows.some(r=>r.type==='paper'));
  assert.deepEqual(choices(data,'Not a street','12'),[]);
  assert.deepEqual(choices(data,'Heerstr.','99999'),[]);
});
test('events use only selected plans and official dates, sorted and unique', () => {
  const rows = choices(data,'Heerstr.','12');
  const row = rows.find(r=>r.type==='residual'&&r.frequency==='02-wöchentl.');
  const es = events(data,{street:'Heerstr.',house:'12',ids:[row.id]});
  assert.deepEqual(es.map(e=>e.date),data.dates[row.dates]);
  assert.ok(es.every(e=>e.type==='residual'));
  assert.equal(new Set(es.map(e=>e.date+e.type)).size,es.length);
});
test('calendar emits stable unique all-day events without invented pickup times', () => {
  const es=[{date:'2026-12-31',type:'residual',name:'Restmüll'}];
  const out=calendar(es,'private-token',data.fetched);
  assert.ok(out.includes('DTSTART;VALUE=DATE:20261231\r\n'));
  assert.ok(out.includes('DTEND;VALUE=DATE:20270101\r\n'));
  assert.ok(out.includes('UID:private-token-residual-2026-12-31@bin-day'));
  assert.ok(!out.includes('VALARM'));
  assert.equal(out,calendar(es,'private-token',data.fetched));
});
test('calendar folds lines at 75 UTF-8 bytes without breaking characters', () => {
  const line='SUMMARY:'+ 'Grünabfall 🌿, '.repeat(20);
  const folded=fold(line);
  assert.ok(folded.split('\r\n').every(l=>Buffer.byteLength(l)<=75));
  assert.equal(folded.replace(/\r\n /g,''),line);
});
