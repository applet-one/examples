// Each check/capture builds a disposable copy and never touches ordinary state.
import { cp, mkdir, mkdtemp, symlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = join(root, "demo/output");
await mkdir(output, { recursive: true });
const scratch = await mkdtemp(join(output, "applet-"));
// Applet derives the app name from cwd; mkdtemp suffixes may contain capitals.
const dir = join(scratch, "prioboard");
await mkdir(dir);
for (const name of [
  "app.js",
  "client",
  "server",
  "shared",
  "scripts",
  "package.json",
  "applet.jsonc",
]) {
  await cp(join(root, name), join(dir, name), { recursive: true });
}
await symlink(join(root, "node_modules"), join(dir, "node_modules"), "dir");
const child = spawn(
  "npm",
  ["run", "dev", "--", "--host", "127.0.0.1", "--port", "8796"],
  {
    cwd: dir,
    stdio: "inherit",
    env: { ...process.env, APPLET_INIT_CWD: dir, INIT_CWD: dir, PWD: dir },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
