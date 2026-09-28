import { page, js, css, setupKey } from './generated.js';
import { clean, validEmail, validDate, quote, canCancel } from './lib.js';

const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const fail = (message, status = 400) => json({ error: message }, status);
const rand = n => [...crypto.getRandomValues(new Uint8Array(n))].map(x => x.toString(16).padStart(2, '0')).join('');
async function hash(text) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return [...new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/../g).map(x => parseInt(x, 16))), iterations: 100000, hash: 'SHA-256' }, key, 256))].map(x => x.toString(16).padStart(2, '0')).join('');
}
const pick = (row) => { if (!row) return null; const { discount_code, ...publicRow } = row; return { ...publicRow, has_discount: !!discount_code }; };
const stamp = () => new Date().toISOString();
const niceId = () => 'EV-' + rand(4).toUpperCase();
const fields = ['title','category','description','location','starts_at','ends_at','capacity','member_price','guest_price','companion_price','early_until','early_member_price','early_guest_price','early_companion_price','discount_code','discount_percent','published'];
function validateEvent(b) {
  const e = {};
  for (const f of ['title','category','description','location']) { e[f] = clean(b[f]); if (!e[f] || e[f].length > (f === 'description' ? 1000 : 120)) throw new Error('Bitte alle Eventangaben vollständig ausfüllen.'); }
  for (const f of ['starts_at','ends_at']) { if (!validDate(b[f])) throw new Error('Ungültiger Eventzeitpunkt.'); e[f] = b[f]; }
  if (Date.parse(e.ends_at) <= Date.parse(e.starts_at)) throw new Error('Das Ende muss nach dem Beginn liegen.');
  e.capacity = Number(b.capacity);
  if (!Number.isInteger(e.capacity) || e.capacity < 1 || e.capacity > 10000) throw new Error('Ungültige Kapazität.');
  for (const f of ['member_price','guest_price','companion_price']) { e[f] = Number(b[f]); if (!Number.isInteger(e[f]) || e[f] < 0 || e[f] > 10000000) throw new Error('Ungültiger Preis.'); }
  e.early_until = b.early_until ? b.early_until : null;
  if (e.early_until && (!validDate(e.early_until) || Date.parse(e.early_until) >= Date.parse(e.starts_at))) throw new Error('Ungültige Early-Bird-Frist.');
  for (const f of ['early_member_price','early_guest_price','early_companion_price']) { e[f] = b[f] === '' || b[f] == null ? null : Number(b[f]); if (e[f] !== null && (!Number.isInteger(e[f]) || e[f] < 0 || e[f] > 10000000)) throw new Error('Ungültiger Early-Bird-Preis.'); }
  e.discount_code = clean(b.discount_code).toUpperCase();
  if (e.discount_code && !/^[A-Z0-9_-]{3,24}$/.test(e.discount_code)) throw new Error('Rabattcode: 3–24 Buchstaben oder Zahlen.');
  e.discount_percent = Number(b.discount_percent || 0);
  if (!Number.isInteger(e.discount_percent) || e.discount_percent < 0 || e.discount_percent > 100) throw new Error('Ungültiger Rabatt.');
  e.published = b.published ? 1 : 0;
  return e;
}
function csvCell(value) { let s = String(value ?? ''); if (/^[\s]*[=+@\-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }

export class AppletState {
  constructor(ctx) { this.ctx = ctx; this.db = ctx.storage.sql; }
  init() {
    const db = this.db;
    db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    db.exec('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expires INTEGER NOT NULL)');
    db.exec('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, location TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, capacity INTEGER NOT NULL, member_price INTEGER NOT NULL, guest_price INTEGER NOT NULL, companion_price INTEGER NOT NULL, early_until TEXT, early_member_price INTEGER, early_guest_price INTEGER, early_companion_price INTEGER, discount_code TEXT NOT NULL DEFAULT \'\', discount_percent INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1)');
    db.exec('CREATE TABLE IF NOT EXISTS registrations (id TEXT PRIMARY KEY, event_id INTEGER NOT NULL, access_hash TEXT NOT NULL, submission_key TEXT NOT NULL UNIQUE, buyer_email TEXT NOT NULL, billing TEXT NOT NULL, member_number TEXT NOT NULL, status TEXT NOT NULL, payment_status TEXT NOT NULL, subtotal INTEGER NOT NULL, discount INTEGER NOT NULL, total INTEGER NOT NULL, created_at TEXT NOT NULL, cancelled_at TEXT, admin_note TEXT NOT NULL DEFAULT \'\')');
    db.exec('CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, registration_id TEXT NOT NULL, event_id INTEGER NOT NULL, kind TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL, phone TEXT NOT NULL, photo_consent INTEGER NOT NULL, guest_rule_consent INTEGER NOT NULL, price INTEGER NOT NULL)');
    db.exec('CREATE INDEX IF NOT EXISTS people_event_email ON people(event_id, email)');
    db.exec('CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, registration_id TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, at TEXT NOT NULL, detail TEXT NOT NULL)');
    if (![...db.exec('SELECT id FROM events LIMIT 1')].length) {
      const at = (days, hour) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); d.setUTCHours(hour, 0, 0, 0); return d.toISOString(); };
      const samples = [
        ['Gespräche, die bleiben', 'NETWORKING', 'Ein Abend für neue Perspektiven, gute Gespräche und Begegnungen jenseits des Gewohnten. In entspannter Atmosphäre entstehen die besten Verbindungen.', 'Salon Mitte', 16, 17, 60, 2500, 4900, 3500],
        ['Ideen am Morgen', 'AUSTAUSCH', 'Ein inspirierender Start in den Tag: kurze Impulse, frische Gedanken und Zeit für echten Austausch bei Kaffee und Frühstück.', 'Studio Nord', 28, 8, 40, 0, 0, 0],
        ['Perspektiven & Begegnungen', 'SPECIAL EVENT', 'Menschen, Ideen und ein gemeinsamer Abend. Entdecke neue Blickwinkel und genieße Raum für Gespräche bei Essen und Getränken.', 'Atelier West', 41, 18, 80, 3900, 6900, 4900]
      ];
      for (const s of samples) db.exec('INSERT INTO events (title,category,description,location,starts_at,ends_at,capacity,member_price,guest_price,companion_price,early_until,early_member_price,early_guest_price,early_companion_price,discount_code,discount_percent,published) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)', s[0],s[1],s[2],s[3],at(s[4],s[5]),at(s[4],s[5]+3),s[6],s[7],s[8],s[9],at(s[4]-7,0),Math.max(0,s[7]-500),Math.max(0,s[8]-700),Math.max(0,s[9]-500),'',0);
    }
  }
  setting(key) { return [...this.db.exec('SELECT value FROM settings WHERE key = ?', key)][0]?.value; }
  sessionToken(req) { return req.headers.get('Cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('event_session='))?.slice(14); }
  async auth(req) {
    const token = this.sessionToken(req);
    return !!(token && /^[a-f0-9]{64}$/.test(token) && [...this.db.exec('SELECT hash FROM sessions WHERE hash = ? AND expires > ?', await hash(token), Date.now())].length > 0);
  }
  async body(req) {
    if (!req.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new Error('JSON erwartet.');
    if (Number(req.headers.get('Content-Length')) > 20000) throw new Error('Anfrage zu groß.');
    const text = await req.text(); if (text.length > 20000) throw new Error('Anfrage zu groß.');
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Ungültige Anfrage.');
    return data;
  }
  async session(req) {
    const token = rand(32), secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
    this.db.exec('INSERT INTO sessions (hash,expires) VALUES (?,?)', await hash(token), Date.now() + 7 * 86400000);
    return json({ ok: true }, 200, { 'Set-Cookie': `event_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure}` });
  }
  event(id, admin = false) { return [...this.db.exec(`SELECT * FROM events WHERE id = ? ${admin ? '' : 'AND published = 1'}`, id)][0]; }
  audit(id, action, actor, detail = '') { this.db.exec('INSERT INTO audit (registration_id,action,actor,at,detail) VALUES (?,?,?,?,?)', id, action, actor, stamp(), detail); }
  receipt(r) { return { id:r.id, status:r.status, payment_status:r.payment_status, total:r.total, created_at:r.created_at, event:pick(this.event(r.event_id,true)), people:[...this.db.exec('SELECT kind,first_name,last_name,email,price FROM people WHERE registration_id = ? ORDER BY id',r.id)] }; }
  async fetch(req) {
    this.init();
    const url = new URL(req.url), path = url.pathname, method = req.method;
    const common = { 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY', 'Cache-Control':'no-store' };
    if (method === 'GET' && (path === '/' || path === '/admin' || path.startsWith('/events/') || path === '/my-registration' || path === '/datenschutz')) return new Response(page, { headers: { ...common, 'Content-Type':'text/html; charset=utf-8', 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" } });
    if (method === 'GET' && path === '/app.js') return new Response(js, { headers: { ...common, 'Content-Type':'text/javascript; charset=utf-8' } });
    if (method === 'GET' && path === '/app.css') return new Response(css, { headers: { ...common, 'Content-Type':'text/css; charset=utf-8' } });
    if (!path.startsWith('/api/')) return fail('Nicht gefunden.',404);
    if (!['GET','POST','PUT'].includes(method)) return fail('Methode nicht erlaubt.',405);
    if (method !== 'GET' && req.headers.get('Origin') !== url.origin) return fail('Ungültige Herkunft.',403);
    try {
      if (path === '/api/events' && method === 'GET') return json({ events:[...this.db.exec('SELECT * FROM events WHERE published = 1 AND starts_at > ? ORDER BY starts_at',stamp())].map(pick) });
      if (path.match(/^\/api\/events\/\d+$/) && method === 'GET') { const e = this.event(Number(path.split('/')[3])); return e ? json({ event:pick(e) }) : fail('Event nicht gefunden.',404); }
      if (path === '/api/quote' && method === 'POST') { const b = await this.body(req), e = this.event(Number(b.event_id)); if (!e || Date.parse(e.starts_at) <= Date.now()) return fail('Event nicht verfügbar.',404); return json(quote(e,b.people,b.code)); }
      if (path === '/api/register' && method === 'POST') return this.register(await this.body(req));
      if (path === '/api/lookup' && method === 'POST') { const b = await this.body(req); const r = [...this.db.exec('SELECT * FROM registrations WHERE id = ?',clean(b.id).toUpperCase())][0]; return r && typeof b.access_code === 'string' && (await hash(b.access_code)) === r.access_hash ? json({ registration:this.receipt(r), can_cancel:r.status !== 'cancelled' && (r.status === 'pending' || canCancel(this.event(r.event_id,true).starts_at)) }) : fail('Referenz oder Zugangscode nicht gefunden.',404); }
      if (path === '/api/cancel' && method === 'POST') { const b = await this.body(req); const r = [...this.db.exec('SELECT * FROM registrations WHERE id = ?',clean(b.id).toUpperCase())][0]; if (!r || typeof b.access_code !== 'string' || (await hash(b.access_code)) !== r.access_hash) return fail('Referenz oder Zugangscode nicht gefunden.',404); if (r.status === 'cancelled') return fail('Bereits storniert.',409); if (r.status !== 'pending' && !canCancel(this.event(r.event_id,true).starts_at)) return fail('Die kostenfreie Stornierungsfrist ist abgelaufen. Bitte das Eventteam kontaktieren.',409); this.db.exec('UPDATE registrations SET status = ?,cancelled_at = ? WHERE id = ?', 'cancelled',stamp(),r.id); this.audit(r.id,'cancelled','participant',r.total && r.payment_status === 'recorded_manually' ? 'Refund requires manual processing' : 'No refund required'); return json({ registration:this.receipt({ ...r,status:'cancelled' }), refund_pending:r.total > 0 && r.payment_status === 'recorded_manually' }); }
      if (path === '/api/admin/status' && method === 'GET') return json({ setup:!!this.setting('admin_hash'), authenticated:!!(await this.auth(req)), setup_available:!!setupKey });
      if (path === '/api/admin/setup' && method === 'POST') { if (this.setting('admin_hash') || !setupKey) return fail('Einrichtung nicht verfügbar.',403); const b = await this.body(req); if (b.setup_key !== setupKey || typeof b.password !== 'string' || b.password.length < 14 || b.password.length > 200) return fail('Ungültiger Einrichtungsschlüssel oder Passwort (mindestens 14 Zeichen).',403); const salt = rand(16), digest = await passwordHash(b.password,salt); this.db.exec('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)','admin_salt',salt); this.db.exec('INSERT INTO settings (key,value) VALUES (?,?)','admin_hash',digest); return this.session(req); }
      if (path === '/api/admin/login' && method === 'POST') { if (!this.setting('admin_hash')) return fail('Adminzugang noch nicht eingerichtet.',403); if (Number(this.setting('login_blocked') || 0) > Date.now()) return fail('Zu viele Versuche. In 15 Minuten erneut versuchen.',429); const b = await this.body(req); const ok = typeof b.password === 'string' && (await passwordHash(b.password,this.setting('admin_salt'))) === this.setting('admin_hash'); if (!ok) { const n = Number(this.setting('login_failures') || 0) + 1; this.db.exec('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)','login_failures',String(n)); if (n >= 5) { this.db.exec('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)','login_blocked',String(Date.now()+900000)); this.db.exec('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)','login_failures','0'); } return fail('Passwort nicht korrekt.',401); } this.db.exec("DELETE FROM settings WHERE key IN ('login_failures','login_blocked')"); return this.session(req); }
      if (!(await this.auth(req))) return fail('Anmeldung erforderlich.',401);
      if (path === '/api/admin/logout' && method === 'POST') { this.db.exec('DELETE FROM sessions WHERE hash = ?',await hash(this.sessionToken(req))); return json({ok:true},200,{'Set-Cookie':'event_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); }
      if (path === '/api/admin/password' && method === 'POST') { const b = await this.body(req); if (typeof b.current !== 'string' || (await passwordHash(b.current,this.setting('admin_salt'))) !== this.setting('admin_hash') || typeof b.next !== 'string' || b.next.length < 14) return fail('Passwortangaben prüfen. Neues Passwort: mindestens 14 Zeichen.'); const salt = rand(16); this.db.exec('UPDATE settings SET value = ? WHERE key = ?',salt,'admin_salt'); this.db.exec('UPDATE settings SET value = ? WHERE key = ?',await passwordHash(b.next,salt),'admin_hash'); this.db.exec('DELETE FROM sessions'); return json({ok:true},200,{'Set-Cookie':'event_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); }
      if (path === '/api/admin/overview' && method === 'GET') { const events = [...this.db.exec('SELECT * FROM events ORDER BY starts_at DESC')]; const regs = [...this.db.exec('SELECT r.*,e.title AS event_title,e.starts_at AS event_starts FROM registrations r JOIN events e ON e.id = r.event_id ORDER BY r.created_at DESC LIMIT 500')].map(r => ({...r,billing:JSON.parse(r.billing),people:[...this.db.exec('SELECT * FROM people WHERE registration_id = ? ORDER BY id',r.id)],audit:[...this.db.exec('SELECT action,actor,at,detail FROM audit WHERE registration_id = ? ORDER BY id DESC',r.id)]})); return json({events,registrations:regs}); }
      if (path === '/api/admin/events' && method === 'POST') return this.saveEvent(await this.body(req));
      if (path.match(/^\/api\/admin\/events\/\d+$/) && method === 'PUT') return this.saveEvent(await this.body(req),Number(path.split('/')[4]));
      if (path.match(/^\/api\/admin\/registrations\/EV-[A-F0-9]{8}\/(paid|verify|cancel)$/) && method === 'POST') {
        const [,id,action] = path.match(/(EV-[A-F0-9]{8})\/(paid|verify|cancel)$/), r = [...this.db.exec('SELECT * FROM registrations WHERE id = ?',id)][0]; if (!r) return fail('Anmeldung nicht gefunden.',404);
        if (action === 'paid') { const b = await this.body(req); if (r.status !== 'pending' || r.total === 0) return fail('Nur offene kostenpflichtige Anmeldungen können bestätigt werden.',409); if (b.verified_payment !== true || (r.member_number && b.verified_member !== true)) return fail('Zahlung und ggf. Mitgliedschaft müssen manuell geprüft und bestätigt werden.'); this.db.exec('UPDATE registrations SET status = ?,payment_status = ? WHERE id = ?','confirmed','recorded_manually',id); this.audit(id,'payment_recorded','admin',r.member_number ? 'Payment and membership checked manually' : 'Payment checked manually'); }
        else if (action === 'verify') { const b = await this.body(req); if (r.status !== 'pending' || r.total !== 0 || !r.member_number || b.verified_member !== true) return fail('Nur kostenfreie Mitgliedsanmeldungen können nach Mitgliedsprüfung bestätigt werden.',409); this.db.exec('UPDATE registrations SET status = ? WHERE id = ?','confirmed',id); this.audit(id,'membership_verified','admin','Membership checked manually'); }
        else { if (r.status === 'cancelled') return fail('Bereits storniert.',409); const b = await this.body(req); if (!canCancel(this.event(r.event_id,true).starts_at) && clean(b.reason).length < 10) return fail('Nach Fristende ist eine Begründung (mind. 10 Zeichen) erforderlich.'); this.db.exec('UPDATE registrations SET status = ?,cancelled_at = ?,admin_note = ? WHERE id = ?','cancelled',stamp(),clean(b.reason),id); this.audit(id,'cancelled','admin',clean(b.reason) || 'Admin cancellation'); }
        return json({ok:true});
      }
      if (path === '/api/admin/export' && method === 'GET') {
        const rows = [...this.db.exec('SELECT e.title,e.starts_at,r.id,r.status,r.payment_status,r.total,p.kind,p.first_name,p.last_name,p.email,p.company,p.phone,p.photo_consent,p.guest_rule_consent,p.price FROM people p JOIN registrations r ON p.registration_id = r.id JOIN events e ON e.id = r.event_id ORDER BY e.starts_at,r.id,p.id')];
        const keys = ['title','starts_at','id','status','payment_status','total','kind','first_name','last_name','email','company','phone','photo_consent','guest_rule_consent','price'];
        return new Response('\uFEFF' + [keys.join(';'),...rows.map(row => keys.map(k => csvCell(row[k])).join(';'))].join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="teilnehmer.csv"','Cache-Control':'no-store'}});
      }
      return fail('Nicht gefunden.',404);
    } catch(err) { if (err instanceof SyntaxError) return fail('Ungültiges JSON.'); if (err.message && !/SQLITE|constraint|database|Cannot|undefined/i.test(err.message)) return fail(err.message); console.error(err); return fail('Interner Fehler. Bitte später erneut versuchen.',500); }
  }
  saveEvent(b,id) {
    const e = validateEvent(b), db = this.db;
    if (id && !this.event(id,true)) return fail('Event nicht gefunden.',404);
    if (id) db.exec(`UPDATE events SET ${fields.map(f => f+' = ?').join(',')} WHERE id = ?`,...fields.map(f => e[f]),id);
    else db.exec(`INSERT INTO events (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,...fields.map(f => e[f]));
    return json({ok:true});
  }
  async register(b) {
    const db = this.db, event = this.event(Number(b.event_id));
    if (!event || Date.parse(event.starts_at) <= Date.now()) return fail('Event nicht verfügbar.',404);
    if (typeof b.submission_key !== 'string' || !/^[a-f0-9-]{36}$/.test(b.submission_key)) return fail('Ungültige Anfrage.');
    const existing = [...db.exec('SELECT * FROM registrations WHERE submission_key = ?',b.submission_key)][0];
    if (existing) return fail('Diese Anfrage wurde bereits verarbeitet. Bitte Referenz und Zugangscode aus der ersten Bestätigung verwenden.',409);
    if (!Array.isArray(b.people) || b.people.length < 1 || b.people.length > 10 || !b.privacy_consent) return fail('Personen und Datenschutzzustimmung prüfen.');
    const people = b.people.map(p => ({ kind:clean(p.kind),first_name:clean(p.first_name),last_name:clean(p.last_name),email:clean(p.email).toLowerCase(),company:clean(p.company),phone:clean(p.phone),photo_consent:p.photo_consent === true ? 1 : 0,guest_rule_consent:p.guest_rule_consent === true ? 1 : 0 }));
    const member = people[0].kind === 'member';
    if (people.some((p,i) => !['member','guest','companion'].includes(p.kind) || (p.kind === 'member' && i !== 0) || (p.kind === 'companion' && (!member || i === 0)) || !p.first_name || !p.last_name || p.first_name.length > 100 || p.last_name.length > 100 || !validEmail(p.email) || p.company.length > 120 || p.phone.length > 50 || ((p.kind === 'guest' || p.kind === 'companion') && (!p.company || !p.guest_rule_consent)))) return fail('Teilnehmerdaten prüfen: Name, E-Mail, Unternehmen und Gastregel sind erforderlich.');
    if (new Set(people.map(p => p.email)).size !== people.length) return fail('Jede Person benötigt eine eigene E-Mail-Adresse.');
    if (member && (!clean(b.member_number) || clean(b.member_number).length > 50)) return fail('Mitgliedsnummer erforderlich.');
    if (clean(b.member_number).length > 50) return fail('Ungültige Mitgliedsnummer.');
    const q = quote(event,people,b.code);
    const billing = b.billing || {}, address = { name:clean(billing.name),street:clean(billing.street),postal:clean(billing.postal),city:clean(billing.city),country:clean(billing.country) };
    if (q.total > 0 && Object.values(address).some(x => !x || x.length > 150)) return fail('Für kostenpflichtige Anmeldungen ist eine vollständige Rechnungsanschrift erforderlich.');
    if (q.total === 0 && Object.values(address).some(x => x.length > 150)) return fail('Ungültige Adressangaben.');
    const activeCount = [...db.exec("SELECT COUNT(*) AS n FROM people p JOIN registrations r ON r.id = p.registration_id WHERE p.event_id = ? AND r.status != 'cancelled'",event.id)][0].n;
    if (activeCount + people.length > event.capacity) return fail('Nicht genügend Plätze verfügbar.',409);
    for (const p of people) if ([...db.exec("SELECT 1 FROM people p JOIN registrations r ON r.id = p.registration_id WHERE p.event_id = ? AND p.email = ? AND r.status != 'cancelled' LIMIT 1",event.id,p.email)].length) return fail('Für eine dieser E-Mail-Adressen liegt bereits eine aktive Anmeldung vor.',409);
    const id = niceId(), accessCode = rand(12), status = q.total === 0 && !member ? 'confirmed' : 'pending', pay = q.total === 0 ? 'not_required' : 'awaiting_payment';
    db.exec('INSERT INTO registrations (id,event_id,access_hash,submission_key,buyer_email,billing,member_number,status,payment_status,subtotal,discount,total,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',id,event.id,await hash(accessCode),b.submission_key,people[0].email,JSON.stringify(address),member ? clean(b.member_number) : '',status,pay,q.subtotal,q.discount,q.total,stamp());
    for (let i=0;i<people.length;i++) { const p = people[i]; db.exec('INSERT INTO people (registration_id,event_id,kind,first_name,last_name,email,company,phone,photo_consent,guest_rule_consent,price) VALUES (?,?,?,?,?,?,?,?,?,?,?)',id,event.id,p.kind,p.first_name,p.last_name,p.email,p.company,p.phone,p.photo_consent,p.guest_rule_consent,q.lines[i].price); }
    this.audit(id,'registered','participant',status === 'pending' ? (q.total === 0 ? 'Awaiting manual membership verification' : 'Awaiting manually verified payment') : 'Free registration');
    return json({ registration:this.receipt({id,event_id:event.id,status,payment_status:pay,total:q.total,created_at:stamp()}), access_code:accessCode },201);
  }
}
export default { fetch(request,env) { return env.APPLET_STATE.get(env.APPLET_STATE.idFromName('default')).fetch(request); } };
