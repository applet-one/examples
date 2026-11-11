import { DatabaseSync } from 'node:sqlite';
import worker, { TodoList } from '../src/index.js';

export function app(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  const sql = { exec(query, ...bindings) {
    const rows = db.prepare(query).all(...bindings);
    return { toArray: () => rows, one: () => {
      if (rows.length !== 1) throw new Error('Expected exactly one SQL row');
      return rows[0];
    } };
  } };
  let state;
  const env = { TODOS: { idFromName: name => name, get: () => {
    state ??= new TodoList({ storage: { sql } });
    return state;
  } } };
  return {
    fetch: request => worker.fetch(request, env),
    request(path, method = 'GET', value) {
      return worker.fetch(new Request('http://localhost' + path, {
        method, ...(value === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) }),
      }), env);
    },
    close: () => db.close(),
  };
}
