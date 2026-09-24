import { readFile, writeFile } from 'node:fs/promises';

// Applet bundles JavaScript modules, not HTML assets. Keep the editable HTML
// as the source of truth and generate the module imported by the Worker.
const html = await readFile(new URL('../src/page.html', import.meta.url), 'utf8');
await writeFile(
  new URL('../src/page.js', import.meta.url),
  `// Generated from page.html by scripts/build-page.mjs. Do not edit.\nexport const html = ${JSON.stringify(html)};\n`,
);
