/* Sistema S.O.S.© — simulador de la pantalla S.S.O.S.© · © Víctor Hugo Ramírez Salgado */
(() => {
  const P = document.getElementById("pantalla");
  if (!P) return;
  const $ = (id) => document.getElementById(id);
  const ESTADOS = {
    normal: { gral: ["Normal", "ok"], f2: ["Libre", "ok", ""], a1: "Sin incidentes", a2: "Todas las cabinas en condición segura." },
    advertencia: { gral: ["Advertencia", "warn"], f2: ["Atención", "warn", "Permanencia prolongada en cabina F‑2 (> 10 min)"], a1: "Advertencia · cabina F‑2", a2: "Permanencia mayor a 10 min. Aviso por voz en cabina (N0)." },
    caida: { gral: ["Alerta crítica", "bad"], f2: ["Caída", "bad", "Persona en el piso en cabina F‑2"], a1: "¡Persona caída detectada! · Cabina F‑2", a2: "" },
  };
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
    // La sirena de la pantalla física emite SOS; aquí suena al tocar (··· ––– ··· dos veces)
    if (window.SOSMorse) { if (estado === "caida") SOSMorse.reproducir("SOS SOS", P.querySelector(".pt-ley .r")); else SOSMorse.detener(); }
  }));
  pinta();
  setInterval(tick, 1000);
})();
