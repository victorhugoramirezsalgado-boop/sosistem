/* SOSistem™ · service worker de la Terminal inmediata (/sos/), en claro por decisión de VHRS.
   © Víctor Hugo Ramírez Salgado (VHRS). Guarda la pantalla para que abra sin red; no guarda voz, imágenes ni lecturas. */
const C="sosistem-sos-beta-v11";
const A=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","../assets/cubo-rt.js?v=sos11","../assets/sos-inicio.js?v=sos11"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith("sosistem-sos-")&&x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))))});
