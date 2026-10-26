/* SOSistem™ · sitio sin internet · © Víctor Hugo Ramírez Salgado
   Guarda el sitio en el teléfono la primera vez que se abre con conexión. Con internet siempre intenta
   la versión más reciente; sin internet muestra la última guardada. El panel de administrador no se guarda. */
const CACHE = "sosistem-sitio-5.0";
const BASE = ["./", "index.html", "assets/estilo.css", "assets/cubo-rt.js", "assets/logo-giro.js", "assets/app.js", "assets/cubo.js", "assets/morse.js",
  "assets/pantalla.js", "assets/cubo-morse.js", "assets/idiomas.js", "assets/banderas.js", "assets/servicios12.js", "assets/pestanas.js",
  "assets/rastreo.js", "assets/morse-motor.js", "assets/morse-toma.js", "assets/receptor.js", "assets/logo.svg", "assets/icono.svg", "assets/icono-180.png", "assets/icono-192.png",
  "datos/idiomas.json", "datos/config.json", "datos/version.json", "datos/textos/es.json", "terminal.html"];
const NUNCA = /admin|\.enc\.json/;
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n.startsWith("sosistem-sitio") && n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || NUNCA.test(u.pathname)) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })
    .then((r) => r || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
