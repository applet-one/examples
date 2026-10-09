import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const files = readdirSync('dist/assets');
const js = readFileSync('dist/assets/' + files.find(x => x.endsWith('.js')), 'utf8');
const css = readFileSync('dist/assets/' + files.find(x => x.endsWith('.css')), 'utf8');
writeFileSync('src/generated.js', `export const page = ${JSON.stringify(html.replace(/<script[^>]+><\/script>/, '<script defer src="/app.js"></script>').replace(/<link[^>]+\.css[^>]*>/, '<link rel="stylesheet" href="/app.css">'))};\nexport const js = ${JSON.stringify(js)};\nexport const css = ${JSON.stringify(css)};\n`);
