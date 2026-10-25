/* Sistema S.O.S.© — Código Internacional de Señales (OMI, res. A.80(IV)): banderas A–Z, significados de una letra
   y equivalencia en Morse (ITU-R M.1677-1). Pruebas de patrones sonoros ISO 8201, ISO 7731 y SOLAS/LSA 7.2.1.
   © Víctor Hugo Ramírez Salgado */
(() => {
  const C = { r: "#D21034", b: "#00247D", y: "#FFD100", k: "#111111", w: "#FFFFFF" };
  let uid = 0;
  const R = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C[c]}"/>`;
  const PG = (pts, c) => `<polygon points="${pts}" fill="${C[c]}"/>`;
  const aspa = (c) => `<path d="M0 0L60 40M60 0L0 40" stroke="${C[c]}" stroke-width="8"/>`;
  const cruz = (c) => R(0, 16, 60, 8, c) + R(26, 0, 8, 40, c);
  const DIB = {
    A: () => R(0, 0, 30, 40, "w") + PG("30,0 60,0 45,20 60,40 30,40", "b"),
    B: () => PG("0,0 60,0 45,20 60,40 0,40", "r"),
    C: () => ["b", "w", "r", "w", "b"].map((c, i) => R(0, i * 8, 60, 8, c)).join(""),
    D: () => R(0, 0, 60, 40, "y") + R(0, 10, 60, 20, "b"),
    E: () => R(0, 0, 60, 20, "b") + R(0, 20, 60, 20, "r"),
    F: () => R(0, 0, 60, 40, "w") + PG("30,0 60,20 30,40 0,20", "r"),
    G: () => [0, 1, 2, 3, 4, 5].map((i) => R(i * 10, 0, 10, 40, i % 2 ? "b" : "y")).join(""),
    H: () => R(0, 0, 30, 40, "w") + R(30, 0, 30, 40, "r"),
    I: () => R(0, 0, 60, 40, "y") + `<circle cx="30" cy="20" r="10" fill="${C.k}"/>`,
    J: () => R(0, 0, 60, 40, "b") + R(0, 13.33, 60, 13.34, "w"),
    K: () => R(0, 0, 30, 40, "y") + R(30, 0, 30, 40, "b"),
    L: () => R(0, 0, 30, 20, "y") + R(30, 0, 30, 20, "k") + R(0, 20, 30, 20, "k") + R(30, 20, 30, 20, "y"),
    M: () => R(0, 0, 60, 40, "b") + aspa("w"),
    N: () => [0, 1, 2, 3].map((f) => [0, 1, 2, 3].map((c) => R(c * 15, f * 10, 15, 10, (f + c) % 2 ? "w" : "b")).join("")).join(""),
    O: () => PG("0,0 0,40 60,40", "y") + PG("0,0 60,0 60,40", "r"),
    P: () => R(0, 0, 60, 40, "b") + R(20, 13.33, 20, 13.34, "w"),
    Q: () => R(0, 0, 60, 40, "y"),
    R: () => R(0, 0, 60, 40, "r") + cruz("y"),
    S: () => R(0, 0, 60, 40, "w") + R(20, 13.33, 20, 13.34, "b"),
    T: () => R(0, 0, 20, 40, "r") + R(20, 0, 20, 40, "w") + R(40, 0, 20, 40, "b"),
    U: () => R(0, 0, 30, 20, "r") + R(30, 0, 30, 20, "w") + R(0, 20, 30, 20, "w") + R(30, 20, 30, 20, "r"),
    V: () => R(0, 0, 60, 40, "w") + aspa("r"),
    W: () => R(0, 0, 60, 40, "b") + R(10, 6.67, 40, 26.66, "w") + R(20, 13.33, 20, 13.34, "r"),
    X: () => R(0, 0, 60, 40, "w") + cruz("b"),
    Y: () => { const id = "ics-y" + uid++; return `<defs><pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="10" fill="${C.y}"/><rect x="5" width="5" height="10" fill="${C.r}"/></pattern></defs><rect width="60" height="40" fill="url(#${id})"/>`; },
    Z: () => PG("0,0 60,0 30,20", "y") + PG("0,0 0,40 30,20", "k") + PG("0,40 60,40 30,20", "r") + PG("60,0 60,40 30,20", "b"),
  };
  // Significado de una sola letra (Código Internacional de Señales, OMI)
  const SIG = {
    A: "Tengo buzo sumergido; manténgase alejado a poca velocidad", B: "Cargo, descargo o transporto mercancías peligrosas",
    C: "Afirmativo (sí)", D: "Manténgase alejado; maniobro con dificultad", E: "Caigo a estribor", F: "Tengo avería; comuníquese conmigo",
    G: "Necesito práctico", H: "Tengo práctico a bordo", I: "Caigo a babor",
    J: "Tengo incendio y carga peligrosa a bordo; manténgase bien alejado", K: "Deseo comunicarme con usted",
    L: "Pare su buque inmediatamente", M: "Mi buque está parado y sin arrancada", N: "Negativo (no)", O: "¡Hombre al agua!",
    P: "En puerto: todo el personal a bordo, el buque va a salir", Q: "Mi buque está sano; pido libre plática",
    R: "Sin significado de una letra (en señales luminosas o sonoras: «recibido»)", S: "Estoy dando atrás",
    T: "Manténgase alejado; pesco al arrastre en pareja", U: "Se dirige usted hacia un peligro", V: "Necesito auxilio",
    W: "Necesito asistencia médica", X: "Suspenda lo que hace y atienda mis señales", Y: "Estoy garreando (el ancla no agarra)",
    Z: "Necesito remolcador" };
  const svg = (L, alto = 34) => {
    const d = DIB[L]; if (!d) return "";
    return `<svg class="ics" viewBox="0 0 60 40" height="${alto}" role="img" aria-label="Bandera ${L}: ${SIG[L]}"><title>${L} · ${SIG[L]}</title>${d()}<rect width="60" height="40" fill="none" stroke="#8a94a6" stroke-width="1"/></svg>`;
  };
  const limpiar = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  window.SOSBanderas = { svg, significado: (L) => SIG[L] || "", letras: Object.keys(DIB),
    mensaje: (t, alto) => limpiar(t).split(/\s+/).filter(Boolean).map((p) => `<span class="ics-pal">${[...p].map((c) => svg(c, alto)).join("")}</span>`).join("") };

  // ---------- Sección «Señales normalizadas» ----------
  const rejilla = document.getElementById("ics-rejilla");
  if (rejilla) rejilla.innerHTML = Object.keys(DIB).map((L) => `<div class="ics-c">${svg(L, 40)}<b>${L}</b><span class="mono">${window.SOSMorse ? SOSMorse.visible(SOSMorse.aMorse(L)) : ""}</span><small>${SIG[L]}</small></div>`).join("");
  const ent = document.getElementById("ics-txt"), sal = document.getElementById("ics-sal"), mor = document.getElementById("ics-morse");
  const pintar = () => { if (!ent) return; const t = ent.value || "SOS"; sal.innerHTML = window.SOSBanderas.mensaje(t, 44); if (window.SOSMorse) mor.textContent = SOSMorse.visible(SOSMorse.aMorse(t)); };
  ent?.addEventListener("input", pintar); pintar();
  document.getElementById("ics-oir")?.addEventListener("click", (e) => window.SOSMorse?.reproducir(ent.value || "SOS", sal, { motivo: "prueba-cliente", boton: e.currentTarget }));
  // Pruebas de patrones sonoros (módulo de pruebas del cliente; volumen reducido en el navegador)
  document.querySelectorAll("[data-patron-prueba]").forEach((b) => b.addEventListener("click", () => {
    const p = b.dataset.patronPrueba, luz = document.getElementById("sn-luz");
    if (!window.SOSMorse) return;
    if (p === "morse") return SOSMorse.reproducir("SOS", luz, { motivo: "prueba-cliente", boton: b });
    SOSMorse.reproducir("", luz, { motivo: "prueba-cliente", boton: b, patron: p, sirenaSeg: p === "t3" ? 8 : p === "solas" ? 19 : 4, sirenaVolumen: 0.5 });
  }));
  document.getElementById("sn-stop")?.addEventListener("click", () => window.SOSMorse?.detener());
})();
