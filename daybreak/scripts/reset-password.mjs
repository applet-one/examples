import { randomBytes, randomUUID, pbkdf2Sync } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { stdin, stdout } from 'node:process';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: pnpm reset-password <registered-email>');
  process.exit(1);
}
const file = new URL('../src/password-reset.js', import.meta.url);
if (!readFileSync(file, 'utf8').includes('passwordReset = null;')) {
  console.error('A reset is already prepared. Apply and clear it before preparing another.');
  process.exit(1);
}
if (!stdin.isTTY) {
  console.error('Run from an interactive terminal so the new password can be entered privately.');
  process.exit(1);
}
stdout.write('New password (at least 10 characters): ');
let password = '';
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');
stdin.on('data', chunk => {
  for (const char of chunk) {
    if (char === '\u0003') { stdout.write('\n'); process.exit(130); }
    if (char === '\r' || char === '\n') {
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      if (password.length < 10 || password.length > 256) {
        console.error('Password must be 10–256 characters.');
        process.exitCode = 1;
        return;
      }
      const salt = randomBytes(32).toString('hex');
      const hash = salt + ':' + pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
      password = '';
      writeFileSync(file, '// One-time admin reset. Do not commit this file with a real reset.\nexport const passwordReset = ' + JSON.stringify({ id: randomUUID(), email, hash }) + ';\n', { mode: 0o600 });
      console.log('Reset prepared. Run `pnpm run deploy`, then visit the app once to apply it.');
      console.log('Afterwards restore src/password-reset.js to `export const passwordReset = null;` and redeploy.');
      return;
    }
    if (char === '\u007f') password = password.slice(0, -1);
    else password += char;
  }
});
