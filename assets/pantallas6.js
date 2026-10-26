/* SOSistem™ · Las 6 pantallas del Sistema S.O.S.© en la terminal «Pantalla · ver terminal»
   Solo datos reales del celular enlazado: estado, movimiento, vibración, sonido, voz, escalamiento y equipo.
   Nada de aforos ni recintos de demostración. Si el celular no mide algo, la pantalla lo dice («sin dato»).
   © 2026 Víctor Hugo Ramírez Salgado · Sistema S.O.S.© (Safe Creative 2609046908578) */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const morse = (t) => (window.SOSMorse ? SOSMorse.visible(SOSMorse.aMorse(t)) : "");
  const mmss = (s) => s == null ? "—" : String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  const hora = (t) => new Date(t).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const v = (x, u = "") => (x == null || x === "" ? "sin dato" : `${x}${u}`);
  const pie = (id, lugar, led) => `<div class="eq-pie"><span>${id} · ${esc(lugar)}</span><span class="eq-leds">${["r", "y", "g", "w"].map((c) => `<i class="${c}${c === led ? " on" : ""}"></i>`).join("")}</span><span>S.O.S.©</span></div>`;
  const aviso = (txt, ev) => `<div class="eq-morse">${esc(txt)} &nbsp;<span>${morse(txt)}</span></div><div class="eq-band" data-banderas="${esc(txt)}"${ev ? ` data-evento="${ev}"` : ""}></div>`;
  const fila = (k, etiqueta) => `<li>${etiqueta}<em data-k="${k}">—</em></li>`;
  const NOMBRES = ["Recinto", "Escalamiento", "Sismo · vibración", "Pantalla exterior", "Sonido y voz", "Equipo"];

  const modoDe = (st) => st.alerta ? (st.alerta.tipo === "sismo" ? "sismo" : "caida") : (st.aviso || st.e === "advertencia") ? "aviso" : "normal";

  function armar(st, m) {
    const rec = esc(st.rec || "Recinto de prueba"), pr = st.alerta?.prueba ? " · PRUEBA" : "", tit = esc(st.alerta?.titulo || st.aviso?.titulo || "");
    const banda = { normal: `<div class="eq-ok" data-k="okmsg">Sin incidentes</div>`, aviso: `<div class="eq-adv"><b>${tit || "Aviso"}</b><span>Aviso por voz en el recinto (N0)</span></div>`,
      caida: `<div class="eq-alerta"><b>¡${tit || "Alerta"}!${pr}</b><span>Tiempo de alerta <span data-k="t">00:00</span></span></div>`,
      sismo: `<div class="eq-sismo"><b>¡Alerta sísmica! · Evacúe${pr}</b></div>` }[m];
    // 1 · Recinto: estado y movimiento real del celular
    const p1 = `<div class="eq-top"><b>NODO S.O.S.© · ${rec.toUpperCase()}</b><span data-k="desde">—</span></div>${banda}
      ${m === "caida" ? `<div class="eq-911" data-k="b911"><span data-k="911t">Llamada al 911 en</span> <b data-k="911n">—</b><i data-k="911i"></i></div>` : ""}
      <div class="p6-plano" data-k="plano"></div>
      <ul class="eq-lista">${fila("quieto", "Sin movimiento")}${fila("g", "Aceleración")}${fila("inc", "Inclinación")}${m === "caida" ? fila("pico", "Impacto registrado") : fila("giro", "Giro")}</ul>
      ${aviso({ normal: "SOS", aviso: "AVISO", caida: "SOS SOS", sismo: "SOS SISMO SOS" }[m], m === "caida" ? "W" : "")}`;
    // 2 · Escalamiento real N0–N3 del evento en curso o del último
    const p2 = `<div class="eq-top"><b>NODO S.O.S.© · ESCALAMIENTO</b><span>Tiempos reales del celular</span></div>
      <ul class="eq-lista p6-esc" data-k="esc"></ul>
      <ul class="eq-lista">${fila("hoy", "Eventos hoy")}${fila("ultimo", "Último evento")}${fila("resp", "Atendido en")}</ul>`;
    // 3 · Sismo: vibración real (STA/LTA del acelerómetro) y voz «está temblando»
    const p3 = `${m === "sismo" ? `<div class="eq-sismo"><b>¡Alerta sísmica! · Evacúe${pr}</b></div>` : `<div class="eq-top"><b>NODO S.O.S.© · SISMO</b><span>Acelerómetro del celular + voz «está temblando»</span></div>`}
      ${m === "sismo" ? `<div class="eq-aforo"><b data-k="t2">00:00</b><span data-k="origen">desde la detección</span></div>` : ""}
      <ul class="eq-lista">${fila("sta", "Vibración STA/LTA")}${fila("rms", "Intensidad (RMS)")}${fila("detsis", "Detector de vibración")}${fila("vozsis", "Voz «está temblando»")}</ul>
      ${m === "sismo" ? aviso("SOS SISMO SOS") : `<div class="eq-ok" data-k="sisok">Sin vibración tipo sismo</div>`}`;
    // 4 · Exterior: solo se enciende con sismo
    const p4 = m === "sismo"
      ? `<div class="eq-top"><b>PANTALLA EXTERIOR · ${rec.toUpperCase()}</b><span>Se enciende solo con sismo o evento natural</span></div>
         <div class="eq-extmsg"><b>Sismo en curso</b><span>No ingrese al recinto</span></div>
         <div class="eq-aforo ext"><b data-k="t3">00:00</b><span>tiempo desde la alerta</span></div>
         <div class="eq-ok">Siga a Protección Civil</div>${aviso("SOS SISMO")}`
      : `<div class="p6-apagada"><b>Pantalla exterior</b><span>Apagada · se enciende solo con sismo o evento natural</span></div>`;
    // 5 · Sonido y voz reales
    const p5 = `<div class="eq-top"><b>NODO S.O.S.© · SONIDO Y VOZ</b><span>Solo nivel de sonido; no se graba audio</span></div>
      <div class="eq-aforo"><b data-k="db">—</b><span data-k="dbu">dB aprox.</span><i data-k="dbbar" style="width:0"></i></div>
      ${m === "aviso" ? `<div class="eq-adv"><b>${tit || "Aviso"}</b><span>Detectado por el celular</span></div>` : ""}
      <ul class="eq-lista">${fila("voz", "Reconocimiento de voz")}${fila("frase", "Última frase oída")}</ul>`;
    // 6 · Equipo: el celular que está midiendo
    const p6 = `<div class="eq-top"><b>NODO S.O.S.© · EQUIPO</b><span data-k="equipo">—</span></div>
      <ul class="eq-lista">${fila("bat", "Batería")}${fila("red", "Red")}${fila("pmov", "Movimiento")}${fila("pmic", "Micrófono")}${fila("pwake", "Pantalla encendida")}${fila("ubic", "Ubicación")}</ul>`;
    const L = { normal: ["g", "g", "g", "", "g", "g"], aviso: ["y", "y", "g", "", "y", "g"], caida: ["r", "r", "g", "", "g", "g"], sismo: ["w", "w", "w", "w", "w", "g"] }[m];
    const caras = [
      [m, p1, pie("PNL-A01", "Recinto", L[0])], ["normal", p2, pie("PNL-E01", "Escalamiento", L[1])], [m === "sismo" ? "sismo" : "normal", p3, pie("PNL-A03", "Sismo", L[2])],
      ["exterior", p4, pie("EXT-01", "Exterior", L[3]), m === "sismo" ? "eq-ext" : "p6-off"], ["normal", p5, pie("PNL-A05", "Sonido", L[4])], ["normal", p6, pie("PNL-A06", "Equipo", L[5])]];
    return caras.map(([fase, c, p, extra = ""], i) => `<div class="p6-cara" data-n="${i + 1}" data-m="${m}"><div class="p6-num">${i + 1}/6 · ${NOMBRES[i]}</div><div class="eq-bisel"><div class="eq-pant ${extra}" data-fase="${fase}">${c}</div>${p}</div></div>`).join("");
  }

  let clave = "";
  // st: foto del celular { e, rec, mon, modo, niv, esc:[{n,ms,c}], alerta:{tipo,titulo,prueba,id,s,n3,datos}, aviso:{tipo,titulo}, r:{lecturas reales} }
  function pintar(raiz, st) {
    if (!raiz) return;
    const m = modoDe(st), k = [m, st.rec, st.alerta?.id, st.alerta?.prueba, st.aviso?.titulo].join("|");
    if (k !== clave) { clave = k; raiz.innerHTML = armar(st, m); window.SOSBanderas?.pintar(raiz); }
    const r = st.r || {}, a = st.alerta, s = a?.s || 0, n3 = a?.n3 || 10;
    const set = (n, txt) => raiz.querySelectorAll(`[data-k="${n}"]`).forEach((el) => (el.textContent = txt));
    // Recinto
    set("desde", r.desde ? `Monitoreo desde ${hora(r.desde)}` : st.mon === false ? "Celular sin monitoreo" : "Esperando al celular");
    set("okmsg", st.mon ? "Sin incidentes · sensores activos" : "Celular sin monitoreo · toca «Iniciar» en el iPhone");
    set("quieto", r.quieto_s != null ? mmss(r.quieto_s) : "sin dato"); set("g", v(r.g, " g")); set("inc", v(r.inc, "°")); set("giro", v(r.giro, " °/s"));
    set("pico", a?.datos?.pico_g ? `${a.datos.pico_g} g` : a?.datos?.origen === "voz" ? "por voz" : "sin dato");
    ["t", "t2", "t3"].forEach((x) => set(x, mmss(s)));
    const falta = Math.max(0, Math.ceil(n3 - s));
    set("911n", falta ? `${falta} s` : ""); set("911t", falta ? "Llamada al 911 en" : st.modo === "real" && !a?.prueba ? "Llamando al 911 · CAP v1.2" : "N3 alcanzado · modo prueba: sin llamada");
    raiz.querySelectorAll('[data-k="911i"]').forEach((el) => (el.style.width = Math.min(100, (s / n3) * 100) + "%"));
    raiz.querySelectorAll('[data-k="b911"]').forEach((el) => el.classList.toggle("hecha", !falta));
    // Plano del recinto medido caminando con el celular (polígono promedio)
    raiz.querySelectorAll('[data-k="plano"]').forEach((el) => {
      const mp = r.mapa; if (!mp?.poligono?.length) { el.innerHTML = ""; return; }
      const xs = mp.poligono.map((q) => q[0]), ys = mp.poligono.map((q) => q[1]), mx = Math.min(...xs), my = Math.min(...ys), w = Math.max(...xs) - mx || 1, h = Math.max(...ys) - my || 1;
      const pts = mp.poligono.map(([x, y]) => `${(((x - mx) / w) * 90 + 5).toFixed(1)},${(95 - ((y - my) / h) * 50).toFixed(1)}`).join(" ");
      const k = `${mp.area}|${mp.recorridos}`; if (el.dataset.v === k) return; el.dataset.v = k;
      el.innerHTML = `<svg viewBox="0 40 100 60" aria-hidden="true"><polygon points="${pts}" fill="rgba(47,210,122,.12)" stroke="#2fd27a" stroke-width="1.2"/></svg><span>${mp.area} m² · ${mp.largo} × ${mp.ancho} m · ${mp.recorridos} recorrido(s)</span>`;
    });
    // Escalamiento
    raiz.querySelectorAll('[data-k="esc"]').forEach((el) => (el.innerHTML = (st.esc || []).map((i) => `<li class="${esc(i.c)}">${esc(i.n)}<em>${i.ms != null ? (i.ms / 1000).toFixed(1) + " s" : "—"}</em></li>`).join("")));
    set("hoy", r.hoy != null ? `${r.hoy}${r.falsas ? ` · ${r.falsas} falsas` : ""}` : "sin dato");
    set("ultimo", r.ultimo ? `${r.ultimo.titulo}${r.ultimo.prueba ? " (prueba)" : ""} · ${hora(r.ultimo.t)}` : "ninguno");
    set("resp", r.ultimo?.resp != null ? `${r.ultimo.resp} s` : "—");
    // Sismo
    set("sta", r.sis ? `${r.sis.ratio} (umbral ${r.sis.umbral})` : "sin dato"); set("rms", r.sis ? `${r.sis.rms} m/s²` : "sin dato");
    set("detsis", r.det ? (r.det.sismo ? "activo" : "apagado") : "sin dato"); set("vozsis", r.voz_sismo ? (r.voz === "escuchando" ? "escuchando" : "activa") : "apagada");
    set("origen", a?.datos?.origen === "voz" ? `activado por voz: «${a.datos.frase || ""}»` : "detectado por el acelerómetro");
    set("sisok", r.sis && r.sis.ratio > r.sis.umbral ? "Vibración por encima del umbral · confirmando" : "Sin vibración tipo sismo");
    // Sonido y voz
    set("db", r.db != null ? r.db : "—"); set("dbu", r.db != null ? `dB aprox. · aviso desde ${r.ruido_db} dB` : "micrófono sin datos");
    raiz.querySelectorAll('[data-k="dbbar"]').forEach((el) => { el.style.width = r.db != null ? Math.min(100, Math.max(0, (r.db - 30) / 90 * 100)) + "%" : "0"; el.style.background = r.db >= r.ruido_db ? "#ffb020" : "#2fd27a"; });
    set("voz", r.voz || "sin dato"); set("frase", r.frase ? `«${r.frase.x}» · ${hora(r.frase.t)}` : "ninguna");
    // Equipo
    set("equipo", r.equipo || "—"); set("bat", r.bat ? `${r.bat.n} %${r.bat.c ? " · cargando" : ""}` : "iPhone no comparte");
    set("red", r.red || "sin dato"); const pm = (x) => ({ granted: "concedido", denied: "denegado", prompt: "por permitir", default: "por permitir" }[x] || x || "sin dato");
    set("pmov", pm(r.perm?.mov)); set("pmic", pm(r.perm?.mic)); set("pwake", pm(r.perm?.wake));
    set("ubic", r.ubic ? `${r.ubic.lat}, ${r.ubic.lon} ±${r.ubic.prec} m` : "no leída");
  }
  window.SOSPantallas6 = { pintar };
})();
