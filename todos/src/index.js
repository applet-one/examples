import { page } from './page.js';
import { script } from './ui.js';

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
function json(value, status = 200) {
  return Response.json(value, { status, headers });
}
function todo(row) {
  return { ...row, completed: Boolean(row.completed) };
}
async function body(request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new Error('Cross-site request rejected');
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new Error('Use application/json');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new Error('JSON body required');
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) throw new Error('Request body too large');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('JSON object required');
  return value;
}
function title(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 240) {
    throw new Error('Title must contain 1–240 characters');
  }
  return value.trim();
}

export class TodoList {
  constructor(ctx) {
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`);
  }

  async fetch(request) {
    const path = new URL(request.url).pathname;
    const method = request.method;
    if (method === 'GET' && path === '/api/health') {
      const row = this.sql.exec('SELECT COUNT(*) AS count FROM todos').one();
      return json({ ok: true, storage: 'sqlite', todo_count: row.count });
    }
    if (path === '/api/todos') {
      if (method === 'GET') {
        return json({ todos: this.sql.exec('SELECT * FROM todos ORDER BY created_at, id').toArray().map(todo) });
      }
      if (method === 'POST') {
        let text;
        try {
          const value = await body(request);
          if (Object.keys(value).some(key => key !== 'title')) throw new Error('Only title is accepted');
          text = title(value.title);
        } catch (error) { return json({ error: error.message }, 400); }
        if (this.sql.exec('SELECT COUNT(*) AS count FROM todos').one().count >= 1000) {
          return json({ error: 'This demo supports up to 1,000 todos' }, 409);
        }
        const row = this.sql.exec(
          'INSERT INTO todos (id, title, created_at) VALUES (?, ?, ?) RETURNING *',
          crypto.randomUUID(), text, Date.now(),
        ).one();
        return json({ todo: todo(row) }, 201);
      }
      return json({ error: 'Method not allowed' }, 405);
    }
    const match = path.match(/^\/api\/todos\/([a-f0-9-]{36})$/);
    if (!match) return json({ error: 'Not found' }, 404);
    const id = match[1];
    if (method === 'DELETE') {
      if (request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Cross-site request rejected' }, 400);
      const rows = this.sql.exec('DELETE FROM todos WHERE id = ? RETURNING id', id).toArray();
      return rows.length ? json({ deleted: id }) : json({ error: 'Todo not found' }, 404);
    }
    if (method === 'PATCH') {
      let value;
      try {
        value = await body(request);
        const keys = Object.keys(value);
        if (!keys.length || keys.some(key => !['title', 'completed'].includes(key))) throw new Error('Use title and/or completed');
        if ('title' in value) value.title = title(value.title);
        if ('completed' in value && typeof value.completed !== 'boolean') throw new Error('Completed must be a boolean');
      } catch (error) { return json({ error: error.message }, 400); }
      // All SQL after the await is synchronous, so read/modify/write cannot interleave.
      const current = this.sql.exec('SELECT * FROM todos WHERE id = ?', id).toArray()[0];
      if (!current) return json({ error: 'Todo not found' }, 404);
      const row = this.sql.exec('UPDATE todos SET title = ?, completed = ? WHERE id = ? RETURNING *',
        value.title ?? current.title, 'completed' in value ? Number(value.completed) : current.completed, id).one();
      return json({ todo: todo(row) });
    }
    return json({ error: 'Method not allowed' }, 405);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/' && ['GET', 'HEAD'].includes(request.method)) {
      return new Response(request.method === 'HEAD' ? null : page, {
        headers: { ...headers, 'content-type': 'text/html; charset=utf-8',
          'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" },
      });
    }
    if (url.pathname === '/app.js' && request.method === 'GET') {
      return new Response(script, {
        headers: { ...headers, 'content-type': 'text/javascript; charset=utf-8' },
      });
    }
    if (url.pathname === '/api/todos' || url.pathname.startsWith('/api/todos/') || url.pathname === '/api/health') {
      const id = env.TODOS.idFromName('shared-list');
      return env.TODOS.get(id).fetch(request);
    }
    return json({ error: 'Not found' }, 404);
  },
};
