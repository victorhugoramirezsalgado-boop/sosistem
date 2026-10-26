/* SOSistem™ · Supervisor de sensores · © Víctor Hugo Ramírez Salgado
   Sistema S.O.S.© (Safe Creative 2609046908578) · Plataforma SOSistem™ (Safe Creative 2610257442171)

   El celular o la Mac del administrador supervisa los sensores instalados (radar mmWave, láser/ToF,
   ultrasonido, vibración, gases). Cada nodo envía un «latido» firmado (HMAC-SHA256) por MQTT; aquí se
   verifica la firma, se mide cuántas ondas llegan (señal Wi-Fi RSSI, energía del radar, tono acústico)
   y se marca un semáforo por sensor. Todo cambio de estado queda en una bitácora de auditoría cifrada
   junto con los demás datos del panel, para supervisar al administrador del lugar donde están los sensores.

   Solo se muestran datos reales recibidos de los nodos: no hay datos de demostración. */
(() => {
  "use strict";
  const te = new TextEncoder(), td = new TextDecoder();
  const BROKERS = window.SOS_BROKERS || ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt", "wss://test.mosquitto.org:8081/mqtt"];
  const TONO_BASE = 18000, TONO_PASO = 250, TONO_MAX = 8;          // 18.00–19.75 kHz: casi inaudible, lo capta el micrófono del celular
  const TIPOS = [["mmw24", "Radar mmWave 24 GHz · presencia"], ["mmw60", "Radar mmWave 60 GHz · caída"], ["laser", "Láser / ToF · barrera"],
    ["ultra", "Ultrasonido · distancia"], ["vibra", "Vibración · sismo/golpe"], ["gas", "Gases / ambiental"], ["celular", "Celular de prueba"]];
  const SEM = { gris: ["Sin datos", ""], verde: ["Activo", "ok"], amarillo: ["Revisar", "warn"], rojo: ["Falla", "bad"] };

  const ST = { mq: [], ultimo: {}, hist: {}, vistos: new Set(), tick: 0, el: null, ctx: null, clave: null, nodoCel: null, ronda: null, audio: null };
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ahora = () => Math.floor(Date.now() / 1000);
  const hexA = (u8) => Array.from(new Uint8Array(u8), (b) => b.toString(16).padStart(2, "0")).join("");
  const azar = (n) => hexA(crypto.getRandomValues(new Uint8Array(n)));
  const hace = (s) => (s < 60 ? `${s} s` : s < 3600 ? `${Math.floor(s / 60)} min` : `${Math.floor(s / 3600)} h`);
  const mediana = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };

  // ---------- Configuración (vive cifrada en S.datos.supervisor) ----------
  function cfg() {
    const D = ST.ctx.S.datos;
    D.supervisor = D.supervisor || {};
    const C = D.supervisor;
    if (!C.canal) { C.canal = azar(6); ST.ctx.marcar(); }
    if (!C.clave) { C.clave = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))); ST.ctx.marcar(); }
    C.latido_s = C.latido_s || 30;
    C.tolerancia_db = C.tolerancia_db ?? 8;
    C.nodos = C.nodos || [];
    C.bitacora = C.bitacora || [];
    return C;
  }
  const topico = (tipo, id) => `sosistem/${cfg().canal}/${tipo}/${id}`;
  async function llaveHmac() {
    const C = cfg();
    if (!ST.clave || ST.clave.b64 !== C.clave) {
      const raw = Uint8Array.from(atob(C.clave), (c) => c.charCodeAt(0));
      ST.clave = { b64: C.clave, k: await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]) };
    }
    return ST.clave.k;
  }
  const firmar = async (txt) => hexA(await crypto.subtle.sign("HMAC", await llaveHmac(), te.encode(txt)));
  async function verificar(txt, hex) {
    if (!/^[0-9a-f]{64}$/i.test(hex || "")) return false;
    const b = Uint8Array.from(hex.match(/../g), (h) => parseInt(h, 16));
    return crypto.subtle.verify("HMAC", await llaveHmac(), b, te.encode(txt));
  }
  function bitacora(nodo, tipo, texto) {
    const C = cfg();
    C.bitacora.push({ fecha: new Date().toLocaleString("sv-SE"), nodo, tipo, texto, equipo: navigator.userAgent.includes("iPhone") ? "iPhone" : navigator.platform || "equipo" });
    if (C.bitacora.length > 1000) C.bitacora.splice(0, C.bitacora.length - 1000);
    ST.ctx.marcar();
  }

  // ---------- Cliente MQTT 3.1.1 mínimo sobre WebSocket (varios brokers a la vez) ----------
  const largoVar = (n) => { const b = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; b.push(d); } while (n > 0); return b; };
  const cadena = (s) => { const u = te.encode(s); return [u.length >> 8, u.length & 255, ...u]; };
  const pq = (tipo, cuerpo) => new Uint8Array([tipo, ...largoVar(cuerpo.length), ...cuerpo]);
  function broker(url, subs, alRecibir) {
    const c = { url, ws: null, listo: false, buf: new Uint8Array(0), ping: 0, rein: 0, vivo: true };
    const abrir = () => {
      if (!c.vivo) return;
      let ws; try { ws = new WebSocket(url, "mqtt"); } catch (e) { c.rein = setTimeout(abrir, 5000); return; }
      c.ws = ws; ws.binaryType = "arraybuffer";
      ws.onopen = () => ws.send(pq(0x10, [...cadena("MQTT"), 4, 0x02, 0, 45, ...cadena("sup" + azar(5))]));
      ws.onmessage = (ev) => {
        const n = new Uint8Array(ev.data), b = new Uint8Array(c.buf.length + n.length); b.set(c.buf); b.set(n, c.buf.length); c.buf = b;
        for (;;) {
          if (c.buf.length < 2) break;
          let mult = 1, largo = 0, i = 1, d;
          do { if (i >= c.buf.length) return; d = c.buf[i++]; largo += (d & 127) * mult; mult *= 128; } while (d & 128);
          if (c.buf.length < i + largo) break;
          const tipo = c.buf[0], cuerpo = c.buf.slice(i, i + largo); c.buf = c.buf.slice(i + largo);
          if ((tipo & 0xf0) === 0x20) { if (cuerpo[1] !== 0) { ws.close(); continue; } ws.send(pq(0x82, [0, 1, ...subs.flatMap((s) => [...cadena(s), 0])])); }
          else if ((tipo & 0xf0) === 0x90) { c.listo = true; clearInterval(c.ping); c.ping = setInterval(() => { try { ws.send(new Uint8Array([0xc0, 0])); } catch (e) {} }, 25000); pintarEnlace(); }
          else if ((tipo & 0xf0) === 0x30) { const qos = (tipo >> 1) & 3, lt = (cuerpo[0] << 8) | cuerpo[1]; const top = td.decode(cuerpo.slice(2, 2 + lt)); let p = 2 + lt; if (qos) p += 2; alRecibir(top, td.decode(cuerpo.slice(p))); }
        }
      };
      ws.onclose = () => { c.listo = false; clearInterval(c.ping); c.buf = new Uint8Array(0); pintarEnlace(); if (c.vivo) c.rein = setTimeout(abrir, 3000); };
      ws.onerror = () => {};
    };
    c.cerrar = () => { c.vivo = false; clearTimeout(c.rein); clearInterval(c.ping); try { c.ws?.send(new Uint8Array([0xe0, 0])); c.ws?.close(); } catch (e) {} };
    c.enviar = (top, txt) => { if (!c.listo) return false; try { c.ws.send(pq(0x30, [...cadena(top), ...te.encode(txt)])); return true; } catch (e) { return false; } };
    abrir(); return c;
  }
  function conectar() {
    if (ST.mq.length) return;
    const subs = [`sosistem/${cfg().canal}/n/+`, `sosistem/${cfg().canal}/c/+`];
    ST.mq = BROKERS.slice(0, 2).map((u) => broker(u, subs, recibir));
  }
  function desconectar() { ST.mq.forEach((c) => c.cerrar()); ST.mq = []; }
  async function publicarFirmado(top, obj) {
    const d = JSON.stringify(obj), txt = JSON.stringify({ d, h: await firmar(d) });
    return ST.mq.map((c) => c.enviar(top, txt)).some(Boolean);
  }

  // ---------- Recepción y verificación de latidos ----------
  async function recibir(top, txt) {
    const partes = top.split("/"); const tipo = partes[2], id = partes[3];
    let o; try { o = JSON.parse(txt); } catch (e) { return; }
    const llave = top + "|" + o.h; if (ST.vistos.has(llave)) return;   // el mismo mensaje llega por dos brokers
    ST.vistos.add(llave); if (ST.vistos.size > 800) ST.vistos.delete(ST.vistos.values().next().value);
    if (tipo === "c") { if (ST.nodoCel && id === ST.nodoCel.id) ordenCelular(o); return; }
    if (tipo !== "n") return;
    const C = cfg(), n = C.nodos.find((x) => x.id === id);
    if (!n) return;                                                      // nodo no registrado en este panel: se ignora
    const ok = await verificar(o.d, o.h);
    let d; try { d = JSON.parse(o.d); } catch (e) { return; }
    const h = (ST.hist[id] = ST.hist[id] || { recibidos: 0, perdidos: 0, rssi: [], ultSeq: null, falsos: 0 });
    if (!ok || d.id !== id) { h.falsos++; ST.ultimo[id] = { ...(ST.ultimo[id] || {}), firmaMala: true, rx: ahora() }; evaluar(n, "Firma inválida: mensaje no auténtico o clave distinta"); refrescar(); return; }
    if (Math.abs(ahora() - Number(d.t)) > 300) { evaluar(n, `Reloj del nodo desfasado ${Math.abs(ahora() - Number(d.t))} s (posible repetición)`); }
    if (h.ultSeq !== null) {
      if (d.seq <= h.ultSeq && d.ev !== "arranque") { h.falsos++; evaluar(n, `Secuencia repetida o hacia atrás (${d.seq} ≤ ${h.ultSeq})`); refrescar(); return; }
      if (d.ev !== "arranque" && d.seq > h.ultSeq + 1) h.perdidos += d.seq - h.ultSeq - 1;
    }
    if (d.ev === "arranque" && h.ultSeq !== null) bitacora(id, "Reinicio", `El nodo se reinició (secuencia ${h.ultSeq} → ${d.seq}). Verificar si fue desconectado.`);
    h.ultSeq = d.seq; h.recibidos++;
    if (typeof d.rssi === "number") { h.rssi.push(d.rssi); if (h.rssi.length > 20) h.rssi.shift(); }
    ST.ultimo[id] = { ...d, rx: ahora(), firmaMala: false };
    if (d.ev && !["latido", "arranque", "presencia", "libre"].includes(d.ev)) bitacora(id, "Evento", `${d.ev}${d.per != null ? ` · ${d.per} persona(s)` : ""}${d.dist != null ? ` · ${d.dist} cm` : ""}`);
    evaluar(n);
    refrescar();
  }

  // ---------- Semáforo por sensor ----------
  function estado(n) {
    const C = cfg(), u = ST.ultimo[n.id], h = ST.hist[n.id];
    if (!u) return ["gris", "Aún no envía latidos en esta sesión"];
    const lat = n.latido_s || C.latido_s, seg = ahora() - u.rx;
    if (u.firmaMala) return ["rojo", "Último mensaje con firma inválida"];
    if (seg > lat * 3) return ["rojo", `Sin latido hace ${hace(seg)} (apagado, sin red o desconectado)`];
    if (u.tamper) return ["rojo", "Gabinete abierto o sensor manipulado"];
    const motivos = [];
    if (seg > lat * 1.5) motivos.push(`latido atrasado (${hace(seg)})`);
    const rs = mediana(h?.rssi || []);
    if (n.rssi_ref == null) motivos.push("sin calibrar la señal de referencia");
    else if (rs != null && Math.abs(rs - n.rssi_ref) > C.tolerancia_db) motivos.push(`señal ${rs} dBm vs. referencia ${n.rssi_ref} dBm: posible cambio de lugar u obstrucción`);
    if (typeof u.bat === "number" && u.bat >= 0 && u.bat < 20) motivos.push(`batería ${u.bat} %`);
    if (n.tono && n.tono.ok === false) motivos.push("no respondió a la última ronda acústica");
    return motivos.length ? ["amarillo", motivos.join("; ")] : ["verde", "Latidos firmados, a tiempo y en su lugar"];
  }
  function evaluar(n, extra) {
    const [s, por] = estado(n);
    if (extra) bitacora(n.id, "Seguridad", extra);
    if (n.ult_estado !== s) { if (n.ult_estado || s !== "gris") bitacora(n.id, "Semáforo", `${SEM[n.ult_estado || "gris"][0]} → ${SEM[s][0]}: ${por}`); n.ult_estado = s; }
  }
  function disponibilidad(id) { const h = ST.hist[id]; if (!h || !(h.recibidos + h.perdidos)) return null; return h.recibidos / (h.recibidos + h.perdidos); }

  // ---------- Ronda acústica: el micrófono del celular escucha el tono propio de cada sensor ----------
  const freqDe = (n) => TONO_BASE + TONO_PASO * ((cfg().nodos.indexOf(n) % TONO_MAX + TONO_MAX) % TONO_MAX);
  async function microfono() {
    if (ST.audio) return ST.audio;
    const flujo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaStreamSource(flujo), an = ac.createAnalyser();
    an.fftSize = 8192; an.smoothingTimeConstant = 0.2; src.connect(an);
    ST.audio = { ac, an, flujo, datos: new Float32Array(an.frequencyBinCount) };
    return ST.audio;
  }
  function soltarMicrofono() { if (!ST.audio) return; ST.audio.flujo.getTracks().forEach((t) => t.stop()); ST.audio.ac.close(); ST.audio = null; }
  function medirTono(f) {
    const { ac, an, datos } = ST.audio; an.getFloatFrequencyData(datos);
    const ancho = ac.sampleRate / an.fftSize, b = Math.round(f / ancho);
    let pico = -Infinity; for (let i = b - 2; i <= b + 2; i++) pico = Math.max(pico, datos[i] ?? -Infinity);
    const ruido = mediana(Array.from(datos.slice(Math.round(16500 / ancho), Math.round(17500 / ancho))));
    return { pico: Math.round(pico), ruido: Math.round(ruido), sobre: Math.round(pico - ruido) };
  }
  async function rondaAcustica(nodos) {
    if (ST.ronda) return;
    try { await microfono(); } catch (e) { alert("Se necesita permiso del micrófono para la ronda acústica (solo mide el tono; no graba)."); return; }
    ST.ronda = { nodos: nodos.map((n) => n.id), lecturas: {} };
    refrescar();
    for (const n of nodos) {
      const f = freqDe(n);
      await publicarFirmado(topico("c", n.id), { id: n.id, cmd: "tono", hz: f, s: 5, t: ahora(), nonce: azar(4) });
      let fuertes = 0, mejor = { sobre: -99 };
      const t0 = performance.now();
      while (performance.now() - t0 < 6000) {
        await new Promise((r) => setTimeout(r, 100));
        const m = medirTono(f); if (m.sobre > mejor.sobre) mejor = m; if (m.sobre >= 15) fuertes++;
        ST.ronda.lecturas[n.id] = { f, ...mejor, vivo: m.sobre, fuertes }; pintarRonda();
      }
      const ok = fuertes >= 10;   // ≥ 1 s acumulado a 15 dB sobre el ruido (criterio ISO 7731 de audibilidad, aplicado al tono de prueba)
      n.tono = { ok, f, sobre: mejor.sobre, fecha: new Date().toLocaleString("sv-SE") };
      bitacora(n.id, "Ronda acústica", ok ? `Tono ${f} Hz captado a ${mejor.sobre} dB sobre el ruido: el sensor está en este recinto.` : `Tono ${f} Hz no captado (máx. ${mejor.sobre} dB sobre el ruido): revisar ubicación, bocina o que el celular esté en el recinto.`);
      evaluar(n);
    }
    ST.ronda = null; soltarMicrofono(); refrescar();
  }
  function pintarRonda() {
    const z = ST.el?.querySelector("#sv-ronda"); if (!z || !ST.ronda) return;
    z.innerHTML = ST.ronda.nodos.map((id) => { const l = ST.ronda.lecturas[id]; const w = l ? Math.max(0, Math.min(100, (l.vivo + 10) * 2.5)) : 0;
      return `<div class="sv-barra"><span class="mono">${esc(id)} · ${l ? l.f + " Hz" : "en espera"}</span><i style="width:${w}%" class="${l && l.vivo >= 15 ? "ok" : ""}"></i><span>${l ? `${l.vivo} dB` : ""}</span></div>`; }).join("");
  }

  // ---------- Este celular como nodo de prueba (datos reales del celular) ----------
  async function iniciarNodoCelular(n) {
    if (ST.nodoCel) return;
    if (typeof DeviceMotionEvent?.requestPermission === "function") { try { if ((await DeviceMotionEvent.requestPermission()) !== "granted") throw 0; } catch (e) { alert("Se necesita permiso de movimiento."); return; } }
    const ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume();
    const N = (ST.nodoCel = { id: n.id, seq: Math.floor(Date.now() / 1000), ac, energia: 0, max: 0, timer: 0 });
    N.mov = (e) => { const a = e.acceleration || {}; const v = Math.hypot(a.x || 0, a.y || 0, a.z || 0); N.energia = N.energia * 0.9 + v * 0.1; N.max = Math.max(N.max, v); };
    addEventListener("devicemotion", N.mov);
    const latir = async (ev) => {
      N.seq++;
      const per = N.max > 0.25 ? 1 : 0;
      const d = { id: N.id, seq: N.seq, t: ahora(), up: Math.round(performance.now() / 1000), pres: per, mov: per, per, ene: Math.min(100, Math.round(N.max * 40)), dist: null, rssi: null, bat: -1, tamper: 0, fw: "celular-1.0", ev };
      N.max = 0;
      await publicarFirmado(topico("n", N.id), d);
    };
    latir("arranque");
    N.timer = setInterval(() => latir("latido"), (n.latido_s || cfg().latido_s) * 1000);
    bitacora(n.id, "Nodo de prueba", "Este celular empezó a enviar latidos firmados con sus sensores de movimiento.");
    refrescar();
  }
  function detenerNodoCelular() {
    const N = ST.nodoCel; if (!N) return;
    clearInterval(N.timer); removeEventListener("devicemotion", N.mov); N.ac.close(); ST.nodoCel = null;
    bitacora(N.id, "Nodo de prueba", "El celular dejó de enviar latidos."); refrescar();
  }
  async function ordenCelular(o) {
    const N = ST.nodoCel; if (!N || !(await verificar(o.d, o.h))) return;
    const c = JSON.parse(o.d); if (c.cmd !== "tono" || Math.abs(ahora() - c.t) > 60) return;
    const osc = N.ac.createOscillator(), g = N.ac.createGain();
    osc.frequency.value = c.hz; g.gain.value = 0.7; osc.connect(g).connect(N.ac.destination);
    osc.start(); osc.stop(N.ac.currentTime + Math.min(10, c.s || 5));
  }

  // ---------- Archivo de configuración para cada nodo ESP32 ----------
  function configNodo(n) {
    const C = cfg(), raw = Uint8Array.from(atob(C.clave), (c) => c.charCodeAt(0));
    return `// SOSistem™ · configuración del nodo ${n.id} · © Víctor Hugo Ramírez Salgado
// Generado por el Supervisor de sensores el ${new Date().toLocaleString("sv-SE")}. CONFIDENCIAL: contiene la llave del sitio.
// Guárdelo como config.h junto a nodo-sos-esp32.ino. No lo suba a un repositorio público.
#pragma once
#define SOS_NODO_ID     "${n.id}"
#define SOS_CANAL       "${C.canal}"
#define SOS_LATIDO_S    ${n.latido_s || C.latido_s}
#define SOS_TONO_HZ     ${freqDe(n)}
#define SOS_TIPO        "${n.tipo}"
#define WIFI_SSID       "SU_RED_WIFI"
#define WIFI_CLAVE      "SU_CLAVE_WIFI"
#define MQTT_HOST       "broker.hivemq.com"
#define MQTT_PUERTO     1883
static const uint8_t SOS_LLAVE[32] = { ${Array.from(raw, (b) => "0x" + b.toString(16).padStart(2, "0")).join(", ")} };
`;
  }
  function descargar(nombre, texto, tipo = "text/plain") {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([texto], { type: tipo + ";charset=utf-8" })); a.download = nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csvBitacora() {
    const filas = [["fecha", "nodo", "tipo", "detalle", "equipo"], ...cfg().bitacora.map((b) => [b.fecha, b.nodo, b.tipo, b.texto, b.equipo])];
    return "﻿" + filas.map((f) => f.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  }

  // ---------- Interfaz ----------
  function pintarEnlace() {
    const z = ST.el?.querySelector("#sv-enlace"); if (!z) return;
    const n = ST.mq.filter((c) => c.listo).length;
    z.innerHTML = ST.mq.length ? `<span class="tag ${n ? "ok" : "warn"}">${n ? `● Escuchando · ${n} de ${ST.mq.length} relevos` : "Conectando a los relevos…"}</span>` : '<span class="tag">Supervisión detenida</span>';
  }
  function filaNodo(n) {
    const C = cfg(), u = ST.ultimo[n.id], h = ST.hist[n.id] || {}, [s, por] = estado(n), disp = disponibilidad(n.id), rs = mediana(h.rssi || []);
    const recintos = ST.ctx.S.config.recintos || [];
    return `<tr data-n="${esc(n.id)}">
      <td><span class="sv-luz ${s}" title="${esc(por)}"></span> <span class="tag ${SEM[s][1]}">${SEM[s][0]}</span><div class="note sv-por">${esc(por)}</div></td>
      <td class="mono"><b>${esc(n.id)}</b><div class="note">${freqDe(n)} Hz</div></td>
      <td><input data-k="nombre" value="${esc(n.nombre)}" aria-label="Nombre"><select data-k="recinto" aria-label="Recinto"><option value="">— recinto —</option>${recintos.map((r) => `<option value="${esc(r.id)}" ${n.recinto === r.id ? "selected" : ""}>${esc(r.nombre)}</option>`).join("")}</select></td>
      <td><select data-k="tipo" aria-label="Tipo">${TIPOS.map(([v, t]) => `<option value="${v}" ${n.tipo === v ? "selected" : ""}>${t}</option>`).join("")}</select></td>
      <td class="num">${u ? hace(ahora() - u.rx) : "—"}<div class="note">${h.recibidos || 0} recibidos · ${h.perdidos || 0} perdidos${h.falsos ? ` · <b style="color:var(--bad)">${h.falsos} rechazados</b>` : ""}</div></td>
      <td class="num">${u && !u.firmaMala ? `${u.per ?? (u.pres ? "≥1" : 0)} pers.` : "—"}<div class="note">${u && !u.firmaMala ? `energía ${u.ene ?? "—"}${u.dist != null ? ` · ${u.dist} cm` : ""}` : ""}</div></td>
      <td class="num">${rs != null ? rs + " dBm" : "—"}<div class="note">ref. ${n.rssi_ref ?? "—"} ± ${C.tolerancia_db}</div></td>
      <td class="num">${disp == null ? "—" : (disp * 100).toFixed(1) + " %"}<div class="note">${u && typeof u.bat === "number" && u.bat >= 0 ? "bat. " + u.bat + " %" : ""}</div></td>
      <td class="sv-acc"><button class="btn" type="button" data-a="cal" ${(h.rssi || []).length < 3 ? "disabled" : ""}>Calibrar señal</button>
        <button class="btn" type="button" data-a="tono" ${ST.ronda || !ST.mq.length ? "disabled" : ""}>Ronda</button>
        ${n.tipo === "celular" ? `<button class="btn" type="button" data-a="cel">${ST.nodoCel?.id === n.id ? "Detener este celular" : "Usar este celular"}</button>` : `<button class="btn" type="button" data-a="cfg">config.h</button>`}
        <button class="btn" type="button" data-a="del">Quitar</button></td></tr>`;
  }
  function refrescar() {
    if (!ST.el?.isConnected) return;
    const C = cfg(), tb = ST.el.querySelector("#sv-tb");
    const ae = document.activeElement;
    if (tb && !(tb.contains(ae) && /^(INPUT|SELECT)$/.test(ae.tagName))) tb.innerHTML = C.nodos.length ? C.nodos.map(filaNodo).join("") : `<tr><td colspan="9" class="note">Sin sensores registrados. Agregue el primero abajo.</td></tr>`;
    const cuenta = { verde: 0, amarillo: 0, rojo: 0, gris: 0 }; C.nodos.forEach((n) => cuenta[estado(n)[0]]++);
    const k = ST.el.querySelector("#sv-kpi");
    if (k) k.innerHTML = [["verde", "Activos"], ["amarillo", "Revisar"], ["rojo", "Falla"], ["gris", "Sin datos"]].map(([s, t]) => `<div class="card sv-k"><span class="sv-luz ${s}"></span><b>${cuenta[s]}</b><span class="note">${t}</span></div>`).join("");
    const b = ST.el.querySelector("#sv-bit");
    if (b) b.innerHTML = C.bitacora.slice(-40).reverse().map((x) => `<tr><td class="mono">${esc(x.fecha)}</td><td class="mono">${esc(x.nodo)}</td><td>${esc(x.tipo)}</td><td>${esc(x.texto)}</td></tr>`).join("") || `<tr><td colspan="4" class="note">Sin registros.</td></tr>`;
    pintarEnlace(); pintarRonda();
    const r = ST.el.querySelector("#sv-ronda-card"); if (r) r.hidden = !ST.ronda;
  }

  function render(el, ctx) {
    ST.el = el; ST.ctx = ctx;
    const C = cfg();
    el.innerHTML = `
      <style>
        .sv-luz { display:inline-block; width:14px; height:14px; border-radius:50%; background:#9aa3ad; vertical-align:middle; box-shadow:0 0 0 2px var(--surface), 0 0 0 3px #8884; }
        .sv-luz.verde { background:var(--ok); } .sv-luz.amarillo { background:#E0A100; } .sv-luz.rojo { background:var(--bad); animation:svp 1s infinite; }
        @keyframes svp { 50% { opacity:.35 } } @media (prefers-reduced-motion: reduce) { .sv-luz.rojo { animation:none } }
        .sv-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin:12px 0; }
        .sv-k { display:grid; justify-items:center; gap:2px; padding:10px 6px; } .sv-k b { font-size:1.5rem; line-height:1; }
        .sv-por { max-width:220px; } .sv-acc { display:flex; flex-wrap:wrap; gap:4px; min-width:170px; } .sv-acc .btn { padding:5px 8px; font-size:.78rem; }
        #sv-tb input, #sv-tb select { font:500 .82rem var(--font); padding:5px 6px; border-radius:7px; border:1px solid var(--line); background:var(--surface); color:var(--ink); max-width:150px; display:block; margin:2px 0; }
        .sv-barra { display:grid; grid-template-columns:150px 1fr 60px; gap:8px; align-items:center; font-size:.82rem; margin:4px 0; }
        .sv-barra i { height:10px; border-radius:6px; background:var(--line); transition:width .1s; } .sv-barra i.ok { background:var(--ok); }
        .sv-ondas { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:8px; } .sv-ondas div { border:1px solid var(--line); border-radius:10px; padding:10px; font-size:.84rem; }
        @media (max-width:600px) { .sv-kpis { grid-template-columns:repeat(2,1fr); } .sv-barra { grid-template-columns:110px 1fr 50px; } }
      </style>
      <div class="card"><h3>Supervisor de sensores</h3>
        <p>Cada sensor instalado envía un latido firmado. Este equipo verifica la firma, mide las ondas que recibe de cada uno y marca un semáforo. Todo cambio queda en la bitácora de auditoría cifrada: así se supervisa al administrador del lugar (sensor apagado, movido, tapado o manipulado).</p>
        <div class="filters" style="margin-bottom:6px"><span id="sv-enlace"></span>
          <button class="btn primary" type="button" id="sv-on">${ST.mq.length ? "Detener supervisión" : "Iniciar supervisión"}</button>
          <button class="btn" type="button" id="sv-todos" ${!C.nodos.length ? "disabled" : ""}>Ronda acústica de todos</button></div>
        <div class="sv-kpis" id="sv-kpi"></div>
      </div>
      <div class="card" id="sv-ronda-card" hidden style="margin-top:12px"><h3>Ronda acústica en curso</h3><p class="note">Mantenga el celular dentro del recinto. Cada sensor emite su tono (18–19.75 kHz) por 5 s; se valida si llega 15 dB por encima del ruido.</p><div id="sv-ronda"></div></div>
      <div class="card" style="margin-top:12px"><h3>Sensores</h3>
        <div class="tbl-wrap"><table><thead><tr><th>Semáforo</th><th>ID · tono</th><th>Nombre y recinto</th><th>Tipo</th><th class="num">Último latido</th><th class="num">Personas</th><th class="num">Señal Wi-Fi</th><th class="num">Disponib.</th><th></th></tr></thead><tbody id="sv-tb"></tbody></table></div>
        <div class="filters" style="margin-top:12px"><label>Nombre<input id="sv-n" placeholder="p. ej. Baño hombres · cabina 2"></label>
          <label>Tipo<select id="sv-t">${TIPOS.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
          <button class="btn" type="button" id="sv-add">Agregar sensor</button></div>
      </div>
      <div class="card" style="margin-top:12px"><h3>¿Qué ondas se miden?</h3>
        <div class="sv-ondas">
          <div><b>Radio · Wi-Fi (RSSI)</b><br>Intensidad con que cada nodo recibe la red. Se calibra al instalar; si cambia más de ${C.tolerancia_db} dB, el sensor se movió, se tapó o algo nuevo lo obstruye.</div>
          <div><b>Radar mmWave</b><br>Energía del eco reflejado por las personas (24 GHz presencia; 60 GHz caída). El nodo reporta personas, distancia y energía; nunca imagen.</div>
          <div><b>Sonido · tono de prueba</b><br>El micrófono del celular escucha el tono propio de cada sensor y confirma que está físicamente en ese recinto.</div>
          <div><b>Latido firmado</b><br>HMAC-SHA256 con llave del sitio, secuencia y hora: un sensor falso, clonado o repetido se rechaza y se registra.</div>
        </div>
        <div class="filters" style="margin-top:12px"><label>Latido cada (s)<input type="number" min="5" max="600" id="sv-lat" value="${C.latido_s}"></label>
          <label>Tolerancia de señal (dB)<input type="number" min="3" max="30" id="sv-tol" value="${C.tolerancia_db}"></label>
          <label>Canal del sitio<input value="${esc(C.canal)}" readonly class="mono"></label>
          <button class="btn" type="button" id="sv-rot">Cambiar llave del sitio</button></div>
        <p class="note">La llave del sitio y el canal se guardan cifrados con el resto del panel. Si cambia la llave, descargue de nuevo el config.h de cada nodo.</p>
      </div>
      <div class="card" style="margin-top:12px"><h3>Bitácora de auditoría</h3>
        <div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Nodo</th><th>Tipo</th><th>Detalle</th></tr></thead><tbody id="sv-bit"></tbody></table></div>
        <p style="margin-top:8px"><button class="btn" type="button" id="sv-csv">Descargar bitácora (CSV)</button> <span class="note">Últimos 40 en pantalla; se guardan hasta 1,000 registros al publicar.</span></p>
      </div>`;
    refrescar();
    clearInterval(ST.tick); ST.tick = setInterval(() => { if (!ST.el?.isConnected) return; cfg().nodos.forEach((n) => evaluar(n)); refrescar(); }, 5000);

    el.addEventListener("click", async (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "sv-on") { if (ST.mq.length) { desconectar(); bitacora("—", "Supervisión", "Supervisión detenida."); } else { conectar(); bitacora("—", "Supervisión", "Supervisión iniciada."); } b.textContent = ST.mq.length ? "Detener supervisión" : "Iniciar supervisión"; refrescar(); return; }
      if (b.id === "sv-todos") { if (!ST.mq.length) conectar(); rondaAcustica(C.nodos.filter((n) => n.tipo !== "celular" || ST.nodoCel?.id !== n.id)); return; }
      if (b.id === "sv-add") {
        const nombre = el.querySelector("#sv-n").value.trim() || "Sensor"; const usados = C.nodos.map((n) => Number(String(n.id).replace(/\D/g, "")) || 0);
        const id = "N" + (Math.max(0, ...usados) + 1);
        C.nodos.push({ id, nombre, tipo: el.querySelector("#sv-t").value, recinto: "", latido_s: C.latido_s, rssi_ref: null, alta: new Date().toLocaleString("sv-SE") });
        bitacora(id, "Alta", `Sensor registrado: ${nombre}.`); el.querySelector("#sv-n").value = ""; refrescar(); return;
      }
      if (b.id === "sv-csv") { descargar(`bitacora-sensores-${new Date().toISOString().slice(0, 10)}.csv`, csvBitacora(), "text/csv"); return; }
      if (b.id === "sv-rot") { if (!confirm("¿Cambiar la llave del sitio? Todos los nodos dejarán de ser aceptados hasta cargarles su nuevo config.h.")) return; C.clave = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))); ST.clave = null; bitacora("—", "Seguridad", "Llave del sitio cambiada."); refrescar(); return; }
      const fila = b.closest("tr[data-n]"); if (!fila) return;
      const n = C.nodos.find((x) => x.id === fila.dataset.n); if (!n) return;
      if (b.dataset.a === "cal") { n.rssi_ref = mediana(ST.hist[n.id].rssi); bitacora(n.id, "Calibración", `Señal de referencia fijada en ${n.rssi_ref} dBm.`); evaluar(n); refrescar(); }
      else if (b.dataset.a === "tono") rondaAcustica([n]);
      else if (b.dataset.a === "cfg") descargar(`config-${n.id}.h`, configNodo(n));
      else if (b.dataset.a === "cel") { if (!ST.mq.length) conectar(); ST.nodoCel?.id === n.id ? detenerNodoCelular() : iniciarNodoCelular(n); }
      else if (b.dataset.a === "del") { if (!confirm(`¿Quitar el sensor ${n.id}?`)) return; C.nodos.splice(C.nodos.indexOf(n), 1); bitacora(n.id, "Baja", `Sensor dado de baja: ${n.nombre}.`); refrescar(); }
    });
    el.addEventListener("change", (e) => {
      const x = e.target;
      if (x.id === "sv-lat") { C.latido_s = Math.max(5, Math.min(600, Number(x.value) || 30)); ST.ctx.marcar(); return; }
      if (x.id === "sv-tol") { C.tolerancia_db = Math.max(3, Math.min(30, Number(x.value) || 8)); ST.ctx.marcar(); refrescar(); return; }
      const fila = x.closest("tr[data-n]"); if (!fila || !x.dataset.k) return;
      const n = C.nodos.find((y) => y.id === fila.dataset.n); if (!n) return;
      n[x.dataset.k] = x.value.trim(); bitacora(n.id, "Cambio", `${x.dataset.k} → ${x.value.trim() || "(vacío)"}`); x.blur(); refrescar();
    });
  }

  window.SOSSupervisor = { render, _recibir: recibir };   // _recibir: solo para pruebas automáticas
})();
