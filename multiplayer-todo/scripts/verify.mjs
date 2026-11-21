import { mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const root = new URL('../', import.meta.url);
const port = process.env.TEST_PORT || '8792';
const url = `http://127.0.0.1:${port}`;
async function run(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`${command} exited with ${code}`);
}
async function isolatedTest(command, args) {
  const dir = await mkdtemp(join(tmpdir(), 'multiplayer-todo-verify-'));
  let server, output = '';
  try {
    for (const file of ['wrangler.jsonc', 'applet.jsonc', 'package.json', 'src', 'generated']) await cp(new URL(file, root), join(dir, file), { recursive: true });
    server = spawn('applet', ['dev', '--port', port], { cwd: dir, env: { ...process.env, APPLET_INIT_CWD: dir, INIT_CWD: dir, PWD: dir }, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', d => output += d); server.stderr.on('data', d => output += d);
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if (output.includes('Local Worker ready:') && (await fetch(url + '/api/bootstrap')).ok) { ready = true; break; } } catch {}
      if (server.exitCode !== null) break;
      await new Promise(r => setTimeout(r, 100));
    }
    if (!ready) throw new Error('Local server did not start.\n' + output);
    await run(command, args, { env: { ...process.env, TEST_URL: url } });
  } finally {
    if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill('SIGINT'); await exited; }
    await rm(dir, { recursive: true, force: true });
  }
}
await run('npm', ['run', 'build']);
await isolatedTest('npm', ['test']);
await isolatedTest('npm', ['run', 'test:browser']);
console.log('Verified model, real Worker API and two-browser flows using isolated disposable storage.');
