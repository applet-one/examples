// Run a separate local Applet project so recordings cannot touch Daybreak's existing .wrangler state.
import { cp, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = join(root, 'demo', 'output');
await mkdir(output, { recursive: true });
const dir = await mkdtemp(join(output, 'applet-'));
for (const name of ['src', 'applet.jsonc', 'package.json']) {
  await cp(join(root, name), join(dir, name), { recursive: true });
}
await writeFile(join(output, 'last-app-dir.txt'), dir + '\n');
process.stdout.write(dir);
