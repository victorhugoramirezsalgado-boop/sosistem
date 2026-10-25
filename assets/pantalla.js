/* Sistema S.O.S.© — simulador de la pantalla S.S.O.S.© · © Víctor Hugo Ramírez Salgado */
(() => {
  const P = document.getElementById("pantalla");
  if (!P) return;
  const $ = (id) => document.getElementById(id);
  const ESTADOS = {
    normal: { gral: ["Normal", "ok"], f2: ["Libre", "ok", ""], a1: "Sin incidentes", a2: "Todas las cabinas en condición segura." },
    advertencia: { gral: ["Advertencia", "warn"], f2: ["Atención", "warn", "Permanencia prolongada en cabina F‑2 (> 10 min)"], a1: "Advertencia · cabina F‑2", a2: "Permanencia mayor a 10 min. Aviso por voz en cabina (N0)." },
    caida: { gral: ["Alerta crítica", "bad"], f2: ["Caída", "bad", "Persona en el piso en cabina F‑2"], a1: "¡Persona en el suelo! · Cabina F‑2", a2: "" },
    sismo: { gral: ["Alerta sísmica", "bad"], f2: ["Evacuar", "bad", "Puerta liberada · salga con calma"], a1: "¡Alerta sísmica! · Evacúe el área", a2: "Siga la luz blanca de evacuación. Puertas de cabinas liberadas." },
  };
  // Sonidos de la pantalla física: SOS en emergencia, SOS + SISMO en desastre natural
  const SONIDO = { advertencia: "AVISO", caida: "SOS SOS", sismo: "SOS SISMO SOS" };
  // Parámetros del equipo por estado (se editan en el panel: pestaña «Sirena y Morse»)
  let ALERTAS = {}, CFG = {};
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    ALERTAS = c.alertas || {}; CFG = c;
    Object.keys(SONIDO).forEach((k) => { if (ALERTAS[k]?.texto) SONIDO[k] = ALERTAS[k].texto; });
    mostrarCodigo(); mapa(); llamada(); ocupacion();
  }).catch(() => {});
  function mostrarCodigo() {
    const pm = document.getElementById("pt-morse"); if (!pm || !window.SOSMorse) return;
    const a = ALERTAS[estado] || {}, txt = SONIDO[estado];
    if (!txt || a.imagen === false || a.morse === false) { pm.innerHTML = ""; return; }
    let info = "";
    if (a.sirena) info += ` · Equipo: sirena ${a.sirena_db} dB × ${a.rafaga_s} s`;
    if (a.cada_s) info += `${info ? "," : " · Equipo:"} repite cada ${a.cada_s} s`;
    pm.innerHTML = "<b>" + txt + "</b> &nbsp;" + SOSMorse.visible(SOSMorse.aMorse(txt)) + "<br><span style='letter-spacing:0'>" + info.replace(/^ · /, "") + "</span>";
  }
  let estado = "caida", t0 = Date.now();
  let TIEMPOS = { N0: 2, N1: 4, N2: 7, N3: 10 };
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => { if (c.tiempos) TIEMPOS = c.tiempos; }).catch(() => {});
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  // Segundos para llamar al 911: los decide el cliente en su panel (web: caída 10 s, sismo 5 s)
  const BASE_911 = { caida: 10, sismo: 5 };
  const seg911 = () => Number(ALERTAS[estado]?.llamada_911_s ?? BASE_911[estado] ?? 0);
  const nivel = (s) => {
    const t911 = seg911() || TIEMPOS.N3;
    return s >= t911 ? "N3 · C5/911 notificado" : s >= TIEMPOS.N2 ? "N2 · central de monitoreo" : s >= TIEMPOS.N1 ? "N1 · encargado notificado" : s >= TIEMPOS.N0 ? "N0 · aviso por voz en cabina" : "confirmando caída (Z < 15 cm)";
  };
  // Textos de la pantalla en el idioma elegido (datos/idiomas.json)
  const ES = { noti_caida: "Persona en el suelo", noti_lugar: "Sanitarios de mujeres · cabina F‑2", ruta_auxilio: "Ruta de auxilio", ruta_traslado: "Ruta de traslado", ruta_evac: "Ruta de evacuación",
    noti_sismo: "Sismo: evacúe por la salida de emergencia más cercana", salida: "Salida de emergencia", llamada_en: "Llamada al 911 en", llamando: "Llamando al 911 · simulación: no se realiza ninguna llamada", reunion: "Punto de reunión", encargado: "Encargado" };
  const tr = (k) => (window.SOSIdioma && SOSIdioma.texto(k)) || ES[k];
  // Plano: 380 unidades ≈ 12.2 m (contenedor de 40 pies). Velocidades estimadas:
  // auxilio a paso rápido 1.5 m/s, traslado con camilla 0.8 m/s, evacuación 1.2 m/s.
  const M_POR_U = 12.2 / 380, VEL = { aux: 1.5, tra: 0.8, ev: 1.2 };
  const largo = (id) => { const p = $(id).getAttribute("points").trim().split(/\s+/).map((x) => x.split(",").map(Number));
    let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L * M_POR_U; };
  const ruta = (id, v) => { const m = largo(id); return { m: Math.round(m), s: Math.ceil(m / v) }; };
  function mapa() {
    const M = $("pt-mapa"); if (!M) return;
    const ver = estado === "caida" || estado === "sismo";
    M.hidden = !ver; $("pt-noti").hidden = !ver; P.classList.toggle("ver-salidas", estado === "sismo");
    if (!ver) return;
    M.dataset.modo = estado;
    // La pantalla física conserva su distribución; solo los textos siguen la dirección del idioma (árabe, hebreo)
    const dir = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
    ["pt-noti", "pt-911", "pt-mapa-ley"].forEach((id) => $(id).setAttribute("dir", dir));
    $("pm-enc").textContent = tr("encargado"); $("pm-reu").textContent = tr("reunion");
    $("pm-salA").textContent = tr("salida") + " A"; $("pm-salB").textContent = tr("salida") + " B";
    const L = (cls, txt, r) => `<span class="pm-l ${cls}"><i></i>${txt} · ${r.m} m · ≈ ${r.s} s</span>`;
    if (estado === "caida") {
      $("pt-n1").textContent = tr("noti_caida"); $("pt-n2").textContent = tr("noti_lugar") + " · ContenedorEns";
      $("pt-mapa-ley").innerHTML = L("aux", tr("ruta_auxilio") + " (" + tr("encargado") + " → F‑2)", ruta("pm-aux", VEL.aux)) + L("tra", tr("ruta_traslado") + " (F‑2 → " + tr("salida") + " B)", ruta("pm-tra", VEL.tra));
    } else {
      $("pt-n1").textContent = tr("noti_sismo"); $("pt-n2").textContent = tr("reunion") + " · ContenedorEns";
      const a = ruta("pm-ev1", VEL.ev), b = ruta("pm-ev2", VEL.ev);
      $("pt-mapa-ley").innerHTML = L("evm", tr("ruta_evac") + " M → " + tr("salida") + " A", a) + L("evf", tr("ruta_evac") + " F → " + tr("salida") + " B", b);
    }
  }
  function llamada() {
    const B = $("pt-911"); if (!B) return;
    const n = seg911(), ver = (estado === "caida" || estado === "sismo") && n > 0;
    B.hidden = !ver; if (!ver) return;
    const s = (Date.now() - t0) / 1000, falta = Math.max(0, Math.ceil(n - s));
    B.classList.toggle("hecha", falta === 0);
    $("pt-911t").textContent = falta ? tr("llamada_en") : tr("llamando");
    $("pt-911n").textContent = falta ? falta + " s" : "";
    $("pt-911b").style.width = Math.min(100, (s / n) * 100) + "%";
  }

  // Sismo: todas las pantallas muestran el personal de todos los recintos y polígonos con módulos
  const OCUP0 = { R1: 9, R2: 5, R3: 6, R4: 4 }; // ocupación de ejemplo al iniciar el sismo
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  function conteo() {
    const s = (Date.now() - t0) / 1000;
    return (CFG.recintos || []).map((r) => {
      const n0 = OCUP0[r.id] ?? Math.round((r.capacidad || 10) * 0.4), T = 4 + n0 * 1.3;
      const dentro = estado === "sismo" ? Math.ceil(n0 * Math.max(0, 1 - s / T)) : n0;
      return { ...r, n0, dentro, fuera: n0 - dentro };
    });
  }
  const DEST = { c5_911: "C5/911", central: "Central de monitoreo", proteccion_civil: "Protección Civil", encargados: "Encargados", otros_recintos: "Otros recintos", pantalla_exterior: "Pantalla exterior" };
  function ocupacion() {
    const O = $("pt-ocup"); if (!O) return;
    const dir = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
    const R = conteo(), ver = estado === "sismo" && R.length;
    O.hidden = !ver;
    if (ver) {
      O.setAttribute("dir", dir);
      const tot = R.reduce((a, r) => a + r.dentro, 0), tf = R.reduce((a, r) => a + r.fuera, 0);
      $("pt-ocup-t").textContent = `${tr("ocup_tit")} · ${tr("dentro")} ${tot} · ${tr("fuera")} ${tf}` + (tot === 0 ? ` · ✓ ${tr("todos_fuera")}` : "");
      $("pt-ocup-l").innerHTML = R.map((r) => `<div class="po-r${r.dentro ? "" : " ok"}"><span><b>${esc(r.id)} · ${esc(r.nombre)}</b><small>${esc(r.poligono)}</small></span><em>${r.dentro ? tr("dentro") + " " + r.dentro : "✓ " + tr("todos_fuera")}</em><i style="width:${r.n0 ? (r.fuera / r.n0) * 100 : 100}%"></i></div>`).join("");
    }
    // Nube: con quién comparte el cliente este evento
    const N = $("pt-nube"), regla = (CFG.nube || {})[estado];
    N.hidden = !regla;
    if (regla) { N.setAttribute("dir", dir); N.textContent = "☁ " + tr("nube_tit") + ": " + (Object.keys(DEST).filter((k) => regla[k]).map((k) => DEST[k]).join(" · ") || "—"); }
    // Pantalla exterior: solo con sismo/evento natural, o si el cliente decide encenderla
    const E = $("pantalla-ext"), X = CFG.pantalla_exterior; if (!E) return;
    E.hidden = !(X && X.instalada);
    if (!X) return;
    const on = (estado === "sismo" && X.encender_con_naturales) || X.encendida_por_cliente;
    E.dataset.on = on ? (estado === "sismo" ? "sismo" : "1") : "0";
    E.setAttribute("dir", dir);
    $("pe-tit").textContent = tr("ext_tit");
    if (!on) { $("pe-cuerpo").textContent = tr("ext_off"); return; }
    if (estado !== "sismo") { $("pe-cuerpo").innerHTML = "<b>Sistema S.O.S.©</b>"; return; }
    const tot = R.reduce((a, r) => a + r.dentro, 0);
    $("pe-cuerpo").innerHTML = `<b>${esc(tr("ext_msg"))}</b><span>${esc(X.mensaje || "")}</span>` +
      (X.mostrar_ocupacion ? `<span class="pe-n">${esc(tr("dentro"))}: ${tot}${tot === 0 ? " · ✓ " + esc(tr("todos_fuera")) : ""}</span>` : "");
  }

  function pinta() {
    const e = ESTADOS[estado];
    P.dataset.estado = estado;
    $("pt-gral").textContent = e.gral[0]; $("pt-gral").className = e.gral[1];
    $("pt-f2s").textContent = e.f2[0]; $("pt-f2s").className = "st " + e.f2[1];
    $("pt-f2t").textContent = e.f2[2] ? " · " + e.f2[2] : "";
    $("pt-a1").textContent = e.a1;
    // En sismo, todas las cabinas pasan a «Evacuar»
    P.querySelectorAll(".pt-row .st").forEach((s) => {
      if (s.id === "pt-f2s") return;
      s.textContent = estado === "sismo" ? "Evacuar" : "Libre";
      s.className = "st " + (estado === "sismo" ? "bad" : "ok");
    });
    document.querySelectorAll("[data-estado]").forEach((b) => b.tagName === "BUTTON" && b.classList.toggle("primary", b.dataset.estado === estado));
    mapa();
    tick();
  }
  function tick() {
    $("pt-hora").textContent = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    if (estado === "caida") {
      const s = Math.floor((Date.now() - t0) / 1000);
      $("pt-a2").textContent = `Tiempo inmóvil ${mmss(s)} · ${nivel(s)}`;
    } else $("pt-a2").textContent = ESTADOS[estado].a2;
    llamada();
    ocupacion();
  }
  document.querySelectorAll("button[data-estado]").forEach((b) => b.addEventListener("click", () => {
    estado = b.dataset.estado; t0 = Date.now(); pinta();
    // En la web esto es una simulación: suena solo si el cliente activó su módulo de pruebas
    if (!window.SOSMorse) return;
    const luz = P.querySelector(estado === "sismo" ? ".pt-ley .w" : estado === "advertencia" ? ".pt-ley .y" : ".pt-ley .r");
    mostrarCodigo();
    const prueba = document.getElementById("sim-sonido")?.checked, a = ALERTAS[estado] || {};
    if (SONIDO[estado]) SOSMorse.reproducir(a.morse === false ? "" : SONIDO[estado], luz, { motivo: prueba ? "prueba-cliente" : "",
      volumen: (a.volumen ?? 100) / 100, sirenaSeg: prueba && a.sirena ? Math.min(2, a.rafaga_s || 0) : 0, sirenaVolumen: a.sirena ? ((a.sirena_db || 105) - 60) / 45 : 0 });
    else SOSMorse.detener();
  }));
  document.getElementById("sim-sonido")?.addEventListener("change", (e) => { if (!e.target.checked) window.SOSMorse?.detener(); });
  document.addEventListener("sos-idioma", () => { mapa(); llamada(); ocupacion(); });
  pinta();
  mostrarCodigo();
  setInterval(tick, 250);
})();
