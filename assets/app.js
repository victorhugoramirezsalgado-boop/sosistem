/* Sistema S.O.S.© — página pública: modo presentación */
(function () {
  const slides = () => Array.from(document.querySelectorAll("section.slide"));
  let i = 0;

  function ir(n) {
    const s = slides();
    i = Math.max(0, Math.min(s.length - 1, n));
    s[i].scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function actual() {
    const s = slides();
    const y = window.scrollY + window.innerHeight / 3;
    let k = 0;
    s.forEach((el, idx) => { if (el.offsetTop <= y) k = idx; });
    return k;
  }
  function entrar() {
    document.body.classList.add("present");
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    ir(actual());
  }
  function salir() {
    document.body.classList.remove("present");
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }

  document.getElementById("btn-presentar")?.addEventListener("click", entrar);
  document.getElementById("btn-salir")?.addEventListener("click", salir);
  document.querySelectorAll("[data-nav]").forEach((b) =>
    b.addEventListener("click", () => ir(actual() + Number(b.dataset.nav))));
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) document.body.classList.remove("present"); });
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("present")) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); ir(actual() + 1); }
    if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); ir(actual() - 1); }
    if (e.key === "Escape") salir();
  });

  // Abrir directo en modo presentación (desde el panel: index.html?presentar=1)
  if (new URLSearchParams(location.search).get("presentar") === "1") {
    document.body.classList.add("present");
    setTimeout(() => ir(0), 50);
  }

  // Tiempos de escalamiento configurados desde el panel de administración
  fetch("datos/config.json", { cache: "no-store" }).then((r) => r.json()).then((c) => {
    Object.entries(c.tiempos || {}).forEach(([k, v]) => {
      const el = document.querySelector(`[data-t="${k}"]`);
      if (el && Number(v) > 0) el.textContent = v;
    });
  }).catch(() => {});
})();
