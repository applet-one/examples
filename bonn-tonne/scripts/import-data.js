import { readFile, writeFile } from 'node:fs/promises';
import { normalize, SOURCE } from '../src/data.js';
const text = process.argv[2] ? await readFile(process.argv[2], 'utf8') : await (await fetch(SOURCE)).text();
const data = normalize(text);
await writeFile(new URL('../src/bonn.json', import.meta.url), JSON.stringify(data));
console.log(`${Object.keys(data.streets).length} streets, ${data.dates.length} unique schedules; fetched ${data.fetched}`);
