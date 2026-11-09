/* SOSistem™ · marca en todo el sitio · © Víctor Hugo Ramírez Salgado
   Muestra cada «SOSistem» del texto con «SOS» en naranja e «istem» en negro, con su ™ (o © si el texto ya lo trae).
   Sobre fondos oscuros la marca va en una placa blanca para que el negro se lea.
   Conserva el texto original en español (data-es) y lo vuelve a traducir cuando cambia el idioma. */
(function () {
  "use strict";
  var RX = /SOSistem(™|©)?(?!\.com)/g;
  var SALTAR = "script,style,noscript,textarea,input,select,option,svg,title,code,pre,.mk,.mk-t,.logo,.hx-marca,.no-marca,.logo-giro,[contenteditable]";

  var css = document.createElement("style");
  css.textContent =
    ".mk{white-space:nowrap;color:#18191B;-webkit-text-fill-color:#18191B;font-weight:inherit}" +
    ".mk b{color:#C0541A;-webkit-text-fill-color:#C0541A;font-weight:inherit}" +
    ".mk sup{font-size:.55em;line-height:0;vertical-align:super}" +
    ".mk-osc .mk{background:#fff;border-radius:.22em;padding:0 .2em .02em;box-shadow:0 .08em 0 rgba(0,0,0,.35)}";
  document.head.appendChild(css);

  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function pintar(txt) {
    return esc(txt).replace(RX, function (_, s) { return '<span class="mk"><b>SOS</b>istem<sup>' + (s || "™") + "</sup></span>"; });
  }
  function limpio(t) { return t.replace(/\s+/g, " ").trim(); }
  function luz(c) { var m = (c || "").match(/[\d.]+/g); if (!m) return null; if (m.length > 3 && +m[3] < 0.2) return null; return 0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]; }
  function fondoOscuro(el) {
    var l = luz(getComputedStyle(el).color);
    return l !== null && l > 165; /* letra clara = fondo oscuro */
  }
  function envolver(n) {
    var p = n.parentNode; if (!p) return;
    var sp = document.createElement("span");
    sp.className = "mk-t";
    sp.setAttribute("data-es", n.nodeValue);
    sp.innerHTML = pintar(n.nodeValue);
    p.replaceChild(sp, n);
    if (fondoOscuro(p)) sp.classList.add("mk-osc");
  }
  function recorrer(raiz) {
    if (!raiz || (raiz.nodeType === 1 && raiz.closest(SALTAR))) return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n, lista = [];
    while ((n = w.nextNode())) {
      if (n.nodeValue.indexOf("SOSistem") < 0) continue;
      RX.lastIndex = 0; if (!RX.test(n.nodeValue)) continue;
      var e = n.parentElement; if (!e || e.closest(SALTAR)) continue;
      lista.push(n);
    }
    lista.forEach(envolver);
  }
  function traducir() {
    var T = window.SOSIdioma && window.SOSIdioma.t;
    document.querySelectorAll(".mk-t").forEach(function (sp) {
      var es = sp.getAttribute("data-es"), k = limpio(es), tr = T ? T(k) || k : k;
      var nuevo = es.match(/^\s*/)[0] + tr + es.match(/\s*$/)[0];
      if (sp.getAttribute("data-tr") !== nuevo) { sp.setAttribute("data-tr", nuevo); sp.innerHTML = pintar(nuevo); }
    });
  }
  var pend = null, nuevos = [];
  function programar() { if (pend) return; pend = setTimeout(function () { pend = null; var l = nuevos; nuevos = []; l.forEach(recorrer); traducir(); }, 120); }
  function iniciar() {
    document.querySelectorAll(".logo-text .mk").forEach(function (m) { if (fondoOscuro(m.parentNode)) m.parentNode.classList.add("mk-osc"); });
    recorrer(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "attributes") { programar(); return; }
        m.addedNodes.forEach(function (x) {
          if (x.nodeType === 1 && !x.classList.contains("mk-t") && !x.classList.contains("mk")) nuevos.push(x);
          else if (x.nodeType === 3 && x.parentNode) nuevos.push(x.parentNode);
        });
        if (m.type === "characterData" && m.target.parentNode) nuevos.push(m.target.parentNode);
      });
      if (nuevos.length) programar();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    new MutationObserver(programar).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    setTimeout(traducir, 600);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
