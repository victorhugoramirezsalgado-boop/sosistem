/* Sistema S.O.S.© — Cubo de 12 servicios (una arista por servicio, 8 vértices de aviso) · © Víctor Hugo Ramírez Salgado
   Los textos viven en el HTML (se traducen con el selector de idioma); este script solo dibuja y enlaza el cubo. */
(() => {
  const svg = document.getElementById("s12-cubo"), lista = document.getElementById("s12-lista");
  if (!svg || !lista) return;
  const NS = "http://www.w3.org/2000/svg";
  const V = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const cards = [...lista.querySelectorAll(".s12-card")];
  const A = cards.map((c) => c.dataset.a.split(",").map(Number));
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let rx = -0.45, ry = 0.6, sel = 0, tocado = false, arrastre = null, movido = false;

  function proy([x, y, z]) {
    let c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c];
    const k = 92 / (1 + z * 0.18);
    return [190 + x * k, 150 + y * k, z];
  }
  function el(tag, at) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; }

  function dibujar() {
    const p = V.map(proy);
    const prof = (i) => (p[A[i][0]][2] + p[A[i][1]][2]) / 2;
    const orden = A.map((_, i) => i).sort((a, b) => prof(b) - prof(a));
    svg.textContent = "";
    for (const i of orden) {
      const [a, b] = A[i];
      svg.append(el("line", { x1: p[a][0], y1: p[a][1], x2: p[b][0], y2: p[b][1], class: "s12-ar" + (prof(i) > 0.3 ? " atras" : "") + (i === sel ? " on" : "") }));
    }
    p.forEach((q) => svg.append(el("circle", { cx: q[0], cy: q[1], r: 4, class: "s12-vx" })));
    for (const i of orden) {
      const [a, b] = A[i], mx = (p[a][0] + p[b][0]) / 2, my = (p[a][1] + p[b][1]) / 2;
      const g = el("g", { class: "s12-bt" + (i === sel ? " on" : ""), "data-i": i, role: "button", tabindex: "0", "aria-label": String(i + 1) });
      g.append(el("circle", { cx: mx, cy: my, r: 13 }));
      const t = el("text", { x: mx, y: my + 4.5, "text-anchor": "middle" }); t.textContent = i + 1; g.append(t);
      svg.append(g);
    }
  }
  function elegir(i, desde) {
    sel = i;
    cards.forEach((c, j) => { c.classList.toggle("on", j === i); c.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    dibujar();
    if (desde === "cubo") cards[i].scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "nearest" });
  }

  svg.addEventListener("pointerdown", (e) => { tocado = true; movido = false; arrastre = [e.clientX, e.clientY]; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre[0], dy = e.clientY - arrastre[1];
    if (Math.abs(dx) + Math.abs(dy) > 3) movido = true;
    ry += dx * 0.01; rx = Math.max(-1.4, Math.min(1.4, rx - dy * 0.01));
    arrastre = [e.clientX, e.clientY]; dibujar();
  });
  svg.addEventListener("pointerup", (e) => {
    arrastre = null;
    if (movido) return;
    const g = document.elementFromPoint(e.clientX, e.clientY)?.closest(".s12-bt");
    if (g) elegir(+g.dataset.i, "cubo");
  });
  svg.addEventListener("pointercancel", () => { arrastre = null; });
  svg.addEventListener("keydown", (e) => {
    const g = e.target.closest?.(".s12-bt");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); elegir(+g.dataset.i, "cubo"); }
  });
  cards.forEach((c, i) => c.addEventListener("click", () => { tocado = true; elegir(i, "lista"); }));

  // Giro suave hasta que la persona toque el cubo (se detiene si prefiere menos movimiento)
  if (!quieto) {
    const girar = () => { if (!tocado && !svg.closest("section").hidden) { ry += 0.004; dibujar(); } requestAnimationFrame(girar); };
    requestAnimationFrame(girar);
  }
  elegir(0);
})();
