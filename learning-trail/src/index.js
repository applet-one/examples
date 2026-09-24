import * as XLSX from "xlsx";

const sample = {
  topic: "Equivalent Fractions",
  skills: [
    { id: "S1", title: "Fractions mean equal parts", prerequisite: "", activity: "A fraction names equal parts of a whole. In 1/2, the bottom number says the whole is split into 2 equal pieces; the top says we have 1 piece.", check: "Which fraction shows 1 of 3 equal pieces?", answer: "1/3", alternate: "Fold or sketch a rectangle into 3 equal boxes. Shade exactly one box, then count shaded boxes over total boxes." },
    { id: "S2", title: "Make equivalent fractions", prerequisite: "S1", activity: "Equivalent fractions name the same amount. Multiply (or divide) the top and bottom by the same number: 1/2 = 2/4 = 3/6.", check: "Complete: 1/2 = ?/4", answer: "2", alternate: "Draw two same-size rectangles. Split one into 2 equal parts and shade 1. Split the other into 4 equal parts and shade 2. Compare the shaded areas." },
    { id: "S3", title: "Find a missing numerator", prerequisite: "S2", activity: "To keep fractions equivalent, whatever happens to the denominator must also happen to the numerator. Since 3 becomes 9 by multiplying by 3, multiply the top by 3 too.", check: "Complete: 2/3 = ?/9", answer: "6", alternate: "Ask: 3 times what equals 9? Use that same multiplier on the numerator: 2 times that number." },
    { id: "S4", title: "Simplify fractions", prerequisite: "S3", activity: "Simplifying reverses multiplying: divide the numerator and denominator by the same common factor. 4/8 becomes 1/2 when both are divided by 4.", check: "Simplify 6/8 (enter the numerator of the simplest fraction).", answer: "3", alternate: "Find a number that divides both 6 and 8. Divide both by 2: 6/8 = 3/4. The same amount is shown with smaller numbers." }
  ]
};
const page = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Learning Trail · Little steps, big discoveries</title><style>
:root{--ink:#20362e;--muted:#687a70;--green:#22664b;--lime:#d9f0b4;--cream:#fbf9f2;--line:#e6e9df;--white:#fff;--orange:#f6c77c}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font:16px/1.55 ui-rounded,"Avenir Next",system-ui,sans-serif}button,input{font:inherit}button{cursor:pointer;border:0;border-radius:13px;background:var(--green);color:white;font-weight:700;padding:12px 19px}button.secondary{background:#edf2e9;color:var(--green)}button:disabled{opacity:.5;cursor:not-allowed}.wrap{max-width:1030px;margin:auto;padding:22px}.top{display:flex;align-items:center;justify-content:space-between}.brand{font-size:20px;font-weight:850;letter-spacing:-.5px}.brand span{color:#77a85f}.tabs{display:flex;gap:6px;background:#edf0e8;border-radius:14px;padding:4px}.buttonlink{display:inline-block;text-decoration:none;border-radius:13px;background:var(--green);color:white;font-weight:700;padding:12px 19px}.tabs button{background:transparent;color:var(--muted);padding:9px 14px}.tabs button.on{background:white;color:var(--ink);box-shadow:0 1px 5px #2233}.hero{margin:36px 0 23px;display:grid;grid-template-columns:1.4fr .6fr;gap:25px;align-items:center}.hero h1{font-size:clamp(32px,5vw,53px);line-height:1.08;letter-spacing:-2px;margin:8px 0 12px}.hero p{color:var(--muted);max-width:560px}.badge{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:var(--green);font-weight:800}.art{border-radius:26px;background:var(--lime);min-height:180px;display:grid;place-items:center;font-size:77px}.card{background:var(--white);border:1px solid var(--line);border-radius:22px;padding:27px;box-shadow:0 7px 25px #34401a09}.grid{display:grid;grid-template-columns:1fr 1fr;gap:17px}.small{font-size:14px;color:var(--muted)}.progress{height:8px;background:#edf1e9;border-radius:8px;overflow:hidden;margin:12px 0 21px}.progress i{display:block;background:#8bb96d;height:100%;transition:width .3s}.trailhead{display:flex;justify-content:space-between;align-items:center}.activity{font-size:20px;line-height:1.65;margin:17px 0}.answer{display:flex;gap:10px;margin-top:18px}.answer input,.uploadbox input{min-width:0;border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:#fff}.answer input{flex:1}.feedback{margin-top:14px;font-weight:700}.good{color:#28744e}.bad{color:#a75830}.pill{display:inline-block;background:#f2f6ec;padding:5px 10px;border-radius:99px;font-size:12px;color:var(--green);font-weight:700}.skills{display:grid;gap:11px}.skill{display:flex;gap:13px;padding:15px;border:1px solid var(--line);border-radius:15px}.num{background:var(--lime);border-radius:10px;padding:3px 9px;height:max-content;font-weight:800}.skill p{margin:2px 0 0;color:var(--muted);font-size:14px}.author{display:none}.author.show{display:block}.child.hide{display:none}.section{margin:20px 0}.notice{border-radius:12px;padding:12px 15px;background:#f5f7ee;color:var(--muted);font-size:14px}.drop{border:1.5px dashed #b7c7b0;border-radius:14px;padding:17px;margin:13px 0}.error{color:#a43d32}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.footer{text-align:center;color:var(--muted);font-size:13px;padding:25px}@media(max-width:650px){.hero{grid-template-columns:1fr}.art{min-height:115px;font-size:55px}.grid{grid-template-columns:1fr}.wrap{padding:15px}.card{padding:20px}.top{align-items:flex-start;gap:12px;flex-direction:column}.hero{margin-top:24px}}
</style><div class="wrap"><header class="top"><div class="brand">🌱 learning<span>trail</span></div><nav class="tabs"><button id="childTab" class="on">For learners</button><button id="authorTab">Educator studio</button></nav></header><section class="hero"><div><div class="badge">A little learning goes a long way</div><h1>Your next small step<br>starts here.</h1><p>A friendly, one-step-at-a-time trail through equivalent fractions. Try, learn, and keep going—there's no score.</p></div><div class="art" aria-hidden="true">🍰 ✨</div></section>
<main class="child" id="child"><section class="card" id="learner"></section><div class="section"><div class="trailhead"><h2>On this trail</h2><span class="pill">4 little discoveries</span></div><div class="skills" id="skilllist"></div></div></main>
<main class="author" id="author"><section class="card"><div class="badge">Educator studio · draft to trail</div><h2>Shape a thoughtful trail</h2><p class="small">Download the equivalent-fractions Excel workbook, edit its Skills, Activities, and Checks tabs, then upload it here. Validate the draft, preview the routing, and publish an immutable version.</p><div class="row"><a class="buttonlink" href="/api/template" download="learning-trail-template.xlsx">Download Excel learning path</a></div><div class="drop"><strong>Upload your edited Excel workbook</strong><p class="small">Keep the Skills, Activities, and Checks tabs and their column headers. Edit rows in Excel, then upload the .xlsx file here.</p><input id="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div><div id="validation" class="small"></div></section><section class="card section"><div class="trailhead"><div><div class="badge">Preview & publish</div><h2>Try the route</h2></div><button id="publish">Publish version</button></div><p class="small">Answer each check to preview the fixed routing: pass → next skill · stuck → alternate activity · stuck again → prerequisite.</p><div id="preview"></div><div id="published" class="small"></div></section></main><div class="footer">Made for curious minds, one step at a time 🌱</div></div><script>
const SAMPLE=${JSON.stringify(sample)};let content=SAMPLE,progress={index:0,attempts:0,done:false,answers:[]},published=[];const $=id=>document.getElementById(id);const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));async function load(){try{let r=await fetch('/api/state');if(r.ok){let d=await r.json();if(d.content)content=d.content;if(d.progress)progress=d.progress;if(d.versions)published=d.versions}}catch{}render()};async function save(){try{await fetch('/api/state',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content,progress,published})})}catch{}}function render(){let el=$('learner');if(progress.done||progress.index>=content.skills.length){el.innerHTML='<div class="badge">Trail complete</div><h2>You did it! 🎉</h2><p>You kept exploring, and that is something to be proud of.</p><button id="restart">Start the trail again</button>'; $('restart').onclick=()=>{progress={index:0,attempts:0,done:false,answers:[]};save();render()}}else{let s=content.skills[progress.index];el.innerHTML='<div class="trailhead"><span class="pill">Step '+(progress.index+1)+' of '+content.skills.length+'</span><span class="small">🌿 Keep going at your pace</span></div><div class="progress"><i style="width:'+Math.round(progress.index/content.skills.length*100)+'%"></i></div><div class="badge">'+clean(s.title)+'</div><p class="activity">'+clean(s.activity)+'</p><div class="notice">💡 Take your time. When you’re ready, try this: <strong>'+clean(s.check)+'</strong></div><div class="answer"><input id="response" aria-label="Your answer" placeholder="Type your answer"><button id="check">Check</button></div><div id="feedback" class="feedback" aria-live="polite"></div>';const input=$('response');input.onkeydown=e=>{if(e.key==='Enter')answer()};$('check').onclick=answer}let list=$('skilllist');list.innerHTML=content.skills.map((s,i)=>'<div class="skill"><span class="num">'+(i<progress.index?'✓':i+1)+'</span><div><strong>'+clean(s.title)+'</strong><p>'+clean(s.activity.slice(0,105))+'…</p></div></div>').join('');drawPreview()}async function answer(){let s=content.skills[progress.index],f=$('feedback'),v=$('response').value.trim();if(!v)return;progress.answers.push(v);if(v.toLowerCase()===String(s.answer).toLowerCase()){f.className='feedback good';f.textContent='That’s it! You spotted it. 🌟';setTimeout(()=>{progress.index++;progress.attempts=0;if(progress.index>=content.skills.length)progress.done=true;save();render()},900)}else{progress.attempts++;f.className='feedback bad';if(progress.attempts===1){f.innerHTML='Not quite—and that’s part of learning! Try this: <strong>'+clean(s.alternate)+'</strong>';await save()}else{let pre=content.skills.findIndex(x=>x.id===s.prerequisite);f.textContent='Let’s revisit an earlier step together.';setTimeout(()=>{progress.index=pre>=0?pre:Math.max(0,progress.index-1);progress.attempts=0;save();render()},1200)}}}function drawPreview(){let p=$('preview');if(!p)return;p.innerHTML='<div class="skills">'+content.skills.map((s,i)=>'<div class="skill"><span class="num">'+(i+1)+'</span><div><strong>'+clean(s.title)+'</strong><p>Pass → '+(content.skills[i+1]?.title||'trail complete')+' · Stuck → alternate · Stuck again → '+(content.skills.find(x=>x.id===s.prerequisite)?.title||'start here')+'</p></div></div>').join('')+'</div>';$('published').innerHTML=published.length?'<div class="notice">Published versions: '+published.map(v=>'<span class="pill">'+clean(v.id)+'</span>').join(' ')+' (fixed snapshots)</div>':''}function validate(c){let e=[];if(!c||!Array.isArray(c.skills)||!c.skills.length)e.push('Skills: add at least one skill.');let seen=new Set;(c?.skills||[]).forEach((s,i)=>{let row=i+2;if(!s.id)e.push('Skills row '+row+': missing stable id.');else if(seen.has(s.id))e.push('Skills row '+row+': duplicate id '+s.id+'.');else seen.add(s.id);for(let k of ['title','activity','check','answer','alternate'])if(!s[k])e.push('Skills row '+row+': missing '+k+'.');if(s.prerequisite&&!c.skills.some(x=>x.id===s.prerequisite))e.push('Skills row '+row+': prerequisite '+s.prerequisite+' does not exist.');});for(let s of c?.skills||[]){let visited=new Set([s.id]),x=s;while(x?.prerequisite){if(visited.has(x.prerequisite)){e.push('Skills: prerequisite cycle includes '+x.prerequisite+'.');break}visited.add(x.prerequisite);x=c.skills.find(y=>y.id===x.prerequisite)}}return e}function showValidation(errors){$('validation').innerHTML=errors.length?'<div class="error"><strong>Please fix these issues:</strong><ul>'+errors.map(x=>'<li>'+clean(x)+'</li>').join('')+'</ul></div>':'<span class="good">✓ Draft is valid. All references resolve and routing reaches a next step.</span>'}document.querySelector('#childTab').onclick=()=>{ $('child').classList.remove('hide');$('author').classList.remove('show');$('childTab').classList.add('on');$('authorTab').classList.remove('on')};$('authorTab').onclick=()=>{$('author').classList.add('show');$('child').classList.add('hide');$('authorTab').classList.add('on');$('childTab').classList.remove('on');drawPreview()};$('file').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let r=await fetch('/api/import',{method:'POST',headers:{'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},body:await f.arrayBuffer()}),d=await r.json();if(!r.ok){showValidation(d.errors||['Workbook could not be read.']);return}content=d.content;showValidation(validate(content));await save();drawPreview()}catch{showValidation(['Workbook: could not read Excel file. Use the downloadable .xlsx template.'])}};$('publish').onclick=async()=>{let errs=validate(content);showValidation(errs);if(errs.length)return;let version={id:'v'+Date.now(),content:JSON.parse(JSON.stringify(content)),publishedAt:new Date().toISOString()};published.push(version);await save();drawPreview();$('published').innerHTML='<div class="notice">Published immutable version <strong>'+clean(version.id)+'</strong>. Existing learner trails keep their version.</div>'};load();
</script></html>`;
function makeWorkbook(content = sample) {
  const wb = XLSX.utils.book_new();
  const skills = [["skill_id", "title", "prerequisite_skill_id"], ...content.skills.map(s => [s.id, s.title, s.prerequisite || ""])];
  const activities = [["activity_id", "skill_id", "kind", "content"]];
  const checks = [["check_id", "skill_id", "prompt", "answer", "pass_route", "stuck_route", "stuck_again_route"]];
  for (const s of content.skills) {
    activities.push(["A-" + s.id, s.id, "primary", s.activity], ["ALT-" + s.id, s.id, "alternate", s.alternate]);
    checks.push(["C-" + s.id, s.id, s.check, s.answer, "next_skill", "alternate_activity", "prerequisite"]);
  }
  for (const [name, rows] of [["Skills", skills], ["Activities", activities], ["Checks", checks]]) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
function readWorkbook(buffer) {
  let wb;
  try { wb = XLSX.read(buffer, { type: "array" }); } catch { return { errors: ["Workbook: file is not a readable Excel .xlsx workbook."] }; }
  const errors = [], tabs = {};
  for (const name of ["Skills", "Activities", "Checks"]) {
    const sheet = wb.Sheets[name];
    if (!sheet) { errors.push(name + " tab: missing required tab."); tabs[name] = []; continue; }
    tabs[name] = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    if (!tabs[name].length) errors.push(name + " row 1: add column headers and content.");
  }
  if (errors.length) return { errors };
  const skills = new Map();
  tabs.Skills.forEach((r, i) => {
    const row = i + 2, id = String(r.skill_id || "").trim();
    if (!id) { errors.push(`Skills row ${row}: missing skill_id.`); return; }
    if (skills.has(id)) { errors.push(`Skills row ${row}: duplicate skill_id ${id}.`); return; }
    skills.set(id, { id, title: String(r.title || "").trim(), prerequisite: String(r.prerequisite_skill_id || "").trim(), activity: "", alternate: "", check: "", answer: "" });
    if (!r.title) errors.push(`Skills row ${row}: missing title.`);
  });
  const refs = new Set();
  tabs.Activities.forEach((r, i) => {
    const row = i + 2, id = String(r.activity_id || "").trim(), skill = skills.get(String(r.skill_id || "").trim()), kind = String(r.kind || "").trim().toLowerCase();
    if (!id) errors.push(`Activities row ${row}: missing activity_id.`);
    else if (refs.has(id)) errors.push(`Activities row ${row}: duplicate activity_id ${id}.`); else refs.add(id);
    if (!skill) errors.push(`Activities row ${row}: skill_id does not reference a Skills row.`);
    if (!['primary', 'alternate'].includes(kind)) errors.push(`Activities row ${row}: kind must be primary or alternate.`);
    if (!r.content) errors.push(`Activities row ${row}: missing content.`);
    if (skill && kind === "primary") skill.activity = String(r.content).trim();
    if (skill && kind === "alternate") skill.alternate = String(r.content).trim();
  });
  const checkRefs = new Set();
  tabs.Checks.forEach((r, i) => {
    const row = i + 2, id = String(r.check_id || "").trim(), skill = skills.get(String(r.skill_id || "").trim());
    if (!id) errors.push(`Checks row ${row}: missing check_id.`);
    else if (checkRefs.has(id)) errors.push(`Checks row ${row}: duplicate check_id ${id}.`); else checkRefs.add(id);
    if (!skill) errors.push(`Checks row ${row}: skill_id does not reference a Skills row.`);
    for (const field of ["prompt", "answer"]) if (!r[field]) errors.push(`Checks row ${row}: missing ${field}.`);
    for (const [field, allowed] of [["pass_route", "next_skill"], ["stuck_route", "alternate_activity"], ["stuck_again_route", "prerequisite"]]) if (String(r[field] || "").trim() !== allowed) errors.push(`Checks row ${row}: ${field} must be ${allowed} (fixed routing rule).`);
    if (skill) { skill.check = String(r.prompt || "").trim(); skill.answer = String(r.answer || "").trim(); }
  });
  for (const [id, s] of skills) {
    for (const [key, label] of [["activity", "primary activity"], ["alternate", "alternate activity"], ["check", "check"]]) if (!s[key]) errors.push(`Skills: ${id} is missing its ${label}.`);
    if (s.prerequisite && !skills.has(s.prerequisite)) errors.push(`Skills: ${id} prerequisite ${s.prerequisite} does not exist.`);
  }
  for (const s of skills.values()) { const seen = new Set([s.id]); let p = s.prerequisite; while (p) { if (seen.has(p)) { errors.push(`Skills: prerequisite cycle includes ${p}.`); break; } seen.add(p); p = skills.get(p)?.prerequisite; } }
  return errors.length ? { errors } : { content: { topic: "Equivalent Fractions", skills: [...skills.values()] } };
}

export class AppletState {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
    this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, data TEXT NOT NULL)");
    const url = new URL(request.url);
    if (url.pathname === "/api/template" && request.method === "GET") return new Response(makeWorkbook(), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": 'attachment; filename="learning-trail-template.xlsx"' } });
    if (url.pathname === "/api/import" && request.method === "POST") {
      const result = readWorkbook(await request.arrayBuffer());
      return Response.json(result, { status: result.errors ? 400 : 200 });
    }
    if (url.pathname === "/api/state") {
      if (request.method === "POST") {
        const data = await request.json();
        this.ctx.storage.sql.exec("INSERT INTO app_state (id,data) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data", JSON.stringify(data));
        return Response.json({ ok: true });
      }
      const row = this.ctx.storage.sql.exec("SELECT data FROM app_state WHERE id=1").toArray()[0];
      return Response.json(row ? JSON.parse(row.data) : {});
    }
    return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
}
export default { async fetch(request, env) { const id = env.APPLET_STATE.idFromName("default"); return env.APPLET_STATE.get(id).fetch(request); } };
