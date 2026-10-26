/* SOSistem™ Terminal de pruebas · © 2026 Víctor Hugo Ramírez Salgado · Sistema S.O.S.© (Safe Creative 2609046908578)
   El celular funciona como una terminal del Sistema S.O.S.©: lee sus sensores, detecta eventos (caída, vibración tipo sismo,
   ruido fuerte, palabra «S.O.S.», sin movimiento prolongado, botón manual), escala por niveles N0–N3 como la pantalla física
   y guarda cada evento con hora al milisegundo para sacar estadísticas (tiempos, % de falsas alarmas).
   Todo se procesa en el celular. Solo sale información si el titular la exporta o la envía a su repositorio privado de GitHub.
   REGLA DE SONIDO: el Morse solo suena en alerta, desastre natural o prueba (morse.js lo valida). */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const VERSION = "4.1";
  const G = 9.80665;
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const horaMs = (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`; };
  const fechaHora = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${horaMs(t)}`; };
  let toastT = 0;
  function toast(m, ms = 2600) { const el = $("toast"); el.textContent = m; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), ms); }

  // ---------- Ajustes ----------
  const DEF = { recinto: "Oficinas ContenedorEns · prueba", id: "T-" + Math.random().toString(36).slice(2, 6).toUpperCase(), modo: "prueba",
    wa: "526462270490", impacto_g: 2.5, quietud_s: 2, sismo_sens: 3, ruido_db: 85, mic_offset: 0, inmovil_min: 0,
    voz: false, sonido: true, vibrar: true, repetir: true, voz_ok: true, pausa_s: 3, sirena_prueba_s: 6, repo: "victorhugoramirezsalgado-boop/sistema-sos", token: "", auto: false,
    det: { caida: true, sismo: true, ruido: true, voz: false, inmovil: false } };
  const A = Object.assign({}, DEF, LS.get("sost_ajustes", {}));
  A.det = Object.assign({}, DEF.det, A.det || {});
  if (!LS.get("sost_ajustes", null)) LS.set("sost_ajustes", A);
  const guardarAjustes = () => LS.set("sost_ajustes", A);
  let TIEMPOS = { N0: 2, N1: 4, N2: 7, N3: 10 };
  // Perfiles de alarma por estado (los mismos del panel de administrador: datos/config.json → alertas)
  let PERFILES = {
    caida: { sirena: true, rafaga_s: 20, morse: true, texto: "SOS SOS", volumen: 100, patron: "fsk", tope_min: 10, sirena_db: 105, db_tras_tope: 95 },
    sismo: { sirena: true, rafaga_s: 60, morse: true, texto: "SOS SISMO SOS", volumen: 100, patron: "t3", tope_min: 10, sirena_db: 105, db_tras_tope: 95 },
    advertencia: { sirena: false, rafaga_s: 0, morse: true, texto: "AVISO", volumen: 60, patron: "pulsos", tope_min: 10, sirena_db: 85, db_tras_tope: 85 },
    prueba: { sirena: true, rafaga_s: 3, morse: true, texto: "PRUEBA SOS", volumen: 50, patron: "t3", tope_min: 1, sirena_db: 85, db_tras_tope: 85 } };
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    if (c.tiempos) TIEMPOS = c.tiempos;
    if (c.alertas) for (const k of Object.keys(PERFILES)) if (c.alertas[k]) PERFILES[k] = Object.assign({}, PERFILES[k], c.alertas[k]);
    log("sis", `Perfiles de alarma cargados del panel · N0 ${TIEMPOS.N0} s, N1 ${TIEMPOS.N1} s, N2 ${TIEMPOS.N2} s, N3 ${TIEMPOS.N3} s`);
  }).catch(() => log("sis", "Sin conexión al panel: se usan perfiles de alarma internos"));
  // iPhone: que el sonido salga aunque el interruptor de silencio esté activado (Safari 17+)
  try { if (navigator.audioSession) navigator.audioSession.type = "play-and-record"; } catch (e) {}

  // ---------- Consola de la terminal de información ----------
  const CONSOLA = []; let consolaPausa = false, consolaPend = false;
  function log(clase, texto, t = Date.now()) {
    CONSOLA.unshift({ t, c: clase, x: texto }); if (CONSOLA.length > 400) CONSOLA.pop();
    if (window.__enlCola) window.__enlCola.push([t, clase, texto]);
    if (!consolaPend) { consolaPend = true; requestAnimationFrame(pintarConsola); }
  }
  function pintarConsola() {
    consolaPend = false; const el = document.getElementById("consola"); if (!el || consolaPausa) return;
    el.innerHTML = CONSOLA.slice(0, 200).map((l) => `<li class="c-${l.c}"><time>${horaMs(l.t)}</time><span>${esc(l.x)}</span></li>`).join("");
  }

  // ---------- Base de datos local (IndexedDB) ----------
  let idb = null;
  const abrir = () => new Promise((ok) => {
    if (!("indexedDB" in window)) return ok(null);
    const r = indexedDB.open("sosistem-terminal", 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("eventos", { keyPath: "id" }); d.createObjectStore("minutos", { keyPath: "t" }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => ok(null);
  });
  const tx = (st, modo, fn) => new Promise((ok) => {
    if (!idb) return ok(null);
    try { const t = idb.transaction(st, modo), s = t.objectStore(st), res = fn(s); t.oncomplete = () => ok(res && res.result !== undefined ? res.result : null); t.onerror = () => ok(null); } catch (e) { ok(null); }
  });
  const todos = (st) => new Promise((ok) => { if (!idb) return ok([]); try { const r = idb.transaction(st).objectStore(st).getAll(); r.onsuccess = () => ok(r.result || []); r.onerror = () => ok([]); } catch (e) { ok([]); } });
  let EVENTOS = [];
  async function guardarEvento(ev) { const i = EVENTOS.findIndex((x) => x.id === ev.id); if (i >= 0) EVENTOS[i] = ev; else EVENTOS.push(ev); await tx("eventos", "readwrite", (s) => s.put(ev)); pintarEventos(); }

  // ---------- Estado del sensor ----------
  const S = { mov: null, rot: null, ori: null, db: null, luz: null, bat: null, red: null, ubic: null, perm: {} };
  const BUF = { acc: [], mic: [] };          // series para gráficas
  let monitoreando = false, wakeLock = null, audio = null, reconocedor = null;
  const MIN = { t: 0, n: 0, accMax: 0, accSum: 0, dbMax: -Infinity, dbSum: 0, nd: 0, eventos: 0 };

  // ---------- Detectores ----------
  const DETS = [
    ["caida", "Caída de persona", "Caída libre + impacto + quietud"],
    ["sismo", "Vibración tipo sismo", "Celular quieto sobre una superficie"],
    ["ruido", "Ruido fuerte o grito", "Nivel de sonido sostenido"],
    ["voz", "Palabra «S.O.S.» / «auxilio»", "Reconocimiento de voz del navegador"],
    ["inmovil", "Sin movimiento prolongado", "Tiempo configurable en Ajustes"],
  ];
  function pintarDetectores() {
    $("detectores").innerHTML = DETS.map(([k, n, d]) => `<label><span>${esc(n)}<small>${esc(d)}</small></span><input class="t-sw" type="checkbox" data-det="${k}" ${A.det[k] ? "checked" : ""}></label>`).join("");
  }
  $("detectores").addEventListener("change", (e) => {
    const k = e.target.dataset.det; if (!k) return; A.det[k] = e.target.checked; guardarAjustes();
    if (k === "voz") { A.voz = e.target.checked; guardarAjustes(); asegurarVoz(); }
  });

  // Caída: |a| < 0.45 g durante ≥ 60 ms → impacto > umbral en ≤ 1.2 s → quietud (desv. < 0.6 m/s²) durante quietud_s
  const CA = { libreDesde: 0, libreOk: 0, impacto: 0, pico: 0, ventana: [] };
  // Sismo: STA/LTA sobre |a| filtrada (sin gravedad) con el celular quieto
  const SI = { media: G, sta: 0, lta: 0.0004, desde: 0, ultimo: 0, pico: 0 };
  const RU = { desde: 0, ultimo: 0, pico: 0 };
  let ultimoMov = Date.now();

  function procesarMovimiento(e) {
    const t = performance.now(), ahora = Date.now();
    const g = e.accelerationIncludingGravity || {}, a = e.acceleration || {}, r = e.rotationRate || {};
    if (g.x == null && a.x == null) return;
    const gx = +g.x || 0, gy = +g.y || 0, gz = +g.z || 0, mag = Math.hypot(gx, gy, gz);
    S.mov = { gx, gy, gz, ax: +a.x || 0, ay: +a.y || 0, az: +a.z || 0, mag, int: e.interval };
    S.rot = { a: +r.alpha || 0, b: +r.beta || 0, g: +r.gamma || 0 };
    BUF.acc.push(mag); if (BUF.acc.length > 300) BUF.acc.shift(); if (window.__enlAcc) window.__enlAcc.push(+mag.toFixed(2));
    MIN.n++; MIN.accSum += mag; if (mag > MIN.accMax) MIN.accMax = mag;
    const rotMag = Math.hypot(S.rot.a, S.rot.b, S.rot.g);
    if (Math.abs(mag - G) > 0.8 || rotMag > 25) ultimoMov = ahora;
    if (!monitoreando || ALERTA.activa) return;

    // --- Caída ---
    if (A.det.caida) {
      if (mag < 0.45 * G) { if (!CA.libreDesde) CA.libreDesde = t; if (t - CA.libreDesde >= 60) { if (!CA.libreOk || t - CA.libreOk > 500) log("det", `Caída libre detectada (|a| ${(mag / G).toFixed(2)} g)`); CA.libreOk = t; } }
      else CA.libreDesde = 0;
      const umbral = A.impacto_g * G;
      if (!CA.impacto && mag > umbral && (CA.libreOk && t - CA.libreOk < 1200 || mag > umbral * 1.4)) { CA.impacto = t; CA.pico = mag; CA.ventana = []; CA.libre = !!CA.libreOk; log("det", `Impacto ${(mag / G).toFixed(2)} g${CA.libre ? " tras caída libre" : " sin caída libre"} · esperando quietud ${A.quietud_s} s`); }
      if (CA.impacto) {
        if (mag > CA.pico && t - CA.impacto < 400) CA.pico = mag;
        if (t - CA.impacto > 400) CA.ventana.push(mag);
        if (t - CA.impacto > 400 + A.quietud_s * 1000) {
          const v = CA.ventana, m = v.reduce((s, x) => s + x, 0) / (v.length || 1), sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length || 1));
          if (!(v.length > 5 && sd < 0.6)) log("det", `Impacto descartado: hubo movimiento después (desv. ${sd.toFixed(2)} m/s² ≥ 0.6)`);
          if (v.length > 5 && sd < 0.6) disparar("caida", { pico_g: +(CA.pico / G).toFixed(2), caida_libre: CA.libre, quietud_desv: +sd.toFixed(3), confianza: CA.libre ? "alta" : "media" }, CA.impacto);
          CA.impacto = 0; CA.libreOk = 0;
        }
      }
    }
    // --- Vibración tipo sismo ---
    if (A.det.sismo) {
      SI.media += (mag - SI.media) * 0.01;
      const x2 = (mag - SI.media) ** 2;
      // STA ≈ 0.5 s y LTA ≈ 30 s; la LTA se congela mientras dura el disparo (práctica usual en sismología)
      SI.sta += (x2 - SI.sta) * 0.035; if (!SI.desde) SI.lta += (x2 - SI.lta) * 0.0006;
      const ratio = SI.sta / Math.max(SI.lta, 0.00005), rms = Math.sqrt(SI.sta);
      const umbralR = 2 + A.sismo_sens * 0.5, umbralRms = 0.015 * A.sismo_sens;
      const quieto = rotMag < 6;   // el celular debe estar apoyado, no en la mano
      if (ratio > umbralR && rms > umbralRms && rms < 3 && quieto) { if (!SI.desde) { SI.desde = t; SI.pico = 0; log("det", `Vibración: STA/LTA ${ratio.toFixed(1)}, ${rms.toFixed(3)} m/s² · confirmando 2 s`); } SI.pico = Math.max(SI.pico, rms); }
      else if (SI.desde) SI.desde = 0;
      if (SI.desde && t - SI.desde > 2000 && ahora - SI.ultimo > 30000) {
        SI.ultimo = ahora; disparar("sismo", { rms_ms2: +SI.pico.toFixed(3), sta_lta: +ratio.toFixed(1), aviso: "Referencia de prueba; no es un sismógrafo calibrado" }, SI.desde); SI.desde = 0;
      }
    }
    // --- Sin movimiento prolongado ---
    if (A.det.inmovil && A.inmovil_min > 0 && ahora - ultimoMov > A.inmovil_min * 60000) { ultimoMov = ahora; disparar("inmovil", { minutos: A.inmovil_min }); }
  }
  function procesarOrientacion(e) { S.ori = { a: e.alpha, b: e.beta, g: e.gamma, abs: e.absolute, rumbo: e.webkitCompassHeading }; }

  // ---------- Micrófono: solo nivel de sonido, sin grabar ----------
  async function iniciarMic() {
    if (!navigator.mediaDevices?.getUserMedia) { S.perm.mic = "no disponible"; return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
      const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC(), src = ctx.createMediaStreamSource(st), an = ctx.createAnalyser();
      an.fftSize = 2048; src.connect(an); const buf = new Float32Array(an.fftSize);
      audio = { st, ctx, an, buf, id: setInterval(() => {
        an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const dbfs = 20 * Math.log10(Math.sqrt(s / buf.length) || 1e-8), db = Math.max(20, Math.min(130, dbfs + 94 + (+A.mic_offset || 0)));
        S.db = db; BUF.mic.push(db); if (BUF.mic.length > 300) BUF.mic.shift(); if (window.__enlMic) window.__enlMic.push(Math.round(db));
        MIN.dbSum += db; MIN.nd++; if (db > MIN.dbMax) MIN.dbMax = db;
        if (monitoreando && A.det.ruido && !ALERTA.activa && !ALERTA.sonandoAviso) {
          const t = performance.now();
          if (window.SOSMorse?.sonando()) { RU.desde = 0; } // la propia alarma no cuenta como ruido
          else if (db >= A.ruido_db) { if (!RU.desde) { RU.desde = t; RU.pico = 0; log("det", `Ruido ${Math.round(db)} dB ≥ ${A.ruido_db} dB · confirmando 1.5 s`); } RU.pico = Math.max(RU.pico, db); } else if (RU.desde && t - RU.desde < 1500) RU.desde = 0;
          if (RU.desde && t - RU.desde >= 1500 && Date.now() - RU.ultimo > 30000) { RU.ultimo = Date.now(); disparar("ruido", { pico_db: Math.round(RU.pico), umbral_db: A.ruido_db, nota: "dB aproximados; calibra con un sonómetro" }, RU.desde, "advertencia"); RU.desde = 0; }
        }
      }, 100) };
      if (ctx.state === "suspended") ctx.resume();
      S.perm.mic = "concedido";
    } catch (e) { S.perm.mic = e.name === "NotAllowedError" ? "denegado" : "error"; }
  }
  function detenerMic() { if (!audio) return; clearInterval(audio.id); audio.st.getTracks().forEach((t) => t.stop()); try { audio.ctx.close(); } catch (e) {} audio = null; S.db = null; }

  // ---------- Reconocimiento de voz: «S.O.S.» para alertar y «todo bien» para detener la alarma ----------
  const RE_SOS = /\b(s\.?\s?o\.?\s?s|ese o ese|auxilio|ayuda|socorro|help)\b/;
  const RE_OK = /\b(todo (esta |está )?bien|estoy bien|todo en orden|todo ok|all good|i'?m ok)\b/;
  const vozNecesaria = () => (monitoreando && A.det.voz) || (ALERTA.activa && A.voz_ok);
  // En iPhone el reconocimiento de voz y la medición de dB compiten por el micrófono: durante la alarma se pausa la medición
  function asegurarVoz() {
    if (ALERTA.activa && A.voz_ok && audio) { detenerMic(); log("sis", "Medición de dB en pausa para escuchar «todo bien»"); }
    if (!ALERTA.activa && monitoreando && !audio && S.perm.mic === "concedido") iniciarMic();
    if (vozNecesaria()) { if (!reconocedor) iniciarVoz(); } else if (reconocedor) detenerVoz();
  }
  function iniciarVoz() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (S.perm.voz !== "no disponible") log("voz", "Este navegador no ofrece reconocimiento de voz: usa el botón verde"); S.perm.voz = "no disponible"; return; }
    try {
      reconocedor = new SR(); reconocedor.lang = "es-MX"; reconocedor.continuous = true; reconocedor.interimResults = true;
      reconocedor.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const txt = e.results[i][0].transcript.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (!txt) continue;
          if (e.results[i].isFinal) log("voz", `Oído: «${txt.slice(0, 70)}»`);
          if (ALERTA.activa && A.voz_ok && RE_OK.test(txt)) { log("ok", `Voz «${txt.match(RE_OK)[0]}» → detener alarma`); atender("voz"); return; }
          if (!ALERTA.activa && monitoreando && A.det.voz && RE_SOS.test(txt)) disparar("voz", { frase: txt.slice(0, 60) });
        }
      };
      reconocedor.onend = () => { if (reconocedor && vozNecesaria()) { try { reconocedor.start(); } catch (e) {} } else reconocedor = null; };
      reconocedor.onerror = (e) => { S.perm.voz = e.error; if (e.error !== "no-speech" && e.error !== "aborted") log("voz", `Reconocimiento de voz: ${e.error}`); };
      reconocedor.start(); S.perm.voz = "escuchando"; log("voz", ALERTA.activa ? "Escuchando «todo bien»…" : "Escuchando «S.O.S.» / «auxilio»…");
    } catch (e) { S.perm.voz = "error"; }
  }
  function detenerVoz() { if (reconocedor) { const r = reconocedor; reconocedor = null; try { r.stop(); } catch (e) {} } S.perm.voz = "apagado"; }

  // ---------- Inicio / paro del monitoreo (un solo toque concede todo) ----------
  async function iniciar() {
    // iOS exige pedir permiso dentro del toque
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") S.perm.mov = await DeviceMotionEvent.requestPermission();
      else S.perm.mov = typeof DeviceMotionEvent !== "undefined" ? "concedido" : "no disponible";
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") S.perm.ori = await DeviceOrientationEvent.requestPermission();
      else S.perm.ori = typeof DeviceOrientationEvent !== "undefined" ? "concedido" : "no disponible";
    } catch (e) { S.perm.mov = S.perm.mov || "error"; }
    if (S.perm.mov === "granted") S.perm.mov = "concedido"; if (S.perm.ori === "granted") S.perm.ori = "concedido";
    // desbloquea el audio para que la alerta pueda sonar después (volumen casi nulo)
    if (A.sonido && window.SOSMorse) SOSMorse.reproducir("E", null, { motivo: "prueba-admin", volumen: 0.01, vibrar: false });
    addEventListener("devicemotion", procesarMovimiento);
    addEventListener("deviceorientation", procesarOrientacion);
    await iniciarMic();   // nivel de sonido en vivo (también alimenta el detector de ruido)
    try { wakeLock = await navigator.wakeLock?.request("screen"); S.perm.wake = wakeLock ? "activo" : "no disponible"; } catch (e) { S.perm.wake = "no disponible"; }
    monitoreando = true; asegurarVoz(); ultimoMov = Date.now(); LS.set("sost_monitor", true);
    log("sis", `Monitoreo iniciado · movimiento: ${S.perm.mov} · micrófono: ${S.perm.mic} · pantalla: ${S.perm.wake}`);
    estado("monitoreo"); $("btn-iniciar").textContent = "Detener monitoreo"; $("btn-iniciar").classList.remove("pri");
    setTimeout(() => { if (monitoreando && !S.mov) toast("No llegan lecturas de movimiento: revisa el permiso «Movimiento y orientación» en Ajustes de Safari.", 5000); }, 2500);
    registrarSistema("inicio", { modo: A.modo });
  }
  function detener() {
    monitoreando = false; LS.set("sost_monitor", false);
    removeEventListener("devicemotion", procesarMovimiento); removeEventListener("deviceorientation", procesarOrientacion);
    detenerMic(); asegurarVoz(); log("sis", "Monitoreo detenido"); try { wakeLock?.release(); } catch (e) {} wakeLock = null;
    estado("detenido"); $("btn-iniciar").textContent = "Iniciar monitoreo"; $("btn-iniciar").classList.add("pri");
    registrarSistema("paro", {});
  }
  $("btn-iniciar").onclick = () => { if (document.body.classList.contains("rol-pantalla")) return; monitoreando ? detener() : iniciar(); };
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && monitoreando && !wakeLock) { try { wakeLock = await navigator.wakeLock?.request("screen"); } catch (e) {} }
    if (document.visibilityState === "hidden" && monitoreando) registrarSistema("segundo-plano", { nota: "Con la pantalla bloqueada el navegador pausa los sensores" });
  });

  // ---------- Alertas y escalamiento N0–N3 ----------
  const TIPOS = { caida: ["Persona en el suelo", "✕", "alerta"], sismo: ["Vibración tipo sismo", "≋", "alerta"], ruido: ["Ruido fuerte", "!", "advertencia"],
    voz: ["Palabra de auxilio detectada", "S", "alerta"], inmovil: ["Sin movimiento prolongado", "…", "advertencia"], manual: ["Alerta manual S.O.S.", "S", "alerta"] };
  const NIV = [["N0", "aviso por voz y Morse en el recinto"], ["N1", "encargado notificado"], ["N2", "central de monitoreo"], ["N3", "911 / C5"]];
  const ALERTA = { activa: false, ev: null, timer: 0, t0: 0 };
  let ultimoDisparo = 0;

  function disparar(tipo, datos = {}, tDeteccionPerf = null, nivelForzado = null, prueba = false) {
    const ahora = Date.now();
    if (ALERTA.activa || ahora - ultimoDisparo < 3000) return;
    ultimoDisparo = ahora;
    const [titulo, , sev] = TIPOS[tipo] || ["Evento", "!", "alerta"];
    const retraso = tDeteccionPerf ? Math.max(0, Math.round(performance.now() - tDeteccionPerf)) : 0;
    const ev = { id: `${A.id}-${ahora}`, tipo, titulo, severidad: nivelForzado || sev, prueba, modo: A.modo, terminal: A.id, recinto: A.recinto,
      inicio: ahora, inicio_iso: new Date(ahora).toISOString(), deteccion_ms: retraso, datos, nivel_max: null, atendido: null, respuesta_s: null,
      calificacion: null, enviado: false, ubicacion: S.ubic ? { lat: S.ubic.lat, lon: S.ubic.lon, prec_m: S.ubic.prec } : null,
      equipo: plataformaCorta() };
    MIN.eventos++;
    guardarEvento(ev);
    log(ev.severidad === "advertencia" ? "det" : "alerta", `${ev.prueba ? "PRUEBA · " : ""}${titulo}${retraso ? ` · confirmada en ${retraso} ms` : ""}${detalleEv(ev) ? " · " + detalleEv(ev) : ""}`);
    if (ev.severidad === "advertencia") { mostrarAdvertencia(ev); return; }
    ALERTA.activa = true; ALERTA.ev = ev; ALERTA.t0 = ahora; ALERTA.ciclos = 0;
    estado("alerta", ev);
    $("btn-atender").hidden = false; $("btn-wa").hidden = false; $("btn-wa").href = enlaceWA(ev);
    if (A.vibrar && navigator.vibrate) try { navigator.vibrate([400, 200, 400, 200, 800]); } catch (e) {}
    $("pt-voz").hidden = !A.voz_ok; asegurarVoz();
    document.querySelector(".pane-a")?.scrollTo({ top: 0, behavior: "smooth" });   // la pantalla de alerta siempre a la vista
    cicloAlarma();
    clearInterval(ALERTA.timer);
    ALERTA.timer = setInterval(tickAlerta, 250); tickAlerta();
  }
  function tickAlerta() {
    if (!ALERTA.activa) return;
    const s = (Date.now() - ALERTA.t0) / 1000, ev = ALERTA.ev;
    const n = s >= TIEMPOS.N3 ? 3 : s >= TIEMPOS.N2 ? 2 : s >= TIEMPOS.N1 ? 1 : s >= TIEMPOS.N0 ? 0 : -1;
    const el = $("pt-nivel"); el.hidden = false;
    el.textContent = n < 0 ? `Confirmando… ${s.toFixed(1)} s` : `${NIV[n][0]} · ${NIV[n][1]} · ${s.toFixed(0)} s`;
    if (n > (ev.nivel_max ?? -1)) {
      ev.nivel_max = n; ev["t_" + NIV[n][0]] = Math.round(s * 1000);
      log("alerta", `${NIV[n][0]} a los ${s.toFixed(1)} s · ${NIV[n][1]}`);
      if (n === 3) { $("btn-911").hidden = A.modo !== "real" || ev.prueba; if (A.modo !== "real" || ev.prueba) $("pt-detalle").textContent = "N3 alcanzado. Modo prueba: no se llama al 911."; }
      guardarEvento(ev);
    }
    pintarEscala();
  }
  function atender(origen = "botón") {
    if (!ALERTA.activa) return;
    const ev = ALERTA.ev; clearInterval(ALERTA.timer); clearTimeout(ALERTA.ciclo); window.SOSMorse?.detener();
    ev.atendido = Date.now(); ev.respuesta_s = +((ev.atendido - ev.inicio) / 1000).toFixed(2); ev.atendido_por = origen; ev.ciclos_alarma = ALERTA.ciclos;
    ALERTA.activa = false; ALERTA.ev = null; ALERTA.ultimo = ev;
    log("ok", `Alarma detenida por ${origen === "voz" ? "voz («todo bien»)" : origen} a los ${ev.respuesta_s} s · ${ALERTA.ciclos} ciclo(s) de sirena y Morse`);
    sonidoActual(null); $("pt-voz").hidden = true; asegurarVoz(); pintarEscala();
    $("btn-atender").hidden = true; $("btn-911").hidden = true; $("btn-wa").hidden = true; $("pt-nivel").hidden = true;
    estado(monitoreando ? "monitoreo" : "detenido");
    guardarEvento(ev).then(() => { if (A.auto && A.token) sincronizar(true); });
    toast(`${origen === "voz" ? "«Todo bien» oído" : "Alerta atendida"}: ${ev.respuesta_s} s. Califícala en Eventos.`);
  }
  $("btn-atender").onclick = () => { if (document.body.classList.contains("rol-pantalla")) { window.__enlOrden?.("atender"); return; } atender("botón"); };
  function mostrarAdvertencia(ev) {
    estado("advertencia", ev);
    const dur = sonarPerfil("advertencia", ev.prueba ? "prueba-admin" : "advertencia", ev.prueba);
    ALERTA.sonandoAviso = true;
    setTimeout(() => { ALERTA.sonandoAviso = false; if (!ALERTA.activa) { estado(monitoreando ? "monitoreo" : "detenido"); sonidoActual(null); } }, Math.max(6000, (dur + 1) * 1000));
  }
  const perfilDe = (tipo) => ({ caida: "caida", manual: "caida", voz: "caida", sismo: "sismo", ruido: "advertencia", inmovil: "advertencia" }[tipo] || "caida");
  // Reproduce sirena (patrón normalizado) + código Morse del perfil; devuelve la duración en segundos
  function sonarPerfil(clave, motivo, prueba) {
    const P = PERFILES[clave] || PERFILES.caida;
    if (!A.sonido || !window.SOSMorse) { sonidoActual(`Sonido apagado en Ajustes · perfil ${clave}`); return 0; }
    let sir = P.sirena ? +P.rafaga_s || 0 : 0;
    if (prueba && sir) sir = Math.min(sir, +A.sirena_prueba_s || 6);
    // NOM-011-STPS-2001: después de tope_min minutos baja del nivel máximo
    const minutos = ALERTA.activa ? (Date.now() - ALERTA.t0) / 60000 : 0;
    let vol = Math.max(0.05, Math.min(1, (+P.volumen || 100) / 100));
    if (P.tope_min && minutos > P.tope_min && P.sirena_db) vol *= Math.pow(10, ((+P.db_tras_tope || P.sirena_db) - P.sirena_db) / 20);
    const texto = P.morse ? P.texto || "SOS" : "";
    const m = SOSMorse.aMorse(texto); $("pt-morse").textContent = texto ? SOSMorse.visible(m) : "";
    const pat = (SOSMorse.patrones || {})[P.patron] || P.patron;
    const dur = SOSMorse.reproducir(texto, $("pantalla"), { motivo, vibrar: A.vibrar, volumen: vol, sirenaSeg: sir, sirenaVolumen: vol, patron: P.patron,
      alTerminar: () => { if (!ALERTA.activa && !ALERTA.sonandoAviso) { $("pt-morse").textContent = ""; sonidoActual(null); } } }) || 0;
    const desc = `${sir ? `Sirena ${pat} ${sir} s` : "Sin sirena"}${texto ? ` + Morse «${texto}» ${SOSMorse.visible(m)}` : ""} · vol ${Math.round(vol * 100)} %${prueba ? " · prueba" : ""}`;
    sonidoActual(desc); log("sonido", desc);
    return dur;
  }
  // Ciclo de alarma: sirena + Morse; se repite (con una pausa para escuchar «todo bien») hasta que alguien atienda
  function cicloAlarma() {
    if (!ALERTA.activa) return;
    const ev = ALERTA.ev; ALERTA.ciclos++;
    const dur = sonarPerfil(perfilDe(ev.tipo), ev.prueba ? "prueba-admin" : ev.tipo === "sismo" ? "desastre" : "emergencia", ev.prueba);
    if (A.repetir) {
      const espera = Math.max(2, dur + (+A.pausa_s || 3));
      ALERTA.ciclo = setTimeout(() => { if (ALERTA.activa) { log("voz", `Pausa de ${A.pausa_s} s para escuchar «todo bien» · ciclo ${ALERTA.ciclos + 1}`); cicloAlarma(); } }, espera * 1000);
    }
  }
  function sonidoActual(t) { const el = $("sonando"); if (!el) return; el.textContent = t ? "🔊 " + t : "Sin sonido"; el.classList.toggle("on", !!t); }
  // Escalamiento: Detección → N0 → N1 → N2 → N3 → Atendida
  function escalaDatos() {
    const ev = ALERTA.activa ? ALERTA.ev : ALERTA.ultimo, act = ALERTA.activa;
    const paso = (n, ms, ok, actual, fin) => ({ n, ms, c: fin ? "fin" : actual ? "act" : ok ? "ok" : "" });
    if (!ev) return ["Detec.", "N0", "N1", "N2", "N3", "Atendida"].map((n) => paso(n, null));
    const nm = ev.nivel_max ?? -1;
    return [paso("Detec.", ev.deteccion_ms || 0, true, act && nm < 0), ...NIV.map(([n], i) => paso(n, ev["t_" + n] ?? null, nm >= i, act && nm === i)),
      paso(ev.atendido_por === "voz" ? "Todo bien" : "Atendida", ev.respuesta_s != null ? ev.respuesta_s * 1000 : null, !!ev.atendido, false, !!ev.atendido)];
  }
  function pintarEscala(items) {
    const el = $("escala"); if (!el) return;
    if (!items && document.body.classList.contains("rol-pantalla")) return;   // en la Mac lo pinta el celular remoto
    el.innerHTML = (items || escalaDatos()).map((i) => `<li class="${esc(i.c)}">${esc(i.n)}<small>${i.ms != null ? (i.ms / 1000).toFixed(1) + " s" : "—"}</small></li>`).join("");
  }
  function enlaceWA(ev) {
    const u = ev.ubicacion ? ` https://maps.google.com/?q=${ev.ubicacion.lat},${ev.ubicacion.lon}` : "";
    const msg = `${ev.prueba || A.modo === "prueba" ? "[PRUEBA] " : ""}SOSistem ${ev.terminal}: ${ev.titulo} en ${ev.recinto} a las ${horaMs(ev.inicio).slice(0, 8)}.${u}`;
    return `https://wa.me/${String(A.wa).replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  }

  // ---------- Pantalla y estado ----------
  function estado(e, ev = null) {
    const p = $("pantalla"); p.dataset.e = e; $("estado-pill").dataset.e = e;
    const T = { detenido: ["DETENIDO", "✓", "Monitoreo detenido", "Toca «Iniciar monitoreo» para activar los sensores de este celular."],
      monitoreo: ["MONITOREO", "✓", "Recinto en orden", "Sensores activos. Deja el celular en el lugar de prueba."],
      advertencia: ["AVISO", "!", ev?.titulo || "Advertencia", detalleEv(ev)], alerta: ["ALERTA", (TIPOS[ev?.tipo] || [])[1] || "S", ev?.titulo || "Alerta", detalleEv(ev)] }[e];
    $("estado-pill").textContent = T[0]; $("pt-icono").textContent = T[1]; $("pt-titulo").textContent = T[2]; $("pt-detalle").textContent = T[3];
    if (e !== "alerta") $("pt-morse").textContent = "";
    window.__enlCambio?.();
  }
  function detalleEv(ev) { if (!ev) return ""; const d = ev.datos || {};
    return [ev.recinto, d.pico_g ? `impacto ${d.pico_g} g` : "", d.pico_db ? `${d.pico_db} dB` : "", d.frase ? `«${d.frase}»` : "", ev.prueba ? "PRUEBA" : ""].filter(Boolean).join(" · "); }
  function pintarCabecera() { $("pt-recinto").textContent = A.recinto; $("pt-id").textContent = A.id; $("pt-modo").textContent = A.modo === "real" ? "MODO REAL" : "MODO PRUEBA"; }
  setInterval(() => { $("pt-hora").textContent = horaMs(Date.now()).slice(0, 8); }, 500);

  // ---------- Botón S.O.S. (mantener 2 s) ----------
  let sosT = 0, sosRaf = 0;
  const sosAbajo = (e) => { e.preventDefault(); const t0 = performance.now();
    const paso = () => { const p = Math.min(1, (performance.now() - t0) / 2000); $("sos-carga").style.height = p * 100 + "%"; if (p >= 1) { sosArriba(); if (document.body.classList.contains("rol-pantalla")) window.__enlOrden?.("manual"); else disparar("manual", { origen: "botón" }, null, null, A.modo === "prueba"); } else sosRaf = requestAnimationFrame(paso); };
    sosRaf = requestAnimationFrame(paso); };
  const sosArriba = () => { cancelAnimationFrame(sosRaf); $("sos-carga").style.height = "0"; };
  const sb = $("btn-sos"); sb.addEventListener("pointerdown", sosAbajo); ["pointerup", "pointerleave", "pointercancel"].forEach((n) => sb.addEventListener(n, sosArriba));
  sb.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- Escenarios de prueba (preajustes) ----------
  const ESC = {
    bano_bolsa: { recinto: "Sanitario · prueba VHRS (celular en la bolsa)", det: { caida: true, sismo: false, ruido: true, voz: true, inmovil: true }, impacto_g: 2.3, quietud_s: 2, ruido_db: 92, inmovil_min: 5,
      nota: "Lleva el celular en la bolsa del pantalón o en la mano. Detecta tu caída (impacto + quietud), la palabra «auxilio» y si dejas de moverte 5 min." },
    bano_repisa: { recinto: "Sanitario · prueba VHRS (celular en repisa)", det: { caida: false, sismo: true, ruido: true, voz: true, inmovil: false }, sismo_sens: 2, ruido_db: 92,
      nota: "Deja el celular apoyado en una repisa o el lavabo. Detecta golpes fuertes en el piso o la pared (vibración), ruido fuerte y la palabra «auxilio»." },
    oficina: { recinto: "Oficinas ContenedorEns · prueba", det: { caida: true, sismo: true, ruido: true, voz: false, inmovil: false }, impacto_g: 2.5, quietud_s: 2, sismo_sens: 3, ruido_db: 85, inmovil_min: 0,
      nota: "Escritorio: caída del celular, vibración tipo sismo y ruido fuerte." } };
  document.querySelectorAll("[data-esc]").forEach((b) => b.onclick = () => {
    const e = ESC[b.dataset.esc]; if (!e) return;
    if (document.body.classList.contains("rol-pantalla")) { window.__enlOrden?.("esc:" + b.dataset.esc); document.querySelectorAll("[data-esc]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); $("esc-nota").textContent = "Escenario enviado al celular: " + e.nota; return; }
    const { nota, det, ...resto } = e; Object.assign(A, resto, { modo: "prueba", sonido: true, repetir: true, voz_ok: true }); A.det = Object.assign({}, A.det, det); A.voz = A.det.voz;
    guardarAjustes(); pintarCabecera(); pintarDetectores();
    document.querySelectorAll("[data-esc]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("esc-nota").textContent = nota; log("sis", `Escenario: ${A.recinto} · detectores ${Object.entries(A.det).filter(([, v]) => v).map(([k]) => k).join(", ")}`);
    if (monitoreando) asegurarVoz(); toast("Escenario listo. Toca «Iniciar monitoreo».");
  });

  // ---------- Pruebas guiadas (con la alarma real del perfil) ----------
  document.querySelectorAll("[data-prueba]").forEach((b) => b.onclick = () => {
    const k = b.dataset.prueba;
    if (document.body.classList.contains("rol-pantalla")) { window.__enlOrden?.(k); return; }
    if (k === "detener") { if (ALERTA.activa) atender("botón"); window.SOSMorse?.detener(); sonidoActual(null); log("sis", "Sonido silenciado"); return; }
    if (k === "sonido") { const old = A.sonido; A.sonido = true; sonarPerfil("prueba", "prueba-admin", true); A.sonido = old; return; }
    if (k === "caida") disparar("caida", { pico_g: 3.1, caida_libre: true, simulada: true }, null, null, true);
    if (k === "sismo") disparar("sismo", { rms_ms2: 0.2, simulada: true }, null, null, true);
    if (k === "manual") disparar("manual", { origen: "prueba", simulada: true }, null, null, true);
    if (k === "ruido") disparar("ruido", { pico_db: 96, simulada: true }, null, "advertencia", true);
  });

  // ---------- Registro de sistema y resumen por minuto ----------
  function registrarSistema(tipo, datos) { const ahora = Date.now(); tx("minutos", "readwrite", (s) => s.put({ t: ahora, sistema: tipo, ...datos })); }
  setInterval(() => {
    if (!monitoreando || !MIN.n) return;
    const t = Math.floor(Date.now() / 60000) * 60000;
    const r = { t, terminal: A.id, muestras: MIN.n, acc_media: +(MIN.accSum / MIN.n).toFixed(3), acc_max: +MIN.accMax.toFixed(3),
      db_medio: MIN.nd ? Math.round(MIN.dbSum / MIN.nd) : null, db_max: MIN.nd ? Math.round(MIN.dbMax) : null, eventos: MIN.eventos, bateria: S.bat?.nivel ?? null };
    tx("minutos", "readwrite", (s) => s.put(r));
    Object.assign(MIN, { n: 0, accMax: 0, accSum: 0, dbMax: -Infinity, dbSum: 0, nd: 0, eventos: 0 });
  }, 60000);

  // ---------- Gráficas en vivo ----------
  function linea(id, datos, min, max, color, umbral) {
    const c = $(id); if (!c || !c.offsetWidth) return;
    const dpr = devicePixelRatio || 1, w = c.offsetWidth, h = c.offsetHeight;
    if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
    const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    if (umbral != null) { const y = h - ((umbral - min) / (max - min)) * h; x.strokeStyle = "#e8a33d88"; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); x.setLineDash([]); }
    if (datos.length < 2) return;
    x.strokeStyle = color; x.lineWidth = 1.6; x.beginPath();
    datos.forEach((v, i) => { const px = (i / 299) * w, py = h - ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * h; i ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.stroke();
  }
  function cuadro() {
    if (document.querySelector("#v-monitor[data-activa=true]")) {
      const rem = window.__enlRemoto?.();
      linea("g-acc", BUF.acc, 0, 40, "#4f8fd6", rem ? rem.umb[0] : A.impacto_g * G); linea("g-mic", BUF.mic, 30, 120, "#3fbf7f", rem ? rem.umb[1] : A.ruido_db);
      if (rem) { $("g-acc-v").textContent = rem.acc ?? "—"; $("g-mic-v").textContent = rem.db ?? "—"; }
      else { $("g-acc-v").textContent = S.mov ? S.mov.mag.toFixed(2) : "—"; $("g-mic-v").textContent = S.db != null ? Math.round(S.db) : "—"; pintarLecturas(); }
    }
    if (document.querySelector("#v-sensores[data-activa=true]")) pintarSensores();
    requestAnimationFrame(cuadro);
  }

  // ---------- Lecturas rápidas de la terminal de información ----------
  let ultLect = 0;
  function pintarLecturas() {
    if (performance.now() - ultLect < 120) return; ultLect = performance.now();
    const r = S.rot ? Math.hypot(S.rot.a, S.rot.b, S.rot.g) : null;
    $("l-acc").textContent = S.mov ? `${(S.mov.mag / G).toFixed(2)} g` : "—";
    $("l-rot").textContent = r != null ? `${r.toFixed(0)} °/s` : "—";
    $("l-inc").textContent = S.ori && S.ori.b != null ? `${(+S.ori.b).toFixed(0)}°` : "—";
    $("l-db").textContent = S.db != null ? `${Math.round(S.db)} dB` : "—";
    $("l-est").textContent = $("estado-pill").textContent;
    $("l-voz").textContent = reconocedor ? (ALERTA.activa ? "«todo bien»" : "escucha") : "apagada";
    $("vivo").classList.toggle("off", !monitoreando); $("vivo").textContent = monitoreando ? "● EN VIVO" : "○ DETENIDO";
  }
  setInterval(() => { if (monitoreando && $("c-seg")?.checked) log("seg", `|a| ${S.mov ? (S.mov.mag / G).toFixed(2) : "—"} g · giro ${S.rot ? Math.hypot(S.rot.a, S.rot.b, S.rot.g).toFixed(0) : "—"} °/s · ${S.db != null ? Math.round(S.db) : "—"} dB`); }, 1000);
  $("c-pausa").onclick = (e) => { consolaPausa = !consolaPausa; e.target.textContent = consolaPausa ? "Seguir" : "Pausar"; if (!consolaPausa) pintarConsola(); };
  $("c-limpiar").onclick = () => { CONSOLA.length = 0; pintarConsola(); };

  // ---------- Pantalla dividida ----------
  function medirSplit() {
    const top = document.querySelector(".t-top")?.offsetHeight || 56, nav = $("nav")?.offsetHeight || 64;
    document.documentElement.style.setProperty("--alto-split", `${innerHeight - top - nav}px`);
  }
  function aplicarDivision() {
    const on = A.dividida !== false; $("split").dataset.dividida = String(on);
    document.body.classList.toggle("dividida", on);
    const b = $("btn-dividir"); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "Pantalla dividida ✓" : "Pantalla dividida";
    medirSplit();
  }
  $("btn-dividir").onclick = () => { A.dividida = A.dividida === false; guardarAjustes(); aplicarDivision(); };
  addEventListener("resize", medirSplit, { passive: true }); addEventListener("orientationchange", () => setTimeout(medirSplit, 250));

  // ---------- Vista Sensores ----------
  const f2 = (v) => (v == null || isNaN(v) ? "—" : (+v).toFixed(2));
  let ultSens = 0;
  function pintarSensores() {
    if (performance.now() - ultSens < 150) return; ultSens = performance.now();
    const st = (v) => !v ? ["pendiente", ""] : /concedido|activo|escuchando|ok/.test(v) ? [v, "ok"] : /deneg|error|no disp/.test(v) ? [v, "no"] : [v, ""];
    const tarjeta = (n, p, v) => { const [t, c] = st(p); return `<div class="t-sen"><h3>${n}<span class="st ${c}">${esc(t)}</span></h3><div class="vv">${v}</div></div>`; };
    const m = S.mov, r = S.rot, o = S.ori;
    $("sensores").innerHTML = [
      tarjeta("Acelerómetro", S.perm.mov, m ? `x ${f2(m.gx)}  y ${f2(m.gy)}  z ${f2(m.gz)}\n|a| ${f2(m.mag)} m/s² (${f2(m.mag / G)} g)\nsin gravedad: ${f2(Math.hypot(m.ax, m.ay, m.az))}\nintervalo ${m.int ?? "—"} ms` : "Sin lecturas"),
      tarjeta("Giroscopio", S.perm.mov, r ? `α ${f2(r.a)}  β ${f2(r.b)}  γ ${f2(r.g)} °/s` : "Sin lecturas"),
      tarjeta("Orientación", S.perm.ori, o ? `inclinación ${f2(o.b)}°  giro ${f2(o.g)}°\nα ${f2(o.a)}°${o.rumbo != null ? `\nbrújula ${f2(o.rumbo)}°` : ""}` : "Sin lecturas"),
      tarjeta("Micrófono", S.perm.mic, S.db != null ? `${Math.round(S.db)} dB aprox.\n(solo nivel; no se graba)` : "Inactivo"),
      tarjeta("Voz «S.O.S.»", S.perm.voz, A.det.voz ? "Activo en Detectores" : "Apagado"),
      tarjeta("Pantalla encendida", S.perm.wake, wakeLock ? "La pantalla no se apaga mientras monitorea" : "Sin bloqueo de pantalla"),
      tarjeta("Batería", S.bat ? "ok" : "no disponible", S.bat ? `${Math.round(S.bat.nivel * 100)} %${S.bat.carga ? " · cargando" : ""}` : "iPhone no comparte este dato"),
      tarjeta("Red", navigator.onLine ? "ok" : "sin conexión", S.red ? `${S.red.tipo || ""} ${S.red.efectivo || ""}\n↓ ${S.red.mbps ?? "—"} Mb/s · ${S.red.rtt ?? "—"} ms` : navigator.onLine ? "En línea" : "Sin conexión"),
      tarjeta("Luz ambiente", S.luz != null ? "ok" : "no disponible", S.luz != null ? `${Math.round(S.luz)} lux` : "No disponible en este navegador"),
    ].join("");
  }
  $("btn-ubic").onclick = () => {
    if (!navigator.geolocation) { $("ubic").textContent = "Este navegador no ofrece ubicación."; return; }
    $("ubic").textContent = "Leyendo…";
    navigator.geolocation.getCurrentPosition((p) => { S.ubic = { lat: +p.coords.latitude.toFixed(6), lon: +p.coords.longitude.toFixed(6), prec: Math.round(p.coords.accuracy), alt: p.coords.altitude };
      $("ubic").textContent = `lat ${S.ubic.lat}, lon ${S.ubic.lon}\nprecisión ±${S.ubic.prec} m${S.ubic.alt != null ? `\naltitud ${Math.round(S.ubic.alt)} m` : ""}`; S.perm.ubic = "concedido"; },
      (e) => { $("ubic").textContent = "No se pudo leer: " + e.message; S.perm.ubic = "denegado"; }, { enableHighAccuracy: true, timeout: 15000 });
  };
  // Batería, red y luz (donde existan)
  navigator.getBattery?.().then((b) => { const u = () => (S.bat = { nivel: b.level, carga: b.charging }); u(); b.onlevelchange = u; b.onchargingchange = u; }).catch(() => {});
  const cn = navigator.connection; if (cn) { const u = () => (S.red = { tipo: cn.type, efectivo: cn.effectiveType, mbps: cn.downlink, rtt: cn.rtt }); u(); cn.onchange = u; }
  try { if ("AmbientLightSensor" in window) { const l = new AmbientLightSensor(); l.onreading = () => (S.luz = l.illuminance); l.start(); } } catch (e) {}

  // ---------- Vista Eventos y estadísticas ----------
  let filtro = "";
  $("filtro").innerHTML = '<option value="">Todos</option>' + Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${esc(v[0])}</option>`).join("");
  $("filtro").onchange = (e) => { filtro = e.target.value; pintarEventos(); };
  function pintarEventos() {
    const ev = EVENTOS.slice().sort((a, b) => b.inicio - a.inicio);
    const cal = ev.filter((e) => e.calificacion), falsas = cal.filter((e) => e.calificacion === "falsa").length;
    const resp = ev.filter((e) => e.respuesta_s != null), prom = resp.length ? resp.reduce((s, e) => s + e.respuesta_s, 0) / resp.length : null;
    const det = ev.filter((e) => e.deteccion_ms), promDet = det.length ? det.reduce((s, e) => s + e.deteccion_ms, 0) / det.length : null;
    const hoy = new Date().toDateString(), nHoy = ev.filter((e) => new Date(e.inicio).toDateString() === hoy).length;
    $("kpis").innerHTML = [
      ["Eventos", ev.length, `${nHoy} hoy`], ["% falsas alarmas", cal.length ? Math.round(falsas / cal.length * 100) + " %" : "—", `${cal.length} calificados`],
      ["Respuesta media", prom != null ? prom.toFixed(1) + " s" : "—", "de la alerta a «Estoy bien»"], ["Confirmación media", promDet != null ? (promDet / 1000).toFixed(1) + " s" : "—", "del impacto a la alerta"],
    ].map(([k, v, s]) => `<div class="t-kpi"><span>${k}</span><b>${v}</b><small>${s}</small></div>`).join("");
    const pend = ev.filter((e) => !e.enviado).length; $("nav-n").textContent = ev.filter((e) => !e.calificacion && !e.prueba).length || "";
    const ls = ev.filter((e) => !filtro || e.tipo === filtro).slice(0, 150);
    $("eventos").innerHTML = ls.length ? ls.map((e) => {
      const d = Object.entries(e.datos || {}).filter(([k]) => k !== "simulada").map(([k, v]) => `${k}: ${v}`).join(" · ");
      return `<li><div class="cab"><span class="tp ${e.prueba ? "prueba" : ""}">${esc(e.titulo)}</span><time>${esc(fechaHora(e.inicio))}</time></div>
        <div class="dt">${esc(e.recinto)} · ${esc(e.terminal)}${e.nivel_max != null && e.nivel_max >= 0 ? ` · nivel ${NIV[e.nivel_max][0]}` : ""}${e.respuesta_s != null ? ` · atendido en ${e.respuesta_s} s` : ""}${e.deteccion_ms ? ` · confirmación ${e.deteccion_ms} ms` : ""}</div>
        ${d ? `<div class="dt">${esc(d)}</div>` : ""}
        <div class="bt"><button type="button" class="v" data-cal="valido" data-id="${esc(e.id)}" aria-pressed="${e.calificacion === "valido"}">Válido</button><button type="button" class="f" data-cal="falsa" data-id="${esc(e.id)}" aria-pressed="${e.calificacion === "falsa"}">Falsa alarma</button>${e.enviado ? '<span class="sub">enviado a GitHub</span>' : ""}</div></li>`;
    }).join("") : '<li class="dt">Sin eventos todavía. Inicia el monitoreo o usa una prueba guiada.</li>';
    $("sync-estado").textContent = (LS.get("sost_sync", null) ? `Último envío: ${LS.get("sost_sync")}\n` : "Sin envíos.\n") + `${pend} evento(s) pendientes de enviar.`;
    barrasHoras(ev);
  }
  $("eventos").addEventListener("click", (e) => { const b = e.target.closest("[data-cal]"); if (!b) return; const ev = EVENTOS.find((x) => x.id === b.dataset.id); if (!ev) return;
    ev.calificacion = ev.calificacion === b.dataset.cal ? null : b.dataset.cal; ev.enviado = false; guardarEvento(ev); });
  function barrasHoras(ev) {
    const c = $("g-horas"); if (!c.offsetWidth) return; const dpr = devicePixelRatio || 1, w = c.offsetWidth, h = 110;
    c.width = w * dpr; c.height = h * dpr; const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ahora = Date.now(), cub = Array(24).fill(0).map(() => [0, 0]);
    ev.forEach((e) => { const i = 23 - Math.floor((ahora - e.inicio) / 3600000); if (i >= 0 && i < 24) cub[i][e.prueba ? 1 : 0]++; });
    const max = Math.max(1, ...cub.map((b) => b[0] + b[1])), bw = w / 24;
    x.fillStyle = "#7c879b"; x.font = "10px ui-monospace,monospace";
    cub.forEach(([r, p], i) => { const hr = (r / max) * (h - 18), hp = (p / max) * (h - 18);
      x.fillStyle = "#e0243e"; x.fillRect(i * bw + 2, h - 14 - hr, bw - 4, hr); x.fillStyle = "#4f8fd6"; x.fillRect(i * bw + 2, h - 14 - hr - hp, bw - 4, hp);
      if (i % 6 === 0) { x.fillStyle = "#7c879b"; x.fillText(`-${24 - i}h`, i * bw + 2, h - 2); } });
    x.fillStyle = "#aab4c5"; x.fillText("rojo: real · azul: prueba", w - 140, 10);
  }

  // ---------- Exportar ----------
  function descargar(nombre, texto, tipo) { const b = new Blob([texto], { type: tipo }), u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); }
  const COLS = ["id", "inicio_iso", "tipo", "titulo", "severidad", "prueba", "modo", "terminal", "recinto", "deteccion_ms", "nivel_max", "t_N0", "t_N1", "t_N2", "t_N3", "respuesta_s", "calificacion", "datos", "ubicacion", "equipo"];
  $("btn-csv").onclick = () => {
    const cel = (v) => { const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    descargar(`sosistem_${A.id}_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + COLS.join(",") + "\n" + EVENTOS.map((e) => COLS.map((c) => cel(e[c])).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  async function paquete(soloPendientes) {
    const mins = await todos("minutos"), ultimo = LS.get("sost_sync_t", 0);
    return { sistema: "SOSistem™ Terminal de pruebas", version: VERSION, autor: "© Víctor Hugo Ramírez Salgado", terminal: A.id, recinto: A.recinto, modo: A.modo,
      generado: new Date().toISOString(), plataforma: plataformaCompleta(), tiempos_escalamiento_s: TIEMPOS,
      umbrales: { impacto_g: A.impacto_g, quietud_s: A.quietud_s, sismo_sens: A.sismo_sens, ruido_db: A.ruido_db, mic_offset: A.mic_offset },
      eventos: EVENTOS.filter((e) => !soloPendientes || !e.enviado), minutos: mins.filter((m) => !soloPendientes || m.t > ultimo) };
  }
  $("btn-json").onclick = async () => descargar(`sosistem_${A.id}_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await paquete(false), null, 2), "application/json");

  // ---------- Envío a GitHub privado (API de contenidos) ----------
  async function sincronizar(silencioso) {
    if (!A.token || !/^[\w.-]+\/[\w.-]+$/.test(A.repo)) { if (!silencioso) { toast("Configura el repositorio y el token en Ajustes."); vista("ajustes"); } return; }
    if (!navigator.onLine) { if (!silencioso) toast("Sin conexión: se enviará después."); return; }
    const p = await paquete(true);
    if (!p.eventos.length && !p.minutos.length) { if (!silencioso) toast("No hay datos nuevos para enviar."); return; }
    const d = new Date(), ruta = `pruebas/terminal/${d.toISOString().slice(0, 10)}/${A.id}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
    const bytes = new TextEncoder().encode(JSON.stringify(p, null, 2)); let bin = "";
    for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    const b64 = btoa(bin);
    $("sync-estado").textContent = "Enviando…";
    try {
      const r = await fetch(`https://api.github.com/repos/${A.repo}/contents/${ruta}`, { method: "PUT",
        headers: { Authorization: `Bearer ${A.token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Terminal ${A.id}: ${p.eventos.length} evento(s), ${p.minutos.length} minuto(s) de lecturas`, content: b64 }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(`${r.status} ${j.message || ""}`); }
      for (const e of p.eventos) { e.enviado = true; await tx("eventos", "readwrite", (s) => s.put(e)); }
      LS.set("sost_sync", `${fechaHora(Date.now())} → ${A.repo}/${ruta}`); LS.set("sost_sync_t", Date.now());
      pintarEventos(); if (!silencioso) toast("Enviado a tu repositorio privado.");
    } catch (e) {
      $("sync-estado").textContent = "No se pudo enviar: " + e.message + (String(e.message).startsWith("401") ? "\nRevisa el token." : String(e.message).startsWith("404") ? "\nEl token no tiene acceso a ese repositorio." : "");
    }
  }
  $("btn-sync").onclick = () => sincronizar(false);
  addEventListener("online", () => { if (A.auto && A.token) sincronizar(true); });

  // ---------- Plataforma ----------
  const ua = navigator.userAgent;
  const so = /iphone|ipod/i.test(ua) ? "iOS" : /ipad/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "iPadOS" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows" : /mac/i.test(ua) ? "macOS" : "Otro";
  const verSO = (ua.match(/OS (\d+[_.]\d+)/) || ua.match(/Android (\d+(\.\d+)?)/) || [])[1]?.replace("_", ".") || "";
  const nav = /CriOS|Chrome/.test(ua) ? "Chrome" : /FxiOS|Firefox/.test(ua) ? "Firefox" : /EdgiOS|Edg/.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Safari/.test(ua) ? "Safari" : "Otro";
  const instalada = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  function plataformaCorta() { return `${so} ${verSO} · ${nav} · ${screen.width}×${screen.height}@${devicePixelRatio}x`; }
  function plataformaCompleta() {
    return { so, version_so: verSO, navegador: nav, agente: ua, idioma: navigator.language, zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pantalla: `${screen.width}×${screen.height} @${devicePixelRatio}x`, ventana: `${innerWidth}×${innerHeight}`, nucleos: navigator.hardwareConcurrency || null,
      memoria_gb: navigator.deviceMemory || null, tactil: navigator.maxTouchPoints, app_instalada: instalada(), seguro: isSecureContext };
  }
  const CAPS = () => [
    ["Movimiento (acelerómetro y giroscopio)", "DeviceMotionEvent" in window], ["Orientación", "DeviceOrientationEvent" in window],
    ["Micrófono (nivel de sonido)", !!navigator.mediaDevices?.getUserMedia], ["Reconocimiento de voz", !!(window.SpeechRecognition || window.webkitSpeechRecognition)],
    ["Ubicación GPS", "geolocation" in navigator], ["Mantener pantalla encendida", "wakeLock" in navigator], ["Vibración", "vibrate" in navigator],
    ["Batería", "getBattery" in navigator], ["Estado de red", "connection" in navigator], ["Sensor de luz", "AmbientLightSensor" in window],
    ["Funciona sin internet (service worker)", "serviceWorker" in navigator], ["Base de datos local", "indexedDB" in window],
    ["Notificaciones", "Notification" in window], ["Instalada como app", instalada()], ["Conexión segura (HTTPS)", isSecureContext],
  ];
  function pintarPlataforma() {
    const p = plataformaCompleta();
    const filas = [["Sistema", `${p.so} ${p.version_so}`], ["Navegador", p.navegador], ["Pantalla", p.pantalla], ["Ventana", p.ventana], ["Núcleos", p.nucleos ?? "—"],
      ["Memoria", p.memoria_gb ? `${p.memoria_gb} GB` : "no disponible"], ["Idioma", p.idioma], ["Zona horaria", p.zona], ["Puntos táctiles", p.tactil],
      ["App instalada", p.app_instalada ? "sí" : "no"], ["Terminal", `${A.id} · ${A.recinto}`], ["Versión", `SOSistem™ ${VERSION}`]];
    $("plat-equipo").innerHTML = filas.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
    $("plat-cap").innerHTML = CAPS().map(([n, ok]) => `<li class="${ok ? "" : "no"}">${esc(n)}</li>`).join("");
    navigator.storage?.estimate?.().then((e) => { $("plat-equipo").insertAdjacentHTML("beforeend", `<dt>Almacenamiento</dt><dd>${(e.usage / 1048576).toFixed(1)} MB usados de ${(e.quota / 1073741824).toFixed(1)} GB</dd>`); }).catch(() => {});
  }
  $("btn-informe").onclick = async () => {
    const txt = JSON.stringify({ plataforma: plataformaCompleta(), capacidades: Object.fromEntries(CAPS()), permisos: S.perm }, null, 2);
    try { await navigator.clipboard.writeText(txt); toast("Informe copiado."); } catch (e) { descargar("sosistem_plataforma.json", txt, "application/json"); }
  };
  let instalador = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); instalador = e; $("btn-instalar").hidden = false; });
  $("btn-instalar").onclick = async () => { if (!instalador) return; instalador.prompt(); await instalador.userChoice; instalador = null; $("btn-instalar").hidden = true; };

  // ---------- Ajustes ----------
  const F = $("f-ajustes");
  function llenarAjustes() { [...F.elements].forEach((el) => { if (!el.name) return; if (el.type === "checkbox") el.checked = !!A[el.name]; else el.value = A[el.name] ?? ""; }); }
  F.onsubmit = (e) => { e.preventDefault();
    [...F.elements].forEach((el) => { if (!el.name) return; A[el.name] = el.type === "checkbox" ? el.checked : el.type === "number" ? +el.value : el.value.trim(); });
    A.id = (A.id || DEF.id).replace(/[^\w-]/g, "").slice(0, 20) || DEF.id; A.det.voz = A.voz;
    guardarAjustes(); pintarCabecera(); pintarDetectores(); toast("Ajustes guardados."); };
  $("btn-borrar").onclick = async () => { if (!confirm("¿Borrar todos los eventos y lecturas guardados en este celular? Lo enviado a GitHub no se borra.")) return;
    await tx("eventos", "readwrite", (s) => s.clear()); await tx("minutos", "readwrite", (s) => s.clear()); EVENTOS = []; pintarEventos(); toast("Datos locales borrados."); };

  // ---------- Navegación ----------
  function vista(v) {
    document.querySelectorAll(".t-vista").forEach((s) => (s.dataset.activa = String(s.id === "v-" + v)));
    document.body.classList.toggle("vista-monitor", v === "monitor");
    document.querySelectorAll("#nav button").forEach((b) => b.setAttribute("aria-current", b.dataset.v === v ? "page" : "false"));
    if (v === "eventos") pintarEventos(); if (v === "plataforma") pintarPlataforma(); if (v === "ajustes") llenarAjustes();
    scrollTo({ top: 0 }); try { history.replaceState(null, "", "#" + v); } catch (e) {}
  }
  $("nav").addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (b) vista(b.dataset.v); });

  // ---------- Enlace: el celular mide (sensores) y otra pantalla — la Mac — ve la terminal en vivo ----------
  // Conexión directa cifrada (WebRTC, DTLS) entre los dos equipos. Para encontrarse usan un relevo público (ntfy.sh)
  // por el que solo pasan mensajes cifrados con AES-256-GCM; la clave sale del código de 6 letras (los 6 lados del cubo)
  // y nunca viaja. Si la conexión directa no abre (redes muy cerradas), los datos siguen por el relevo cada 15 s.
  const RELEVO = window.SOS_RELEVO || "https://ntfy.sh/";
  const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }] };
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // sin I ni O para no confundirlas con 1 y 0
  const ROLES = { solo: "Todo ocurre en este equipo. Elige «Celular · sensores» en el iPhone y «Pantalla · ver terminal» en la Mac para verla en otra pantalla.",
    sensor: "Este celular mide con sus sensores y manda la terminal a la otra pantalla. Toca «Iniciar monitoreo» aquí; las pruebas se pueden lanzar desde aquí o desde la Mac.",
    pantalla: "Esta pantalla muestra en vivo la terminal del celular. Los botones de prueba, «Todo bien» y S.O.S. mandan la orden al celular." };
  const ENL = { rol: LS.get("sost_rol", "solo"), codigo: LS.get("sost_codigo", ""), yo: Math.random().toString(36).slice(2, 10),
    clave: null, topico: "", es: null, pc: null, dc: null, modo: "off", partes: {}, tRespaldo: 0, tRelevo: 0, ultRelevo: 0, ultFoto: 0, ultDato: 0,
    remoto: null, alertaRemota: null, tSonar: 0, cambio: false };
  const te = new TextEncoder(), td = new TextDecoder();
  const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
  const deb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const limpiarCodigo = (c) => String(c || "").toUpperCase().replace(/[^A-Z]/g, "").replace(/I/g, "J").replace(/O/g, "Q").slice(0, 6);
  const nuevoCodigo = () => [...crypto.getRandomValues(new Uint8Array(6))].map((b) => ABC[b % ABC.length]).join("");
  const enlaceVer = () => `${location.origin}${location.pathname}#ver=${ENL.codigo}`;

  async function prepararClave(cod) {
    const h = new Uint8Array(await crypto.subtle.digest("SHA-256", te.encode("sosistem-topico:" + cod)));
    ENL.topico = "sosistem_" + [...h.slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const base = await crypto.subtle.importKey("raw", te.encode(cod), "PBKDF2", false, ["deriveKey"]);
    ENL.clave = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: te.encode("sosistem-enlace-v1"), iterations: 150000, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function cifrar(o) { const iv = crypto.getRandomValues(new Uint8Array(12)); return b64(iv) + "." + b64(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, ENL.clave, te.encode(JSON.stringify(o))))); }
  async function descifrar(s) { const [a, b] = s.split("."); return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deb64(a) }, ENL.clave, deb64(b)))); }

  function estadoEnlace(e, txt) { const el = $("enl-est"); el.dataset.e = e; el.textContent = txt; }

  // --- Relevo (para encontrarse y como respaldo) ---
  async function publicar(o) {
    if (!ENL.clave) return;
    o.de = ENL.yo; const txt = await cifrar(o), id = Math.random().toString(36).slice(2, 8);
    const trozos = txt.length > 3000 ? txt.match(/.{1,3000}/g) : [txt];
    for (let i = 0; i < trozos.length; i++) {
      const cuerpo = trozos.length > 1 ? `P|${id}|${i}|${trozos.length}|${trozos[i]}` : trozos[i];
      try {
        const r = await fetch(`${RELEVO}${ENL.topico}?cache=no&firebase=no`, { method: "POST", body: cuerpo });
        if (r.status === 429) { estadoEnlace("lento", "El relevo pidió esperar unos segundos"); return; }
      } catch (e) { estadoEnlace("error", "Sin conexión a internet para enlazar"); return; }
    }
  }
  function escuchar() {
    try { ENL.es?.close(); } catch (e) {}
    const es = new EventSource(`${RELEVO}${ENL.topico}/sse`); ENL.es = es;
    es.onopen = () => { if (ENL.rol === "pantalla") publicar({ t: "hola" }); if (ENL.rol === "sensor") publicar({ t: "listo" }); };
    es.onmessage = async (ev) => {
      let j; try { j = JSON.parse(ev.data); } catch (e) { return; }
      if (j.event && j.event !== "message") return;
      let m = j.message || "";
      if (m.startsWith("P|")) { const [, id, i, n, ...r] = m.split("|"); const c = ENL.partes[id] || (ENL.partes[id] = []); c[+i] = r.join("|");
        if (c.filter(Boolean).length < +n) return; m = c.join(""); delete ENL.partes[id]; }
      let o; try { o = await descifrar(m); } catch (e) { return; }   // otro código o mensaje ajeno: se ignora
      if (o.de !== ENL.yo) recibir(o);
    };
    es.onerror = () => { if (ENL.modo !== "p2p" && ENL.rol !== "solo") estadoEnlace("espera", "Reconectando…"); };
  }

  // --- Conexión directa (WebRTC) ---
  function cerrarP2P() { const { dc, pc } = ENL; ENL.dc = null; ENL.pc = null; try { dc?.close(); } catch (e) {} try { pc?.close(); } catch (e) {} if (ENL.modo === "p2p") ENL.modo = "relevo"; }
  const esperarIce = (pc) => new Promise((ok) => { if (pc.iceGatheringState === "complete") return ok(); const t = setTimeout(ok, 4000);
    pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); ok(); } }); });
  function vigilar(pc) { pc.onconnectionstatechange = () => { if (pc !== ENL.pc) return;
    if (pc.connectionState === "failed") { log("sis", "La conexión directa falló · se usa el relevo"); cerrarP2P(); if (ENL.rol === "sensor") usarRelevo(); } }; }
  function canal(dc) {
    ENL.dc = dc;
    dc.onopen = () => { ENL.modo = "p2p"; clearTimeout(ENL.tRespaldo); clearInterval(ENL.tRelevo);
      estadoEnlace("ok", ENL.rol === "sensor" ? "● Conectado directo con la pantalla" : "● Conectado directo con el celular");
      log("sis", "Enlace directo abierto (cifrado de extremo a extremo)"); if (ENL.rol === "sensor") mandarFoto(true); };
    dc.onmessage = (e) => { let o; try { o = JSON.parse(e.data); } catch (x) { return; } recibir(o); };
    dc.onclose = () => { if (ENL.dc !== dc) return; ENL.dc = null; ENL.modo = "relevo";
      if (ENL.rol === "sensor") { estadoEnlace("espera", "La pantalla se desconectó · esperando que vuelva"); }
      if (ENL.rol === "pantalla") { estadoEnlace("espera", "Se perdió el enlace directo · reintentando"); publicar({ t: "hola" }); } };
  }
  async function ofrecer() {   // celular
    cerrarP2P(); const pc = new RTCPeerConnection(ICE); ENL.pc = pc; vigilar(pc);
    canal(pc.createDataChannel("sosistem", { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer()); await esperarIce(pc);
    if (pc !== ENL.pc) return;
    publicar({ t: "oferta", sdp: pc.localDescription.sdp });
    clearTimeout(ENL.tRespaldo); ENL.tRespaldo = setTimeout(() => { if (ENL.modo !== "p2p" && ENL.rol === "sensor") usarRelevo(); }, 15000);
  }
  async function responder(sdp) {   // pantalla
    cerrarP2P(); const pc = new RTCPeerConnection(ICE); ENL.pc = pc; vigilar(pc);
    pc.ondatachannel = (e) => canal(e.channel);
    await pc.setRemoteDescription({ type: "offer", sdp }); await pc.setLocalDescription(await pc.createAnswer()); await esperarIce(pc);
    if (pc === ENL.pc) publicar({ t: "respuesta", sdp: pc.localDescription.sdp });
  }
  function usarRelevo() {
    ENL.modo = "relevo"; estadoEnlace("lento", "Sin conexión directa · la pantalla recibe datos cada 15 s (alertas al instante)");
    clearInterval(ENL.tRelevo); ENL.tRelevo = setInterval(() => mandarFoto(true), 15000); mandarFoto(true);
  }

  // --- Lo que manda el celular ---
  function foto() {
    const cola = (window.__enlCola || []).splice(0), qa = (window.__enlAcc || []).splice(0), qm = (window.__enlMic || []).splice(0);
    return { t: "foto", ts: Date.now(), e: $("pantalla").dataset.e, pill: $("estado-pill").textContent, ico: $("pt-icono").textContent, tit: $("pt-titulo").textContent,
      det: $("pt-detalle").textContent, niv: $("pt-nivel").hidden ? "" : $("pt-nivel").textContent, morse: $("pt-morse").textContent, voz: !$("pt-voz").hidden,
      rec: A.recinto, id: A.id, modo: A.modo, mon: monitoreando, l: ["l-acc", "l-rot", "l-inc", "l-db", "l-est", "l-voz"].map((i) => $(i).textContent),
      son: $("sonando").textContent, sonOn: $("sonando").classList.contains("on"), esc: escalaDatos(),
      acc: S.mov ? +S.mov.mag.toFixed(2) : null, db: S.db != null ? Math.round(S.db) : null, umb: [A.impacto_g * G, A.ruido_db],
      alerta: ALERTA.activa ? { tipo: ALERTA.ev.tipo, prueba: ALERTA.ev.prueba, id: ALERTA.ev.id } : null,
      qa: ENL.modo === "p2p" ? qa : [], qm: ENL.modo === "p2p" ? qm : [], log: ENL.modo === "p2p" ? cola : cola.slice(0, 8) };
  }
  function mandarFoto(forzar) {
    if (ENL.rol !== "sensor") return;
    if (ENL.dc?.readyState === "open") { try { ENL.dc.send(JSON.stringify(foto())); } catch (e) {} return; }
    if (ENL.modo === "relevo" && (forzar || Date.now() - ENL.ultRelevo > 15000)) { ENL.ultRelevo = Date.now(); publicar(foto()); }
  }
  setInterval(() => { if (ENL.rol === "sensor" && ENL.modo === "p2p") mandarFoto(); }, 200);
  // un cambio de estado (alerta, aviso, atendida) sale al instante, también por el relevo
  window.__enlCambio = () => { if (ENL.rol !== "sensor" || ENL.cambio) return; ENL.cambio = true;
    const espera = ENL.modo === "relevo" ? Math.max(150, 3000 - (Date.now() - ENL.ultRelevo)) : 150;   // por el relevo, máximo uno cada 3 s; nunca se pierde
    setTimeout(() => { ENL.cambio = false; if (ENL.modo === "relevo") { ENL.ultRelevo = Date.now(); publicar(foto()); } else mandarFoto(); }, espera); };
  const ORDENES = new Set(["caida", "sismo", "manual", "ruido", "sonido", "detener", "atender"]);
  function ejecutarOrden(k) {
    if (k === "atender") { atender("pantalla remota"); return; }
    if (k === "manual") { disparar("manual", { origen: "pantalla remota", simulada: true }, null, null, true); return; }
    if (k.startsWith("esc:")) { const b = document.querySelector(`[data-esc="${CSS.escape(k.slice(4))}"]`); if (b) b.click(); return; }
    if (ORDENES.has(k)) document.querySelector(`[data-prueba="${k}"]`)?.click();
  }

  // --- Lo que hace la pantalla (Mac) ---
  window.__enlOrden = (k) => {
    if (ENL.rol !== "pantalla") return;
    const o = { t: "orden", k };
    if (ENL.dc?.readyState === "open") ENL.dc.send(JSON.stringify(o)); else if (ENL.clave) publicar(o); else { toast("Primero conecta con el celular."); return; }
    toast(k === "atender" ? "«Todo bien» enviado al celular" : "Orden enviada al celular"); log("sis", `Orden a la terminal remota: ${k}`);
  };
  window.__enlRemoto = () => (ENL.rol === "pantalla" && ENL.remoto ? ENL.remoto : null);
  function aplicarFoto(f) {
    ENL.remoto = f; ENL.ultDato = Date.now();
    const p = $("pantalla"); p.dataset.e = f.e; $("estado-pill").dataset.e = f.e; $("estado-pill").textContent = f.pill;
    $("pt-icono").textContent = f.ico; $("pt-titulo").textContent = f.tit; $("pt-detalle").textContent = f.det;
    $("pt-nivel").hidden = !f.niv; $("pt-nivel").textContent = f.niv; $("pt-morse").textContent = f.morse; $("pt-voz").hidden = !f.voz;
    $("pt-recinto").textContent = f.rec; $("pt-id").textContent = `${f.id} · remoto`; $("pt-modo").textContent = f.modo === "real" ? "MODO REAL" : "MODO PRUEBA";
    ["l-acc", "l-rot", "l-inc", "l-db", "l-est", "l-voz"].forEach((i, n) => ($(i).textContent = f.l[n]));
    $("sonando").textContent = f.son; $("sonando").classList.toggle("on", !!f.sonOn); pintarEscala(f.esc);
    for (const v of f.qa || []) { BUF.acc.push(v); if (BUF.acc.length > 300) BUF.acc.shift(); }
    for (const v of f.qm || []) { BUF.mic.push(v); if (BUF.mic.length > 300) BUF.mic.shift(); }
    if (!f.qa?.length && f.acc != null) { BUF.acc.push(f.acc); if (BUF.acc.length > 300) BUF.acc.shift(); }
    if (!f.qm?.length && f.db != null) { BUF.mic.push(f.db); if (BUF.mic.length > 300) BUF.mic.shift(); }
    for (const [t, c, x] of (f.log || []).reverse()) log(c, "📱 " + x, t);
    $("vivo").classList.toggle("off", !f.mon); $("vivo").textContent = f.mon ? "● EN VIVO · CELULAR" : "○ CELULAR SIN MONITOREO";
    $("btn-atender").hidden = !f.alerta;
    // alarma también en la Mac: empieza con la alerta del celular y se calla cuando la atienden
    const antes = ENL.alertaRemota?.id, ahora = f.alerta?.id;
    if (ahora && ahora !== antes) { ENL.alertaRemota = f.alerta; sonarRemoto(); }
    if (!ahora && antes) { ENL.alertaRemota = null; clearTimeout(ENL.tSonar); window.SOSMorse?.detener(); }
  }
  function sonarRemoto() {
    clearTimeout(ENL.tSonar); const a = ENL.alertaRemota;
    if (!a || !$("enl-sonar").checked || !A.sonido) return;
    const dur = sonarPerfil(perfilDe(a.tipo), a.prueba ? "prueba-admin" : a.tipo === "sismo" ? "desastre" : "emergencia", a.prueba);
    ENL.tSonar = setTimeout(sonarRemoto, Math.max(2, dur + (+A.pausa_s || 3)) * 1000);
  }
  setInterval(() => { if (ENL.rol === "pantalla" && ENL.ultDato && ENL.modo === "p2p" && Date.now() - ENL.ultDato > 8000) estadoEnlace("espera", "Sin datos del celular (¿pantalla bloqueada o app en segundo plano?)"); }, 2000);

  // --- Mensajes recibidos (directo o por relevo) ---
  function recibir(o) {
    if (ENL.rol === "sensor") {
      if (o.t === "hola") { estadoEnlace("espera", "Pantalla encontrada · abriendo conexión directa…"); ofrecer().catch(() => usarRelevo()); }
      else if (o.t === "respuesta" && ENL.pc && ENL.pc.signalingState === "have-local-offer") ENL.pc.setRemoteDescription({ type: "answer", sdp: o.sdp }).catch(() => {});
      else if (o.t === "orden" && typeof o.k === "string") { log("sis", `Orden de la pantalla remota: ${o.k}`); ejecutarOrden(o.k); }
      else if (o.t === "adios") { cerrarP2P(); clearInterval(ENL.tRelevo); ENL.modo = "off"; estadoEnlace("espera", "La pantalla se desconectó · esperando…"); }
    }
    if (ENL.rol === "pantalla") {
      if (o.t === "listo") publicar({ t: "hola" });
      else if (o.t === "oferta") { estadoEnlace("espera", "Celular encontrado · conectando…"); responder(o.sdp).catch(() => estadoEnlace("lento", "Sin conexión directa · esperando datos por relevo")); }
      else if (o.t === "foto") { if (ENL.modo !== "p2p") { ENL.modo = ENL.dc ? ENL.modo : "relevo"; if (ENL.modo === "relevo") estadoEnlace("lento", "● Recibiendo por relevo cada 15 s (sin conexión directa)"); } aplicarFoto(o); }
    }
  }

  // --- Elegir la función de este equipo (pestaña Pruebas) ---
  function pintarCubo() { $("enl-cubo").innerHTML = ENL.codigo.split("").map((c, i) => `<span><small>L${i + 1}</small>${esc(c)}</span>`).join(""); }
  async function ponerRol(rol, codigo) {
    if (ENL.rol !== "solo" && ENL.clave && rol !== ENL.rol) publicar({ t: "adios" });
    cerrarP2P(); clearInterval(ENL.tRelevo); clearTimeout(ENL.tRespaldo); clearTimeout(ENL.tSonar); try { ENL.es?.close(); } catch (e) {}
    ENL.es = null; ENL.clave = null; ENL.modo = "off"; ENL.remoto = null; ENL.alertaRemota = null; ENL.ultDato = 0;
    const eraPantalla = ENL.rol === "pantalla";
    ENL.rol = rol; LS.set("sost_rol", rol);
    document.body.classList.toggle("rol-pantalla", rol === "pantalla"); document.body.classList.toggle("rol-sensor", rol === "sensor");
    document.querySelectorAll("[data-rol]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rol === rol)));
    $("enl-nota").textContent = ROLES[rol]; $("enl-sensor").hidden = rol !== "sensor"; $("enl-pantalla").hidden = rol !== "pantalla";
    window.__enlCola = rol === "sensor" ? [] : null; window.__enlAcc = rol === "sensor" ? [] : null; window.__enlMic = rol === "sensor" ? [] : null;
    if (rol === "pantalla" && monitoreando) detener();
    if (eraPantalla || rol === "pantalla") { BUF.acc.length = 0; BUF.mic.length = 0; CONSOLA.length = 0; pintarConsola(); pintarCabecera(); estado("detenido"); $("btn-atender").hidden = true; pintarEscala(); }
    if (rol === "solo") { estadoEnlace("off", "Sin enlace"); return; }
    if (!window.crypto?.subtle || !window.RTCPeerConnection || !window.EventSource) { estadoEnlace("error", "Este navegador no permite el enlace (usa Safari o Chrome actualizados)"); return; }
    if (rol === "sensor") {
      if (!ENL.codigo || codigo === "nuevo") { ENL.codigo = nuevoCodigo(); LS.set("sost_codigo", ENL.codigo); }
      pintarCubo(); estadoEnlace("espera", "Esperando a la pantalla…");
    } else {
      const c = limpiarCodigo(codigo || LS.get("sost_codigo_ver", ""));
      $("enl-codigo").value = c;
      if (c.length !== 6) { estadoEnlace("off", "Escribe el código de 6 letras que aparece en el celular"); return; }
      ENL.codigo = c; LS.set("sost_codigo_ver", c); estadoEnlace("espera", "Buscando al celular…");
      $("vivo").textContent = "○ ESPERANDO CELULAR"; $("vivo").classList.add("off");
    }
    await prepararClave(ENL.codigo); escuchar();
    log("sis", rol === "sensor" ? `Enlace listo · código ${ENL.codigo}` : `Buscando la terminal ${ENL.codigo}…`);
  }
  document.querySelectorAll("[data-rol]").forEach((b) => (b.onclick = () => ponerRol(b.dataset.rol)));
  $("enl-nuevo").onclick = () => ponerRol("sensor", "nuevo");
  $("enl-pantalla").onsubmit = (e) => { e.preventDefault(); ponerRol("pantalla", $("enl-codigo").value);
    if (A.sonido && window.SOSMorse) SOSMorse.reproducir("E", null, { motivo: "prueba-admin", volumen: 0.01, vibrar: false }); };   // desbloquea el sonido de la Mac
  $("enl-codigo").addEventListener("input", (e) => { const c = limpiarCodigo(e.target.value); if (e.target.value !== c) e.target.value = c; });
  $("enl-compartir").onclick = async () => {
    const url = enlaceVer();
    try { if (navigator.share) { await navigator.share({ title: "SOSistem™ · ver terminal", text: `Código ${ENL.codigo}`, url }); return; } } catch (e) { if (e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); toast("Enlace copiado. Pégalo en Safari de la Mac."); } catch (e) { toast(url, 6000); }
  };
  function iniciarEnlace(h) {
    const m = /^ver=([A-Za-z]{6})$/.exec(h || "");
    if (m) { ponerRol("pantalla", m[1]); toast("Haz clic en cualquier parte para activar el sonido de la alarma en esta pantalla.", 4500);
      addEventListener("pointerdown", () => { if (A.sonido && window.SOSMorse) SOSMorse.reproducir("E", null, { motivo: "prueba-admin", volumen: 0.01, vibrar: false }); }, { once: true });
      try { history.replaceState(null, "", "#monitor"); } catch (e) {} return; }
    if (ENL.rol !== "solo") ponerRol(ENL.rol);
  }


  // ---------- Arranque ----------
  (async () => {
    idb = await abrir(); EVENTOS = await todos("eventos");
    document.body.classList.add("vista-monitor"); aplicarDivision();
    pintarCabecera(); pintarDetectores(); estado("detenido"); pintarEventos(); pintarEscala();
    log("sis", `SOSistem™ Terminal ${VERSION} · ${A.id} · ${A.recinto} · ${A.modo === "real" ? "modo real" : "modo prueba"}`);
    const h = location.hash.slice(1); if (["monitor", "sensores", "eventos", "plataforma", "ajustes"].includes(h)) vista(h);
    iniciarEnlace(h);
    if (LS.get("sost_monitor", false)) toast("Toca «Iniciar monitoreo» para reanudar (el celular pide permiso cada vez).", 4000);
    requestAnimationFrame(cuadro);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw-terminal.js", { scope: "./terminal" }).catch(() => {});
  })();
  // Para pruebas desde la consola o el panel: SOSTerminal.disparar("caida")
  window.SOSTerminal = { disparar: (t, d) => disparar(t, d || {}, null, null, true), atender, estado: () => ({ monitoreando, alerta: ALERTA.activa, ciclos: ALERTA.ciclos, S }), version: VERSION, log };
})();
