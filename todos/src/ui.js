export const script = String.raw`
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  let todos = [], filter = 'all', busy = false, editing = null;
  const list = $('#todos'), error = $('#error'), input = $('#new-title');
  function button(text, className, onClick) {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = text; el.className = className;
    el.addEventListener('click', onClick); return el;
  }
  function setBusy(value) {
    busy = value;
    document.querySelectorAll('button, input').forEach(el => { el.disabled = value; });
  }
  function render() {
    list.replaceChildren();
    const visible = todos.filter(todo => filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed));
    for (const todo of visible) {
      const li = document.createElement('li');
      li.dataset.id = todo.id; li.className = todo.completed ? 'done' : '';
      if (editing === todo.id) {
        const form = document.createElement('form'); form.className = 'edit-form';
        const field = document.createElement('input'); field.type = 'text'; field.value = todo.title;
        field.maxLength = 240; field.required = true; field.setAttribute('aria-label', 'Edit todo');
        const save = button('Save', 'primary', () => form.requestSubmit());
        const cancel = button('Cancel', '', () => { editing = null; render(); });
        form.addEventListener('submit', event => {
          event.preventDefault();
          if (!field.value.trim()) return;
          act(async () => { await api('/api/todos/' + todo.id, 'PATCH', { title: field.value }); editing = null; });
        });
        field.addEventListener('keydown', event => { if (event.key === 'Escape') { editing = null; render(); } });
        form.append(field, save, cancel); li.append(form);
      } else {
        const label = document.createElement('label');
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = todo.completed;
        checkbox.setAttribute('aria-label', 'Complete ' + todo.title);
        checkbox.addEventListener('change', () => act(() => api('/api/todos/' + todo.id, 'PATCH', { completed: checkbox.checked })));
        const text = document.createElement('span'); text.className = 'title'; text.textContent = todo.title;
        label.append(checkbox, text);
        const actions = document.createElement('div'); actions.className = 'actions';
        actions.append(button('Edit', '', () => { editing = todo.id; render(); list.querySelector('.edit-form input').focus(); }),
          button('Delete', 'delete', () => act(() => api('/api/todos/' + todo.id, 'DELETE'))));
        li.append(label, actions);
      }
      list.append(li);
    }
    const active = todos.filter(todo => !todo.completed).length;
    $('#summary').textContent = active + (active === 1 ? ' task left' : ' tasks left') + ' · ' + todos.length + ' total';
    $('#empty').hidden = visible.length > 0;
    $('#empty').textContent = filter === 'completed' ? 'No completed tasks yet.' : filter === 'active' && todos.length ? 'All caught up. Enjoy the breathing room.' : todos.length ? 'Nothing here.' : 'A clean slate. Add your first todo above.';
    document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.filter === filter)));
    setBusy(busy);
  }
  async function api(path, method = 'GET', value) {
    const response = await fetch(path, { method, cache: 'no-store', signal: AbortSignal.timeout(10000), headers: value ? { 'content-type': 'application/json' } : {}, body: value ? JSON.stringify(value) : undefined });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed (' + response.status + ')');
    return result;
  }
  async function act(operation) {
    if (busy) return;
    error.hidden = true; setBusy(true); $('#save-status').textContent = 'Saving…';
    try {
      await operation();
      todos = (await api('/api/todos')).todos;
      $('#save-status').textContent = 'Saved to server';
    } catch (err) {
      error.textContent = err.message || 'Unable to connect. Please reload and try again.';
      error.hidden = false; $('#save-status').textContent = 'Could not confirm — reload to check';
    } finally { busy = false; render(); }
  }
  $('#add-form').addEventListener('submit', event => {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    act(async () => { await api('/api/todos', 'POST', { title }); input.value = ''; });
  });
  document.querySelectorAll('[data-filter]').forEach(el => el.addEventListener('click', () => { filter = el.dataset.filter; editing = null; render(); }));
  setBusy(true);
  api('/api/todos').then(result => {
    todos = result.todos; $('#save-status').textContent = 'Loaded from server';
  }).catch(err => {
    error.textContent = 'Could not load todos: ' + err.message + '. Reload to retry.'; error.hidden = false;
    $('#save-status').textContent = 'Connection failed';
  }).finally(() => { busy = false; render(); });
})();
`;
