// Build and serve a disposable source copy, never the app's normal local state.
import { cp, mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = join(root, 'demo/output');
await mkdir(output, { recursive: true });
const dir = await mkdtemp(join(output, 'applet-'));
for (const name of ['src', 'scripts', 'wrangler.jsonc', 'applet.jsonc', 'package.json', 'index.html', 'vite.config.js']) {
  await cp(join(root, name), join(dir, name), { recursive: true });
}
await symlink(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir');
const setupKey = randomBytes(32).toString('hex');
// Local-only runtime secret; the UI build never receives the key.
await writeFile(join(dir, '.dev.vars'), `EVENTRAUM_SETUP_KEY=${setupKey}\n`, { mode: 0o600 });
const build = spawnSync('pnpm', ['run', 'build:ui'], {
  cwd: dir,
  stdio: ['ignore', 2, 2],
});
if (build.status !== 0) throw new Error('Disposable UI build failed');
await writeFile(join(output, 'snapshot.json'), JSON.stringify({ dir, setupKey }) + '\n', { mode: 0o600 });
process.stdout.write(dir);
