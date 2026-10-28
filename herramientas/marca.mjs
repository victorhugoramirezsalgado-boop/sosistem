// SOSistem™ · Marca común de todo lo que se genera (PDF, imágenes): logo naranja vigente, «SOS» en Morse,
// braille y banderas, y marcas © / ™ en cada mención. © Víctor Hugo Ramírez Salgado
import fs from "fs";

export const NAR = "#DB641C";
// Logo vigente del sitio (sello naranja con S.O.S. en Morse) — el mismo de la cabecera de sosistem.com
export const logoSello = () => "data:image/svg+xml;base64," + fs.readFileSync("assets/logo-sello.svg").toString("base64");
export const logoSelloSvg = () => fs.readFileSync("assets/logo-sello.svg", "utf8");

// Braille (puntos 1–6): S = 2·3·4, O = 1·3·5
const BR = { S: [2, 3, 4], O: [1, 3, 5] };
export function braille(txt = "SOS", alto = 34) {
  const pos = { 1: [0, 0], 2: [0, 1], 3: [0, 2], 4: [1, 0], 5: [1, 1], 6: [1, 2] };
  return [...txt].map((L) => {
    let c = "";
    for (let d = 1; d <= 6; d++) { const [x, y] = pos[d], on = (BR[L] || []).includes(d); c += `<circle cx="${6 + x * 10}" cy="${6 + y * 10}" r="${on ? 3.6 : 1.6}" fill="${on ? "#0f1b2d" : "#b8c0cc"}"/>`; }
    return `<svg viewBox="0 0 22 32" height="${alto}" width="${alto * 0.69}" role="img" aria-label="Braille ${L}">${c}</svg>`;
  }).join("");
}
export const MORSE_SOS = "··· ––– ···";

// Banderas del Código Internacional de Señales: se toman del mismo script del sitio (assets/banderas.js)
export async function banderas(navegador, txt = "SOS", alto = 34) {
  const p = await navegador.newPage();
  await p.setContent("<html><body></body></html>");
  await p.addScriptTag({ path: "assets/cubo-rt.js" });
  await p.addScriptTag({ path: "assets/banderas.js" });
  const html = await p.evaluate(([t, a]) => (window.SOSBanderas ? window.SOSBanderas.mensaje(t, a) : ""), [txt, alto]);
  await p.close();
  return html;
}

// Emblema: logo naranja grande con «SOS» escrito, y SOS en Morse, braille y banderas
export const emblemaCss = `
.emb{display:flex;gap:14px;align-items:center;border-bottom:4px solid ${NAR};padding-bottom:8px}
.emb-logo{display:flex;flex-direction:column;align-items:center;gap:2px}.emb-logo img{width:92px;height:92px;display:block}
.emb-logo b{font:900 20pt/1 Inter,Arial,sans-serif;letter-spacing:.18em;color:${NAR};margin-left:.18em}
.emb-txt{flex:1;min-width:0}
.emb-sos{display:flex;gap:8px;margin-top:6px}.emb-sos div{border:1px solid #f0c8ae;background:#fff7f1;border-radius:6px;padding:3px 8px;display:flex;flex-direction:column;align-items:center;gap:2px}
.emb-sos small{font:700 6.6pt Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8a4a20}
.emb-sos .m{font:900 19pt/1.1 ui-monospace,Menlo,monospace;color:${NAR};letter-spacing:.06em}
.emb-sos div>span{display:flex;gap:4px;align-items:center;min-height:32px}.emb-sos .ics-pal{display:inline-flex;gap:3px}.emb-sos svg{display:block}`;
export function emblema({ titulo, sub, flags }) {
  return `<div class="emb"><div class="emb-logo"><img src="${logoSello()}" alt="SOSistem™"><b>SOS</b></div>
  <div class="emb-txt"><h1>${titulo}</h1><p class="sub">${sub}</p>
    <div class="emb-sos"><div><small>Morse</small><span class="m">${MORSE_SOS}</span></div><div><small>Braille</small><span>${braille("SOS", 30)}</span></div><div><small>Banderas · Código Internacional de Señales</small><span>${flags}</span></div></div></div></div>`;
}

// © y ™ en cada mención de las obras registradas (solo en el texto, nunca dentro de etiquetas o enlaces)
const MARCAS = [
  [/SOSistem(?![™©])/g, "SOSistem™"],
  [/(?<![\w.])S\.S\.O\.S\.(?![™©])/g, "S.S.O.S.©"],
  [/(?<![\w.])S\.O\.S\.(?![™©])/g, "S.O.S.©"],
  [/ContenedorEns(?![™©])/g, "ContenedorEns©"],
  [/Arsa Bodegas(?![™©])/g, "Arsa Bodegas©"],
  [/Cubo Morse(?![™©])/g, "Cubo Morse©"],
  [/Código Cúbico(?![™©])/g, "Código Cúbico©"],
  [/Código de comunicación del Cubo \(33\)(?![™©])/g, "Código de comunicación del Cubo (33)©"],
  [/Econotopía(?![™©])/g, "Econotopía©"],
  [/1ntertopía(?![™©])/g, "1ntertopía©"],
  [/(?<!1)Intertopía(?![™©])/g, "Intertopía©"],
  [/Cubo SOSistem™(?![™©])/g, "Cubo SOSistem™"],
];
export function marcas(html) {
  const fix = (t) => MARCAS.reduce((s, [r, v]) => s.replace(r, v), t);
  return html.replace(/(<style[\s\S]*?<\/style>)|(<script[\s\S]*?<\/script>)|(<[^>]+>)|([^<]+)/g, (m, st, sc, tag, txt) => (txt ? fix(txt) : m));
}
