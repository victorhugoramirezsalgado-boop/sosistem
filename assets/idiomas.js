/* Sistema S.O.S.© — selector de idioma y botones «Escuchar en Morse» · © Víctor Hugo Ramírez Salgado
   Los textos traducidos viven en datos/idiomas.json. La versión oficial es en español. */
(() => {
  const leer = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  let D = null, actual = "es";
  const nodos = {};          // clave → [elementos]
  const SEL = "h1,h2,h3,p,a,button,span,b,em";

  // Marca en la página los textos que existen en el diccionario español.
  function marcar() {
    const es = D.idiomas.es.t, porTexto = {};
    D.claves.forEach((k, i) => { if (es[i] && !(es[i] in porTexto)) porTexto[es[i]] = k; });
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.closest(".pantalla, .tbl-wrap, footer .cubo-firma, #idioma-wrap")) return;
      const txt = el.textContent.replace(/\s+/g, " ").trim();
      const k = porTexto[txt];
      if (!k) return;
      if ([...el.querySelectorAll(SEL)].some((h) => h.textContent.replace(/\s+/g, " ").trim() === txt)) return; // usa el más interno
      (nodos[k] = nodos[k] || []).push(el);
    });
  }

  function texto(k, lang = actual) {
    const i = D.claves.indexOf(k), L = D.idiomas[lang] || D.idiomas.es;
    return (L.t[i] || D.idiomas.es.t[i] || "");
  }

  // ---------- Traducción de TODO el texto de la página (nodo por nodo) ----------
  // datos/textos/es.json = lista de textos en español; datos/textos/<idioma>.json = misma lista traducida.
  const EXCL = "script,style,noscript,.mono,code,#idioma,#idioma-wrap,.cm-cubo,.cubo-firma,.alfabeto-morse,.refs,.ics-morse,.no-traducir";
  const ORIG = new WeakMap(), CACHE = {};
  let ES = null, MAPA = null, cambiando = false;
  const limpio = (t) => t.replace(/\s+/g, " ").trim();
  async function cargarTextos(lang) {
    if (lang === "es") return null;
    try {
      if (!ES) ES = await (await fetch("datos/textos/es.json", { cache: "no-cache" })).json();
      if (!CACHE[lang]) {
        const tr = await (await fetch(`datos/textos/${lang}.json`, { cache: "no-cache" })).json(), m = new Map();
        ES.forEach((t, i) => { if (tr[i]) m.set(t, tr[i]); });
        CACHE[lang] = m;
      }
      return CACHE[lang];
    } catch (e) { return null; }
  }
  function nodo(n) {
    const p = n.parentElement; if (!p || p.closest(EXCL)) return;
    const cur = n.nodeValue; let o = ORIG.get(n);
    if (!o || (cur !== o.tr && cur !== o.es)) o = { es: cur };          // texto nuevo puesto por la página
    const clave = limpio(o.es), t = MAPA && clave && MAPA.get(clave);
    const nuevo = t ? (o.es.match(/^\s*/)[0] + t + o.es.match(/\s*$/)[0]) : o.es;
    o.tr = nuevo; ORIG.set(n, o);
    if (cur !== nuevo) { cambiando = true; n.nodeValue = nuevo; cambiando = false; }
  }
  function recorrer(raiz) {
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (/[\p{L}]/u.test(n.nodeValue)) nodo(n);
    document.querySelectorAll("[placeholder],[data-i18n-title]").forEach((el) => {
      const k = el.dataset.esPh ?? (el.dataset.esPh = el.getAttribute("placeholder") || ""); if (k) el.setAttribute("placeholder", (MAPA && MAPA.get(k)) || k);
    });
  }
  // Textos que la página cambia sola (simulador, cubo de pantallas) también se traducen
  new MutationObserver((ms) => {
    if (cambiando || actual === "es") return;
    ms.forEach((m) => {
      if (m.type === "characterData") nodo(m.target);
      else m.addedNodes.forEach((a) => (a.nodeType === 3 ? nodo(a) : a.nodeType === 1 && recorrer(a)));
    });
  }).observe(document.body, { subtree: true, childList: true, characterData: true });

  async function aplicar(lang) {
    if (!D.idiomas[lang]) lang = "es";
    MAPA = await cargarTextos(lang);
    actual = lang;
    const L = D.idiomas[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = L.dir;
    Object.entries(nodos).forEach(([k, els]) => els.forEach((el) => { el.textContent = texto(k); }));
    const aviso = document.getElementById("aviso-trad");
    if (aviso) { aviso.hidden = lang === "es"; aviso.textContent = texto("aviso_trad"); }
    document.querySelectorAll(".btn-morse .bm-txt").forEach((s) => { s.textContent = texto("morse_play"); });
    const sel = document.getElementById("idioma"); if (sel) { sel.value = lang; sel.setAttribute("aria-label", texto("idioma")); }
    guardar("sos_idioma", lang);
    recorrer(document.body);
    if (!document.documentElement.dataset.tituloEs) document.documentElement.dataset.tituloEs = document.title;
    document.title = (MAPA && MAPA.get(document.documentElement.dataset.tituloEs)) || document.documentElement.dataset.tituloEs;
    document.dispatchEvent(new CustomEvent("sos-idioma", { detail: lang }));
  }

  function selector() {
    const nav = document.querySelector(".top nav");
    if (!nav) return;
    const wrap = document.createElement("label");
    wrap.id = "idioma-wrap"; wrap.className = "idioma";
    const sel = document.createElement("select");
    sel.id = "idioma";
    Object.entries(D.idiomas).forEach(([c, L]) => {
      const o = document.createElement("option"); o.value = c; o.textContent = L.corto + " · " + L.nombre; o.lang = c; sel.appendChild(o);
    });
    (D.pendientes || []).forEach((p) => {
      const o = document.createElement("option"); o.disabled = true; o.textContent = "⋯ " + p.nombre + " (en preparación)"; sel.appendChild(o);
    });
    sel.addEventListener("change", () => aplicar(sel.value));
    wrap.appendChild(sel);
    nav.insertBefore(wrap, nav.firstChild);
    const aviso = document.createElement("div");
    aviso.id = "aviso-trad"; aviso.className = "aviso-trad"; aviso.hidden = true; aviso.setAttribute("role", "status");
    document.querySelector(".top").after(aviso);
  }

  // Un botón «Escuchar en Morse» junto al título de cada sección
  function botonesMorse() {
    document.querySelectorAll("section.slide h2").forEach((h2) => {
      if (!window.SOSMorse) return;
      const espanol = h2.textContent.trim();
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn-morse";
      b.innerHTML = '<span class="bm-luz" aria-hidden="true"></span><span class="bm-txt"></span>';
      b.querySelector(".bm-txt").textContent = texto("morse_play");
      b.addEventListener("click", () => {
        if (b.classList.contains("morse-sonando")) { SOSMorse.detener(); return; }
        const actualTxt = h2.textContent.trim();
        const fuente = SOSMorse.cobertura(actualTxt) >= 0.8 ? actualTxt : espanol; // escrituras no latinas: se usa el español
        b.title = SOSMorse.visible(SOSMorse.aMorse(fuente));
        b.querySelector(".bm-txt").textContent = texto("morse_stop");
        SOSMorse.reproducir(fuente, b.querySelector(".bm-luz"), { boton: b, alTerminar: () => { b.querySelector(".bm-txt").textContent = texto("morse_play"); } });
      });
      h2.after(b);
    });
  }

  fetch("datos/idiomas.json", { cache: "no-cache" }).then((r) => r.json()).then((d) => {
    D = d;
    marcar();
    selector();
    // Botones «Escuchar en Morse» por sección: desactivados por regla de sonido (solo emergencias y pruebas)
    const pref = leer("sos_idioma") || (navigator.language || "es").slice(0, 2).toLowerCase();
    aplicar(D.idiomas[pref] ? pref : (pref === "no" || pref === "nn" ? "nb" : "es"));
  }).catch(() => {});
  // t("texto en español") → traducción del idioma actual (para textos armados por los scripts)
  window.SOSIdioma = { texto: (k) => (D ? texto(k) : ""), actual: () => actual, t: (es) => (MAPA && MAPA.get(es)) || es };
})();
