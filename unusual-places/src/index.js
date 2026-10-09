import {places as seedPlaces} from './data.js';
import {html} from '../generated/assets.js';
import {searchPlaces,itinerary,interpretChat} from './domain.js';
import {handleMcp} from './mcp.js';
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{20,100}$/.test(id);
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
function ui(origin,embedded=false){return html.replace('__EMBED_FLAG__',JSON.stringify(embedded)).replace('__BASE_ORIGIN__',JSON.stringify(origin).replaceAll('<','\\u003c'));}
export class AppletState {
 constructor(ctx){this.ctx=ctx;this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS destinations (id TEXT PRIMARY KEY, data TEXT NOT NULL)');this.sql.exec('CREATE TABLE IF NOT EXISTS visitor_state (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)');for(const place of seedPlaces)this.sql.exec('INSERT INTO destinations (id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',place.id,JSON.stringify(place));}
 places(){return [...this.sql.exec('SELECT data FROM destinations')].map(row=>JSON.parse(row.data));}
 getState(id){if(!validId(id))throw new Error('A valid private visitor ID is required');const row=[...this.sql.exec('SELECT data FROM visitor_state WHERE id=?',id)][0];return row?JSON.parse(row.data):{shortlist:[],trip:[]};}
 saveState(id,input){const previous=this.getState(id);const known=new Set(this.places().map(p=>p.id));const clean=key=>input[key]===undefined?previous[key]:Array.isArray(input[key])?[...new Set(input[key].filter(x=>known.has(x)))].slice(0,30):previous[key];const state={shortlist:clean('shortlist'),trip:clean('trip')};this.sql.exec('INSERT INTO visitor_state (id,data,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at',id,JSON.stringify(state),new Date().toISOString());return state;}
 async fetch(request){
 const url=new URL(request.url),path=url.pathname,origin=url.origin;
 try{
 if(path==='/mcp'){
  const originHeader=request.headers.get('origin');if(originHeader&&!([origin,'https://chatgpt.com','https://chat.openai.com'].includes(originHeader)||/^https:\/\/[^/]+\.(?:oaiusercontent\.com|chatgpt\.com)$/.test(originHeader)))return json({error:'Origin not allowed'},403);
  return await handleMcp(request,{search:async args=>({...searchPlaces(this.places(),args),allPlaces:this.places()}),getPlace:async id=>this.places().find(p=>p.id===id)||null,getState:async id=>this.getState(id),saveState:async(id,data)=>this.saveState(id,data),planTrip:async ids=>itinerary(this.places(),ids),getHtml:()=>ui(origin,true)});
 }
 if(path==='/api/places'&&request.method==='GET')return json(searchPlaces(this.places(),Object.fromEntries(url.searchParams)));
 if(path==='/api/state'){
 const id=request.headers.get('X-Visitor-Id');if(!validId(id))return json({error:'A valid private visitor ID is required'},400);
 if(request.method==='GET')return json(this.getState(id));
 if(request.method==='PUT'){if(Number(request.headers.get('content-length'))>10000)return json({error:'Request too large'},413);return json(this.saveState(id,await request.json()));}
 }
 if(path==='/api/chat'&&request.method==='POST'){
 const id=request.headers.get('X-Visitor-Id');if(!validId(id))return json({error:'A valid private visitor ID is required'},400);
 const body=await request.json();if(typeof body.message!=='string'||body.message.length>2000)return json({error:'Please send a message of up to 2,000 characters'},400);
 const state=this.getState(id);const selected=Array.isArray(body.selectedIds)?body.selectedIds.slice(0,30):state.shortlist;const result=interpretChat(body.message,body.filters,selected,this.places());if(result.trip)this.saveState(id,{trip:result.trip});return json(result);
 }
 if(path==='/api/info')return json({name:'Offbeat',mcpUrl:`${origin}/mcp`,destinations:this.places().length,guide:'Deterministic demo interpreter, not an LLM',sources:['Wikipedia','Wikimedia Commons','OpenStreetMap'],privacy:'Your random visitor ID is a private capability. Keep it private. No account required; state persists on this browser and in the app database.'});
 if(path==='/health')return json({ok:true,destinations:this.places().length});
 if((path==='/'||path==='/embed')&&request.method==='GET')return new Response(ui(origin,path==='/embed'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
 return json({error:'Not found'},404);
 }catch(error){console.error('Request failed',path,error.message);return json({error:'Request could not be completed. Please check your input and try again.'},400);}
 }
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, PUT, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Visitor-Id','Access-Control-Max-Age':'86400'};
 if(path.startsWith('/api/')&&request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(path.startsWith('/api/')&&Number(request.headers.get('content-length'))>20000)return json({error:'Request too large'},413);
 const id=env.APPLET_STATE.idFromName('default');const response=await env.APPLET_STATE.get(id).fetch(request);
 if(!path.startsWith('/api/'))return response;
 const headers=new Headers(response.headers);for(const [key,value]of Object.entries(cors))headers.set(key,value);
 return new Response(response.body,{status:response.status,headers});
}};
