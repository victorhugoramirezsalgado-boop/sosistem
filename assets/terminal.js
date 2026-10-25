/* SOSistem™ Terminal de pruebas · © 2026 Víctor Hugo Ramírez Salgado · Sistema S.O.S.© (Safe Creative 2609046908578)
   El celular funciona como una terminal del Sistema S.O.S.©: lee sus sensores, detecta eventos (caída, vibración tipo sismo,
   ruido fuerte, palabra «S.O.S.», sin movimiento prolongado, botón manual), escala por niveles N0–N3 como la pantalla física
   y guarda cada evento con hora al milisegundo para sacar estadísticas (tiempos, % de falsas alarmas).
   Todo se procesa en el celular. Solo sale información si el titular la exporta o la envía a su repositorio privado de GitHub.
   REGLA DE SONIDO: el Morse solo suena en alerta, desastre natural o prueba (morse.js lo valida). */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const VERSION = "3.9";
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
    voz: false, sonido: true, vibrar: true, repo: "victorhugoramirezsalgado-boop/sistema-sos", token: "", auto: false,
    det: { caida: true, sismo: true, ruido: true, voz: false, inmovil: false } };
  const A = Object.assign({}, DEF, LS.get("sost_ajustes", {}));
  A.det = Object.assign({}, DEF.det, A.det || {});
  if (!LS.get("sost_ajustes", null)) LS.set("sost_ajustes", A);
  const guardarAjustes = () => LS.set("sost_ajustes", A);
  let TIEMPOS = { N0: 2, N1: 4, N2: 7, N3: 10 };
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => { if (c.tiempos) TIEMPOS = c.tiempos; }).catch(() => {});

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
    if (k === "voz") { A.voz = e.target.checked; guardarAjustes(); if (monitoreando) (A.det.voz ? iniciarVoz() : detenerVoz()); }
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
    BUF.acc.push(mag); if (BUF.acc.length > 300) BUF.acc.shift();
    MIN.n++; MIN.accSum += mag; if (mag > MIN.accMax) MIN.accMax = mag;
    const rotMag = Math.hypot(S.rot.a, S.rot.b, S.rot.g);
    if (Math.abs(mag - G) > 0.8 || rotMag > 25) ultimoMov = ahora;
    if (!monitoreando || ALERTA.activa) return;

    // --- Caída ---
    if (A.det.caida) {
      if (mag < 0.45 * G) { if (!CA.libreDesde) CA.libreDesde = t; if (t - CA.libreDesde >= 60) CA.libreOk = t; }
      else CA.libreDesde = 0;
      const umbral = A.impacto_g * G;
      if (!CA.impacto && mag > umbral && (CA.libreOk && t - CA.libreOk < 1200 || mag > umbral * 1.4)) { CA.impacto = t; CA.pico = mag; CA.ventana = []; CA.libre = !!CA.libreOk; }
      if (CA.impacto) {
        if (mag > CA.pico && t - CA.impacto < 400) CA.pico = mag;
        if (t - CA.impacto > 400) CA.ventana.push(mag);
        if (t - CA.impacto > 400 + A.quietud_s * 1000) {
          const v = CA.ventana, m = v.reduce((s, x) => s + x, 0) / (v.length || 1), sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length || 1));
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
      if (ratio > umbralR && rms > umbralRms && rms < 3 && quieto) { if (!SI.desde) { SI.desde = t; SI.pico = 0; } SI.pico = Math.max(SI.pico, rms); }
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
        S.db = db; BUF.mic.push(db); if (BUF.mic.length > 300) BUF.mic.shift();
        MIN.dbSum += db; MIN.nd++; if (db > MIN.dbMax) MIN.dbMax = db;
        if (monitoreando && A.det.ruido && !ALERTA.activa) {
          const t = performance.now();
          if (db >= A.ruido_db) { if (!RU.desde) { RU.desde = t; RU.pico = 0; } RU.pico = Math.max(RU.pico, db); } else if (RU.desde && t - RU.desde < 1500) RU.desde = 0;
          if (RU.desde && t - RU.desde >= 1500 && Date.now() - RU.ultimo > 30000) { RU.ultimo = Date.now(); disparar("ruido", { pico_db: Math.round(RU.pico), umbral_db: A.ruido_db, nota: "dB aproximados; calibra con un sonómetro" }, RU.desde, "advertencia"); RU.desde = 0; }
        }
      }, 100) };
      if (ctx.state === "suspended") ctx.resume();
      S.perm.mic = "concedido";
    } catch (e) { S.perm.mic = e.name === "NotAllowedError" ? "denegado" : "error"; }
  }
  function detenerMic() { if (!audio) return; clearInterval(audio.id); audio.st.getTracks().forEach((t) => t.stop()); try { audio.ctx.close(); } catch (e) {} audio = null; S.db = null; }

  // ---------- Reconocimiento de voz «S.O.S.» ----------
  function iniciarVoz() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { S.perm.voz = "no disponible"; toast("Este navegador no ofrece reconocimiento de voz."); return; }
    try {
      reconocedor = new SR(); reconocedor.lang = "es-MX"; reconocedor.continuous = true; reconocedor.interimResults = true;
      reconocedor.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const txt = e.results[i][0].transcript.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          if (/\b(s\.?\s?o\.?\s?s|ese o ese|auxilio|ayuda|socorro|help)\b/.test(txt) && !ALERTA.activa) disparar("voz", { frase: txt.trim().slice(0, 60) });
        }
      };
      reconocedor.onend = () => { if (monitoreando && A.det.voz && reconocedor) { try { reconocedor.start(); } catch (e) {} } };
      reconocedor.onerror = (e) => { S.perm.voz = e.error; };
      reconocedor.start(); S.perm.voz = "escuchando";
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
    if (A.det.voz) iniciarVoz();
    try { wakeLock = await navigator.wakeLock?.request("screen"); S.perm.wake = wakeLock ? "activo" : "no disponible"; } catch (e) { S.perm.wake = "no disponible"; }
    monitoreando = true; ultimoMov = Date.now(); LS.set("sost_monitor", true);
    estado("monitoreo"); $("btn-iniciar").textContent = "Detener monitoreo"; $("btn-iniciar").classList.remove("pri");
    setTimeout(() => { if (monitoreando && !S.mov) toast("No llegan lecturas de movimiento: revisa el permiso «Movimiento y orientación» en Ajustes de Safari.", 5000); }, 2500);
    registrarSistema("inicio", { modo: A.modo });
  }
  function detener() {
    monitoreando = false; LS.set("sost_monitor", false);
    removeEventListener("devicemotion", procesarMovimiento); removeEventListener("deviceorientation", procesarOrientacion);
    detenerMic(); detenerVoz(); try { wakeLock?.release(); } catch (e) {} wakeLock = null;
    estado("detenido"); $("btn-iniciar").textContent = "Iniciar monitoreo"; $("btn-iniciar").classList.add("pri");
    registrarSistema("paro", {});
  }
  $("btn-iniciar").onclick = () => (monitoreando ? detener() : iniciar());
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
    if (ev.severidad === "advertencia") { mostrarAdvertencia(ev); return; }
    ALERTA.activa = true; ALERTA.ev = ev; ALERTA.t0 = ahora;
    estado("alerta", ev);
    $("btn-atender").hidden = false; $("btn-wa").hidden = false; $("btn-wa").href = enlaceWA(ev);
    if (A.vibrar && navigator.vibrate) try { navigator.vibrate([400, 200, 400, 200, 800]); } catch (e) {}
    sonarMorse(prueba ? "prueba-admin" : tipo === "sismo" ? "desastre" : "emergencia");
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
      if (n >= 1 && A.sonido) sonarMorse(ev.prueba ? "prueba-admin" : "emergencia");
      if (n === 3) { $("btn-911").hidden = A.modo !== "real" || ev.prueba; if (A.modo !== "real" || ev.prueba) $("pt-detalle").textContent = "N3 alcanzado. Modo prueba: no se llama al 911."; }
      guardarEvento(ev);
    }
  }
  function atender() {
    if (!ALERTA.activa) return;
    const ev = ALERTA.ev; clearInterval(ALERTA.timer); window.SOSMorse?.detener();
    ev.atendido = Date.now(); ev.respuesta_s = +((ev.atendido - ev.inicio) / 1000).toFixed(2);
    ALERTA.activa = false; ALERTA.ev = null;
    $("btn-atender").hidden = true; $("btn-911").hidden = true; $("btn-wa").hidden = true; $("pt-nivel").hidden = true;
    estado(monitoreando ? "monitoreo" : "detenido");
    guardarEvento(ev).then(() => { if (A.auto && A.token) sincronizar(true); });
    toast(`Alerta atendida en ${ev.respuesta_s} s. Califícala en Eventos.`);
  }
  $("btn-atender").onclick = atender;
  function mostrarAdvertencia(ev) {
    estado("advertencia", ev);
    if (A.sonido) sonarMorse(ev.prueba ? "prueba-admin" : "advertencia", "AVISO");
    setTimeout(() => { if (!ALERTA.activa) estado(monitoreando ? "monitoreo" : "detenido"); }, 6000);
  }
  function sonarMorse(motivo, texto = "SOS") {
    if (!A.sonido || !window.SOSMorse) return;
    const m = SOSMorse.aMorse(texto); $("pt-morse").textContent = SOSMorse.visible(m);
    SOSMorse.reproducir(texto, $("pantalla"), { motivo, vibrar: A.vibrar, alTerminar: () => { if (!ALERTA.activa) $("pt-morse").textContent = ""; } });
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
  }
  function detalleEv(ev) { if (!ev) return ""; const d = ev.datos || {};
    return [ev.recinto, d.pico_g ? `impacto ${d.pico_g} g` : "", d.pico_db ? `${d.pico_db} dB` : "", d.frase ? `«${d.frase}»` : "", ev.prueba ? "PRUEBA" : ""].filter(Boolean).join(" · "); }
  function pintarCabecera() { $("pt-recinto").textContent = A.recinto; $("pt-id").textContent = A.id; $("pt-modo").textContent = A.modo === "real" ? "MODO REAL" : "MODO PRUEBA"; }
  setInterval(() => { $("pt-hora").textContent = horaMs(Date.now()).slice(0, 8); }, 500);

  // ---------- Botón S.O.S. (mantener 2 s) ----------
  let sosT = 0, sosRaf = 0;
  const sosAbajo = (e) => { e.preventDefault(); const t0 = performance.now();
    const paso = () => { const p = Math.min(1, (performance.now() - t0) / 2000); $("sos-carga").style.height = p * 100 + "%"; if (p >= 1) { sosArriba(); disparar("manual", { origen: "botón" }, null, null, A.modo === "prueba"); } else sosRaf = requestAnimationFrame(paso); };
    sosRaf = requestAnimationFrame(paso); };
  const sosArriba = () => { cancelAnimationFrame(sosRaf); $("sos-carga").style.height = "0"; };
  const sb = $("btn-sos"); sb.addEventListener("pointerdown", sosAbajo); ["pointerup", "pointerleave", "pointercancel"].forEach((n) => sb.addEventListener(n, sosArriba));
  sb.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- Pruebas guiadas ----------
  document.querySelectorAll("[data-prueba]").forEach((b) => b.onclick = () => {
    const k = b.dataset.prueba;
    if (k === "morse") { const old = A.sonido; A.sonido = true; sonarMorse("prueba-admin"); A.sonido = old; return; }
    if (k === "caida") disparar("caida", { pico_g: 3.1, caida_libre: true, simulada: true }, null, null, true);
    if (k === "sismo") disparar("sismo", { rms_ms2: 0.2, simulada: true }, null, null, true);
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
      linea("g-acc", BUF.acc, 0, 40, "#4f8fd6", A.impacto_g * G); linea("g-mic", BUF.mic, 30, 120, "#3fbf7f", A.ruido_db);
      $("g-acc-v").textContent = S.mov ? S.mov.mag.toFixed(2) : "—"; $("g-mic-v").textContent = S.db != null ? Math.round(S.db) : "—";
    }
    if (document.querySelector("#v-sensores[data-activa=true]")) pintarSensores();
    requestAnimationFrame(cuadro);
  }

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
    document.querySelectorAll("#nav button").forEach((b) => b.setAttribute("aria-current", b.dataset.v === v ? "page" : "false"));
    if (v === "eventos") pintarEventos(); if (v === "plataforma") pintarPlataforma(); if (v === "ajustes") llenarAjustes();
    scrollTo({ top: 0 }); try { history.replaceState(null, "", "#" + v); } catch (e) {}
  }
  $("nav").addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (b) vista(b.dataset.v); });

  // ---------- Arranque ----------
  (async () => {
    idb = await abrir(); EVENTOS = await todos("eventos");
    pintarCabecera(); pintarDetectores(); estado("detenido"); pintarEventos();
    const h = location.hash.slice(1); if (["monitor", "sensores", "eventos", "plataforma", "ajustes"].includes(h)) vista(h);
    if (LS.get("sost_monitor", false)) toast("Toca «Iniciar monitoreo» para reanudar (el celular pide permiso cada vez).", 4000);
    requestAnimationFrame(cuadro);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw-terminal.js", { scope: "./terminal" }).catch(() => {});
  })();
  // Para pruebas desde la consola o el panel: SOSTerminal.disparar("caida")
  window.SOSTerminal = { disparar: (t, d) => disparar(t, d || {}, null, null, true), estado: () => ({ monitoreando, alerta: ALERTA.activa, S }), version: VERSION };
})();
