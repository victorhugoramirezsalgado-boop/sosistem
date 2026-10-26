/* Sistema S.O.S.© — Cubo de 12 servicios: 6 caras exteriores (salvar vidas) y 6 interiores (negocio rentable)
   © Víctor Hugo Ramírez Salgado. Los títulos se leen de las tarjetas del HTML, así cambian con el idioma elegido. */
(() => {
  const cubo = document.getElementById("s12-3d"), esc = document.getElementById("s12-esc"), lista = document.getElementById("s12-lista");
  if (!cubo || !esc || !lista) return;
  const cards = [...lista.querySelectorAll(".s12-card")];
  const bExt = document.getElementById("s12-ver-ext"), bInt = document.getElementById("s12-ver-int");
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Caras del cubo y el giro que las pone de frente
  const LADOS = [
    { c: "frente", t: "rotateY(0deg)", v: [0, 0] }, { c: "derecha", t: "rotateY(90deg)", v: [0, -90] },
    { c: "atras", t: "rotateY(180deg)", v: [0, -180] }, { c: "izquierda", t: "rotateY(-90deg)", v: [0, 90] },
    { c: "arriba", t: "rotateX(90deg)", v: [-90, 0] }, { c: "abajo", t: "rotateX(-90deg)", v: [90, 0] }];
  const capa = (k) => cards.map((c, i) => [c, i]).filter(([c]) => c.dataset.capa === k).map(([, i]) => i);
  const GRUPO = { ext: capa("ext"), int: capa("int") };
  let interior = false, sel = -1, rx = -18, ry = -28, tocado = false, arrastre = null, movido = false;

  cubo.innerHTML = LADOS.map((l, j) => `<div class="s12-cara" data-j="${j}" style="transform:${l.t} translateZ(var(--s12-m))"><span class="s12-cn"></span><b></b><small></small></div>`).join("");
  const caras = [...cubo.children];

  function textos() {
    const g = GRUPO[interior ? "int" : "ext"];
    caras.forEach((f, j) => {
      const c = cards[g[j]]; if (!c) return;
      f.dataset.i = g[j];
      f.querySelector(".s12-cn").textContent = c.dataset.n;
      f.querySelector("b").textContent = c.querySelector("b").textContent;
      f.querySelector("small").textContent = c.querySelector(".s12-tag").textContent;
      f.classList.toggle("on", g[j] === sel);
    });
    cubo.classList.toggle("int", interior);
    bExt.setAttribute("aria-pressed", String(!interior));
    bInt.setAttribute("aria-pressed", String(interior));
  }
  const pintar = () => { cubo.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };

  function vista(int) { interior = int; textos(); }
  function elegir(i, desde) {
    sel = i;
    const int = cards[i].dataset.capa === "int";
    if (int !== interior) vista(int); else textos();
    cards.forEach((c, j) => { c.classList.toggle("on", j === i); c.setAttribute("aria-pressed", String(j === i)); });
    if (desde === "lista") {
      tocado = true;
      const j = GRUPO[int ? "int" : "ext"].indexOf(i);
      [rx, ry] = LADOS[j].v; rx = rx || -12; ry = ry === 0 || Math.abs(ry) === 180 ? ry - 12 : ry;
      cubo.classList.add("anim"); pintar(); setTimeout(() => cubo.classList.remove("anim"), 600);
    } else cards[i].scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "nearest" });
  }

  esc.addEventListener("pointerdown", (e) => { tocado = true; movido = false; arrastre = [e.clientX, e.clientY]; esc.setPointerCapture(e.pointerId); });
  esc.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre[0], dy = e.clientY - arrastre[1];
    if (Math.abs(dx) + Math.abs(dy) > 4) movido = true;
    ry += dx * 0.5; rx = Math.max(-90, Math.min(90, rx - dy * 0.5));
    arrastre = [e.clientX, e.clientY]; pintar();
  });
  esc.addEventListener("pointerup", (e) => {
    arrastre = null;
    if (movido) return;
    esc.releasePointerCapture?.(e.pointerId);
    const f = document.elementFromPoint(e.clientX, e.clientY)?.closest(".s12-cara");
    if (f && f.dataset.i) elegir(+f.dataset.i, "cubo");
  });
  esc.addEventListener("pointercancel", () => { arrastre = null; });
  bExt.addEventListener("click", () => vista(false));
  bInt.addEventListener("click", () => vista(true));
  cards.forEach((c, i) => c.addEventListener("click", () => elegir(i, "lista")));
  // Al cambiar de idioma se traducen las tarjetas: se copian de nuevo a las caras
  new MutationObserver(() => requestAnimationFrame(textos)).observe(lista, { subtree: true, characterData: true, childList: true });

  if (!quieto) {
    const girar = () => { if (!tocado && !esc.closest("section").hidden) { ry -= 0.25; pintar(); } requestAnimationFrame(girar); };
    requestAnimationFrame(girar);
  }
  textos(); pintar();
})();
