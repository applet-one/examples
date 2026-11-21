const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let token = new URL(location.href).searchParams.get('token');
let state, view = 'all', filter = 'open', search = '', selectedTask, socket, retry, stopped = false, toastTimer;
const commentDrafts = new Map();
const me = () => state?.members.find(m => m.id === state.me);
const person = id => state.members.find(m => m.id === id);
const initials = name => name.trim().split(/\s+/).map(w => Array.from(w)[0]).slice(0, 2).join('').toUpperCase();
function avatar(user, extra = '') {
  const color = (user?.id || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % 5;
  return `<span class="avatar ${extra}" data-color="${color}" title="${escape(user?.name || 'Former collaborator')}">${escape(initials(user?.name || '?'))}</span>`;
}
function linkFor(value) { const url = new URL('/', location.href); url.searchParams.set('token', value); return url.href; }
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => $('#toast').hidden = true, 5000); }
async function api(path, body, auth = token) {
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(auth ? { authorization: 'Bearer ' + auth } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && state) invalidLink(result.error);
    throw new Error(result.error || 'Request failed. Please retry.');
  }
  return result;
}
function accept(next) {
  if (state && next.version < state.version) return;
  state = next;
  render();
}
function invalidLink(message) {
  stopped = true; clearTimeout(retry); socket?.close();
  $$('dialog[open]').forEach(d => d.close());
  $('#workspace').hidden = true; $('#gate').hidden = false;
  $('#gate-content').innerHTML = `<h1>Access unavailable</h1><p class="muted">${escape(message)}</p>`;
  state = undefined;
}
function connect() {
  if (stopped) return;
  const url = new URL('/api/live', location.href); url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'; url.searchParams.set('token', token);
  socket = new WebSocket(url);
  socket.onopen = () => { $('#connection').textContent = 'Live'; $('#connection').classList.add('live'); };
  socket.onmessage = event => { try { accept(JSON.parse(event.data)); } catch { toast('Could not read an update. Reconnecting…'); socket.close(); } };
  socket.onclose = async event => {
    $('#connection').textContent = 'Reconnecting'; $('#connection').classList.remove('live');
    if (stopped) return;
    if (event.code === 4001) { invalidLink('Your access has been revoked. Ask the admin for a new invite.'); return; }
    try { accept(await api('/api/state')); } catch {}
    if (!stopped) retry = setTimeout(connect, 2500 + Math.random() * 1500);
  };
  socket.onerror = () => socket.close();
}
function enter(next) {
  stopped = false; accept(next); $('#gate').hidden = true; $('#workspace').hidden = false; connect();
}
function render() {
  const user = me(), open = state.tasks.filter(t => !t.completed).length, done = state.tasks.length - open;
  $('#my-name').textContent = user.name; $('#my-role').textContent = user.admin ? 'Workspace admin' : 'Collaborator';
  $('#my-avatar').outerHTML = avatar(user).replace('class="avatar ', 'id="my-avatar" class="avatar ');
  $('#nav-all').textContent = state.tasks.length; $('#nav-mine').textContent = state.tasks.filter(t => t.assignees.includes(user.id) && !t.completed).length; $('#nav-done').textContent = done;
  $('#tab-open').textContent = open;
  renderList();
  if ($('#people-dialog').open) renderPeople();
  if ($('#task-dialog').open) renderDetail();
}
function renderList() {
  const labels = { all: 'All tasks', mine: 'Assigned to me', completed: 'Completed' };
  $('#view-title').textContent = labels[view];
  $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  const tasks = state.tasks.filter(t => (view !== 'mine' || t.assignees.includes(state.me)) && (view !== 'completed' || t.completed) && (view === 'completed' || filter === 'all' || t.completed === (filter === 'done')) && t.title.toLowerCase().includes(search.toLowerCase()));
  $('.tabs').hidden = view === 'completed';
  $('#task-list').innerHTML = tasks.length ? tasks.map(task => `<div class="task-row ${task.completed ? 'done' : ''}" data-task="${task.id}"><button class="check ${task.completed ? 'checked' : ''}" data-action="toggle" aria-label="${task.completed ? 'Reopen' : 'Complete'} ${escape(task.title)}" aria-pressed="${task.completed}">${task.completed ? '✓' : ''}</button><button class="task-title" data-action="open">${escape(task.title)}</button><div class="task-assignees">${task.assignees.length ? task.assignees.slice(0, 3).map(id => avatar(person(id))).join('') + (task.assignees.length > 3 ? `<span class="avatar">+${task.assignees.length - 3}</span>` : '') : '<span class="unassigned">Unassigned</span>'}</div><button class="comment-count" data-action="open" aria-label="${task.comments.length} comments on ${escape(task.title)}"><span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h6"/></svg></span>${task.comments.length || ''}</button></div>`).join('') : `<div class="empty"><p>${search ? 'No matching tasks.' : view === 'completed' || filter === 'done' ? 'No completed tasks.' : view === 'mine' ? 'No tasks assigned to you.' : state.tasks.length ? 'No tasks to do.' : 'No tasks yet. Add one above.'}</p></div>`;
  $('#list-count').textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
}
function linkBox(value, label) {
  return `<div class="link-row"><input readonly aria-label="${escape(label)}" value="${escape(linkFor(value))}"><button class="button secondary" data-copy="${escape(value)}" aria-label="Copy ${escape(label)}">Copy link</button></div>`;
}
function renderPeople() {
  const user = me();
  $('#invite-form').hidden = !user.admin;
  $('#people-rows').innerHTML = state.members.map(m => {
    const personalToken = m.id === user.id ? token : user.admin ? m.linkToken : null;
    const link = !m.revoked && personalToken ? linkBox(personalToken, `Link for ${m.name}`) : '';
    return `<div class="person-row" data-person="${m.id}">${avatar(m)}<span class="person-name">${escape(m.name)}${m.id === user.id ? ' (you)' : ''}<small>${m.revoked ? 'Access revoked' : m.admin ? 'Admin' : 'Collaborator'}</small></span>${user.admin && !m.admin ? m.revoked ? `<button class="button secondary restore-invite" data-restore-invite="${m.id}">Generate invite</button>` : `<button class="revoke" data-revoke="${m.id}">Revoke access</button>` : ''}${link ? `<div class="person-link">${link}</div>` : ''}</div>`;
  }).join('');
}
function renderDetail() {
  const task = state.tasks.find(t => t.id === selectedTask);
  if (!task) { $('#task-dialog').close(); return; }
  const focused = document.activeElement, key = focused?.id, start = focused?.selectionStart, end = focused?.selectionEnd;
  const titleDraft = key === 'detail-title' ? focused.value : null;
  const comment = $('#comment-text'); if (comment) commentDrafts.set(selectedTask, comment.value);
  $('#task-detail').innerHTML = `<textarea id="detail-title" class="detail-title" maxlength="240" aria-label="Task title" rows="2">${escape(titleDraft ?? task.title)}</textarea><div class="detail-meta"><button class="status-button" id="detail-toggle">${task.completed ? '✓ Completed · Reopen' : '○ To do · Mark complete'}</button><button class="delete-button" id="delete-task">Delete task</button></div><span class="field-label">ASSIGNED TO</span><div class="assignee-options">${state.members.filter(m => !m.revoked).map(m => `<button class="assignee-choice ${task.assignees.includes(m.id) ? 'selected' : ''}" data-assign="${m.id}" aria-pressed="${task.assignees.includes(m.id)}">${avatar(m)}${escape(m.name)}${task.assignees.includes(m.id) ? ' ✓' : ''}</button>`).join('')}</div><div class="comments-section"><h3>Comments <span class="muted">(${task.comments.length})</span></h3><div>${task.comments.length ? task.comments.map(c => `<div class="comment">${avatar({ id: c.userId, name: c.name })}<div class="comment-content"><strong>${escape(c.name)}</strong><time datetime="${new Date(c.createdAt).toISOString()}">${escape(new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(c.createdAt))}</time><p>${escape(c.text)}</p></div></div>`).join('') : '<p class="no-comments">No comments yet.</p>'}</div><form id="comment-form" class="comment-form"><textarea id="comment-text" maxlength="2000" required placeholder="Add a comment…" aria-label="Your comment">${escape(commentDrafts.get(selectedTask) || '')}</textarea><button class="button primary">Post comment</button></form></div>`;
  if (['detail-title', 'comment-text'].includes(key)) { const input = $('#' + key); input.focus({ preventScroll: true }); input.setSelectionRange(start, end); }
}
async function change(path, body) { const next = await api(path, body); accept(next); }
async function safely(fn) { try { await fn(); } catch (error) { toast(error.message || 'Could not connect. Please try again.'); } }
async function copy(value) {
  try { await navigator.clipboard.writeText(linkFor(value)); toast('Link copied.'); }
  catch { toast('Select the link text and copy it manually.'); }
}
$('#home').addEventListener('click', e => { e.preventDefault(); view = 'all'; filter = 'open'; renderList(); });
$$('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; filter = 'open'; renderList(); }));
$$('[data-filter]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.filter; renderList(); }));
$('#search').addEventListener('input', e => { search = e.target.value; renderList(); });
$('#add-form').addEventListener('submit', e => {
  e.preventDefault(); const input = $('#new-title'), title = input.value.trim(), button = $('button', e.target);
  if (!title) return;
  button.disabled = true;
  safely(async () => { await change('/api/tasks', { action: 'create', title }); if (input.value.trim() === title) input.value = ''; view = 'all'; filter = 'open'; search = ''; $('#search').value = ''; renderList(); input.focus(); }).finally(() => button.disabled = false);
});
$('#task-list').addEventListener('click', e => {
  const b = e.target.closest('[data-action]'); if (!b) return;
  const task = state.tasks.find(t => t.id === b.closest('[data-task]').dataset.task);
  if (b.dataset.action === 'toggle') safely(() => change('/api/tasks', { action: 'update', id: task.id, completed: !task.completed }));
  else { selectedTask = task.id; $('#task-detail').innerHTML = ''; renderDetail(); $('#task-dialog').showModal(); }
});
function openPeople() { renderPeople(); $('#people-dialog').showModal(); }
$('#profile').addEventListener('click', openPeople);
$$('.close-dialog').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
$('#task-dialog').addEventListener('close', () => { const c = $('#comment-text'); if (c) commentDrafts.set(selectedTask, c.value); });
document.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copy(b.dataset.copy); });
$('#invite-form').addEventListener('submit', e => {
  e.preventDefault(); const input = $('#invite-name'), name = input.value.trim(), button = $('button', e.target);
  if (!name) return; button.disabled = true;
  safely(async () => { const result = await api('/api/invite', { name }); accept(result.state); input.value = ''; }).finally(() => button.disabled = false);
});
$('#people-rows').addEventListener('click', e => {
  const restore = e.target.closest('[data-restore-invite]');
  if (restore) {
    restore.disabled = true;
    safely(async () => {
      const result = await api('/api/links/restore', { id: restore.dataset.restoreInvite });
      accept(result.state);
      toast('New invite ready. Copy the link to share it.');
    }).finally(() => restore.disabled = false);
    return;
  }
  const button = e.target.closest('[data-revoke]'); if (!button) return;
  const target = person(button.dataset.revoke);
  if (!confirm(`Revoke access for ${target.name}? Their link will stop working immediately.`)) return;
  safely(async () => { await change('/api/revoke', { id: target.id }); toast('Access revoked.'); });
});
$('#task-detail').addEventListener('change', e => {
  if (e.target.id === 'detail-title') {
    const task = state.tasks.find(t => t.id === selectedTask);
    if (task && e.target.value.trim() !== task.title) safely(() => change('/api/tasks', { action: 'update', id: task.id, title: e.target.value }));
  }
});
$('#task-detail').addEventListener('input', e => { if (e.target.id === 'comment-text') commentDrafts.set(selectedTask, e.target.value); });
$('#task-detail').addEventListener('click', e => {
  const task = state.tasks.find(t => t.id === selectedTask); if (!task) return;
  if (e.target.closest('#detail-toggle')) safely(() => change('/api/tasks', { action: 'update', id: task.id, completed: !task.completed }));
  const assign = e.target.closest('[data-assign]');
  if (assign) { const id = assign.dataset.assign; safely(() => change('/api/tasks', { action: 'update', id: task.id, assignees: task.assignees.includes(id) ? task.assignees.filter(x => x !== id) : [...task.assignees, id] })); }
  if (e.target.closest('#delete-task') && confirm('Delete this task and its comments? This cannot be undone.')) safely(async () => { await change('/api/tasks', { action: 'delete', id: task.id }); commentDrafts.delete(task.id); });
});
$('#task-detail').addEventListener('submit', e => {
  if (e.target.id !== 'comment-form') return;
  e.preventDefault(); const id = selectedTask, input = $('#comment-text'), text = input.value.trim(), button = $('button', e.target);
  if (!text) return; button.disabled = true;
  safely(async () => {
    const next = await api('/api/comments', { id, text });
    if (selectedTask === id && $('#comment-text')?.value.trim() === text) $('#comment-text').value = '';
    commentDrafts.delete(id); accept(next);
  }).finally(() => { if ($('#comment-form button')) $('#comment-form button').disabled = false; });
});
async function start() {
  try {
    if (token) { enter(await api('/api/state')); return; }
    const { initialized } = await api('/api/bootstrap');
    if (initialized) {
      $('#gate-content').innerHTML = '<h1>Invite required</h1><p class="muted">Open your personal link to access this list, or ask the admin for an invite.</p>';
      return;
    }
    $('#gate-content').innerHTML = '<h1>Create a shared list</h1><p class="muted">You’ll be the admin and can invite collaborators.</p><form id="setup-form"><label for="setup-name">Your name</label><input id="setup-name" maxlength="60" required autocomplete="given-name"><button class="button primary">Create list</button></form>';
    $('#setup-form').addEventListener('submit', async e => {
      e.preventDefault(); const button = $('button', e.target), name = $('#setup-name').value.trim(); if (!name) return;
      button.disabled = true;
      await safely(async () => {
        const candidate = Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('');
        const next = await api('/api/setup', { name }, candidate); token = candidate; history.replaceState(null, '', linkFor(token));
        $('#gate-content').innerHTML = `<h1>Save your admin link</h1><p class="muted">This is your way back. Keep it private—anyone with it has admin access.</p><a class="saved-link" href="${escape(linkFor(token))}">${escape(linkFor(token))}</a><div class="welcome-actions"><button class="button secondary" data-copy="${token}">Copy admin link</button><button class="button primary" id="enter-workspace">Open list</button></div>`;
        $('#enter-workspace').addEventListener('click', () => enter(next));
      });
      button.disabled = false;
    });
  } catch (error) { invalidLink(error.message || 'Unable to connect. Refresh to try again.'); }
}
window.addEventListener('online', () => { if (state && socket?.readyState === WebSocket.CLOSED && !stopped) { clearTimeout(retry); connect(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && state) safely(async () => accept(await api('/api/state'))); });
start();
