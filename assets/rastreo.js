/* Sistema S.O.S.© — medición anónima de visitas (GoatCounter: sin cookies, sin IP guardada)
   Registra: visita, secciones vistas ≥ 2 s, rango de tiempo en la página y clics de contacto. */
(() => {
  if (navigator.doNotTrack === "1" || location.hostname === "localhost") return;
  const inicio = Date.now();
  let code = "sositem", listo;
  const cfg = fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => { if (c.goatcounter) code = c.goatcounter; }).catch(() => {});
  const url = (p, t, ev) => `https://${code}.goatcounter.com/count?p=${encodeURIComponent(p)}&t=${encodeURIComponent(t || "")}` +
    (ev ? "&e=true" : `&r=${encodeURIComponent(document.referrer)}&s=${screen.width}`) + `&rnd=${Math.random().toString(36).slice(2)}`;
  const enviar = (p, t, ev, beacon) => {
    if (!code) return;
    const u = url(p, t, ev);
    if (beacon && navigator.sendBeacon) navigator.sendBeacon(u); else new Image().src = u;
  };
  cfg.then(() => { listo = true; enviar(location.pathname, document.title, false); });

  // Interés por sección
  const vistas = new Set(), timers = {};
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    const id = e.target.id;
    if (e.isIntersecting) timers[id] = setTimeout(() => { if (!vistas.has(id) && listo) { vistas.add(id); enviar("seccion/" + id, "Sección: " + id, true); } }, 2000);
    else clearTimeout(timers[id]);
  }), { threshold: 0.5 });
  document.querySelectorAll("section[id]").forEach((s) => io.observe(s));

  // Clics de contacto y presentación
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a,button"); if (!a) return;
    if (/wa\.me/.test(a.href || "")) enviar("evento/whatsapp", "Clic WhatsApp", true);
    else if (/^tel:/.test(a.href || "")) enviar("evento/telefono", "Clic teléfono", true);
    else if (a.id === "btn-presentar") enviar("evento/presentar", "Modo presentación", true);
  });

  // Tiempo de visita (una vez, al salir u ocultar la página)
  let hecho = false;
  const rango = (s) => s < 10 ? "0-10s" : s < 30 ? "10-30s" : s < 60 ? "30-60s" : s < 180 ? "1-3min" : s < 600 ? "3-10min" : "10min+";
  const cerrar = () => { if (hecho || !listo) return; hecho = true; const s = (Date.now() - inicio) / 1000; enviar("tiempo/" + rango(s), "Tiempo de visita", true, true); };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") cerrar(); });
  addEventListener("pagehide", cerrar);
})();
