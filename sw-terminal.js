/* SOSistem™ Terminal · funcionamiento sin internet · © Víctor Hugo Ramírez Salgado
   Guarda la app en el celular; con internet siempre intenta la versión más reciente primero. */
const CACHE = "sosistem-terminal-4.3";
const ARCHIVOS = ["terminal.html", "assets/terminal.css", "assets/terminal.js", "assets/morse.js", "assets/banderas.js", "assets/pantallas6.js", "assets/mapeo.js", "assets/icono.svg",
  "assets/icono-180.png", "assets/icono-192.png", "assets/icono-512.png", "manifest-terminal.webmanifest", "datos/config.json"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n.startsWith("sosistem-terminal") && n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;   // la API de GitHub nunca se guarda
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("terminal.html"))));
});
