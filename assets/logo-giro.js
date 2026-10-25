/* SOSistem™ — logo giratorio: cubo rojo de 6 caras con palabras vitales en código Morse (UIT-R M.1677-1)
   © Víctor Hugo Ramírez Salgado · Sistema S.O.S.© (Safe Creative 2609046908578)
   Caras: SOS · SOSISTEM · 911 · AYUDA · SALIDA · AVISO. No suena: el Morse de S.O.S.© solo suena en emergencia o pruebas. */
(() => {
  const CARAS = ["SOS", "SOSISTEM", "911", "AYUDA", "SALIDA", "AVISO"];
  const M = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
    N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };
  const f = (v) => +v.toFixed(2);

  // Morse en renglones centrados dentro de la banda inferior de la cara (viewBox 100 × 100)
  function morse(palabra, y0, y1) {
    const letras = [...palabra].map((c) => M[c]).filter(Boolean);
    for (const e of [1, .85, .72, .6, .5]) {
      const r = 3.4 * e, dw = 13 * e, h = 6.8 * e, gi = 3.6 * e, gl = 9 * e, lh = 15 * e;
      const filas = []; let fila = [], x = 0;
      letras.forEach((cod) => {
        const w = [...cod].reduce((a, c) => a + (c === "." ? 2 * r : dw), 0) + gi * (cod.length - 1);
        let sep = fila.length ? gl : 0;
        if (fila.length && x + sep + w > 84) { filas.push({ fila, x }); fila = []; x = 0; sep = 0; }
        fila.push({ x: x + sep, cod }); x += sep + w;
      });
      if (fila.length) filas.push({ fila, x });
      if (filas.length * lh > y1 - y0) continue;
      let out = "", yc = y0 + ((y1 - y0) - filas.length * lh) / 2 + lh / 2;
      filas.forEach(({ fila, x: ancho }) => {
        const dx = 8 + (84 - ancho) / 2;
        fila.forEach(({ x, cod }) => {
          let px = dx + x;
          [...cod].forEach((c) => {
            out += c === "." ? `<circle cx="${f(px + r)}" cy="${f(yc)}" r="${f(r)}"/>` : `<rect x="${f(px)}" y="${f(yc - h / 2)}" width="${f(dw)}" height="${f(h)}" rx="${f(h / 2)}"/>`;
            px += (c === "." ? 2 * r : dw) + gi;
          });
        });
        yc += lh;
      });
      return out;
    }
    return "";
  }
  // Cara del cubo: palabra arriba y su Morse abajo (o solo Morse en grande)
  function cara(palabra, fondo = "#C8102E", tinta = "#fff", soloMorse = false) {
    const txt = palabra.length > 7 && palabra.includes(" ") ? palabra.split(" ").slice(0, 3) : [palabra];
    const fs = Math.min(txt.length > 1 ? 22 : 30, 84 / (0.72 * Math.max(...txt.map((t) => t.length), 1)));
    const tex = soloMorse ? "" : txt.map((t, i) => `<text x="50" y="${f(14 + fs * .78 + i * fs * .95)}" text-anchor="middle" font-family="Archivo, Inter, Arial, sans-serif" font-weight="900" font-size="${f(fs)}" fill="${tinta}">${t}</text>`).join("");
    const yM = soloMorse ? 12 : 18 + fs * .85 + (txt.length - 1) * fs * .95;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="1" y="1" width="98" height="98" rx="20" fill="${fondo}"/>` +
      `<rect x="7" y="7" width="86" height="86" rx="15" fill="none" stroke="${tinta}" stroke-opacity=".35" stroke-width="2"/>` +
      tex + `<g fill="${tinta}">${morse(palabra.replace(/ /g, ""), yM, 90)}</g></svg>`;
  }
  // Texto apto para Morse internacional: mayúsculas, sin acentos ni signos (ISO/IEC 646)
  const normal = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim();

  const LADOS = ["translateZ(var(--lg))", "rotateY(90deg) translateZ(var(--lg))", "rotateY(180deg) translateZ(var(--lg))",
    "rotateY(-90deg) translateZ(var(--lg))", "rotateX(90deg) translateZ(var(--lg))", "rotateX(-90deg) translateZ(var(--lg))"];
  function crear() {
    const el = document.createElement("span");
    el.className = "logo-giro"; el.id = "logo-giro";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "SOSistem™: cubo con SOS, SOSISTEM, 911, AYUDA, SALIDA y AVISO en código Morse");
    el.title = CARAS.map((p) => `${p}  ${[...p].map((c) => M[c]).join(" ")}`).join("\n");
    el.innerHTML = `<span class="lg-cubo">${CARAS.map((p, i) => `<span class="lg-cara" style="transform:${LADOS[i]}">${cara(p)}</span>`).join("")}</span>`;
    return el;
  }
  // Se usa cuando el panel elige el logo «giro» (predeterminado)
  window.SOSLogoGiro = {
    poner() {
      const img = document.getElementById("logo-img");
      if (!img || document.getElementById("logo-giro")) return;
      img.hidden = true; img.after(crear());
    },
    quitar() { document.getElementById("logo-giro")?.remove(); const img = document.getElementById("logo-img"); if (img) img.hidden = false; },
    // Cubo amarillo de los separadores: gira mostrando el nombre de su pestaña y su Morse
    separador(nombre) {
      const p = normal(nombre) || "SOS";
      const el = document.createElement("span");
      el.className = "sep-giro"; el.dataset.palabra = p;
      el.setAttribute("aria-hidden", "true");
      el.title = `${p}  ${p.split(" ").map((w) => [...w].map((c) => M[c]).join(" ")).join(" / ")}`;
      const caras = [cara(p, "#F4C400", "#1B1F27"), cara(p, "#F4C400", "#1B1F27", true), cara(p, "#F4C400", "#1B1F27"), cara(p, "#F4C400", "#1B1F27", true),
        cara("SOS", "#F4C400", "#1B1F27"), cara("SOS", "#F4C400", "#1B1F27")];
      el.innerHTML = `<span class="sg-cubo">${caras.map((c, i) => `<span class="lg-cara" style="transform:${LADOS[i]}">${c}</span>`).join("")}</span>`;
      return el;
    },
  };
})();
