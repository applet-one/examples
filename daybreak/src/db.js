import { passwordReset } from './password-reset.js';

export function rows(db, sql, ...args) {
  return db.exec(sql, ...args).toArray();
}

export function one(db, sql, ...args) {
  return db.exec(sql, ...args).toArray()[0];
}

export function init(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS friendships (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, addressee_id TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS slots (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS meetings (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, recipient_id TEXT NOT NULL, start_at INTEGER NOT NULL, end_at INTEGER NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (email TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS applied_resets (id TEXT PRIMARY KEY);`);
  if (passwordReset && !one(db, 'SELECT id FROM applied_resets WHERE id = ?', passwordReset.id)) {
    db.exec('UPDATE users SET password = ? WHERE email = ?', passwordReset.hash, passwordReset.email);
    const user = one(db, 'SELECT id FROM users WHERE email = ?', passwordReset.email);
    if (user) db.exec('DELETE FROM sessions WHERE user_id = ?', user.id);
    db.exec('INSERT INTO applied_resets (id) VALUES (?)', passwordReset.id);
  }
}
