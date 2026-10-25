/* Cubo Morse© — logo en 3D · © Víctor Hugo Ramírez Salgado */
(() => {
  const cubo = document.getElementById("cm-cubo");
  if (!cubo) return;
  const GIROS = {
    sos: "rotateX(-12deg) rotateY(-12deg)", eco: "rotateX(-12deg) rotateY(-90deg)",
    ssos: "rotateX(-12deg) rotateY(-180deg)", arsa: "rotateX(-12deg) rotateY(90deg)",
    inter: "rotateX(-90deg) rotateY(0deg)", cont: "rotateX(90deg) rotateY(0deg)",
  };
  const botones = document.querySelectorAll(".cm-lista button");
  function girar(id) {
    cubo.classList.remove("auto");
    cubo.style.transform = GIROS[id];
    botones.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cara === id)));
  }
  function auto() {
    cubo.style.transform = "";
    cubo.classList.add("auto");
    botones.forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  const ORDEN = ["sos", "eco", "ssos", "arsa", "inter", "cont"];   // mismo orden que las caras en la página
  const caras = cubo.querySelectorAll(".cm-cara");
  botones.forEach((b) => b.addEventListener("click", () => {
    girar(b.dataset.cara);
    // La cara destella el nombre del proyecto en Morse (sin sonido: la regla solo permite sonido en emergencias y pruebas)
    const nombre = (b.querySelector("b")?.textContent || "").replace(/[™©.]/g, "");
    if (window.SOSMorse) SOSMorse.reproducir(nombre, caras[ORDEN.indexOf(b.dataset.cara)], { boton: b });
  }));
  document.getElementById("cm-auto")?.addEventListener("click", () => { window.SOSMorse?.detener(); auto(); });
  auto();
})();
