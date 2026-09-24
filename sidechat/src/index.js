const ADMIN_EMAIL = "admin@demo.de";
const SEED_CHANNELS = [
  { id: "general", name: "general", note: "Welcome! Share updates and useful links here." },
  { id: "ideas", name: "ideas", note: "A space for thoughts worth coming back to." },
  { id: "launch", name: "launch", note: "Keep launch plans and next steps in view." },
];
import { html } from './page.js';

export class AppletState {
  constructor(ctx) { this.ctx = ctx; this.ready = false; }
  async init() {
    if (this.ready) return;
    const sql = this.ctx.storage.sql;
    sql.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY, name TEXT NOT NULL, note TEXT NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, user TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0, must_reset INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at INTEGER NOT NULL)");
    const version = sql.exec("SELECT value FROM meta WHERE key='schema_version'").toArray()[0];
    if (!version || Number(version.value) < 1) {
      this.seed();
      sql.exec("INSERT OR REPLACE INTO meta(key,value) VALUES('schema_version','1')");
    }
    if (!sql.exec('SELECT email FROM users').toArray().length) {
      await this.addUser('demo@demo.de', 'demo', 'demo@demo.de', true, false);
      if (ADMIN_EMAIL !== 'demo@demo.de') await this.addUser(ADMIN_EMAIL, 'admin', 'admin@demo.de', true, true);
    }
    sql.exec("UPDATE users SET slug='demo' WHERE email='demo@demo.de' AND slug='demo@demo.de'");
    this.ready = true;
  }
  async hashPassword(password, salt) {
    const enc=new TextEncoder(); const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
    return [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  async addUser(email, slug, password, approved, mustReset) {
    const salt=crypto.randomUUID(); const hash=await this.hashPassword(password,salt);
    this.ctx.storage.sql.exec('INSERT INTO users(email,slug,password_hash,approved,must_reset,created_at) VALUES(?,?,?,?,?,?)',email,slug,salt+':'+hash,approved?1:0,mustReset?1:0,new Date().toISOString());
  }
  seed() {
    const sql=this.ctx.storage.sql;
    sql.exec('DELETE FROM messages'); sql.exec('DELETE FROM tasks'); sql.exec('DELETE FROM channels');
    sql.exec("INSERT INTO meta(key,value) VALUES('title','Sidechat Team') ON CONFLICT(key) DO UPDATE SET value=excluded.value");
    for(const c of SEED_CHANNELS) sql.exec('INSERT INTO channels(id,name,note) VALUES(?,?,?)',c.id,c.name,c.note);
    const now=new Date().toISOString();
    sql.exec('INSERT INTO messages(channel,user,body,created_at) VALUES(?,?,?,?)','general','Alex','Welcome to Sidechat! Use this space to keep the team in sync.',now);
    sql.exec('INSERT INTO messages(channel,user,body,created_at) VALUES(?,?,?,?)','launch','Sam','Let’s keep launch tasks and updates here.',now);
    sql.exec('INSERT INTO tasks(title,completed,created_at) VALUES(?,?,?)','Share your weekly update',0,now);
    sql.exec('INSERT INTO tasks(title,completed,created_at) VALUES(?,?,?)','Review launch checklist',0,now);
  }
  async verifyPassword(stored,password){const [salt,hash]=stored.split(':');return !!salt&&await this.hashPassword(password,salt)===hash;}
  jsonError(message,status=400){return Response.json({error:message},{status});}
  async fetch(request) {
    await this.init(); const url=new URL(request.url); const sql=this.ctx.storage.sql;
    const cookie=request.headers.get('Cookie')||''; const token=cookie.match(/(?:^|; )sidechat_session=([^;]+)/)?.[1];
    let session=token?sql.exec('SELECT users.email,users.slug,users.must_reset FROM sessions JOIN users ON users.email=sessions.email WHERE sessions.token=? AND sessions.expires_at>? AND users.approved=1',token,Date.now()).toArray()[0]:null;
    if(url.pathname==='/api/signup'&&request.method==='POST'){
      let b;try{b=await request.json()}catch{return this.jsonError('Invalid request')}
      const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';const slug=typeof b.slug==='string'?b.slug.trim().toLowerCase():'';const password=typeof b.password==='string'?b.password:'';
      if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||!/^[a-z0-9-]{2,30}$/.test(slug)||password.length<8||password.length>128)return this.jsonError('Provide a valid email, slug (2–30 letters/numbers/hyphens), and password (8+ characters).');
      if(sql.exec('SELECT email FROM users WHERE email=? OR slug=?',email,slug).toArray().length)return this.jsonError('Email or slug is already registered');
      await this.addUser(email,slug,password,false,false);return Response.json({ok:true,message:'Account created. Await admin approval.'});
    }
    if(url.pathname==='/api/login'&&request.method==='POST'){
      let b;try{b=await request.json()}catch{return this.jsonError('Invalid request')}
      const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';const user=sql.exec('SELECT * FROM users WHERE email=?',email).toArray()[0];
      if(!user||!await this.verifyPassword(user.password_hash,String(b.password||'')))return this.jsonError('Email or password is incorrect',401);
      if(!user.approved)return this.jsonError('Your account is awaiting admin approval',403);
      const fresh=crypto.randomUUID()+crypto.randomUUID();sql.exec('INSERT INTO sessions(token,email,expires_at) VALUES(?,?,?)',fresh,email,Date.now()+2592000000);
      return new Response(JSON.stringify({ok:true,must_reset:!!user.must_reset}),{headers:{'content-type':'application/json','set-cookie':'sidechat_session='+fresh+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000'}});
    }
    if(url.pathname.startsWith('/api/')&&url.pathname!=='/api/state'&&!session)return this.jsonError('Please log in',401);
    if(url.pathname==='/api/state'&&!session)return this.jsonError('Please log in',401);
    if(session?.must_reset&&url.pathname!=='/api/password'&&url.pathname!=='/api/logout'&&url.pathname!=='/')return this.jsonError('Password reset required',403);
    if(request.method==='GET'&&url.pathname==='/')return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
    if(url.pathname==='/api/state'&&request.method==='GET'){
      const title=sql.exec("SELECT value FROM meta WHERE key='title'").toArray()[0]?.value||'Sidechat Team';
      return Response.json({title,currentUser:session.email,currentSlug:session.slug,isAdmin:session.email===ADMIN_EMAIL,users:session.email===ADMIN_EMAIL?sql.exec('SELECT email,slug,approved,must_reset FROM users ORDER BY created_at').toArray():undefined,channels:sql.exec('SELECT id,name,note FROM channels ORDER BY rowid').toArray(),messages:sql.exec('SELECT id,channel,user,body,created_at FROM messages ORDER BY created_at,id').toArray(),tasks:sql.exec('SELECT id,title,completed,created_at FROM tasks ORDER BY id').toArray()});
    }
    if(!url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
    if(request.method!=='POST')return this.jsonError('Use POST for mutations',405);
    let b;try{b=await request.json()}catch{return this.jsonError('Request body must be valid JSON')}
    const str=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
    if(url.pathname==='/api/logout')return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json','set-cookie':'sidechat_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'}});
    if(url.pathname==='/api/profile'&&request.method==='POST'){
      const slug=str(b.slug,30).toLowerCase();if(!/^[a-z0-9-]{2,30}$/.test(slug))return this.jsonError('Slug must be 2–30 letters, numbers, or hyphens');
      if(sql.exec('SELECT email FROM users WHERE slug=? AND email<>?',slug,session.email).toArray().length)return this.jsonError('That slug is already taken');
      sql.exec('UPDATE users SET slug=? WHERE email=?',slug,session.email);return Response.json({ok:true});
    }
    if(url.pathname==='/api/password'){
      const password=typeof b.password==='string'?b.password:'';if(password.length<8||password.length>128)return this.jsonError('Password must be 8–128 characters');
      const salt=crypto.randomUUID(),hash=await this.hashPassword(password,salt);sql.exec('UPDATE users SET password_hash=?,must_reset=0 WHERE email=?',salt+':'+hash,session.email);return Response.json({ok:true});
    }
    if(url.pathname==='/api/admin/users'){
      if(session.email!==ADMIN_EMAIL)return this.jsonError('Admin only',403);
      return Response.json({users:sql.exec('SELECT email,slug,approved,must_reset,created_at FROM users ORDER BY created_at').toArray()});
    }
    if(url.pathname==='/api/admin/approve'||url.pathname==='/api/admin/revoke'||url.pathname==='/api/admin/reset-password'){
      if(session.email!==ADMIN_EMAIL)return this.jsonError('Admin only',403);
      const email=str(b.email,254).toLowerCase();if(!sql.exec('SELECT email FROM users WHERE email=?',email).toArray().length)return this.jsonError('User not found',404);
      if(url.pathname==='/api/admin/approve')sql.exec('UPDATE users SET approved=1 WHERE email=?',email);
      if(url.pathname==='/api/admin/revoke'){sql.exec('UPDATE users SET approved=0 WHERE email=?',email);sql.exec('DELETE FROM sessions WHERE email=?',email)}
      if(url.pathname==='/api/admin/reset-password'){sql.exec('UPDATE users SET must_reset=1 WHERE email=?',email);sql.exec('DELETE FROM sessions WHERE email=?',email)}
      return Response.json({ok:true});
    }
    if(url.pathname==='/api/reset'){this.seed();return Response.json({ok:true})}
    if(url.pathname==='/api/message'){
      const channel=str(b.channel,40),body=str(b.body,2000),user=session.slug;
      if(!sql.exec('SELECT id FROM channels WHERE id=?',channel).toArray().length)return this.jsonError('Choose a valid channel');
      if(!body)return this.jsonError('Message cannot be empty');if(body.length>2000)return this.jsonError('Message is too long');if(!user)return this.jsonError('Demo name cannot be empty');
      sql.exec('INSERT INTO messages(channel,user,body,created_at) VALUES(?,?,?,?)',channel,user,body,new Date().toISOString());return Response.json({ok:true});
    }
    if(url.pathname==='/api/note'){
      const channel=str(b.channel,40);if(typeof b.note!=='string'||b.note.length>500)return this.jsonError('Note must be 500 characters or fewer');
      if(!sql.exec('SELECT id FROM channels WHERE id=?',channel).toArray().length)return this.jsonError('Choose a valid channel');
      sql.exec('UPDATE channels SET note=? WHERE id=?',b.note.trim(),channel);return Response.json({ok:true});
    }
    if(url.pathname==='/api/task'){
      const title=str(b.title,160);if(!title)return this.jsonError('Task title cannot be empty');if(typeof b.title!=='string'||b.title.length>160)return this.jsonError('Task title must be 160 characters or fewer');
      sql.exec('INSERT INTO tasks(title,completed,created_at) VALUES(?,?,?)',title,0,new Date().toISOString());return Response.json({ok:true});
    }
    if(url.pathname==='/api/complete'){
      const id=Number(b.id);if(!Number.isSafeInteger(id)||id<1||typeof b.completed!=='boolean')return this.jsonError('Invalid task update');
      const found=sql.exec('SELECT id FROM tasks WHERE id=?',id).toArray();if(!found.length)return this.jsonError('Task not found',404);
      sql.exec('UPDATE tasks SET completed=? WHERE id=?',b.completed?1:0,id);return Response.json({ok:true});
    }
    return new Response('Not found',{status:404});
  }
}
export default { async fetch(request,env){const id=env.APPLET_STATE.idFromName('default');return env.APPLET_STATE.get(id).fetch(request)} };
