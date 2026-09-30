// Serve only a fresh source copy, never the app's regular local or hosted state.
import { cp, mkdir, mkdtemp, symlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = join(root, 'demo/output');
await mkdir(output, { recursive: true });
const dir = await mkdtemp(join(output, 'applet-'));
for (const name of ['src', 'applet.jsonc', 'package.json']) {
  await cp(join(root, name), join(dir, name), { recursive: true });
}
await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir');
process.stdout.write(dir);
