function hex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function digest(value) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
}

export function random() {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

export function emailOf(input) {
  return String(input || '').trim().toLowerCase();
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function hashPassword(password, salt = random()) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: new TextEncoder().encode(salt),
    iterations: 100000,
    hash: 'SHA-256',
  }, key, 256);
  return `${salt}:${hex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = (await hashPassword(password, salt)).split(':')[1];
  const a = Uint8Array.from(expected.match(/../g) || [], x => parseInt(x, 16));
  const b = Uint8Array.from(actual.match(/../g) || [], x => parseInt(x, 16));
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export function cleanUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
