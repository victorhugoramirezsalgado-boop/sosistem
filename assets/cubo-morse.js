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
  botones.forEach((b) => b.addEventListener("click", () => girar(b.dataset.cara)));
  document.getElementById("cm-auto")?.addEventListener("click", auto);
  auto();
})();
