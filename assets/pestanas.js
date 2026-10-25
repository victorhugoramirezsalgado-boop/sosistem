/* Sistema S.O.S.© — pestañas del sistema y detección del tipo de pantalla · © Víctor Hugo Ramírez Salgado
   - Pestañas chicas al borde derecho; al abrir una se ocultan y solo queda arriba «Ver pestañas del sistema».
   - En pantallas anchas (escritorio con margen libre) las pestañas quedan fijas sin tapar el contenido.
   - Marca <html data-pantalla="movil|tableta|escritorio" data-puntero="tactil|raton" data-so="…"> para ajustar el diseño. */
(() => {
  const H = document.documentElement;
  const NAV = document.getElementById("pestanas"), BTN = document.getElementById("ver-pestanas");
  if (!NAV || !BTN) return;

  // ---------- Tipo de pantalla (inteligente: ancho real, puntero y sistema) ----------
  const ua = navigator.userAgent || "";
  H.dataset.so = /android/i.test(ua) ? (/samsung|SM-/i.test(ua) ? "samsung" : "android")
    : /iphone|ipod/i.test(ua) ? "ios" : /ipad/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "ipados"
    : /macintosh/i.test(ua) ? "mac" : /windows/i.test(ua) ? "windows" : /linux/i.test(ua) ? "linux" : "otro";
  const fijo = () => H.dataset.pantalla === "escritorio" && innerWidth >= 1340;
  function medir() {
    const w = Math.min(innerWidth, screen.width || innerWidth), tactil = matchMedia("(pointer: coarse)").matches;
    H.dataset.pantalla = w < 700 ? "movil" : w < 1100 || (tactil && w < 1366) ? "tableta" : "escritorio";
    H.dataset.puntero = tactil ? "tactil" : "raton";
    H.dataset.orientacion = innerWidth > innerHeight ? "horizontal" : "vertical";
    H.classList.toggle("pestanas-fijas", fijo());
    // Alto real de la ventana (las barras del navegador móvil cambian 100vh)
    H.style.setProperty("--alto-real", innerHeight + "px");
    const top = document.querySelector(".top"); if (top) H.style.setProperty("--alto-barra", top.offsetHeight + "px");
  }
  medir();
  addEventListener("resize", medir, { passive: true });
  addEventListener("orientationchange", () => setTimeout(medir, 200));

  // ---------- Pestañas ----------
  const ETIQ = { inicio: "tab_inicio", funciones: "tab_funciones", problema: "tab_problema", datos: "tab_datos", funciona: "tab_funciona", ventajas: "tab_ventajas",
    "pantalla-demo": "tab_pantalla", galeria: "tab_galeria", normativa: "tab_normativa", clientes: "tab_clientes", piloto: "tab_piloto",
    contacto: "tab_contacto", fuentes: "tab_fuentes" };
  const FIJAS = { ssos: "S.S.O.S.©", "cubo-morse": "Cubo Morse©" };
  const ES = { tab_inicio: "Inicio", tab_funciones: "Funciones", tab_problema: "Problema", tab_datos: "Datos", tab_funciona: "Cómo funciona", tab_ventajas: "Ventajas",
    tab_pantalla: "Pantalla", tab_galeria: "Galería", tab_normativa: "Normativa", tab_clientes: "Clientes", tab_piloto: "Piloto",
    tab_contacto: "Contacto", tab_fuentes: "Fuentes", ver_pestanas: "Ver pestañas del sistema", ver_todo: "Ver todo", pestanas: "Pestañas del sistema" };
  const tr = (k) => (window.SOSIdioma && SOSIdioma.texto(k)) || ES[k] || k;
  const SECS = [...document.querySelectorAll("main > section[id]")];
  let actual = "inicio", abierto = false;

  function pintar() {
    NAV.setAttribute("aria-label", tr("pestanas"));
    NAV.innerHTML = SECS.map((s) => `<button type="button" data-sec="${s.id}" aria-current="${actual === s.id ? "page" : "false"}">${FIJAS[s.id] || tr(ETIQ[s.id] || s.id)}</button>`).join("") +
      `<button type="button" data-sec="todo" class="todo" aria-current="${actual === "todo" ? "page" : "false"}">${tr("ver_todo")}</button>`;
    document.getElementById("ver-pestanas-t").textContent = tr("ver_pestanas");
    // Separador de tema al inicio de cada sección: línea + cubo + título corto
    SECS.forEach((s, i) => {
      if (i === 0) return;
      let sep = s.querySelector(":scope > .sep-sec");
      if (!sep) { sep = document.createElement("div"); sep.className = "sep-sec"; sep.setAttribute("aria-hidden", "true");
        sep.innerHTML = '<span class="sep-l"></span><img src="assets/logo.svg" alt="" width="18" height="19"><b></b><span class="sep-l"></span>'; s.prepend(sep); }
      sep.querySelector("b").textContent = FIJAS[s.id] || tr(ETIQ[s.id] || s.id);
    });
  }
  function mostrar(id, { desplazar = true } = {}) {
    if (id !== "todo" && !SECS.some((s) => s.id === id)) id = "inicio";
    actual = id;
    document.body.classList.toggle("modo-pestana", id !== "todo");
    SECS.forEach((s) => { s.hidden = id !== "todo" && s.id !== id; });
    pintar();
    cerrar();
    if (!desplazar) return; // al cargar no se toca la dirección (evita que el navegador salte al ancla)
    scrollTo(0, 0);
    try { history.replaceState(null, "", id === "todo" ? location.pathname + location.search : "#" + id); } catch (e) {}
  }
  function abrir() { abierto = true; H.classList.add("pestanas-abiertas"); BTN.setAttribute("aria-expanded", "true"); NAV.querySelector('[aria-current="page"]')?.focus({ preventScroll: true }); }
  function cerrar() { abierto = false; H.classList.remove("pestanas-abiertas"); BTN.setAttribute("aria-expanded", "false"); }

  BTN.addEventListener("click", () => (abierto ? cerrar() : abrir()));
  NAV.addEventListener("click", (e) => { const b = e.target.closest("[data-sec]"); if (b) mostrar(b.dataset.sec); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && abierto) { cerrar(); BTN.focus(); } });
  document.addEventListener("click", (e) => { if (abierto && !fijo() && !e.target.closest("#pestanas, #ver-pestanas")) cerrar(); });
  // Enlaces internos (#contacto, #funciona…) abren su pestaña
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (actual !== "todo" && SECS.some((s) => s.id === id)) { e.preventDefault(); mostrar(id); }
  });
  addEventListener("hashchange", () => { const id = location.hash.slice(1); if (SECS.some((s) => s.id === id)) mostrar(id); });
  document.addEventListener("sos-idioma", pintar);

  // El modo presentación recorre todas las secciones
  const presentar = new URLSearchParams(location.search).get("presentar") === "1";
  document.getElementById("btn-presentar")?.addEventListener("click", () => mostrar("todo", { desplazar: false }), true);
  const inicial = location.hash.slice(1);
  mostrar(presentar ? "todo" : SECS.some((s) => s.id === inicial) ? inicial : "inicio", { desplazar: false });
})();
