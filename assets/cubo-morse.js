/* Cubo Morse de 12 caras (6 exteriores + 6 interiores) · © Víctor Hugo Ramírez Salgado
   Al tocar una cara se escucha y destella su Morse (motivo «cubo»). */
(() => {
  const cubo = document.getElementById("cm-cubo");
  if (!cubo) return;
  // Vista exterior: la cara mira al usuario. Vista interior: se mira la pared opuesta por dentro.
  const EXT = { frente: "rotateX(-12deg) rotateY(-12deg)", derecha: "rotateX(-12deg) rotateY(-90deg)",
    "atrás": "rotateX(-12deg) rotateY(-180deg)", izquierda: "rotateX(-12deg) rotateY(90deg)",
    arriba: "rotateX(-90deg) rotateY(0deg)", abajo: "rotateX(90deg) rotateY(0deg)" };
  const OPUESTO = { frente: "atrás", "atrás": "frente", derecha: "izquierda", izquierda: "derecha", arriba: "abajo", abajo: "arriba" };
  const botones = document.querySelectorAll(".cm-lista button");
  const bExt = document.getElementById("cm-ver-ext"), bInt = document.getElementById("cm-ver-int");

  function vista(interior) {
    cubo.classList.toggle("ver-interior", interior);
    bExt?.setAttribute("aria-pressed", String(!interior));
    bInt?.setAttribute("aria-pressed", String(interior));
  }
  function auto() {
    cubo.style.transform = "";
    cubo.classList.add("auto");
    botones.forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  botones.forEach((b) => b.addEventListener("click", () => {
    const interior = b.dataset.capa === "int";
    vista(interior);
    cubo.classList.remove("auto");
    cubo.style.transform = interior ? EXT[OPUESTO[b.dataset.lado]] : EXT[b.dataset.lado];
    botones.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const capa = cubo.querySelector(`.cm-capa[data-cara="${b.dataset.cara}"]`);
    const palabra = (b.querySelector("span")?.textContent || "");
    const texto = b.querySelector("b").textContent.replace(/^\d+\.\s*/, "").replace(/[™©.]/g, "");
    if (window.SOSMorse && capa) SOSMorse.reproducir(texto, capa, { boton: b, motivo: "cubo", volumen: 0.8 });
    b.title = palabra;
  }));
  bExt?.addEventListener("click", () => vista(false));
  bInt?.addEventListener("click", () => vista(true));
  document.getElementById("cm-auto")?.addEventListener("click", () => { window.SOSMorse?.detener(); auto(); });
  auto();
})();
