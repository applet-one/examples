export const MANIFEST = { name: 'bonn-tonne', short_name: 'bonn-tonne', lang: 'de', start_url: '/', scope: '/', display: 'standalone', background_color: '#f6f7f2', theme_color: '#284f40', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] };
export const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="40" fill="#284f40"/><g fill="none" stroke="#e3ecda" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M58 68h76l-8 84H66l-8-84ZM48 48h96M77 48V32h38v16M82 91v38m28-38v38"/></g></svg>';
export const SW = `const CACHE='bin-day-shell-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/icon.svg'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'&&url.pathname==='/')event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put('/',copy)))}return response}).catch(()=>caches.match('/')));
});`;
