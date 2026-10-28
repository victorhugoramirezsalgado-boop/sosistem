// SOSistem™ · Resumen ejecutivo global (PDF con índice, siglas y referencias APA 7.ª ed.) · © Víctor Hugo Ramírez Salgado
// Presentación mundial en varios idiomas. El texto vive en datos/resumen/<idioma>.json (mismas claves en todos);
// este programa solo arma las hojas. Se regenera con cada versión publicada.
// Uso: servir la raíz del sitio en http://localhost:8765 y correr: node herramientas/ejecutiva-global.mjs [es en fr …]
//      →  assets/resumen-ejecutivo-global-sosistem-<idioma>.pdf  (y en español también assets/resumen-ejecutivo-global-sosistem.pdf)
import { createRequire } from "module";
import fs from "fs";
import { logoSello, marcas, idiomasCss, fotoTerminal, NAR } from "./marca.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");

const V = JSON.parse(fs.readFileSync("datos/version.json", "utf8"));
const C = JSON.parse(fs.readFileSync("datos/config.json", "utf8"));
const IDI = JSON.parse(fs.readFileSync("datos/idiomas.json", "utf8")).idiomas;
const ver = V.version, anio = new Date().getFullYear();
const T = { N0: 2, N1: 4, N2: 7, N3: 10, ...(C.tiempos || {}) };
const S = "https://sosistem.com/";
const pedidos = process.argv.slice(2);
const IDIOMAS = (pedidos.length ? pedidos : fs.readdirSync("datos/resumen").filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))).sort((a, b) => (a === "es" ? -1 : b === "es" ? 1 : a.localeCompare(b)));
const img = (f) => "data:image/webp;base64," + fs.readFileSync("assets/img/" + f).toString("base64");

const b = await chromium.launch();
const celular = await fotoTerminal(b);

// ---------- Gráficas (SVG) ----------
function barras(datos, { ancho = 300, alto = 120, color = "#005387", fmt = (v) => v } = {}) {
  const max = Math.max(...datos.map((d) => d[1])), bw = (ancho - 20) / datos.length;
  return `<svg viewBox="0 0 ${ancho} ${alto + 30}" width="100%" role="img">` + datos.map(([et, v, c], i) => {
    const h = (v / max) * alto, x = 10 + i * bw + bw * 0.18, w = bw * 0.64, y = alto - h + 10;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c || color}"/><text x="${x + w / 2}" y="${y - 3}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f1b2d">${fmt(v)}</text><text x="${x + w / 2}" y="${alto + 25}" text-anchor="middle" font-size="9.5" fill="#334155">${et}</text>`;
  }).join("") + `<line x1="6" y1="${alto + 10}" x2="${ancho - 6}" y2="${alto + 10}" stroke="#9aa5b5"/></svg>`;
}

function documento(L) {
  const hoy = new Date().toLocaleDateString(L.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "America/Tijuana" });
  const num = (v, d = 1) => Number(v).toLocaleString(L.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const kpi = (v, t, f, c = "") => `<div class="k ${c}"><b>${v}</b><span>${t}</span><small>${f}</small></div>`;
  const K = L.c, pie = (t) => `<footer class="f">${t}</footer>`;
  const SEC = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
  const idiomas = Object.entries(IDI).map(([c, v]) => `<span dir="${v.dir || "ltr"}" lang="${c}">${String(v.nombre).replace(/\s*\(.*\)\s*/, "").replace(/\s*\/.*$/, "")}</span>`).join("");
  const fig = (f, p) => `<figure><img src="${img(f)}" alt=""><figcaption>${p}</figcaption></figure>`;
  const g60 = barras([["2020", 1.0], ["2030", 1.4], ["2050", 2.1]], { fmt: (v) => num(v) });
  const gew = barras([[L.graf_ew_a, 1, "#15803D"], [L.graf_ew_b, 6, "#D9221A"]], { fmt: (v) => (v === 1 ? "1×" : "≈ 6×") });

  const portada = `<section class="h">
  <div class="cab"><div class="cab-l"><img src="${logoSello()}" alt="SOSistem™"><b>SOS</b></div>
    <div><h1>${L.doc_titulo} · SOSistem™</h1><p class="sub">${L.doc_sub} · ${L.version} ${ver} · ${hoy}</p></div></div>
  <div class="idi"><div class="idi-t"><b>${L.idiomas_n}</b></div><div class="idi-l">${idiomas}</div><div class="idi-s"><b>${L.lsm_t}</b><span>${L.lsm_d}</span></div></div>
  <div class="obj"><b>${L.proposito_t}</b>${L.proposito}</div>
  <div class="niv3">
    <div class="nv g"><h3>${L.nivel_global}</h3>${kpi(L.k_g1_v, L.k_g1_t, L.k_g1_f, "r")}${kpi(L.k_g2_v, L.k_g2_t, L.k_g2_f, "r")}${kpi(L.k_g3_v, L.k_g3_t, L.k_g3_f, "n")}</div>
    <div class="nv m"><h3>${L.nivel_nacional}</h3>${kpi(L.k_n1_v, L.k_n1_t, L.k_n1_f)}${kpi(L.k_n2_v, L.k_n2_t, L.k_n2_f)}${kpi(L.k_n3_v, L.k_n3_t, L.k_n3_f, "n")}</div>
    <div class="nv l"><h3>${L.nivel_local}</h3>${kpi(L.k_l1_v, L.k_l1_t, L.k_l1_f)}${kpi(L.k_l2_v, L.k_l2_t, L.k_l2_f)}${kpi(L.k_l3_v, L.k_l3_t, L.k_l3_f, "a")}</div>
  </div>
  <div class="por2"><div><div class="graf"><b>${L.graf_60_t}</b>${g60}<small>${L.graf_60_f}</small></div>
    <h2>${L.indice}</h2><table class="idx"><tbody>${SEC.map((s, i) => `<tr><td><a href="#${s}">${L[s]}</a></td><td class="pg">${i + 2}</td></tr>`).join("")}</tbody></table></div>
    ${celular ? `<figure class="tel"><img src="${celular}" alt=""><figcaption>${L.cel_foto}</figcaption></figure>` : ""}</div>
  ${pie(`© ${anio} Víctor Hugo Ramírez Salgado · ${L.portada_pie}`)}
</section>`;

  const s0 = `<section class="h" id="s0"><h2 class="t">${L.s0}</h2>
  <h3>${L.siglas_t}</h3><table class="gl"><tbody>${L.siglas.map(([a, d]) => `<tr><th>${a}</th><td>${d}</td></tr>`).join("")}</tbody></table>
  <h3>${L.simbolos_t}</h3><table class="gl sm"><tbody>${L.simbolos.map(([a, d]) => `<tr><th>${a}</th><td>${d}</td></tr>`).join("")}</tbody></table>
  <p class="nota">${L.simbolos_n}</p>
  ${pie("ISO 80000-1:2022 · NOM-008-SCFI-2002")}
</section>`;

  const s1 = `<section class="h" id="s1"><h2 class="t">${L.s1}</h2>
  <p class="lead">${L.r_lead}</p>
  <div class="g2"><div><h3>${L.r_prob_t}</h3><p>${L.r_prob}</p></div><div><h3>${L.r_sol_t}</h3><p>${L.r_sol}</p></div>
    <div><h3>${L.r_esc_t}</h3><p>${L.r_esc}</p></div><div><h3>${L.r_ali_t}</h3><p>${L.r_ali}</p></div></div>
  <h3>${L.r_dif_t}</h3><table class="dif"><tbody>${L.r_dif.map(([a, d]) => `<tr><th>${a}</th><td>${d}</td></tr>`).join("")}</tbody></table>
  <div class="caja n"><b>${L.r_etapa_t}</b>${L.r_etapa}</div>
  ${pie("OMS/WHO (2021) · OIT/ILO (2023) · UIT/ITU (2025) · SEP (2025) · INEGI (2026) · UNDRR & OMM/WMO (2024) · OASIS (2010)")}
</section>`;

  const s2 = `<section class="h" id="s2"><h2 class="t">${L.s2}</h2>
  <div class="g2 graf2"><div class="graf"><b>${L.graf_60_t}</b>${g60}<small>${L.graf_60_f}</small></div><div class="graf"><b>${L.graf_ew_t}</b>${gew}<small>${L.graf_ew_f}</small></div></div>
  <h3>${L.c_pers_t}</h3><div class="kp3">${kpi(K.pob_v, K.pob_t, K.pob_f)}${kpi(K.p65_v, K.p65_t, K.p65_f)}${kpi(K.p60_30_v, K.p60_30_t, K.p60_30_f)}${kpi(K.p80_v, K.p80_t, K.p80_f)}${kpi(K.eua_v, K.eua_t, K.eua_f)}${kpi(K.cel_v, K.cel_t, K.cel_f, "a")}</div>
  <h3>${L.c_trab_t}</h3><div class="kp3">${kpi(K.cm_v, K.cm_t, K.cm_f, "r")}${kpi(K.ca_v, K.ca_t, K.ca_f, "r")}${kpi(K.tm_v, K.tm_t, K.tm_f, "r")}${kpi(K.tl_v, K.tl_t, K.tl_f, "r")}${kpi(K.mx_multa_v, K.mx_multa_t, K.mx_multa_f, "r")}</div>
  <h3>${L.c_des_t}</h3><div class="kp4">${kpi(K.d24_v, K.d24_t, K.d24_f, "n")}${kpi(K.dm_v, K.dm_t, K.dm_f, "n")}${kpi(K.da_v, K.da_t, K.da_f, "n")}${kpi(K.ew_v, K.ew_t, K.ew_f, "n")}</div>
  <h3>${L.c_mx_t}</h3><div class="kp4">${kpi(K.mx60_v, K.mx60_t, K.mx60_f)}${kpi(K.mxe_v, K.mxe_t, K.mxe_f)}${kpi(K.mxs_v, K.mxs_t, K.mxs_f, "n")}${kpi(K.mxp_v, K.mxp_t, K.mxp_f)}</div>
  ${pie("UN (2024) · World Bank (2025) · OMS/WHO (2021, 2025) · CDC (2026) · OIT/ILO (2023) · LFT art. 994 · INEGI (2026) · UIT/ITU (2025) · CRED (2025) · OMM/WMO (2025) · UNDRR & OMM/WMO (2024) · SEP (2025) · Pacheco (2025) · The Logistics World (2024)")}
</section>`;

  const s3 = `<section class="h" id="s3"><h2 class="t">${L.s3}</h2>
  <p>${L.u_lead}</p>
  <table class="uni"><thead><tr>${L.u_cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${L.u_filas.map((f) => `<tr><td><b>${f[0]}</b></td><td class="num">${f[1]}</td><td>${f[2]}</td><td class="num">${f[3]}</td></tr>`).join("")}</tbody></table>
  <h3>${L.u_sect_t}</h3><div class="chips">${L.u_sect.map((x) => `<span>${x}</span>`).join("")}</div>
  <p class="nota">${L.inv}</p>
  ${pie("SEP (2025) · Giga (s. f./n.d.) · INEGI (2026) · World Bank (2025) · Secretaría de Economía (s. f./n.d.) · The Logistics World (2024) · UN (2024)")}
</section>`;

  const s4 = `<section class="h" id="s4"><h2 class="t">${L.s4}</h2>
  <div class="f3">${fig("ref-equipo-frontal.webp", L.sol_f[0])}${fig("ref-despiece.webp", L.sol_f[1])}${fig("ref-pantalla-pasillo.webp", L.sol_f[2])}</div>
  <div class="f4">${fig("v3-pantalla-sanitarios-caida.webp", L.sol_p[0])}${fig("v3-pantalla-sismo-dividida.webp", L.sol_p[1])}${fig("v3-pantalla-entrada-aforo.webp", L.sol_p[2])}${fig("v3-pantalla-cocina-gas.webp", L.sol_p[3])}</div>
  <div class="g2"><div><h3>${L.sol_niv_t}</h3><table class="niv"><thead><tr>${L.sol_niv_cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>
    ${["N0", "N1", "N2", "N3"].map((n, i) => `<tr><td>${n}</td><td>${T[n]} min</td><td>${L.sol_niv[i]}</td></tr>`).join("")}</tbody></table><p class="nota">${L.sol_niv_n}</p></div>
    <div><h3>${L.sol_serv_t}</h3><div class="chips">${L.sol_serv.map((x, i) => `<span>${i + 1}. ${x}</span>`).join("")}</div></div></div>
  ${pie(L.img_pie + " ISO 7010:2019 · ISO 3864-1:2011 · NOM-026-STPS-2008 · OASIS CAP 1.2")}
</section>`;

  const s5 = `<section class="h" id="s5"><h2 class="t">${L.s5}</h2>
  <p class="lead">${L.cel_lead}</p>
  <div class="imp"><b>${L.cel_imp_t}</b>${L.cel_imp}<span>${L.cel_imp_b}</span></div>
  <div class="cel"><div><h3>${L.cel_como_t}</h3><ol>${L.cel_como.map((x) => `<li>${x}</li>`).join("")}</ol>
    <h3>${L.cel_sens_t}</h3><table class="sens"><tbody><tr><th>${L.cel_sens_cel_t}</th><td>${L.cel_sens_cel}</td></tr><tr><th>${L.cel_sens_fij_t}</th><td>${L.cel_sens_fij}</td></tr></tbody></table>
    <p class="nota">${L.cel_estado}</p></div>
    ${celular ? `<figure class="tel"><img src="${celular}" alt=""><figcaption>${L.cel_foto}</figcaption></figure>` : ""}</div>
  ${pie("UIT/ITU (2025) · LFPDPPP (2025)")}
</section>`;

  const LSM = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((c) => `<img src="${img("lsm/" + c.toLowerCase() + ".webp")}" alt="${c}">`).join("");
  const s6 = `<section class="h" id="s6"><h2 class="t">${L.s6}</h2>
  <p class="lead">${L.acc_lead}</p>
  <h3>${L.acc_lsm_t}</h3><div class="lsm">${LSM}</div><p>${L.acc_lsm}</p><p class="nota">${L.acc_lsm_f}</p>
  <h3>${L.acc_br_t}</h3><ul class="br">${L.acc_br.map((x) => `<li>${x}</li>`).join("")}</ul><p class="nota">${L.acc_br_n}</p>
  ${pie("Secretaría de Educación Pública & Aprende.mx (s. f./n.d.)")}
</section>`;

  const s7 = `<section class="h" id="s7"><h2 class="t">${L.s7}</h2>
  <table class="ali"><thead><tr>${L.ali_cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${L.ali.map((r) => `<tr><td><b>${r[0]}</b></td><td class="cita">${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table>
  <div class="g2"><div><h3>${L.ind_t}</h3><table><thead><tr>${L.ind_cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${L.ind.map(([a, d]) => `<tr><td>${a}</td><td>${d}</td></tr>`).join("")}</tbody></table></div>
    <div><h3>${L.foda_t}</h3><table class="foda"><tbody><tr><td class="fo-f"><b>${L.foda[0][0]}</b><br>${L.foda[0][1]}</td><td class="fo-d"><b>${L.foda[1][0]}</b><br>${L.foda[1][1]}</td></tr>
      <tr><td class="fo-o"><b>${L.foda[2][0]}</b><br>${L.foda[2][1]}</td><td class="fo-a"><b>${L.foda[3][0]}</b><br>${L.foda[3][1]}</td></tr></tbody></table></div></div>
  <h3>${L.priv_t}</h3><p>${L.priv}</p>
  ${pie("UN (2015) · UNDRR (2015) · UNDRR & OMM/WMO (2024) · OMM/WMO (2025) · LFPDPPP (2025) · ISO (2011, 2019) · STPS (2008) · OASIS (2010)")}
</section>`;

  const s8 = `<section class="h" id="s8"><h2 class="t">${L.s8}</h2>
  <table class="ruta"><thead><tr>${L.ruta_cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${L.ruta.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table>
  <div class="g2"><div><h3>${L.inv_t}</h3><p>${L.inv}</p><p class="nota">${L.nota_911}</p></div>
    <div><h3>${L.aliados_t}</h3><ul>${L.aliados.map((x) => `<li>${x}</li>`).join("")}</ul></div></div>
  <div class="firma"><div class="fi-l"><span class="linea"></span><b>Víctor Hugo Ramírez Salgado</b><span>${L.firma_autor}</span><span class="leyenda">${L.firma_leyenda}</span></div>
    <div class="fi-r">${L.firma_g.map((g, i) => `<span>${g} <b>${["11197647", "10392206", "6226780", "01837017"][i]}</b></span>`).join("")}
    <span class="pi">Safe Creative: Sistema S.O.S.© 2609046908578 · SOSistem™ 2610257442171 · Cubo Morse© 2610257441754</span></div></div>
  <div class="cta"><div><b>${L.contacto}</b> · WhatsApp +52 646 227 0490 · <a href="${S}">sosistem.com</a> · <a href="${S}terminal.html">${L.terminal}</a></div><div>© ${anio} Víctor Hugo Ramírez Salgado</div></div>
  ${pie("Ramírez Salgado (" + anio + ")")}
</section>`;

  const refs = `<section class="h" id="refs"><h2 class="t">${L.refs_t}</h2><p class="nota">${L.refs_n}</p>
  <ol class="refs">${L.refs.map((r) => `<li>${r.replaceAll("{hoy}", hoy).replaceAll("{anio}", anio).replaceAll("{ver}", ver)}</li>`).join("")}</ol>
  ${pie(`© ${anio} Víctor Hugo Ramírez Salgado · SOSistem™ · Sistema S.O.S.© (Safe Creative 2609046908578) · SOSistem™ (2610257442171)`)}
</section>`;

  const css = `@page{size:letter}*{box-sizing:border-box}body{margin:0;font:9.6pt/1.45 Inter,"Segoe UI","Noto Sans",Roboto,Arial,sans-serif;color:#0f1b2d}
.h{page-break-after:always;height:9.85in;display:flex;flex-direction:column;overflow:hidden}.h:last-child{page-break-after:auto}
h1{font-size:18pt;margin:0}.sub{margin:2px 0 0;color:#4a5568;font-size:8.6pt}
h2{font-size:11pt;margin:8px 0 5px;padding-left:8px;border-left:5px solid #005387}h2.t{font-size:15pt;margin:0 0 8px;border-left:6px solid ${NAR};padding-left:10px}
h3{font-size:10pt;margin:8px 0 4px;color:#005387}p{margin:3px 0}
.cab{display:flex;gap:14px;align-items:center;border-bottom:4px solid ${NAR};padding-bottom:8px}.cab-l{display:flex;flex-direction:column;align-items:center}.cab-l img{width:84px;height:84px}
.cab-l b{font:900 18pt/1 Inter,Arial,sans-serif;letter-spacing:.18em;color:${NAR};margin-left:.18em}
.obj{margin:6px 0;padding:7px 12px;border-radius:8px;background:#0f2a4a;color:#fff;font-size:10pt;line-height:1.38}.obj b{display:block;color:#ffb27a;font-size:8pt;letter-spacing:.14em;text-transform:uppercase}
.niv3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.nv{display:flex;flex-direction:column;gap:5px}.nv h3{margin:0;padding:3px 8px;border-radius:5px;color:#fff;font-size:8.4pt;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nv.g h3{background:#0f2a4a}.nv.m h3{background:#237F52}.nv.l h3{background:${NAR}}
.k{border:1px solid #c9ced6;border-top:4px solid #005387;border-radius:6px;padding:4px 7px;display:flex;flex-direction:column}
.k b{font-size:14pt;line-height:1.1;color:#005387}.k span{font-size:8pt;line-height:1.3;color:#334155}.k small{font-size:6.8pt;color:#6b7687;margin-top:auto;padding-top:2px}
.k.r{border-top-color:#D9221A}.k.r b{color:#D9221A}.k.a{border-top-color:${NAR}}.k.a b{color:${NAR}}.k.n{border-top-color:#0f2a4a}.k.n b{color:#0f2a4a}
.kp3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.kp4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.por2{display:grid;grid-template-columns:1fr 1.75in;gap:14px;margin-top:8px;align-items:start}
.graf{border:1px solid #c9ced6;border-radius:6px;padding:6px 8px}.graf b{font-size:8.6pt;display:block}.graf small{font-size:6.8pt;color:#6b7687}
.graf2 .graf svg{max-height:1.15in}.por2 .graf svg{max-height:.75in}.por2 h2{margin-top:4px}
.tel{border-radius:16px;border:3px solid #1e293b;background:#0b1018;margin:0;overflow:hidden}.tel img{display:block;width:100%}.tel figcaption{background:#fff;font-size:7pt;padding:2px 6px;color:#334155}
.idx{width:100%;border-collapse:collapse;font-size:9pt}.idx td{border:0;border-bottom:1px dotted #9aa5b5;padding:2px 2px}.idx .pg{text-align:right;width:3em;font-weight:700}.idx a{color:#0f1b2d;text-decoration:none}
table{width:100%;border-collapse:collapse;font-size:8.8pt}th,td{border:1px solid #c9ced6;padding:3px 6px;text-align:left;vertical-align:top}th{background:#eef1f5}.num{text-align:right;white-space:nowrap}
.gl th{width:6.8em;background:#fff7f1;color:#8a4a20;white-space:nowrap}.gl td,.gl th{font-size:8.6pt;padding:2px 6px}
.lead{font-size:10.2pt}.g2{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}.dif th{width:7.5em;background:#fff7f1;color:#8a4a20}
.caja{margin:6px 0;padding:8px 12px;border-radius:8px}.caja.n{background:#f3f7fc;border:1px solid #c9d6e6}.caja b{display:block;color:#005387;font-size:8pt;letter-spacing:.12em;text-transform:uppercase}
.chips{display:flex;flex-wrap:wrap;gap:4px}.chips span{border:1px solid #f0c8ae;background:#fff7f1;border-radius:10px;padding:1px 8px;font-size:8.4pt}
figure{margin:0;border:1px solid #c9ced6;border-radius:6px;overflow:hidden;background:#0b1018}figure img{display:block;width:100%;object-fit:cover}
figcaption{background:#fff;color:#334155;font-size:7.2pt;padding:2px 5px;line-height:1.25}
.f3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.f3 img{height:1.75in}.f4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:7px}.f4 img{height:1.5in;object-fit:contain}
.niv td:first-child{color:${NAR};font-weight:800}
.imp{margin:6px 0;padding:9px 12px;border-radius:8px;background:#0f2a4a;color:#fff;font-size:10pt;line-height:1.45}.imp b{display:block;color:#ffb27a;font-size:8pt;letter-spacing:.14em;text-transform:uppercase}.imp span{display:block;margin-top:4px;color:#ffd29e;font-weight:700}
.cel{display:grid;grid-template-columns:1fr 2.3in;gap:14px;align-items:start}.sens th{width:6.5em;background:#fff7f1;color:#8a4a20}ol,ul{margin:3px 0;padding-left:18px}li{margin:2px 0}
.lsm{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;margin:4px 0 6px}.lsm img{width:100%;border:1px solid #c9ced6;border-radius:6px;background:#fff}
.br li{margin:4px 0}
.ali td,.ali th{font-size:8.2pt}.ali td:first-child{width:22%}.ali .cita{font-style:italic;color:#334155;width:46%}
.foda td{width:50%;font-size:8.4pt}.fo-f{border-left:4px solid #15803D}.fo-d{border-left:4px solid #F9A900}.fo-o{border-left:4px solid #1F6FB2}.fo-a{border-left:4px solid #D9221A}
.ruta td:first-child{width:8em;color:${NAR}}
.firma{display:grid;grid-template-columns:1fr 1.25fr;gap:14px;margin-top:10px;padding:8px 10px;border:1px solid #c9ced6;border-left:5px solid ${NAR};border-radius:6px}
.firma span{display:block}.fi-l .linea{border-bottom:1px solid #0f1b2d;height:24px;margin-bottom:3px;width:85%}.fi-l b{font-size:10.5pt}
.leyenda{font-size:7.8pt;color:#8a4a20;margin-top:3px;font-style:italic}.fi-r{font-size:8.2pt;line-height:1.5}.fi-r .pi{font-size:7pt;color:#4a5568;margin-top:2px}
.cta div:last-child{white-space:nowrap}.cta{display:flex;justify-content:space-between;gap:10px;background:#0f2a4a;color:#fff;border-radius:6px;padding:6px 10px;margin-top:8px;font-size:8.6pt}.cta a{color:#ffd29e}
.refs{padding-left:0;margin:4px 0;columns:2;column-gap:16px}.refs a{word-break:break-all}.refs li{list-style:none;padding-left:2.2em;text-indent:-2.2em;margin:0 0 4px;font-size:7.6pt;line-height:1.35;break-inside:avoid}
.nota{font-size:8pt;color:#4a5568;margin:4px 0}a{color:#005387}
footer.f{margin-top:auto;border-top:1px solid #0f1b2d;padding-top:4px;font-size:7pt;color:#4a5568}
${idiomasCss}`;
  const html = `<!doctype html><html lang="${L.lang}"><head><meta charset="utf-8"><title>${L.doc_titulo} · SOSistem™ ${ver}</title><style>${css}</style></head>
<body>${portada}${s0}${s1}${s2}${s3}${s4}${s5}${s6}${s7}${s8}${refs}</body></html>`;
  return { html, hoy };
}

for (const lang of IDIOMAS) {
  const L = JSON.parse(fs.readFileSync(`datos/resumen/${lang}.json`, "utf8"));
  const { html, hoy } = documento(L);
  const p = await b.newPage({ viewport: { width: 720, height: 1000 } }); // ancho útil de la hoja carta (7.5 in) para medir como al imprimir
  await p.emulateMedia({ media: "print" });
  await p.setContent(marcas(html), { waitUntil: "load" });
  const desborde = await p.$$eval(".h", (hs) => hs.map((h, i) => (h.scrollHeight > h.clientHeight + 1 ? `${i + 1} (+${h.scrollHeight - h.clientHeight}px)` : "")).filter(Boolean));
  if (desborde.length) console.warn(`AVISO [${lang}] · no cabe en la hoja:`, desborde.join(", "));
  const salida = `assets/resumen-ejecutivo-global-sosistem-${lang}.pdf`;
  await p.pdf({ path: salida, format: "Letter", printBackground: true, outline: true,
    displayHeaderFooter: true, headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;font:7pt Arial;color:#7a8699;padding:0 .5in;display:flex;justify-content:space-between"><span>${L.doc_titulo} · SOSistem™ ${ver} · ${hoy}</span><span>${L.hoja} <span class="pageNumber"></span> ${L.de} <span class="totalPages"></span></span></div>`,
    margin: { top: "0.42in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
  await p.close();
  if (lang === "es") fs.copyFileSync(salida, "assets/resumen-ejecutivo-global-sosistem.pdf");
  console.log(`Resumen ejecutivo global listo · ${lang} · versión ${ver}`);
}
await b.close();
