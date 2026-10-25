/* Sistema S.O.S.© — simulador de la pantalla S.S.O.S.© · © Víctor Hugo Ramírez Salgado */
(() => {
  const P = document.getElementById("pantalla");
  if (!P) return;
  const $ = (id) => document.getElementById(id);
  const ESTADOS = {
    normal: { gral: ["Normal", "ok"], f2: ["Libre", "ok", ""], a1: "Sin incidentes", a2: "Todas las cabinas en condición segura." },
    advertencia: { gral: ["Advertencia", "warn"], f2: ["Atención", "warn", "Permanencia prolongada en cabina F‑2 (> 10 min)"], a1: "Advertencia · cabina F‑2", a2: "Permanencia mayor a 10 min. Aviso por voz en cabina (N0)." },
    caida: { gral: ["Alerta crítica", "bad"], f2: ["Caída", "bad", "Persona en el piso en cabina F‑2"], a1: "¡Persona caída detectada! · Cabina F‑2", a2: "" },
    sismo: { gral: ["Alerta sísmica", "bad"], f2: ["Evacuar", "bad", "Puerta liberada · salga con calma"], a1: "¡Alerta sísmica! · Evacúe el área", a2: "Siga la luz blanca de evacuación. Puertas de cabinas liberadas." },
  };
  // Sonidos de la pantalla física: SOS en emergencia, SOS + SISMO en desastre natural
  const SONIDO = { advertencia: "AVISO", caida: "SOS SOS", sismo: "SOS SISMO SOS" };
  // Parámetros del equipo por estado (se editan en el panel: pestaña «Sirena y Morse»)
  let ALERTAS = {};
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    ALERTAS = c.alertas || {};
    Object.keys(SONIDO).forEach((k) => { if (ALERTAS[k]?.texto) SONIDO[k] = ALERTAS[k].texto; });
    mostrarCodigo();
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
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  const nivel = (s) => (s >= 200 ? "N3 · C5/911 notificado" : s >= 110 ? "N2 · central de monitoreo" : s >= 50 ? "N1 · encargado notificado" : s >= 20 ? "N0 · aviso por voz en cabina" : "confirmando caída (Z < 15 cm)");

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
    tick();
  }
  function tick() {
    $("pt-hora").textContent = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    if (estado === "caida") {
      const s = Math.floor((Date.now() - t0) / 1000) + 30;
      $("pt-a2").textContent = `Tiempo inmóvil ${mmss(s)} · ${nivel(s)}`;
    } else $("pt-a2").textContent = ESTADOS[estado].a2;
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
  pinta();
  mostrarCodigo();
  setInterval(tick, 1000);
})();
