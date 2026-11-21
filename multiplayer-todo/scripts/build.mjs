import { readFile, mkdir, writeFile } from 'node:fs/promises';
const assets = {};
for (const [path, file, type] of [['/', 'index.html', 'text/html; charset=utf-8'], ['/app.js', 'app.js', 'text/javascript; charset=utf-8'], ['/styles.css', 'styles.css', 'text/css; charset=utf-8']]) {
  assets[path] = { content: await readFile(new URL('../client/' + file, import.meta.url), 'utf8'), type };
}
await mkdir(new URL('../generated/', import.meta.url), { recursive: true });
await writeFile(new URL('../generated/assets.js', import.meta.url), 'export const assets = ' + JSON.stringify(assets) + ';\n');
