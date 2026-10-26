/* SOSistem™ · Las 6 pantallas del Sistema S.O.S.© en la terminal «Pantalla · ver terminal»
   Cada pantalla reacciona en vivo al estado del celular (normal, aviso, caída, sismo) con sus tiempos reales.
   Aforos, recintos y distancias son de demostración, iguales a los de sosistem.com.
   © 2026 Víctor Hugo Ramírez Salgado · Sistema S.O.S.© (Safe Creative 2609046908578) */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const morse = (t) => (window.SOSMorse ? SOSMorse.visible(SOSMorse.aMorse(t)) : "");
  const pie = (id, lugar, led) => `<div class="eq-pie"><span>${id} · ${lugar}</span><span class="eq-leds">${["r", "y", "g", "w"].map((c) => `<i class="${c}${c === led ? " on" : ""}"></i>`).join("")}</span><span>S.O.S.©</span></div>`;
  const aviso = (txt, ev) => `<div class="eq-morse">${esc(txt)} &nbsp;<span>${morse(txt)}</span></div><div class="eq-band" data-banderas="${esc(txt)}"${ev ? ` data-evento="${ev}"` : ""}></div>`;
  const pant = (fase, cuerpo, piehtml, extra = "") => `<div class="p6-cara"><div class="eq-bisel"><div class="eq-pant ${extra}" data-fase="${fase}">${cuerpo}</div>${piehtml}</div></div>`;
  const NOMBRES = ["Sanitarios", "Entrada principal", "Sismo · salidas", "Pantalla exterior", "Oficina", "Cocina"];

  // modo: normal | caida | sismo | aviso
  function modoDe(st) {
    if (st.alerta) return st.alerta.tipo === "sismo" ? "sismo" : "caida";
    if (st.aviso || st.e === "advertencia") return "aviso";
    return "normal";
  }
  function armar(st, m) {
    const rec = esc(st.rec || "Recinto de prueba"), prueba = st.alerta?.prueba ? " · PRUEBA" : "";
    const tituloEv = esc(st.alerta?.titulo || st.aviso?.titulo || "");
    // 1 · Sanitarios
    const p1 = m === "caida"
      ? `<div class="eq-top"><b>NODO S.O.S.© · SANITARIOS PLANTA BAJA</b><span>${rec}</span></div>
         <div class="eq-mods"><div class="eq-mod m"><h4>Masculino</h4><p><i></i>Adultos 3/6<em class="ok">Libre</em></p><p><i></i>Pediátrico 1/3<em class="ok">Libre</em></p></div>
         <div class="eq-mod f"><h4>Femenino</h4><p><i></i>Adultas 4/6<em class="ok">Libre</em></p><p class="riesgo"><i></i>Cabina F‑2<em class="bad">Caída</em></p></div></div>
         <div class="eq-alerta"><b>¡${tituloEv || "Persona en el suelo"}!${prueba}</b><span>Tiempo inmóvil <span data-k="t">00:00</span></span></div>
         <div class="eq-911" data-k="b911"><span data-k="911t">Llamada al 911 en</span> <b data-k="911n">—</b><i data-k="911i"></i></div>${aviso("SOS SOS", "W")}`
      : m === "sismo"
      ? `<div class="eq-top"><b>NODO S.O.S.© · SANITARIOS PLANTA BAJA</b><span>${rec}</span></div>
         <div class="eq-sismo"><b>¡Alerta sísmica! · Salga con calma</b></div>
         <ul class="eq-lista"><li>Puertas de cabinas<em>Liberadas</em></li><li>Luz de evacuación<em>Encendida</em></li><li>Tiempo de alerta<em data-k="t">00:00</em></li></ul>${aviso("SOS SISMO SOS")}`
      : `<div class="eq-top"><b>NODO S.O.S.© · SANITARIOS PLANTA BAJA</b><span>${rec}</span></div>
         <div class="eq-mods"><div class="eq-mod m"><h4>Masculino</h4><p><i></i>Adultos 3/6<em class="ok">Libre</em></p><p><i></i>Pediátrico 1/3<em class="ok">Libre</em></p></div>
         <div class="eq-mod f"><h4>Femenino</h4><p><i></i>Adultas 4/6<em class="ok">Libre</em></p><p><i></i>Cabina F‑2<em class="ok">Libre</em></p></div></div>
         <div class="eq-ok">${st.mon ? "Sin incidentes · sensores del celular activos" : "Sin incidentes · celular sin monitoreo"}</div>${aviso("SOS")}`;
    // 2 · Entrada principal
    const p2 = `<div class="eq-top"><b>NODO S.O.S.© · ENTRADA PRINCIPAL</b><span>Aforo del inmueble · Red <em class="ok">OK</em></span></div>
      <div class="eq-aforo"><b data-k="aforo">27</b><span>${m === "sismo" ? "personas por evacuar de 60" : "personas dentro de 60"}</span><i style="width:45%"></i></div>
      <ul class="eq-lista"><li>R1 Sanitarios<em>${m === "caida" ? "⚠ F‑2" : "9"}</em></li><li>R2 Oficina<em>5</em></li><li>R3 Cocina<em>3</em></li><li>R4 Bodega y taller<em>6</em></li><li>R0 Entrada<em>4</em></li></ul>
      ${m === "normal" ? `<div class="eq-ok">Condición segura · todos los recintos en verde</div>${aviso("SOS")}`
        : m === "aviso" ? `<div class="eq-adv"><b>Aviso en ${rec}</b><span>${tituloEv || "Advertencia"} · N0 voz en el recinto</span></div>${aviso("AVISO")}`
        : m === "caida" ? `<div class="eq-alerta"><b>Alerta en sanitarios${prueba}</b><span data-k="niv">Encargado en camino</span></div>${aviso("SOS SOS", "W")}`
        : `<div class="eq-sismo"><b>Sismo · evacúe por la salida más cercana</b></div>${aviso("SOS SISMO SOS")}`}`;
    // 3 · Sismo · salidas y personas
    const p3 = m === "sismo"
      ? `<div class="eq-sismo"><b>¡Alerta sísmica! · Evacúe${prueba}</b></div>
         <div class="eq-split"><svg viewBox="0 0 100 92" aria-hidden="true"><rect x="3" y="3" width="94" height="72" rx="3" fill="#0c111a" stroke="#6c7a8f"/><rect x="8" y="8" width="34" height="22" fill="#121a26" stroke="#3a4658"/><rect x="58" y="8" width="34" height="22" fill="rgba(255,176,32,.2)" stroke="#ffb020"/><rect x="38" y="50" width="26" height="25" fill="#121a26" stroke="#3a4658"/><polyline points="75,30 75,40 51,40 51,76" fill="none" stroke="#2fd27a" stroke-width="3" stroke-dasharray="5 4" class="eq-ruta"/><rect x="44" y="73" width="14" height="4" fill="#19a65a"/><circle cx="75" cy="30" r="3" fill="#ffb020"/><text x="51" y="88" text-anchor="middle" fill="#2fd27a" font-size="6" font-weight="700" data-k="salida">SALIDA A · 16 m · 14 s</text></svg>
         <div><div class="eq-aqui"><span>Aquí con usted</span><b>8</b></div><ul class="eq-lista mini"><li>R0 Entrada<em>3</em></li><li>R2 Oficina<em>4</em></li><li>R3 Cocina<em>✓</em></li><li>R4 Bodega<em>5</em></li></ul></div></div>${aviso("SOS SISMO SOS")}`
      : `<div class="eq-top"><b>NODO S.O.S.© · RUTA DE EVACUACIÓN</b><span>Se activa con sismo detectado o con la voz «está temblando»</span></div>
         <div class="eq-split"><svg viewBox="0 0 100 92" aria-hidden="true"><rect x="3" y="3" width="94" height="72" rx="3" fill="#0c111a" stroke="#3a4658"/><rect x="8" y="8" width="34" height="22" fill="#121a26" stroke="#2a3342"/><rect x="58" y="8" width="34" height="22" fill="#121a26" stroke="#2a3342"/><rect x="38" y="50" width="26" height="25" fill="#121a26" stroke="#2a3342"/><polyline points="75,30 75,40 51,40 51,76" fill="none" stroke="#2fd27a55" stroke-width="2" stroke-dasharray="5 4"/><rect x="44" y="73" width="14" height="4" fill="#19a65a"/><text x="51" y="88" text-anchor="middle" fill="#8b96a8" font-size="6" font-weight="700">SALIDA A · 16 m</text></svg>
         <div><ul class="eq-lista mini p6-verde"><li>R0 Entrada<em>4</em></li><li>R2 Oficina<em>5</em></li><li>R3 Cocina<em>3</em></li><li>R4 Bodega<em>6</em></li></ul></div></div>
         <div class="eq-ok">Sin alerta sísmica · ruta lista</div>`;
    // 4 · Pantalla exterior (solo enciende con sismo)
    const p4 = m === "sismo"
      ? `<div class="eq-top"><b>PANTALLA EXTERIOR · ACCESO PRINCIPAL</b><span>Se enciende solo con sismo o evento natural</span></div>
         <div class="eq-extmsg"><b>Sismo en curso</b><span>No ingrese al recinto</span></div>
         <div class="eq-aforo ext"><b data-k="dentro">12</b><span>personas siguen dentro</span></div>
         <div class="eq-ok">Siga a Protección Civil · punto de reunión: estacionamiento</div>${aviso("SOS SISMO")}`
      : `<div class="p6-apagada"><b>Pantalla exterior</b><span>Apagada · se enciende solo con sismo o evento natural</span></div>`;
    // 5 · Oficina · permanencia y aforo
    const p5 = `<div class="eq-top"><b>NODO S.O.S.© · OFICINA ADMINISTRATIVA</b><span>Módulo de permanencia y aforo</span></div>
      ${m === "aviso" ? `<div class="eq-adv"><b>Advertencia · ${tituloEv || "aviso"}</b><span>${rec} · revise el recinto</span></div>`
        : m === "caida" ? `<div class="eq-alerta"><b>Alerta en sanitarios${prueba}</b><span>No acuda solo · espere indicaciones</span></div>`
        : m === "sismo" ? `<div class="eq-sismo"><b>Sismo · salga por la salida A</b></div>`
        : `<div class="eq-ok">Aforo normal · 5 de 12 personas</div>`}
      <ul class="eq-lista"><li>Permanencia promedio<em>38 min</em></li><li>Temperatura<em>27 °C</em></li><li>Salida más cercana<em>A · 9 m</em></li></ul>${aviso(m === "normal" ? "SOS" : m === "sismo" ? "SOS SISMO SOS" : m === "caida" ? "SOS SOS" : "AVISO")}`;
    // 6 · Cocina · gas (módulo opcional; el celular no mide gas)
    const p6 = `<div class="eq-top"><b>NODO S.O.S.© · COCINA</b><span>Módulo opcional de gas</span></div>
      ${m === "sismo" ? `<div class="eq-sismo"><b>Sismo · válvula de gas cerrada</b></div>` : `<div class="eq-ok">Gas LP · sin detección (0 % LIE)</div>`}
      <ul class="eq-lista"><li>Válvula de gas<em>${m === "sismo" ? "Cerrada" : "Abierta"}</em></li><li>Personas en cocina<em>2</em></li><li>Aviso<em>${{ normal: "—", aviso: "N0 voz", caida: "N1 encargado", sismo: "Evacuar" }[m]}</em></li></ul>${aviso(m === "sismo" ? "SOS SISMO" : "SOS")}`;
    const LED = { normal: ["g", "g", "g", "", "g", "g"], aviso: ["g", "y", "g", "", "y", "g"], caida: ["r", "r", "g", "", "r", "g"], sismo: ["w", "w", "w", "w", "w", "w"] }[m];
    return [
      pant(m === "caida" ? "caida" : m, p1, pie("PNL-A01", "Sanitarios", LED[0])),
      pant("normal", p2, pie("PNL-E01", "Entrada", LED[1])),
      pant(m === "sismo" ? "sismo" : "normal", p3, pie("PNL-A03", "Sismo", LED[2])),
      pant("exterior", p4, pie("EXT-01", "Exterior", LED[3]), m === "sismo" ? "eq-ext" : "p6-off"),
      pant("advertencia", p5, pie("PNL-A05", "Oficina", LED[4])),
      pant("gas", p6, pie("PNL-A06", "Cocina", LED[5])),
    ].map((h, i) => h.replace('<div class="p6-cara">', `<div class="p6-cara" data-n="${i + 1}" data-m="${m}"><div class="p6-num">${i + 1}/6 · ${NOMBRES[i]}</div>`)).join("");
  }
  let clave = "";
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  // st: { e, rec, mon, alerta:{tipo,titulo,prueba,s,n3}, aviso:{tipo,titulo} }
  function pintar(raiz, st) {
    if (!raiz) return;
    const m = modoDe(st), k = [m, st.rec, st.mon, st.alerta?.id, st.alerta?.prueba, st.aviso?.titulo].join("|");
    if (k !== clave) { clave = k; raiz.innerHTML = armar(st, m); window.SOSBanderas?.pintar(raiz); }
    const s = st.alerta?.s || 0, n3 = st.alerta?.n3 || 10, q = (n) => raiz.querySelectorAll(`[data-k="${n}"]`);
    q("t").forEach((el) => (el.textContent = mmss(s)));
    const falta = Math.max(0, Math.ceil(n3 - s));
    q("911n").forEach((el) => (el.textContent = falta ? `${falta} s` : ""));
    q("911t").forEach((el) => (el.textContent = falta ? "Llamada al 911 en" : st.modo === "real" && !st.alerta?.prueba ? "Llamando al 911 · CAP v1.2" : "N3 alcanzado · modo prueba: sin llamada"));
    q("911i").forEach((el) => (el.style.width = Math.min(100, (s / n3) * 100) + "%"));
    q("b911").forEach((el) => el.classList.toggle("hecha", !falta));
    q("niv").forEach((el) => (el.textContent = st.niv || "Encargado en camino"));
    const ev = Math.max(0, 14 - Math.floor(s));
    q("salida").forEach((el) => (el.textContent = ev ? `SALIDA A · 16 m · ${ev} s` : "SALIDA A · todos en camino"));
    q("dentro").forEach((el) => (el.textContent = Math.max(0, 12 - Math.floor(s / 3))));
  }
  window.SOSPantallas6 = { pintar };
})();
