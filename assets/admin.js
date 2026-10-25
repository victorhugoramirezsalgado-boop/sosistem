/* Sistema S.O.S.© — Panel de administración · © Víctor Hugo Ramírez Salgado
   Seguridad: los datos viven cifrados (AES-GCM 256) en datos/admin.enc.json.
   Capa 1 se abre con la clave de pre-ingreso; dentro está la capa 2, que solo
   se abre con la clave de 2.ª autorización. Sin la primera no existe la segunda.
   Las claves nunca se guardan: solo se derivan llaves en memoria (PBKDF2-SHA256). */
(() => {
  "use strict";
  const REPO = "victorhugoramirezsalgado-boop/sosistem";
  const RAMA = "main";
  const ITER = 600000;
  const BLOQUEO_MIN = 15;
  const te = new TextEncoder(), td = new TextDecoder();
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const b64 = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8)));
  const ub64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const usd = (n) => "$" + Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 });
  const mxn = (n) => "$" + Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 }) + " MXN";
  const pct = (n) => (Number(n) * 100).toFixed(1) + " %";

  const S = { sobre: null, capa1: null, k1: null, k2: null, salt1: null, salt2: null, datos: null, config: null, sucio: false };

  // ---------- Cifrado ----------
  async function llave(clave, salt) {
    const base = await crypto.subtle.importKey("raw", te.encode(clave), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITER }, base,
      { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function cifrar(k, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, te.encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function descifrar(k, iv, ct) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub64(iv) }, k, ub64(ct));
    return JSON.parse(td.decode(pt));
  }
  async function empaquetar() {
    const c2 = await cifrar(S.k2, S.datos);
    const c1 = await cifrar(S.k1, { salt2: b64(S.salt2), iv2: c2.iv, ct2: c2.ct });
    return { v: 1, alg: "AES-GCM-256 / PBKDF2-SHA256", iter: ITER, salt1: b64(S.salt1), iv1: c1.iv, ct1: c1.ct, actualizado: new Date().toISOString() };
  }

  // ---------- Intentos y bloqueo ----------
  function bloqueado() {
    const h = Number(sessionStorage.getItem("sos_bloq") || 0);
    return h > Date.now() ? Math.ceil((h - Date.now()) / 60000) : 0;
  }
  function fallo() {
    const n = Number(sessionStorage.getItem("sos_fallos") || 0) + 1;
    sessionStorage.setItem("sos_fallos", n);
    if (n >= 5) { sessionStorage.setItem("sos_bloq", Date.now() + 5 * 60000); sessionStorage.setItem("sos_fallos", 0); }
  }

  // ---------- Acceso en dos pasos ----------
  async function cargarSobre() {
    const r = await fetch("datos/admin.enc.json?_=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("No se encontró el archivo cifrado.");
    S.sobre = await r.json();
    S.salt1 = ub64(S.sobre.salt1);
  }
  async function paso1(e) {
    e.preventDefault();
    const msg = $("#m1"), btn = $("#f1 button");
    const min = bloqueado(); if (min) { msg.textContent = `Demasiados intentos. Espere ${min} min.`; return; }
    btn.disabled = true; msg.textContent = "Verificando…";
    try {
      if (!S.sobre) await cargarSobre();
      const k1 = await llave($("#c1").value, S.salt1);
      S.capa1 = await descifrar(k1, S.sobre.iv1, S.sobre.ct1);
      S.k1 = k1; S.salt2 = ub64(S.capa1.salt2);
      $("#c1").value = ""; msg.textContent = "";
      $("#f1").hidden = true; $("#f2").hidden = false; $("#c2").focus();
    } catch (err) {
      fallo(); msg.textContent = err.message.startsWith("No se") ? err.message : "Clave de pre-ingreso incorrecta.";
    } finally { btn.disabled = false; }
  }
  async function paso2(e) {
    e.preventDefault();
    const msg = $("#m2"), btn = $("#f2 button");
    const min = bloqueado(); if (min) { msg.textContent = `Demasiados intentos. Espere ${min} min.`; return; }
    btn.disabled = true; msg.textContent = "Confirmando autenticación…";
    try {
      const k2 = await llave($("#c2").value, S.salt2);
      S.datos = await descifrar(k2, S.capa1.iv2, S.capa1.ct2);
      S.k2 = k2; S.capa1 = null; $("#c2").value = "";
      sessionStorage.setItem("sos_fallos", 0);
      await cargarConfig();
      $("#acceso").hidden = true; $("#app").hidden = false; scrollTo(0, 0);
      iniciarApp();
    } catch {
      fallo(); msg.textContent = "Clave de 2.ª autorización incorrecta.";
    } finally { btn.disabled = false; }
  }
  async function cargarConfig() {
    try { S.config = await (await fetch("datos/config.json?_=" + Date.now(), { cache: "no-store" })).json(); }
    catch { S.config = { tiempos: { N0: 20, N1: 50, N2: 110, N3: 200 }, goatcounter: "sosistem" }; }
  }
  function salir() {
    S.datos = S.k1 = S.k2 = S.salt2 = null;
    location.reload();
  }
  let reloj;
  function vigilar() {
    const reinicia = () => { clearTimeout(reloj); reloj = setTimeout(() => { alert("Sesión cerrada por inactividad."); salir(); }, BLOQUEO_MIN * 60000); };
    ["click", "keydown", "touchstart", "scroll"].forEach((ev) => addEventListener(ev, reinicia, { passive: true }));
    reinicia();
  }

  // ---------- App ----------
  const PESTANAS = [
    ["resumen", "Resumen"], ["visitas", "Visitas e interés"], ["eventos", "Eventos"], ["financiera", "Financiera"],
    ["tecnico", "Datos técnicos"], ["cambios", "Cambios y comentarios"], ["usuarios", "Usuarios"],
    ["ejecutivo", "Ejecutivo"], ["ajustes", "Ajustes"],
  ];
  function iniciarApp() {
    const t = $("#tabs");
    t.innerHTML = PESTANAS.map(([id, n], i) => `<button class="tab" role="tab" aria-selected="${i === 0}" data-tab="${id}">${n}</button>`).join("");
    $("#paneles").innerHTML = PESTANAS.map(([id], i) => `<section class="panel" id="p-${id}" ${i ? "hidden" : ""}></section>`).join("");
    t.addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) abrir(b.dataset.tab); });
    $("#btn-salir").addEventListener("click", salir);
    $("#btn-publicar").addEventListener("click", publicar);
    addEventListener("beforeunload", (e) => { if (S.sucio) { e.preventDefault(); e.returnValue = ""; } });
    vigilar();
    abrir("resumen");
  }
  const RENDER = {};
  function abrir(id) {
    $$(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === id));
    $$(".panel").forEach((p) => (p.hidden = p.id !== "p-" + id));
    const viejo = $("#p-" + id), nuevo = viejo.cloneNode(false); // panel limpio, sin escuchas previas
    viejo.replaceWith(nuevo);
    RENDER[id](nuevo);
  }
  function marcar() { S.sucio = true; $("#estado").innerHTML = '<span class="tag warn">Cambios sin publicar</span>'; }

  // ---------- Cálculos financieros ----------
  function finanzas() {
    const f = S.datos.finanzas;
    const pvp = f.costo * (1 + f.margen / 100);
    const fases = f.fases.map((x) => {
      const hw = x.u * pvp, saas = x.u * f.saas * 12, tot = hw + saas, costo = x.u * f.costo, esim = x.u * f.esim * 12;
      const eb = tot - costo - esim - x.opex;
      return { ...x, hw, saas, tot, costo, esim, eb, mar: eb / tot };
    });
    return { pvp, gan: pvp - f.costo, fases };
  }

  // ---------- Resumen ----------
  RENDER.resumen = (el) => {
    const f = S.datos.finanzas, c = finanzas(), ev = S.datos.eventos;
    const fp = ev.filter((e) => e.resultado === "Falsa alarma").length;
    const ult = S.datos.cambios.slice(-3).reverse();
    el.innerHTML = `
      <div class="grid g4">
        <div class="card kpi"><div class="v">${usd(c.pvp)}</div><div class="l">Precio de venta (USD)</div><div class="s">${mxn(c.pvp * f.fx)} · margen ${f.margen} % s/costo</div></div>
        <div class="card kpi"><div class="v">${usd(c.fases[0].eb)}</div><div class="l">EBITDA Fase 1 (USD)</div><div class="s">${pct(c.fases[0].mar)} de margen</div></div>
        <div class="card kpi"><div class="v">${ev.length}</div><div class="l">Eventos registrados</div><div class="s">${pct(fp / ev.length)} falsas alarmas · datos de prueba</div></div>
        <div class="card kpi"><div class="v" id="r-visitas">—</div><div class="l">Visitas totales al sitio</div><div class="s">GoatCounter · anónimas</div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Últimos cambios</h3>${ult.map((x) => `<p><b>${esc(x.fecha)}</b> · ${esc(x.autor)}<br>${esc(x.texto)}</p>`).join("")}</div>
        <div class="card"><h3>Fondos BC 2026</h3>
          <p>Solicitud: <b>${mxn(f.fondos.monto)}</b> ≈ ${usd(f.fondos.monto / f.fx)} USD.</p>
          <p>Alcanza para <b>${Math.floor(f.fondos.monto / (f.costo * f.fx))}</b> paquete(s) a costo (${mxn(f.costo * f.fx)} c/u); remanente ${mxn(f.fondos.monto - Math.floor(f.fondos.monto / (f.costo * f.fx)) * f.costo * f.fx)}.</p>
          <p class="note">${esc(f.fondos.uso)}</p></div>
      </div>`;
    contador("TOTAL").then((r) => { if (r) $("#r-visitas").textContent = Number(r.count.replace(/\D/g, "")).toLocaleString("es-MX"); });
    fetch("datos/version.json?_=" + Date.now(), { cache: "no-store" }).then((r) => r.json()).then((v) => {
      const c = document.createElement("div"); c.className = "card"; c.style.marginTop = "16px";
      c.innerHTML = `<h3>Versión publicada: ${esc(v.version)}</h3><p class="note">${esc(v.esquema)}</p>` +
        v.historial.map((h) => `<p><b>${esc(h.v)}</b> · ${esc(h.fecha)} — ${esc(h.resumen)}</p>`).join("");
      el.appendChild(c);
    }).catch(() => {});
  };

  // ---------- Visitas (GoatCounter, sin cookies) ----------
  async function contador(ruta) {
    const code = S.config.goatcounter;
    if (!code) return null;
    try {
      const r = await fetch(`https://${code}.goatcounter.com/counter/${encodeURIComponent(ruta)}.json`);
      return r.ok ? r.json() : null;
    } catch { return null; }
  }
  const SECCIONES = ["inicio", "problema", "datos", "funciona", "ventajas", "ssos", "normativa", "clientes", "piloto", "contacto", "fuentes"];
  const TIEMPOS = ["0-10s", "10-30s", "30-60s", "1-3min", "3-10min", "10min+"];
  RENDER.visitas = async (el) => {
    el.innerHTML = `<p class="note">Cargando estadísticas de visitas…</p>`;
    const tot = await contador("TOTAL");
    if (!tot) {
      el.innerHTML = `<div class="demo-banner">Aún no hay conexión con el contador de visitas <b>${esc(S.config.goatcounter || "(sin código)")}.goatcounter.com</b>.</div>
        <div class="card"><h3>Actívelo en 3 pasos (gratis, sin cookies)</h3><ol class="steps">
        <li><div>Cree una cuenta en <a href="https://www.goatcounter.com/signup" target="_blank" rel="noopener">goatcounter.com</a> con el código <b>${esc(S.config.goatcounter || "sosistem")}</b>.</div></li>
        <li><div>En <i>Settings</i>, active <b>“Allow adding visitor counts on your website”</b>.</div></li>
        <li><div>El sitio ya envía las visitas; vuelva a esta pestaña. Si usó otro código, cámbielo en <b>Ajustes</b> y publique.</div></li></ol></div>`;
      return;
    }
    const n = (r) => (r ? Number(String(r.count).replace(/\D/g, "")) : 0);
    const u = (r) => (r && r.count_unique ? Number(String(r.count_unique).replace(/\D/g, "")) : 0);
    const sec = await Promise.all(SECCIONES.map((s) => contador("seccion/" + s)));
    const tie = await Promise.all(TIEMPOS.map((s) => contador("tiempo/" + s)));
    const acc = await Promise.all(["evento/whatsapp", "evento/telefono", "evento/presentar"].map(contador));
    const sumT = tie.reduce((a, r) => a + n(r), 0) || 1;
    el.innerHTML = `
      <div class="grid g4">
        <div class="card kpi"><div class="v">${n(tot).toLocaleString("es-MX")}</div><div class="l">Visitas totales</div><div class="s">${u(tot).toLocaleString("es-MX")} visitantes únicos</div></div>
        <div class="card kpi"><div class="v">${n(acc[0])}</div><div class="l">Clics a WhatsApp</div><div class="s">Conversión ${pct(n(acc[0]) / (n(tot) || 1))}</div></div>
        <div class="card kpi"><div class="v">${n(acc[1])}</div><div class="l">Clics a teléfono</div></div>
        <div class="card kpi"><div class="v">${n(acc[2])}</div><div class="l">Modo presentación</div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Interés por sección</h3><p class="note">Sección vista al menos 2 s por visita.</p>${barras(SECCIONES.map((s, i) => [s, n(sec[i])]))}</div>
        <div class="card"><h3>Tiempo de visita</h3><p class="note">Distribución por rango de permanencia.</p>${barras(TIEMPOS.map((s, i) => [s, n(tie[i])]))}
          <p class="note">${TIEMPOS.map((s, i) => `${s}: ${pct(n(tie[i]) / sumT)}`).join(" · ")}</p></div>
      </div>
      <p class="note" style="margin-top:12px">Visitantes anónimos: no se guardan nombres, IP ni cookies. Identificar a cada persona requeriría aviso de privacidad y consentimiento (LFPDPPP 2025). <a href="https://${esc(S.config.goatcounter)}.goatcounter.com" target="_blank" rel="noopener">Abrir panel completo de GoatCounter</a></p>`;
  };
  function barras(pares, color = "var(--s2)") {
    const max = Math.max(1, ...pares.map((p) => p[1]));
    const h = 26, w = 420, lab = 110;
    return `<svg class="chart" viewBox="0 0 ${w} ${pares.length * h + 6}" role="img">${pares.map(([k, v], i) => {
      const bw = ((w - lab - 40) * v) / max, y = i * h + 4;
      return `<text x="0" y="${y + 15}">${esc(k)}</text><rect x="${lab}" y="${y}" width="${Math.max(bw, 1)}" height="${h - 8}" rx="4" fill="${color}"/><text x="${lab + bw + 6}" y="${y + 15}">${v}</text>`;
    }).join("")}</svg>`;
  }

  // ---------- Eventos ----------
  RENDER.eventos = (el) => {
    const ev = S.datos.eventos;
    const recs = [...new Set(ev.map((e) => e.recinto))];
    el.innerHTML = `<div class="demo-banner">Datos de prueba generados por el simulador. Se reemplazan por eventos reales al conectar las estaciones del piloto.</div>
      <div class="filters">
        <label>Recinto<select id="fr"><option value="">Todos</option>${recs.map((r) => `<option>${esc(r)}</option>`).join("")}</select></label>
        <label>Nivel máximo<select id="fn"><option value="">Todos</option>${["N0", "N1", "N2", "N3"].map((n) => `<option>${n}</option>`).join("")}</select></label>
        <label>Resultado<select id="fs"><option value="">Todos</option><option>Atendido</option><option>Falsa alarma</option></select></label>
        <label>Desde<input type="date" id="fd"></label>
        <button class="btn" id="fcsv" type="button">Descargar CSV</button>
      </div><div id="ev-out"></div>`;
    const pinta = () => {
      const r = $("#fr").value, nv = $("#fn").value, s = $("#fs").value, d = $("#fd").value;
      const L = ev.filter((e) => (!r || e.recinto === r) && (!nv || e.nivel === nv) && (!s || e.resultado === s) && (!d || e.fecha >= d));
      const fp = L.filter((e) => e.resultado === "Falsa alarma").length;
      const at = L.filter((e) => e.resultado === "Atendido");
      const prom = at.length ? at.reduce((a, e) => a + e.respuesta_s, 0) / at.length : 0;
      const horas = Array.from({ length: 24 }, (_, h) => [String(h).padStart(2, "0") + "h", L.filter((e) => Number(e.hora.slice(0, 2)) === h).length]);
      const niveles = ["N0", "N1", "N2", "N3"].map((n) => [n, L.filter((e) => e.nivel === n).length]);
      $("#ev-out").innerHTML = `
        <div class="grid g4">
          <div class="card kpi"><div class="v">${L.length}</div><div class="l">Eventos</div></div>
          <div class="card kpi"><div class="v">${pct(fp / (L.length || 1))}</div><div class="l">% de error (falsas alarmas)</div></div>
          <div class="card kpi"><div class="v">${prom.toFixed(0)} s</div><div class="l">Respuesta media (atendidos)</div></div>
          <div class="card kpi"><div class="v">${niveles[3][1]}</div><div class="l">Escalados al 911</div></div>
        </div>
        <div class="grid g2" style="margin-top:16px">
          <div class="card"><h3>Eventos por hora del día</h3>${barras(horas.filter((x) => x[1]))}</div>
          <div class="card"><h3>Nivel máximo alcanzado</h3>${barras(niveles, "var(--brand)")}</div>
        </div>
        <div class="tbl-wrap" style="margin-top:16px"><table><thead><tr><th>Folio</th><th>Fecha</th><th>Hora (hh:mm:ss)</th><th>Recinto</th><th>Cabina</th><th>Tipo</th><th>Nivel</th><th class="num">Respuesta</th><th>Resultado</th></tr></thead>
        <tbody>${L.slice().reverse().map((e) => `<tr><td class="mono">${esc(e.id)}</td><td>${e.fecha}</td><td class="mono">${e.hora}</td><td>${esc(e.recinto)}</td><td>${esc(e.cabina)}</td><td>${esc(e.tipo)}</td><td>${e.nivel}</td><td class="num">${e.respuesta_s} s</td><td><span class="tag ${e.resultado === "Atendido" ? "ok" : "warn"}">${e.resultado}</span></td></tr>`).join("")}</tbody></table></div>`;
      $("#fcsv").onclick = () => {
        const cab = ["id", "fecha", "hora", "recinto", "cabina", "tipo", "nivel", "respuesta_s", "resultado"];
        const csv = [cab.join(",")].concat(L.map((e) => cab.map((k) => `"${String(e[k]).replace(/"/g, '""')}"`).join(","))).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "eventos_sos.csv"; a.click();
      };
    };
    $$("#fr,#fn,#fs,#fd").forEach((x) => x.addEventListener("change", pinta));
    pinta();
  };

  // ---------- Financiera (editable) ----------
  RENDER.financiera = (el) => {
    const f = S.datos.finanzas;
    const campo = (k, l, step = "any") => `<label>${l}<input type="number" step="${step}" data-f="${k}" value="${f[k]}"></label>`;
    el.innerHTML = `
      <div class="card"><h3>Parámetros (editables)</h3><div class="filters">
        ${campo("costo", "Costo unitario USD")}${campo("margen", "Margen % s/costo")}${campo("saas", "SaaS USD/mes")}${campo("esim", "eSIM USD/mes")}
        ${campo("fx", "Tipo de cambio FIX")}<label>Fecha FIX<input type="date" data-f="fxFecha" value="${f.fxFecha}"></label>
      </div>
      <div class="filters">${f.fases.map((x, i) => `<label>${esc(x.nombre)} · unidades<input type="number" data-fase="${i}" data-k="u" value="${x.u}"></label><label>Gastos operativos USD<input type="number" data-fase="${i}" data-k="opex" value="${x.opex}"></label>`).join("")}</div></div>
      <div id="fin-out" style="margin-top:16px"></div>`;
    const pinta = () => {
      const c = finanzas();
      const fila = (l, k, fmt = usd) => `<tr><td>${l}</td>${c.fases.map((x) => `<td class="num">${fmt(x[k])}<br><span class="note">${mxn(x[k] * f.fx)}</span></td>`).join("")}</tr>`;
      $("#fin-out").innerHTML = `
        <div class="grid g4">
          <div class="card kpi"><div class="v">${usd(f.costo)}</div><div class="l">Costo + instalación</div><div class="s">${mxn(f.costo * f.fx)}</div></div>
          <div class="card kpi"><div class="v">${usd(c.pvp)}</div><div class="l">Precio de venta</div><div class="s">${mxn(c.pvp * f.fx)}</div></div>
          <div class="card kpi"><div class="v">${usd(c.gan)}</div><div class="l">Ganancia bruta unitaria</div><div class="s">${pct(c.gan / c.pvp)} sobre precio</div></div>
          <div class="card kpi"><div class="v">${f.fx}</div><div class="l">FIX MXN/USD</div><div class="s">${esc(f.fxFecha)}</div></div>
        </div>
        <div class="tbl-wrap" style="margin-top:16px"><table><thead><tr><th>Línea</th>${c.fases.map((x) => `<th class="num">${esc(x.nombre)} (${x.u})</th>`).join("")}</tr></thead><tbody>
          ${fila("Ingresos hardware", "hw")}${fila("Ingresos SaaS anual", "saas")}${fila("<b>Total ingresos</b>", "tot")}
          ${fila("Costo directo equipos", "costo")}${fila("Conectividad eSIM", "esim")}${fila("Gastos operativos", "opex")}
          ${fila("<b>EBITDA</b>", "eb")}<tr><td>Margen EBITDA</td>${c.fases.map((x) => `<td class="num">${pct(x.mar)}</td>`).join("")}</tr>
        </tbody></table></div>
        <div class="card" style="margin-top:16px"><h3>EBITDA por fase (USD)</h3>${barras(c.fases.map((x) => [x.nombre.split(":")[0], Math.round(x.eb)]), "var(--ok)")}</div>`;
    };
    el.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.f) f[t.dataset.f] = t.type === "number" ? Number(t.value) : t.value;
      if (t.dataset.fase) f.fases[t.dataset.fase][t.dataset.k] = Number(t.value);
      marcar(); pinta();
    });
    pinta();
  };

  // ---------- Datos técnicos ----------
  RENDER.tecnico = (el) => {
    const t = S.datos.tecnico;
    const campo = (k, l) => `<label>${l}<input type="number" step="any" data-t="${k}" value="${t[k]}"></label>`;
    el.innerHTML = `
      <div class="card"><h3>Memoria de cálculo energético</h3><div class="filters">
        ${campo("consumoW", "Consumo basal W")}${campo("dias", "Días de autonomía")}${campo("v", "Voltaje nominal V")}${campo("dod", "DoD")}${campo("eta", "η térmica")}${campo("nimhmAh", "NiMH mAh")}${campo("nimhH", "Horas NiMH")}
      </div><div id="t-out"></div></div>
      <div class="card" style="margin-top:16px"><h3>Generador de alerta CAP v1.2</h3><div class="filters">
        <label>Recinto / área<input id="cap-a" value="Sanitarios Damas - Cabina 1"></label>
        <label>Latitud<input id="cap-la" value="31.8667"></label><label>Longitud<input id="cap-lo" value="-116.5964"></label>
        <button class="btn" id="cap-g" type="button">Generar</button></div>
        <pre class="mono" id="cap-x" style="white-space:pre-wrap;overflow-x:auto"></pre></div>
      <div class="card" style="margin-top:16px"><h3>Especificación de referencia</h3><div class="tbl-wrap"><table><tbody>
        <tr><td>Sensor</td><td>Radar FMCW 60–64 GHz / 77–81 GHz, antena AoP</td></tr>
        <tr><td>Criterio de caída</td><td>Z &lt; 15 cm durante t ≥ 5 s + micro-Doppler torácico</td></tr>
        <tr><td>Procesador</td><td>ARM Cortex-M7 480 MHz</td></tr>
        <tr><td>Comunicación</td><td>SIP/VoIP (RFC 3261) + CAP v1.2 (OASIS); eSIM M2M</td></tr>
        <tr><td>Sirena</td><td>105 dB SPL a 1 m, FSK 4 Hz</td></tr>
        <tr><td>Gabinetes</td><td>Interior IP65/IK08 · Exterior IP67/IK09 · NEMA 4X</td></tr>
        <tr><td>Batería</td><td>LiFePO4 250 Ah, BMS SMBus, &gt; 4,000 ciclos al 80 % DoD</td></tr>
      </tbody></table></div></div>`;
    const pinta = () => {
      const E = t.consumoW * t.dias * 24, C = E / (t.v * t.dod * t.eta), I = t.nimhmAh / t.nimhH;
      $("#t-out").innerHTML = `<pre class="mono">E = ${t.consumoW} W × ${t.dias * 24} h = ${E.toFixed(0)} Wh
C = ${E.toFixed(0)} Wh / (${t.v} V × ${t.dod} × ${t.eta}) = <b>${C.toFixed(2)} Ah</b> → banco comercial ${Math.ceil(C / 50) * 50} Ah
NiMH: ${t.nimhmAh} mAh / ${t.nimhH} h = consumo medio máx. ${I.toFixed(1)} mA</pre>`;
    };
    el.addEventListener("input", (e) => { if (e.target.dataset.t) { t[e.target.dataset.t] = Number(e.target.value); marcar(); pinta(); } });
    $("#cap-g").onclick = () => {
      const now = new Date(), off = -now.getTimezoneOffset(), p = (n) => String(Math.floor(Math.abs(n))).padStart(2, "0");
      const sent = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19) + (off >= 0 ? "+" : "-") + p(off / 60) + ":" + p(off % 60);
      $("#cap-x").textContent = `<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>SSOS-ENS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}</identifier>
  <sender>ssos-central@sosistem.com</sender>
  <sent>${sent}</sent>
  <status>Actual</status><msgType>Alert</msgType><scope>Restricted</scope>
  <restriction>C5 Baja California / 911</restriction>
  <info>
    <language>es-MX</language><category>Safety</category>
    <event>Colapso vertical en recinto sanitario</event>
    <urgency>Immediate</urgency><severity>Severe</severity><certainty>Likely</certainty>
    <area><areaDesc>${esc($("#cap-a").value)}</areaDesc>
      <circle>${esc($("#cap-la").value)},${esc($("#cap-lo").value)} 0.01</circle></area>
  </info>
</alert>`;
    };
    pinta(); $("#cap-g").click();
  };

  // ---------- Cambios y comentarios ----------
  RENDER.cambios = (el) => {
    const L = S.datos.cambios;
    el.innerHTML = `
      <div class="card"><h3>Nuevo registro</h3>
        <div class="filters"><label>Autor<input id="cm-a" value="${esc(S.datos.usuarios[0]?.nombre || "")}"></label>
        <label>Tipo<select id="cm-t"><option>Cambio</option><option>Comentario</option><option>Pendiente</option><option>Decisión</option></select></label></div>
        <textarea id="cm-x" rows="3" style="width:100%;font:inherit;padding:10px;border-radius:9px;border:1px solid var(--line);background:var(--surface);color:var(--ink)" placeholder="Describa el cambio o comentario"></textarea>
        <p style="margin-top:8px"><button class="btn primary" id="cm-ok" type="button">Agregar</button></p></div>
      <div class="tbl-wrap" style="margin-top:16px"><table class="wrap-cells"><thead><tr><th>Fecha</th><th>Tipo</th><th>Autor</th><th>Detalle</th><th></th></tr></thead>
      <tbody>${L.map((x, i) => ({ x, i })).reverse().map(({ x, i }) => `<tr><td class="mono">${esc(x.fecha)}</td><td><span class="tag">${esc(x.tipo || "Cambio")}</span></td><td>${esc(x.autor)}</td><td>${esc(x.texto)}</td><td><button class="btn" data-del="${i}" type="button">Quitar</button></td></tr>`).join("")}</tbody></table></div>`;
    $("#cm-ok").onclick = () => {
      const x = $("#cm-x").value.trim(); if (!x) return;
      L.push({ fecha: new Date().toLocaleString("sv-SE").slice(0, 16), tipo: $("#cm-t").value, autor: $("#cm-a").value, texto: x });
      marcar(); RENDER.cambios(el);
    };
    el.onclick = (e) => { const b = e.target.closest("[data-del]"); if (b && confirm("¿Quitar este registro?")) { L.splice(Number(b.dataset.del), 1); marcar(); RENDER.cambios(el); } };
  };

  // ---------- Usuarios ----------
  RENDER.usuarios = (el) => {
    const U = S.datos.usuarios;
    el.innerHTML = `
      <p class="note">Registro de personas con acceso o rol en el sistema. El acceso a este panel se controla con las dos claves; los visitantes del sitio se ven, de forma anónima, en <b>Visitas e interés</b>.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Nombre</th><th>Rol</th><th>Recinto / alcance</th><th>Alta</th><th></th></tr></thead>
      <tbody>${U.map((u, i) => `<tr><td>${esc(u.nombre)}</td><td>${esc(u.rol)}</td><td>${esc(u.alcance)}</td><td class="mono">${esc(u.alta)}</td><td>${i ? `<button class="btn" data-del="${i}" type="button">Quitar</button>` : '<span class="tag ok">Propietario</span>'}</td></tr>`).join("")}</tbody></table></div>
      <div class="card" style="margin-top:16px"><h3>Agregar usuario</h3><div class="filters">
        <label>Nombre<input id="u-n"></label><label>Rol<select id="u-r"><option>Administrador</option><option>Encargado de recinto</option><option>Central de monitoreo</option><option>Técnico</option><option>Consulta</option></select></label>
        <label>Recinto / alcance<input id="u-a" placeholder="p. ej. Oficinas ContenedorEns©"></label><button class="btn primary" id="u-ok" type="button">Agregar</button></div></div>`;
    $("#u-ok").onclick = () => {
      const n = $("#u-n").value.trim(); if (!n) return;
      U.push({ nombre: n, rol: $("#u-r").value, alcance: $("#u-a").value.trim() || "—", alta: new Date().toLocaleDateString("sv-SE") });
      marcar(); RENDER.usuarios(el);
    };
    el.onclick = (e) => { const b = e.target.closest("[data-del]"); if (b && confirm("¿Quitar este usuario?")) { U.splice(Number(b.dataset.del), 1); marcar(); RENDER.usuarios(el); } };
  };

  // ---------- Ejecutivo ----------
  RENDER.ejecutivo = (el) => {
    const f = S.datos.finanzas, c = finanzas();
    el.innerHTML = `
      <div class="grid g2">
        <div class="card"><h3>Presentación para clientes</h3>
          <p>Abre la página pública en modo presentación: una sección por pantalla, flechas para avanzar. No muestra costos ni márgenes.</p>
          <p><a class="btn primary" href="index.html?presentar=1" target="_blank" rel="noopener">Abrir presentación</a></p>
          <h3 style="margin-top:18px">Guion de 60 segundos</h3>
          <ol class="steps">
            <li><div><b>Problema:</b> en sanitarios y vestidores no se pueden poner cámaras; una caída puede pasar desapercibida.</div></li>
            <li><div><b>Dato:</b> 684,000 muertes al año por caídas (OMS); multa STPS de hasta $586,550 MXN.</div></li>
            <li><div><b>Solución:</b> radar sin imagen, pantalla de ocupación y aviso escalonado hasta el 911, 30 días sin luz.</div></li>
            <li><div><b>Oferta:</b> paquete de restaurante ${usd(c.pvp)} USD + ${usd(f.saas)} USD/mes; evaluación del recinto sin costo.</div></li>
          </ol></div>
        <div class="card"><h3>Tablero interno de negocio</h3>
          <div class="tbl-wrap"><table><tbody>
            <tr><td>Precio de venta</td><td class="num">${usd(c.pvp)} · ${mxn(c.pvp * f.fx)}</td></tr>
            <tr><td>Ganancia bruta unitaria</td><td class="num">${usd(c.gan)}</td></tr>
            ${c.fases.map((x) => `<tr><td>EBITDA ${esc(x.nombre)}</td><td class="num">${usd(x.eb)} (${pct(x.mar)})</td></tr>`).join("")}
            <tr><td>Punto de equilibrio Fase 1 (unidades)</td><td class="num">${Math.ceil(c.fases[0].opex / (c.gan + (f.saas - f.esim) * 12))}</td></tr>
          </tbody></table></div>
          <p style="margin-top:12px"><button class="btn" type="button" onclick="window.print()">Imprimir / guardar PDF</button></p></div>
      </div>`;
  };

  // ---------- Ajustes ----------
  RENDER.ajustes = (el) => {
    const T = S.config.tiempos;
    el.innerHTML = `
      <div class="grid g2">
        <div class="card"><h3>Tiempos de escalamiento (página pública)</h3>
          <div class="filters">${["N0", "N1", "N2", "N3"].map((k) => `<label>${k} (s)<input type="number" min="1" data-cfg="${k}" value="${T[k]}"></label>`).join("")}</div>
          <h3>Contador de visitas</h3>
          <div class="filters"><label>Código GoatCounter<input id="aj-gc" value="${esc(S.config.goatcounter || "")}"></label></div>
          <p class="note">Estos ajustes se guardan en datos/config.json (público) al publicar.</p></div>
        <div class="card"><h3>Publicación en GitHub</h3>
          <p>Para guardar cambios desde aquí se necesita un token personal de GitHub (fine-grained) con permiso <b>Contents: Read and write</b> solo sobre <span class="mono">${REPO}</span>.</p>
          <div class="filters"><label style="flex:1">Token<input type="password" id="aj-tk" autocomplete="off" placeholder="github_pat_…" style="width:100%"></label>
          <button class="btn" id="aj-tk-ok" type="button">Usar en esta sesión</button></div>
          <p class="note" id="aj-tk-m">${sessionStorage.getItem("sos_gh") ? "Token cargado para esta sesión." : "Sin token. Se borra al cerrar la pestaña; nunca se guarda en el sitio."}</p>
          <p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Crear token en GitHub</a></p></div>
        <div class="card"><h3>Cambiar claves</h3>
          <div class="filters"><label>Nueva clave de pre-ingreso<input type="password" id="n1" autocomplete="new-password"></label>
          <label>Confirmar<input type="password" id="n1b" autocomplete="new-password"></label></div>
          <div class="filters"><label>Nueva clave de 2.ª autorización<input type="password" id="n2" autocomplete="new-password"></label>
          <label>Confirmar<input type="password" id="n2b" autocomplete="new-password"></label></div>
          <p><button class="btn primary" id="n-ok" type="button">Cambiar claves y publicar</button></p>
          <p class="note" id="n-m">Mínimo 12 caracteres cada una, distintas entre sí. Guárdelas en un gestor de contraseñas: si se pierden, los datos cifrados no se pueden recuperar.</p></div>
      </div>`;
    el.addEventListener("input", (e) => {
      if (e.target.dataset.cfg) { T[e.target.dataset.cfg] = Number(e.target.value); marcar(); }
      if (e.target.id === "aj-gc") { S.config.goatcounter = e.target.value.trim(); marcar(); }
    });
    $("#aj-tk-ok").onclick = () => { const v = $("#aj-tk").value.trim(); if (v) { sessionStorage.setItem("sos_gh", v); $("#aj-tk").value = ""; $("#aj-tk-m").textContent = "Token cargado para esta sesión."; } };
    $("#n-ok").onclick = async () => {
      const a = $("#n1").value, a2 = $("#n1b").value, b = $("#n2").value, b2 = $("#n2b").value, m = $("#n-m");
      if (a.length < 12 || b.length < 12) return (m.textContent = "Cada clave debe tener al menos 12 caracteres.");
      if (a !== a2 || b !== b2) return (m.textContent = "Las confirmaciones no coinciden.");
      if (a === b) return (m.textContent = "Las dos claves deben ser distintas.");
      if (!sessionStorage.getItem("sos_gh")) return (m.textContent = "Primero cargue el token de GitHub.");
      m.textContent = "Derivando llaves…";
      S.salt1 = crypto.getRandomValues(new Uint8Array(16)); S.salt2 = crypto.getRandomValues(new Uint8Array(16));
      S.k1 = await llave(a, S.salt1); S.k2 = await llave(b, S.salt2);
      $$("#n1,#n1b,#n2,#n2b").forEach((x) => (x.value = ""));
      S.datos.cambios.push({ fecha: new Date().toLocaleString("sv-SE").slice(0, 16), tipo: "Cambio", autor: S.datos.usuarios[0]?.nombre || "Admin", texto: "Cambio de claves de acceso." });
      S.sucio = true; await publicar();
    };
  };

  // ---------- Publicar en GitHub ----------
  async function gh(ruta, contenido, mensaje) {
    const tk = sessionStorage.getItem("sos_gh");
    const url = `https://api.github.com/repos/${REPO}/contents/${ruta}`;
    const H = { Authorization: "Bearer " + tk, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    const g = await fetch(url + "?ref=" + RAMA, { headers: H });
    const sha = g.ok ? (await g.json()).sha : undefined;
    const body = { message: mensaje, branch: RAMA, content: b64(te.encode(contenido)), ...(sha ? { sha } : {}) };
    const r = await fetch(url, { method: "PUT", headers: H, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`GitHub respondió ${r.status} al guardar ${ruta}.`);
  }
  async function publicar() {
    const est = $("#estado");
    if (!sessionStorage.getItem("sos_gh")) { abrir("ajustes"); est.innerHTML = '<span class="tag warn">Cargue su token de GitHub en Ajustes</span>'; return; }
    est.innerHTML = '<span class="tag">Cifrando y publicando…</span>';
    try {
      S.datos.actualizado = new Date().toISOString();
      S.config.actualizado = S.datos.actualizado;
      const sobre = await empaquetar();
      await gh("datos/admin.enc.json", JSON.stringify(sobre, null, 1) + "\n", "Panel: actualiza datos cifrados");
      await gh("datos/config.json", JSON.stringify(S.config, null, 2) + "\n", "Panel: actualiza configuración pública");
      S.sucio = false;
      est.innerHTML = '<span class="tag ok">Publicado · el sitio se actualiza en 1–2 min</span>';
    } catch (e) {
      est.innerHTML = `<span class="tag bad">${esc(e.message)}</span>`;
    }
  }

  // ---------- Arranque ----------
  $("#f1").addEventListener("submit", paso1);
  $("#f2").addEventListener("submit", paso2);
  if (!window.isSecureContext || !crypto.subtle) $("#m1").textContent = "Este panel requiere HTTPS.";
})();
