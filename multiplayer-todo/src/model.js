export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new HttpError(status, message); };
export function text(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(400, `${label} must contain 1–${max} characters.`);
  return value.trim();
}
export const emptyState = () => ({ version: 0, members: [], tasks: [] });
export function member(state, hash) {
  return state.members.find(m => m.hash === hash && !m.revoked);
}
export function snapshot(state, user) {
  return {
    version: state.version,
    me: user.id,
    members: state.members.filter(m => user.admin || !m.revoked).map(({ hash, linkToken, ...m }) => ({
      ...m,
      ...(user.admin && !m.revoked && !m.admin && linkToken ? { linkToken } : {}),
    })),
    tasks: state.tasks,
  };
}
export function createMember(state, name, hash, admin = false) {
  if (state.members.filter(m => !m.revoked).length >= 100) fail(409, 'This workspace supports 100 active people.');
  const user = { id: crypto.randomUUID(), name: text(name, 60, 'Name'), hash, admin, revoked: false };
  state.members.push(user);
  return user;
}
export function mutate(state, user, path, body) {
  if (path === '/api/revoke') {
    if (!user.admin) fail(403, 'Only the admin can revoke access.');
    const target = state.members.find(m => m.id === body.id);
    if (!target) fail(404, 'Person not found.');
    if (target.admin) fail(400, 'The admin cannot be revoked.');
    target.revoked = true;
    delete target.linkToken;
    for (const task of state.tasks) task.assignees = task.assignees.filter(id => id !== target.id);
    return;
  }
  if (path === '/api/tasks' && body.action === 'create') {
    if (state.tasks.length >= 1000) fail(409, 'This workspace supports 1,000 tasks.');
    state.tasks.unshift({ id: crypto.randomUUID(), title: text(body.title, 240, 'Title'), completed: false, assignees: [], comments: [], createdAt: Date.now(), createdBy: user.id });
    return;
  }
  const task = state.tasks.find(t => t.id === body.id);
  if (!task) fail(404, 'Task not found.');
  if (path === '/api/tasks' && body.action === 'delete') {
    state.tasks = state.tasks.filter(t => t.id !== task.id);
  } else if (path === '/api/tasks' && body.action === 'update') {
    const keys = Object.keys(body).filter(k => !['id', 'action'].includes(k));
    if (!keys.length || keys.some(k => !['title', 'completed', 'assignees'].includes(k))) fail(400, 'Choose a title, completion status, or assignees.');
    if ('title' in body) task.title = text(body.title, 240, 'Title');
    if ('completed' in body) {
      if (typeof body.completed !== 'boolean') fail(400, 'Completion status must be a boolean.');
      task.completed = body.completed;
    }
    if ('assignees' in body) {
      if (!Array.isArray(body.assignees) || body.assignees.length > 100 || body.assignees.some(id => !state.members.some(m => m.id === id && !m.revoked))) fail(400, 'Choose active collaborators.');
      task.assignees = [...new Set(body.assignees)];
    }
  } else if (path === '/api/comments') {
    if (task.comments.length >= 300) fail(409, 'This task supports 300 comments.');
    task.comments.push({ id: crypto.randomUUID(), userId: user.id, name: user.name, text: text(body.text, 2000, 'Comment'), createdAt: Date.now() });
  } else fail(404, 'Not found.');
}
