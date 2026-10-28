// SOSistem™ · Presentación ejecutiva (PDF, 2 hojas, APA 7.ª ed.) · © Víctor Hugo Ramírez Salgado
// Resume todo el sistema en dos hojas para instituciones (BID, OEA-CIP, ONU, CEPAL), autoridades y clientes.
// Se regenera sola con los datos vigentes del sitio (versión, tiempos de escalamiento y experiencia del autor).
// Uso: node herramientas/ejecutiva.mjs  →  assets/presentacion-ejecutiva-sosistem.pdf
import { createRequire } from "module";
import fs from "fs";
import { emblema, emblemaCss, banderas, marcas } from "./marca.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");

const V = JSON.parse(fs.readFileSync("datos/version.json", "utf8"));
const C = JSON.parse(fs.readFileSync("datos/config.json", "utf8"));
const ES = JSON.parse(fs.readFileSync("datos/textos/es.json", "utf8"));
const ver = V.version, anio = new Date().getFullYear();
const hoy = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Tijuana" });
const T = { N0: 2, N1: 4, N2: 7, N3: 10, ...(C.tiempos || {}) };
const S = "https://sosistem.com/";
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const L = (url, txt) => `<a href="${url}">${esc(txt || url.replace("https://", ""))}</a>`;
const b = await chromium.launch();
const flags = await banderas(b, "SOS", 30);

// Referencias (APA 7.ª ed.)
const R = [
  `Organización Mundial de la Salud. (2021, 26 de abril). <i>Caídas</i> [Nota descriptiva]. ${L("https://www.who.int/es/news-room/fact-sheets/detail/falls")}`,
  `Organización Meteorológica Mundial. (2023). Overview of the Early Warnings for All: Executive Action Plan 2023–2027. <i>Boletín de la OMM, 72</i>(1). ${L("https://wmo.int/media/magazine-article/overview-of-early-warnings-all-executive-action-plan-2023-2027", "wmo.int")}`,
  `Ley Federal del Trabajo. (s. f.). Art. 994. Cámara de Diputados. Recuperado el ${hoy}, de ${L("https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf", "diputados.gob.mx")}`,
  `Instituto Nacional de Estadística y Geografía. (2026). <i>Unidad de Medida y Actualización (UMA)</i>. ${L("https://www.inegi.org.mx/temas/uma/", "inegi.org.mx")}`,
  `International Organization for Standardization. (2019). <i>Graphical symbols — Safety colours and safety signs — Registered safety signs</i> (ISO 7010:2019, con Amd. 1–11). ${L("https://www.iso.org/standard/72424.html")}`,
  `International Organization for Standardization. (2011). <i>Graphical symbols — Safety colours and safety signs — Part 1</i> (ISO 3864-1:2011). ${L("https://www.iso.org/standard/51021.html")}`,
  `Secretaría del Trabajo y Previsión Social. (2008). <i>NOM-026-STPS-2008. Colores y señales de seguridad e higiene</i>. ${L("https://dof.gob.mx/normasOficiales/3541/stps.htm", "dof.gob.mx")}`,
  `OASIS. (2010). <i>Common Alerting Protocol version 1.2</i>. ${L("https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html", "docs.oasis-open.org")}`,
  `Ley Federal de Protección de Datos Personales en Posesión de los Particulares. (2025). <i>Diario Oficial de la Federación</i>, 20 de marzo de 2025. ${L("https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf", "diputados.gob.mx")}`,
  `Naciones Unidas. (2015). <i>Transformar nuestro mundo: la Agenda 2030 para el Desarrollo Sostenible</i> (A/RES/70/1). ${L("https://www.un.org/sustainabledevelopment/es/", "un.org")}`,
  `Oficina de las Naciones Unidas para la Reducción del Riesgo de Desastres. (2015). <i>Marco de Sendai para la Reducción del Riesgo de Desastres 2015-2030</i>. ${L("https://www.undrr.org/publication/sendai-framework-disaster-risk-reduction-2015-2030", "undrr.org")}`,
  `Ramírez Salgado, V. H. (${anio}). <i>SOSistem™: Sistema S.O.S.©, versión ${esc(ver)}</i> [Sitio web y documentación técnica]. ${L(S)}`,
];

const img = (f) => "data:image/webp;base64," + fs.readFileSync("assets/img/" + f).toString("base64");
const fig = (f, pie, cls = "") => `<figure class="${cls}"><img src="${img(f)}" alt=""><figcaption>${pie}</figcaption></figure>`;
const SERV = ["Inventario de personas", "Distribución y permanencia", "Persona en el suelo", "Aforo máximo excedido", "Zonas en m² y m³", "Pantallas ejecutivas",
  "Sismo, explosión y voz de auxilio", "Gases y oxígeno", "Enlace al 911 y bitácora", "Estadística ejecutiva", "Desastre y comité", "Luz, Morse y megafonía"];

const hoja1 = `<section class="h">
  ${emblema({ titulo: "Resumen ejecutivo del proyecto · SOSistem™", sub: `Sistema S.O.S.© · Alerta temprana para salvar vidas en recintos confinados · versión ${esc(ver)} · ${hoy}`, flags })}
  <table class="ficha"><tbody>
    <tr><th>Sector</th><td>Seguridad humana, gestión del riesgo de desastres, salud y seguridad en el trabajo</td><th>Etapa</th><td>Prototipo funcional y piloto</td></tr>
    <tr><th>Ubicación</th><td>Ensenada, Baja California, México; replicable en América Latina y el Caribe</td><th>Ejecutor</th><td>Víctor Hugo Ramírez Salgado (persona física con actividad empresarial)</td></tr>
    <tr><th>Alineación</th><td colspan="3">ODS 3 (salud), 8.8 (entornos de trabajo seguros) y 11.5 (reducir muertes por desastres) · Marco de Sendai, meta G · iniciativa «Alertas tempranas para todos» (ONU-OMM)</td></tr>
  </tbody></table>
  <p class="lead"><b>SOSistem™</b>, mediante sensores y terminales (pantallas) de observación e información al momento, detecta en segundos a una persona en el suelo, un sismo, una fuga de gas o una situación de violencia en sanitarios, vestidores, cabinas y espacios confinados, <b>sin cámaras ni grabación</b>, y escala la alerta hasta el 911.</p>
  <h2>Problema</h2>
  <div class="kpis">
    <div><b>684,000</b><span>muertes al año por caídas en el mundo; segunda causa de muerte por traumatismos no intencionales (OMS, 2021)</span></div>
    <div><b>37.3 M</b><span>caídas al año que requieren atención médica (OMS, 2021)</span></div>
    <div><b>$586,550</b><span>MXN de multa máxima por infracción a normas de seguridad e higiene: 250 a 5,000 UMA (LFT, art. 994; UMA 2026)</span></div>
  </div>
  <p class="nota">En los recintos donde la privacidad impide la videovigilancia, una emergencia puede pasar inadvertida durante minutos decisivos.</p>
  <h2>Solución: el equipo</h2>
  <div class="fotos3">
    ${fig("ref-equipo-frontal.webp", "Terminal NODO S.O.S.©: pantalla micro-LED, radar mmWave y sirena")}
    ${fig("ref-despiece.webp", "Componentes: radar, sensores, batería LiFePO4 y respaldo de 30 días")}
    ${fig("ref-pantalla-pasillo.webp", "Pantalla S.S.O.S.© instalada en el acceso a sanitarios")}
  </div>
  <div class="dos">
    <ul>
      <li><b>Sensores sin imagen:</b> radar mmWave y sensores de distancia, gas, humo, oxígeno, sonido y vibración.</li>
      <li><b>Pantallas de ocupación y emergencia</b> con colores ISO 7010, ISO 3864-1 y NOM-026-STPS-2008.</li>
      <li><b>Autonomía:</b> hasta 30 días sin red eléctrica; luz, Morse, banderas del Código Internacional de Señales y sirena.</li>
      <li><b>Privacidad por diseño:</b> cuenta personas sin identificarlas (LFPDPPP, 2025).</li>
    </ul>
    <div><table class="esc"><thead><tr><th>Nivel</th><th>Tiempo</th><th>Aviso</th></tr></thead><tbody>
      <tr><td><b>N0</b></td><td>${T.N0} min</td><td>Cabina o recinto</td></tr>
      <tr><td><b>N1</b></td><td>${T.N1} min</td><td>Responsable del lugar</td></tr>
      <tr><td><b>N2</b></td><td>${T.N2} min</td><td>Central de monitoreo</td></tr>
      <tr><td><b>N3</b></td><td>${T.N3} min</td><td>911 · mensaje CAP v1.2</td></tr></tbody></table>
      <p class="nota">Ante una caída confirmada o un sismo, el aviso es inmediato.</p></div>
  </div>
  <h2>Doce servicios del sistema</h2>
  <p class="chips">${SERV.map((x, i) => `<span>${i + 1}. ${x}</span>`).join("")}</p>
  <footer class="f"><b>Fuentes</b>: OMS (2021); OMM (2023); Naciones Unidas (2015); UNDRR (2015); LFT, art. 994; INEGI, UMA 2026; ISO 7010:2019; ISO 3864-1:2011; NOM-026-STPS-2008; OASIS CAP v1.2; LFPDPPP (2025). Imágenes: renders y pantallas de referencia del sistema. Referencias completas en la hoja 2.</footer>
</section>`;

const hoja2 = `<section class="h">
  <h2 style="margin-top:0">Así informa el sistema en cada recinto</h2>
  <div class="fotos4">
    ${fig("v3-pantalla-sanitarios-caida.webp", "Persona en el suelo")}
    ${fig("v3-pantalla-sismo-dividida.webp", "Sismo: ruta de evacuación")}
    ${fig("v3-pantalla-entrada-aforo.webp", "Inventario de personas")}
    ${fig("v3-pantalla-cocina-gas.webp", "Fuga de gas")}
  </div>
  <div class="dos2">
    <div><h2>Resultados esperados e indicadores</h2>
      <table><thead><tr><th>Indicador</th><th>Medición</th></tr></thead><tbody>
        <tr><td>Aviso al responsable del lugar</td><td>≤ ${T.N1} min (N1); inmediato en caída o sismo</td></tr>
        <tr><td>Aviso al 911 con mensaje CAP v1.2</td><td>≤ ${T.N3} min (N3)</td></tr>
        <tr><td>Personas contadas por recinto</td><td>En tiempo real, sin identificarlas</td></tr>
        <tr><td>Falsas alarmas</td><td>Porcentaje por evento, con bitácora auditable</td></tr>
        <tr><td>Recintos protegidos</td><td>Piloto en ContenedorEns©; réplica por sector</td></tr></tbody></table></div>
    <div><h2>Análisis FODA</h2>
      <table class="foda"><tbody>
        <tr><td class="fo-f"><b>Fortalezas</b><br>Ve sin cámaras · aviso en segundos · 30 días sin red</td><td class="fo-d"><b>Debilidades</b><br>Etapa piloto · evaluación de la conformidad en curso · costo inicial</td></tr>
        <tr><td class="fo-o"><b>Oportunidades</b><br>Alertas tempranas para todos · envejecimiento · obligación legal</td><td class="fo-a"><b>Amenazas</b><br>Emergencias inadvertidas · sismos sin aviso · falsas alarmas (mitigadas por niveles)</td></tr></tbody></table></div>
  </div>
  <div class="dos2">
    <div><h2>Ruta de implementación</h2>
      <ol class="ruta"><li>Prototipo y prueba real en ContenedorEns© (Ensenada, B.C.).</li>
      <li>Prueba adicional en el Puerto de Ensenada, sujeta a autorización de ASIPONA Ensenada.</li>
      <li>Evaluación de la conformidad ante organismos nacionales e internacionales.</li>
      <li>Escalamiento regional con aliados institucionales y fondos de desarrollo.</li></ol>
      <p class="nota"><b>Mercados:</b> hospitales y turismo médico, escuelas, restaurantes, industria IMMEX, puertos y recintos fiscalizados, oficinas de gobierno y hoteles.</p></div>
    <div><h2>Modelo de sostenibilidad</h2>
      <table><tbody>
        <tr><td>Paquete de referencia (pantalla, dos radares, instalación y calibración)</td><td class="num"><b>USD 1,667.50</b></td></tr>
        <tr><td>Servicio de monitoreo, mantenimiento y simulacro mensual</td><td class="num"><b>USD 35 / mes</b></td></tr>
        <tr><td>Diagnóstico del recinto</td><td class="num">Sin costo</td></tr></tbody></table>
      <p class="nota">Precios sin IVA. SOSistem™ no sustituye a los servicios oficiales de emergencia.</p></div>
  </div>
  <p class="norm"><b>Normativa:</b> ISO 7010:2019 · ISO 3864-1:2011 e ISO 3864-3 · NOM-026-STPS-2008 · ISO 8201:2017 · ISO 7731:2003 · OASIS CAP v1.2 · LFPDPPP (2025) · Protección Civil de cada país.</p>
  <div class="firma">
    <div class="fi-l"><span class="linea"></span><b>Víctor Hugo Ramírez Salgado</b><span>Autor de Sistema S.O.S.© y SOSistem™</span>
      <span class="leyenda">Más de 20 años en puertos; cursos internacionales OEA-CIP, OMI, Universidad de Cantabria, ValenciaPort y China.</span></div>
    <div class="fi-r"><span>MBA · CETYS Universidad · Cédula profesional <b>11197647</b></span><span>Lic. en Comercio Internacional · Cédula profesional <b>10392206</b></span>
      <span>Técnico en Contabilidad · DGETI · Registro <b>6226780</b></span><span>Certificación CONOCER EC0217 · Folio <b>01837017</b></span>
      <span class="pi">Safe Creative: Sistema S.O.S.© 2609046908578 · SOSistem™ 2610257442171 · Cubo Morse© 2610257441754</span></div>
  </div>
  <div class="cta"><div><b>Contacto</b> · WhatsApp 646 227 0490 · ${L(S, "sosistem.com")} · ${L(S + "terminal.html", "Terminal de pruebas abierta al público")}</div><div>© ${anio} Víctor Hugo Ramírez Salgado</div></div>
  <footer class="f"><b>Referencias (APA 7.ª ed.)</b><ol>${R.map((x) => `<li>${x}</li>`).join("")}</ol></footer>
</section>`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Resumen ejecutivo · SOSistem™ ${esc(ver)}</title><style>
@page{size:letter}*{box-sizing:border-box}body{margin:0;font:9pt/1.36 Inter,"Segoe UI",Roboto,Arial,sans-serif;color:#0f1b2d}
.h{page-break-after:always;height:9.85in;display:flex;flex-direction:column;overflow:hidden}.h:last-child{page-break-after:auto}
.port{display:flex;gap:14px;align-items:center;border-bottom:4px solid #DB641C;padding-bottom:7px}.port img{width:54px;height:58px}
h1{font-size:17pt;margin:0}.sub{margin:2px 0 0;color:#4a5568;font-size:8.4pt}
h2{font-size:11pt;margin:9px 0 5px;padding-left:8px;border-left:5px solid #005387}
.lead{margin:8px 0 2px;font-size:9.6pt}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.kpis div{border:1px solid #c9ced6;border-top:4px solid #D9221A;border-radius:6px;padding:6px 8px}
.kpis b{display:block;font-size:17pt;color:#D9221A;line-height:1.1}.kpis span{font-size:7.9pt;color:#334155}
.dos{display:grid;grid-template-columns:1.25fr 1fr;gap:12px}ul{margin:3px 0 4px;padding-left:16px}li{margin:1.5px 0}
table{width:100%;border-collapse:collapse;font-size:8.4pt}th,td{border:1px solid #c9ced6;padding:3px 6px;text-align:left;vertical-align:top}th{background:#eef1f5}.num{text-align:right;white-space:nowrap}
.esc td:first-child{color:#DB641C}
.serv{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.serv div{border:1px solid #c9ced6;border-radius:6px;padding:4px 6px 4px 26px;position:relative;font-size:8pt}
.serv i{position:absolute;left:5px;top:4px;width:16px;height:16px;border-radius:4px;background:#DB641C;color:#fff;font:700 8pt/16px Arial;text-align:center;font-style:normal}.serv b{display:block}.serv span{color:#4a5568}
.cols{columns:2;column-gap:18px}
.foda th{width:5.5em}.foda td{width:47%}.foda ul{padding-left:14px}.fo-f{border-left:4px solid #15803D}.fo-d{border-left:4px solid #F9A900}.fo-o{border-left:4px solid #1F6FB2}.fo-a{border-left:4px solid #D9221A}
.nota{font-size:7.9pt;color:#4a5568;margin:3px 0}.norm{margin:2px 0}.aut{margin:2px 0;font-size:8.6pt}
.cta div:last-child{white-space:nowrap}.cta{display:flex;justify-content:space-between;gap:10px;background:#0f2a4a;color:#fff;border-radius:6px;padding:6px 10px;margin-top:6px;font-size:8.6pt}.cta a{color:#ffd29e}
a{color:#005387}
footer.f{margin-top:auto;border-top:1px solid #0f1b2d;padding-top:3px;font-size:6.6pt;line-height:1.3;color:#4a5568}footer.f ol{margin:2px 0 0;padding-left:0;columns:2;column-gap:14px}footer.f li{break-inside:avoid}footer.f li{padding-left:1.6em;text-indent:-1.6em;list-style:none;margin:0}

.ficha{margin:7px 0 2px;font-size:8pt}.ficha th{background:#0f2a4a;color:#fff;width:5.8em;white-space:nowrap}
figure{margin:0;border:1px solid #c9ced6;border-radius:6px;overflow:hidden;background:#0b1018}figure img{display:block;width:100%;object-fit:cover}
figcaption{background:#fff;color:#334155;font-size:7.2pt;padding:2px 5px;line-height:1.25}
.fotos3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:5px}.fotos3 img{height:1.45in}
.fotos4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.fotos4 img{height:1.15in;object-fit:contain}
.chips{margin:3px 0 2px;font-size:8.2pt;line-height:1.9}.chips span{display:inline-block;border:1px solid #f0c8ae;background:#fff7f1;border-radius:10px;padding:0 6px;margin:0 3px 0 0}
.dos2 table td,.dos2 table th{padding:2px 5px;font-size:7.9pt}.dos2 h2{margin-top:7px}.dos2{display:grid;grid-template-columns:1fr 1fr;gap:12px}.foda td{font-size:7.8pt;width:50%}.ruta{margin:2px 0;padding-left:16px;font-size:8.2pt}
.firma{display:grid;grid-template-columns:1fr 1.25fr;gap:14px;margin-top:5px;padding:6px 10px;border:1px solid #c9ced6;border-left:5px solid #DB641C;border-radius:6px}
.firma span{display:block}.fi-l .linea{border-bottom:1px solid #0f1b2d;height:22px;margin-bottom:3px;width:85%}.fi-l b{font-size:10.5pt}
.leyenda{font-size:7.8pt;color:#8a4a20;margin-top:3px;font-style:italic}.fi-r{font-size:8pt;line-height:1.5}.fi-r .pi{font-size:7pt;color:#4a5568;margin-top:2px}
${emblemaCss}</style></head><body>${hoja1}${hoja2}</body></html>`;

const p = await b.newPage();
await p.setContent(marcas(html), { waitUntil: "load" });
const desborde = await p.$$eval(".h", (hs) => hs.map((h, i) => (h.scrollHeight > h.clientHeight + 1 ? `hoja ${i + 1}: ${h.scrollHeight - h.clientHeight}px` : "")).filter(Boolean));
if (desborde.length) console.warn("AVISO · el contenido no cabe en:", desborde.join(", "));
await p.pdf({ path: "assets/presentacion-ejecutiva-sosistem.pdf", format: "Letter", printBackground: true,
  displayHeaderFooter: true, headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;font:7pt Arial;color:#7a8699;padding:0 .5in;display:flex;justify-content:space-between"><span>Resumen ejecutivo · SOSistem™ ${esc(ver)} · ${hoy}</span><span>Hoja <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
  margin: { top: "0.42in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
await b.close();
console.log("Presentación ejecutiva lista · versión " + ver);
