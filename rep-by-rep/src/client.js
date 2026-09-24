export const client = String.raw`
const app = document.getElementById('app'), tabs = document.getElementById('tabs');
const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let exercises = [], logs = [], history = [], presets = [], view = 'today', editing = null, selectedDay = localDay();
function localDay() { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
async function api(path, method, data) {
  const r = await fetch('/api/' + path, { method: method || 'GET', headers: data ? {'Content-Type':'application/json'} : {}, body: data ? JSON.stringify(data) : undefined });
  let result; try { result = await r.json(); } catch { throw Error('Could not reach the app'); }
  if (!r.ok) { if (r.status === 401 && path !== 'login') lock(); throw Error(result.error || 'Request failed'); }
  return result;
}
function message(text) { const el = document.getElementById('message'); if (el) el.textContent = text || ''; }
function lock(setup) {
  tabs.hidden = true;
  app.innerHTML = '<div class="login"><div class="brand-mark" aria-hidden="true">✳</div><p class="eyebrow">A little progress, every day</p><h1>Rep by Rep.</h1><p class="muted">Your physio routine, at your pace.</p><div class="card"><h2>' + (setup ? 'Make it yours' : 'Welcome back') + '</h2><form id="auth"><label>4-character passphrase<input name="password" type="password" minlength="4" maxlength="4" autocomplete="' + (setup ? 'new-password' : 'current-password') + '" required></label><button>' + (setup ? 'Create my space →' : 'Unlock my space →') + '</button><p id="message" role="alert"></p></form></div>' + (setup ? '<p class="small notice">First visitor sets the passphrase. A 4-character code is easy to guess: avoid sensitive notes. Set it now; there is no recovery.</p>' : '') + '</div>';
  document.getElementById('auth').onsubmit = async e => { e.preventDefault(); try { await api(setup ? 'setup' : 'login','POST',{password:e.target.password.value}); await load(); } catch(err) { message(err.message); } };
}
async function load() {
  try {
    const status = await api('status');
    if (!status.setup || !status.authenticated) return lock(!status.setup);
    [exercises, logs, history, presets] = await Promise.all([api('exercises').then(x => x.exercises),api('logs?day='+selectedDay).then(x => x.logs),api('logs').then(x => x.logs),api('presets').then(x => x.presets)]);
    render();
  } catch(err) { app.innerHTML = '<p role="alert">' + esc(err.message) + '</p><button id="retry">Retry</button>'; document.getElementById('retry').onclick = () => location.reload(); }
}
function render() {
  tabs.hidden = false;
  const icons = {today:'◉',plan:'▤',history:'◷'};
  tabs.innerHTML = ['today','plan','history'].map(v => '<button data-view="'+v+'" aria-label="'+v+'" aria-current="'+(view === v ? 'page' : 'false')+'" class="nav-button '+(view === v ? 'active' : '')+'"><span class="icon" aria-hidden="true">'+icons[v]+'</span>'+v[0].toUpperCase()+v.slice(1)+'</button>').join('');
  tabs.querySelectorAll('button').forEach(b => b.onclick = () => { view=b.dataset.view; editing=null; render(); });
  app.innerHTML = '<header class="top"><div class="brand"><div class="brand-mark" aria-hidden="true">✳</div><div><h1>Rep by Rep</h1><div class="brand-sub">Move at your pace</div></div></div><button class="ghost small" id="logout" aria-label="Lock app">Lock ↗</button></header><div id="content"></div><p id="message" role="alert"></p>';
  document.getElementById('logout').onclick = async () => { try { await api('logout','POST'); lock(); } catch(err) { message(err.message); } };
  if (view === 'today') today(); else if (view === 'plan') plan(); else showHistory();
}
function today() {
  const due = exercises.filter(e => e.days.includes(new Date(selectedDay+'T12:00:00').getDay()));
  const done = due.filter(e => logs.some(l => l.exercise_id === e.id)).length;
  let html = '<div class="hero"><p class="eyebrow">Your daily routine</p><h2>One rep at a time.</h2><p class="muted">Small steps still move you forward.</p></div><div class="date-wrap"><label for="day">Your day</label><input aria-label="Choose date" id="day" type="date" value="'+esc(selectedDay)+'"></div><section class="summary" aria-label="Daily progress"><p class="eyebrow">Today’s progress</p><div class="row"><strong>'+done+' <span>/ '+due.length+'</span></strong><span>exercises recorded</span></div><p>'+(due.length && done === due.length ? 'All done. Make room for rest, too.' : 'Your pace is the right pace.')+'</p><progress value="'+done+'" max="'+(due.length || 1)+'" aria-label="Exercises recorded"></progress></section><p class="section-title">Your exercises</p>';
  if (!due.length) html += '<div class="card empty"><span class="symbol" aria-hidden="true">✳</span><h3>A little breathing room.</h3><p class="muted">Nothing scheduled today. Rest up, or add an exercise in your plan.</p></div>';
  for (const e of due) {
    const l = logs.find(x => x.exercise_id === e.id);
    html += '<section class="card"><div class="card-head"><div><h3>'+esc(e.name)+'</h3><p class="target">Target · '+e.target+' '+esc(e.unit)+'</p></div>'+(l ? '<span class="badge '+(l.skipped ? 'skipped' : '')+'">'+(l.skipped ? 'Skipped' : '✓ Recorded')+'</span>' : '')+'</div>'+(e.instructions ? '<p class="instruction">'+esc(e.instructions)+'</p>' : '')+(e.link ? '<a class="small" href="'+esc(e.link)+'" target="_blank" rel="noopener noreferrer">Watch demonstration ↗</a>' : '')+'<form class="log-form" data-id="'+e.id+'"><div class="field-pair"><label>Completed '+esc(e.unit)+'<input type="number" name="amount" min="0" max="10000" inputmode="numeric" value="'+(l ? l.amount : e.target)+'" required></label><label>Pain · 0–10<select name="pain"><option value="">Optional</option>'+Array.from({length:11},(_,n)=>'<option value="'+n+'" '+(l && l.pain === n ? 'selected' : '')+'>'+n+'</option>').join('')+'</select></label></div><label>Note (optional)<textarea name="note" maxlength="1000" placeholder="Add a quick note…">'+esc(l?.note || '')+'</textarea></label><div class="actions"><button type="submit">'+(l ? 'Update entry' : 'Record exercise')+'</button><button class="secondary skip" type="button">Skip</button></div></form></section>';
  }
  html += '<p class="small notice">Follow your clinician’s advice. Stop if symptoms worsen; this app does not provide medical guidance.</p>';
  document.getElementById('content').innerHTML = html;
  document.getElementById('day').onchange = async e => { selectedDay=e.target.value; if (!selectedDay) return; try { logs=(await api('logs?day='+selectedDay)).logs; render(); } catch(err) { message(err.message); } };
  document.querySelectorAll('.log-form').forEach(f => {
    async function save(skipped) { try { await api('logs','POST',{day:selectedDay,exerciseId:Number(f.dataset.id),amount:skipped ? 0 : Number(f.elements.namedItem('amount').value),pain:skipped || f.elements.namedItem('pain').value === '' ? null : Number(f.elements.namedItem('pain').value),note:skipped ? '' : f.elements.namedItem('note').value,skipped}); await load(); } catch(err) { message(err.message); } }
    f.onsubmit = e => { e.preventDefault(); save(false); }; f.querySelector('.skip').onclick = () => save(true);
  });
}
function plan() {
  const content = document.getElementById('content');
  if (editing !== null) {
    const e = exercises.find(x => x.id === editing), days = e?.days || [1,2,3,4,5];
    content.innerHTML = '<button class="ghost form-back" id="back">← Back to plan</button><div class="page-heading"><p class="eyebrow">Make it yours</p><h2>'+(e ? 'Edit exercise' : 'New exercise')+'</h2><p class="muted">Keep the routine that works for you.</p></div><form class="card plan-form" id="exercise"><label>Name<input name="name" maxlength="100" required value="'+esc(e?.name || '')+'" placeholder="e.g. Heel raises"></label><label>Instructions<textarea name="instructions" maxlength="1000" placeholder="Include any sets, rests, or cues from your clinician">'+esc(e?.instructions || '')+'</textarea></label><label>Target amount<input name="target" type="number" min="1" max="10000" inputmode="numeric" required value="'+(e?.target || 10)+'"></label><label>Unit<select name="unit"><option value="reps" '+(e?.unit === 'seconds' ? '' : 'selected')+'>Reps</option><option value="seconds" '+(e?.unit === 'seconds' ? 'selected' : '')+'>Seconds</option></select></label><div><strong>Scheduled days</strong><div class="days">'+names.map((n,i)=>'<label><input type="checkbox" name="days" value="'+i+'" '+(days.includes(i)?'checked':'')+'><span>'+n+'</span></label>').join('')+'</div></div><label>Demonstration link (optional)<input name="link" type="url" pattern="https://.*" placeholder="https://…" value="'+esc(e?.link || '')+'"></label><div class="form-footer"><button>Save exercise →</button>'+(e ? '<button type="button" class="ghost danger" id="archive">Archive exercise</button>' : '')+'</div></form>';
    document.getElementById('back').onclick = () => { editing=null; render(); };
    if (e) document.getElementById('archive').onclick = async () => { if (!confirm('Archive this exercise? Past history will remain.')) return; try { await api('exercises/'+e.id,'DELETE'); editing=null; await load(); } catch(err) { message(err.message); } };
    document.getElementById('exercise').onsubmit = async event => { event.preventDefault(); const f=event.target; const days=[...f.querySelectorAll('[name=days]:checked')].map(x=>Number(x.value)); if (!days.length) return message('Choose at least one day'); try { await api('exercises'+(e?'/'+e.id:''),e?'PUT':'POST',{name:f.elements.namedItem('name').value,instructions:f.elements.namedItem('instructions').value,link:f.elements.namedItem('link').value,target:Number(f.elements.namedItem('target').value),unit:f.elements.namedItem('unit').value,days}); editing=null; await load(); } catch(err) { message(err.message); } };
    return;
  }
  content.innerHTML = '<div class="page-heading"><p class="eyebrow">Your routine</p><h2>A plan for progress.</h2><p class="muted">Exercises on your terms, one day at a time.</p></div><div class="row"><p class="section-title">Your exercises · '+exercises.length+'</p><button id="add">+ Add new</button></div>'+(exercises.length ? exercises.map(e => '<div class="card plan-card"><div class="row"><div><h3>'+esc(e.name)+'</h3><p class="target">'+e.target+' '+esc(e.unit)+' · '+e.days.map(d=>names[d]).join(', ')+'</p></div><button class="secondary edit" data-id="'+e.id+'" aria-label="Edit '+esc(e.name)+'">Edit</button></div></div>').join('') : '<p class="muted small">Nothing scheduled yet. Add your own or choose a starter below.</p>')+'<div class="preset-heading"><p class="section-title">Starter plans</p><p class="small muted">Examples only. Add one if it matches your clinician’s advice, then edit its targets and days before use.</p></div>'+presets.map(p => '<section class="card preset-card"><div><h3>'+esc(p.title)+'</h3><p class="muted small">'+esc(p.description)+'</p><p class="preset-exercises">'+p.exercises.map(esc).join(' · ')+'</p></div><button class="'+(p.installed?'secondary':'')+' install" data-id="'+esc(p.id)+'" '+(p.installed?'disabled':'')+' aria-label="'+(p.installed?'Already added ':'Add ')+esc(p.title)+'">'+(p.installed?'✓ Added':'Add plan →')+'</button></section>').join('');
  document.getElementById('add').onclick = () => { editing=0; render(); };
  content.querySelectorAll('.edit').forEach(b => b.onclick = () => { editing=Number(b.dataset.id); render(); });
  content.querySelectorAll('.install:not(:disabled)').forEach(b => b.onclick = async () => { b.disabled = true; try { await api('presets/'+b.dataset.id,'POST'); await load(); } catch(err) { b.disabled = false; message(err.message); } });
}
function showHistory() {
  const grouped = new Map(); for (const l of history) { if (!grouped.has(l.day)) grouped.set(l.day, []); grouped.get(l.day).push(l); }
  document.getElementById('content').innerHTML = '<div class="page-heading"><p class="eyebrow">Your journey</p><h2>Every step counts.</h2><p class="muted">A look at the work you’ve put in.</p></div><p class="section-title">Recent activity</p>'+(grouped.size ? [...grouped].map(([day,items]) => '<section class="card history-card"><h3>'+esc(day)+'</h3>'+items.map(l=>'<div class="log-line"><strong>'+esc(l.exercise_name)+'</strong><div class="log-meta">'+(l.skipped?'Skipped':l.amount+' recorded')+(l.pain===null?'':' · Pain '+l.pain+'/10')+'</div>'+(l.note?'<p>'+esc(l.note)+'</p>':'')+'</div>').join('')+'</section>').join('') : '<div class="card empty"><span class="symbol" aria-hidden="true">◷</span><h3>Your story starts here.</h3><p class="muted">Record an exercise and it will show up in your history.</p></div>');
}
load();
`;
