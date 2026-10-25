/* Sistema S.O.S.© — página pública: modo presentación */
(function () {
  const slides = () => Array.from(document.querySelectorAll("section.slide"));
  let i = 0;

  function ir(n) {
    const s = slides();
    i = Math.max(0, Math.min(s.length - 1, n));
    s[i].scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function actual() {
    const s = slides();
    const y = window.scrollY + window.innerHeight / 3;
    let k = 0;
    s.forEach((el, idx) => { if (el.offsetTop <= y) k = idx; });
    return k;
  }
  function entrar() {
    document.body.classList.add("present");
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    ir(actual());
  }
  function salir() {
    document.body.classList.remove("present");
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }

  document.getElementById("btn-presentar")?.addEventListener("click", entrar);
  document.getElementById("btn-salir")?.addEventListener("click", salir);
  document.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", () => ir(actual() + Number(b.dataset.nav))));
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) document.body.classList.remove("present"); });
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("present")) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); ir(actual() + 1); }
    if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); ir(actual() - 1); }
    if (e.key === "Escape") salir();
  });

  // Abrir directo en modo presentación (desde el panel: index.html?presentar=1)
  if (new URLSearchParams(location.search).get("presentar") === "1") {
    document.body.classList.add("present");
    setTimeout(() => ir(0), 50);
  }

  // Apariencia elegida en el panel: fondo (blanco, beige, crema, gris, azul, negro) y logo
  const FONDOS = { blanco: "#ffffff", beige: "#ece2cf", crema: "#fbf4e2", gris: "#dde0e5", azul: "#0b2240", negro: "#000000" };
  const LOGOS = { sello: "assets/logo-sello.svg", cubo: "assets/logo.svg" };
  function aplicarApariencia(a) {
    a = { fondo: "gris", logo: "sello", ...(a || {}) };
    if (!FONDOS[a.fondo]) a.fondo = "gris";
    document.documentElement.dataset.fondo = a.fondo;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", FONDOS[a.fondo]);
    const img = document.getElementById("logo-img"); if (img && LOGOS[a.logo]) img.src = LOGOS[a.logo];
    try { localStorage.setItem("sos_apariencia", JSON.stringify(a)); } catch (e) {}
  }
  try { const ap = JSON.parse(localStorage.getItem("sos_apariencia") || "null"); if (ap) aplicarApariencia(ap); } catch (e) {}

  // Portada: la pantalla real recorre el escalamiento N0 → N3 (911) en bucle
  (function equipo() {
    const P = document.getElementById("hero-equipo"); if (!P) return;
    const lis = [...P.querySelectorAll(".eq-esc li")], b = P.querySelector(".eq-911");
    const seg = (n) => Number(P.querySelector(`[data-t="${n}"]`)?.textContent) || 0;
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t0 = Date.now();
    const paso = () => {
      const N3 = seg("N3") || 10, s = quieto ? N3 : ((Date.now() - t0) / 1000) % (N3 + 4);
      lis.forEach((li) => li.classList.toggle("on", s >= seg(li.dataset.n)));
      const falta = Math.max(0, Math.ceil(N3 - s));
      b.classList.toggle("hecha", falta === 0);
      document.getElementById("eq-911t").textContent = falta ? "Llamada al 911 en" : "Llamando al 911 · CAP v1.2";
      document.getElementById("eq-911n").textContent = falta ? falta + " s" : "";
      document.getElementById("eq-911b").style.width = Math.min(100, (s / N3) * 100) + "%";
      const ss = Math.floor(s); document.getElementById("eq-t").textContent = "00:" + String(ss).padStart(2, "0");
      document.getElementById("eq-hora").textContent = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
    };
    paso(); if (!quieto) setInterval(paso, 250);
  })();

  // Versión publicada
  fetch("datos/version.json", { cache: "no-store" }).then((r) => r.json()).then((v) => {
    const el = document.getElementById("version");
    if (el && v.version) el.textContent = "Versión " + v.version;
  }).catch(() => {});

  // Tiempos de escalamiento configurados desde el panel de administración
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    aplicarApariencia(c.apariencia);
    Object.entries(c.tiempos || {}).forEach(([k, v]) => {
      if (Number(v) > 0) document.querySelectorAll(`[data-t="${k}"]`).forEach((el) => { el.textContent = v; });
    });
  }).catch(() => {});
})();
