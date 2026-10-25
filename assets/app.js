/* Sistema S.O.S.© — página pública: modo presentación */
(function () {
  const T = (t) => (window.SOSIdioma?.t ? SOSIdioma.t(t) : t); // traduce textos armados aquí
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
  const LOGOS = { giro: "assets/logo-sello.svg", sello: "assets/logo-sello.svg", cubo: "assets/logo.svg" };
  function aplicarApariencia(a) {
    a = { fondo: "gris", logo: "giro", ...(a || {}) };
    if (!LOGOS[a.logo]) a.logo = "giro";
    if (!FONDOS[a.fondo]) a.fondo = "gris";
    document.documentElement.dataset.fondo = a.fondo;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", FONDOS[a.fondo]);
    const img = document.getElementById("logo-img"); if (img && LOGOS[a.logo]) img.src = LOGOS[a.logo];
    if (a.logo === "giro") window.SOSLogoGiro?.poner(); else window.SOSLogoGiro?.quitar();
    try { localStorage.setItem("sos_apariencia", JSON.stringify(a)); } catch (e) {}
  }
  try { aplicarApariencia(JSON.parse(localStorage.getItem("sos_apariencia") || "null")); } catch (e) { aplicarApariencia(); }

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
      document.getElementById("eq-911t").textContent = T(falta ? "Llamada al 911 en" : "Llamando al 911 · CAP v1.2");
      document.getElementById("eq-911n").textContent = falta ? falta + " s" : "";
      document.getElementById("eq-911b").style.width = Math.min(100, (s / N3) * 100) + "%";
      const ss = Math.floor(s); document.getElementById("eq-t").textContent = "00:" + String(ss).padStart(2, "0");
      document.getElementById("eq-hora").textContent = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
    };
    paso(); if (!quieto) setInterval(paso, 250);
  })();

  // Portada: cubo de pantallas. Cada cara exterior es una pantalla; gira a la derecha cada 4 s.
  // Caras 1–4 alrededor; 5 (arriba) y 6 (abajo) solo si el cliente tiene más pantallas (config: apariencia.pantallas_portada).
  const CUBO = (function () {
    const E = document.getElementById("eq-escena"), C = document.getElementById("eq-cubo"); if (!E || !C) return null;
    const NOMBRES = ["Sanitarios · persona en el suelo", "Entrada principal · aforo", "Sismo · salidas y personas", "Pantalla exterior · sismo", "Oficina · advertencia de aforo", "Cocina · gas detectado"];
    const ATRAS = "translateZ(calc(var(--z) * -1)) "; // el cubo se aleja media arista para que la cara del frente no se salga del recuadro
    const PASOS = ["rotateY(0deg) rotateX(0deg)", "rotateY(90deg) rotateX(0deg)", "rotateY(180deg) rotateX(0deg)", "rotateY(270deg) rotateX(0deg)", "rotateY(360deg) rotateX(-90deg)", "rotateY(360deg) rotateX(90deg)"].map((t) => ATRAS + t);
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let n = 6, k = 0, pausa = false, reloj;
    const medir = () => E.style.setProperty("--z", E.offsetWidth / 2 + "px");
    const puntos = document.getElementById("eq-puntos");
    function dibujar() {
      C.querySelectorAll(".eq-cara").forEach((f) => { f.hidden = Number(f.dataset.n) > n; });
      puntos.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" aria-label="${T("Pantalla")} ${i + 1}: ${T(NOMBRES[i])}" aria-current="${i === k}"></button>`).join("");
      document.getElementById("eq-cap").textContent = `${k + 1}/${n} · ${T(NOMBRES[k])}`;
    }
    function ir(j) {
      k = (j + n) % n;
      if (k === 0 && /270|360/.test(C.style.transform)) { // vuelta completa: sigue a la derecha y regresa a 0 sin que se note
        C.style.transform = ATRAS + "rotateY(360deg) rotateX(0deg)";
        setTimeout(() => { C.classList.add("sin-trans"); C.style.transform = PASOS[0]; void C.offsetWidth; C.classList.remove("sin-trans"); }, 1150);
      } else C.style.transform = PASOS[k];
      dibujar();
    }
    function ciclo() { clearInterval(reloj); if (!quieto) reloj = setInterval(() => { if (!pausa && !document.hidden) ir(k + 1); }, 4000); }
    puntos.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; ir([...puntos.children].indexOf(b)); ciclo(); });
    E.addEventListener("mouseenter", () => (pausa = true)); E.addEventListener("mouseleave", () => (pausa = false));
    E.addEventListener("focus", () => (pausa = true)); E.addEventListener("blur", () => (pausa = false));
    E.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { ir(k + 1); ciclo(); } if (e.key === "ArrowLeft") { ir(k - 1); ciclo(); } });
    addEventListener("resize", medir, { passive: true });
    medir(); C.style.transform = PASOS[0]; dibujar(); ciclo();
    document.addEventListener("sos-idioma", dibujar);
    return { pantallas(x) { n = Math.max(4, Math.min(6, Number(x) || 6)); if (k >= n) ir(0); else dibujar(); } };
  })();

  // Versión publicada
  fetch("datos/version.json", { cache: "no-store" }).then((r) => r.json()).then((v) => {
    const el = document.getElementById("version");
    if (el && v.version) el.textContent = T("Versión") + " " + v.version;
  }).catch(() => {});

  // Tiempos de escalamiento configurados desde el panel de administración
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    aplicarApariencia(c.apariencia);
    CUBO?.pantallas(c.apariencia?.pantallas_portada ?? 6);
    Object.entries(c.tiempos || {}).forEach(([k, v]) => {
      if (Number(v) > 0) document.querySelectorAll(`[data-t="${k}"]`).forEach((el) => { el.textContent = v; });
    });
  }).catch(() => {});
})();

/* Portada: inventario de personas en tiempo real (demostración). Entradas y salidas por recinto,
   sin rebasar el aforo; sincroniza la pantalla «Entrada principal» del cubo. © Víctor Hugo Ramírez Salgado */
(() => {
  const tot = document.getElementById("iv-total"), lista = document.getElementById("iv-lista"), barra = document.getElementById("iv-barra");
  const pant = document.querySelector(".eq-aforo"), lis = pant ? [...pant.parentElement.querySelectorAll(".eq-lista li")] : [];
  if (!tot || !lista || !lis.length) return;
  const AFORO = 60, CAP = [16, 12, 8, 14, 10];   // capacidad por recinto (R1, R2, R3, R4, R0)
  const R = lis.map((li, i) => ({ nombre: li.firstChild.textContent.trim(), n: Number(li.querySelector("em").textContent) || 0, cap: CAP[i] || 10 }));
  lista.innerHTML = R.map((r) => `<li><span>${r.nombre}</span><em>${r.n}</em></li>`).join("");
  const filas = [...lista.children];
  function pintar(k) {
    const t = R.reduce((a, r) => a + r.n, 0), pct = Math.round(t / AFORO * 100);
    tot.textContent = t; barra.style.width = pct + "%";
    barra.classList.toggle("alto", pct >= 75 && pct < 95); barra.classList.toggle("lleno", pct >= 95);
    R.forEach((r, i) => { filas[i].querySelector("em").textContent = r.n; lis[i].querySelector("em").textContent = r.n; filas[i].classList.toggle("cambio", i === k); });
    if (pant) { pant.querySelector("b").textContent = t; const bi = pant.querySelector("i"); if (bi) bi.style.width = pct + "%"; }
  }
  pintar(-1);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  setInterval(() => {
    if (document.hidden) return;
    const k = Math.floor(Math.random() * R.length), r = R[k], t = R.reduce((a, x) => a + x.n, 0);
    const entra = Math.random() < (t < AFORO * 0.4 ? 0.65 : t > AFORO * 0.7 ? 0.35 : 0.5);
    if (entra && r.n < r.cap && t < AFORO) r.n++; else if (!entra && r.n > 0) r.n--; else return;
    pintar(k);
  }, 3500);
})();

/* Apoya el proyecto: meta, avance y botón según datos/config.json → apoyo (editable desde el panel) */
(() => {
  const btn = document.getElementById("ap-btn"); if (!btn) return;
  const mx = (n) => "$" + Math.round(n).toLocaleString("es-MX");
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    const a = { meta_mxn: 50000, recaudado_mxn: 0, activo: false, url: "", ...(c.apoyo || {}) };
    const pct = a.meta_mxn > 0 ? Math.min(100, Math.round(a.recaudado_mxn / a.meta_mxn * 100)) : 0;
    document.getElementById("ap-rec").textContent = mx(a.recaudado_mxn);
    document.getElementById("ap-meta").textContent = mx(a.meta_mxn) + " MXN";
    document.getElementById("ap-barra").style.width = pct + "%";
    document.getElementById("ap-pct").textContent = pct + " % de la meta";
    if (a.activo && /^https:\/\/github\.com\/sponsors\//.test(a.url)) {
      btn.href = a.url; btn.textContent = "Patrocinar en GitHub";
      document.getElementById("ap-estado").textContent = "Pago único o mensual con tarjeta, mediante GitHub Sponsors.";
    }
  }).catch(() => {});
})();
