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
const autor = ES.find((t) => typeof t === "string" && t.startsWith("Creado por Víctor Hugo Ramírez Salgado")) || "";
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
  `Ramírez Salgado, V. H. (${anio}). <i>SOSistem™: Sistema S.O.S.©, versión ${esc(ver)}</i> [Sitio web y documentación técnica]. ${L(S)}`,
];

const SERV = [
  ["Inventario de personas", "Cuántas personas hay en cada recinto, sin identificarlas."],
  ["Distribución y permanencia", "Ocupación por zona y tiempo de estancia."],
  ["Persona en el suelo", "Caída e inmovilidad con aviso escalonado."],
  ["Aforo máximo excedido", "Aviso preventivo antes de rebasar la capacidad."],
  ["Zonas en m² y m³", "Polígonos y volúmenes controlados por recinto."],
  ["Pantallas ejecutivas", "Información para seguridad, 911, Cruz Roja y bomberos."],
  ["Sismo, explosión y voz de auxilio", "Vibración, golpe fuerte y la palabra «S.O.S.»."],
  ["Gases y oxígeno", "Humo, gas, falta de oxígeno e hidrógeno."],
  ["Enlace al 911 y bitácora", "Mensaje CAP v1.2 y registro con fecha y hora."],
  ["Estadística ejecutiva", "Uso por hora, día, zona y evento."],
  ["Desastre y comité", "Salidas de emergencia y conteo por recinto."],
  ["Luz, Morse y megafonía", "Señal visible y audible con colores ISO."],
];

const hoja1 = `<section class="h">
  ${emblema({ titulo: "Presentación ejecutiva · SOSistem™", sub: `Sistema S.O.S.© · Alerta temprana para salvar vidas en recintos confinados · versión ${esc(ver)} · ${hoy}`, flags })}
  <p class="lead"><b>SOSistem™</b>, mediante sensores y terminales (pantallas) de observación e información al momento, detecta en segundos a una persona en el suelo, un sismo, una fuga de gas o una situación de violencia en sanitarios, vestidores, cabinas y espacios confinados, <b>sin cámaras ni grabación</b>, y escala la alerta hasta el 911. Está diseñado para recintos públicos y centros de trabajo donde la privacidad impide la videovigilancia.</p>
  <h2>El problema</h2>
  <div class="kpis">
    <div><b>684,000</b><span>muertes al año por caídas en el mundo; segunda causa de muerte por traumatismos no intencionales (OMS, 2021)</span></div>
    <div><b>37.3 M</b><span>caídas al año que requieren atención médica (OMS, 2021)</span></div>
    <div><b>$586,550</b><span>MXN de multa máxima por infracción a normas de seguridad e higiene: 250 a 5,000 UMA (LFT, art. 994; UMA 2026)</span></div>
  </div>
  <h2>La solución</h2>
  <div class="dos">
    <ul>
      <li><b>Sensores sin imagen:</b> radar mmWave y sensores de distancia, gas, humo, oxígeno, sonido y vibración; solo estados y medidas.</li>
      <li><b>Pantalla de ocupación y emergencia</b> en el acceso, con colores de seguridad ISO 7010, ISO 3864-1 y NOM-026-STPS-2008.</li>
      <li><b>Operación autónoma:</b> hasta 30 días sin red eléctrica; luz, código Morse, banderas del Código Internacional de Señales y sirena.</li>
      <li><b>Privacidad por diseño:</b> cuenta personas sin identificarlas, conforme a la LFPDPPP (2025).</li>
    </ul>
    <div><table class="esc"><thead><tr><th>Nivel</th><th>Tiempo</th><th>Acción</th></tr></thead><tbody>
      <tr><td><b>N0</b></td><td>${T.N0} min</td><td>Aviso en la cabina o recinto</td></tr>
      <tr><td><b>N1</b></td><td>${T.N1} min</td><td>Responsable del lugar</td></tr>
      <tr><td><b>N2</b></td><td>${T.N2} min</td><td>Central de monitoreo</td></tr>
      <tr><td><b>N3</b></td><td>${T.N3} min</td><td>911 · mensaje CAP v1.2</td></tr></tbody></table>
      <p class="nota">Ante una caída confirmada o un sismo, el aviso es inmediato.</p></div>
  </div>
  <h2>Doce servicios del Cubo Morse© de SOSistem™</h2>
  <div class="serv">${SERV.map(([n, d], i) => `<div><i>${i + 1}</i><b>${n}</b><span>${d}</span></div>`).join("")}</div>
  <h2>Arquitectura</h2>
  <ul class="cols">
    <li><b>Sensores estáticos y pantallas fabricadas</b> para cabinas y recintos: función principal.</li>
    <li><b>Modalidad rápida con celulares</b> como sensores y terminal de pruebas.</li>
    <li><b>Pantallas de lectura</b> en iPad, celular o escritorio con módulo lector.</li>
    <li><b>Administrador principal y secundario</b> con facultades para autorizar módulos, vistas y lectura.</li>
  </ul>
  <footer class="f"><b>Fuentes</b>: OMS (2021); OMM (2023); LFT, art. 994; INEGI, UMA 2026; ISO 7010:2019; ISO 3864-1:2011; NOM-026-STPS-2008; OASIS CAP v1.2; LFPDPPP (2025). Referencias completas en la hoja 2.</footer>
</section>`;

const hoja2 = `<section class="h">
  <h2 style="margin-top:0">Análisis FODA</h2>
  <table class="foda"><thead><tr><th></th><th>Favorables</th><th>Desfavorables</th></tr></thead><tbody>
    <tr><th>Internos</th><td class="fo-f"><b>Fortalezas</b><ul><li>Ve lo que nadie puede ver, sin cámaras</li><li>Ayuda en segundos, no en horas</li><li>Funciona cuando todo falla (30 días sin red)</li></ul></td>
      <td class="fo-d"><b>Debilidades</b><ul><li>Etapa piloto</li><li>Evaluación de la conformidad en curso</li><li>Costo inicial cercano a USD 1,500 por equipo</li></ul></td></tr>
    <tr><th>Externos</th><td class="fo-o"><b>Oportunidades</b><ul><li>Iniciativa «Alertas tempranas para todos» (ONU-OMM)</li><li>Más caídas con el envejecimiento de la población</li><li>Obligación legal de prevenir riesgos</li></ul></td>
      <td class="fo-a"><b>Amenazas</b><ul><li>Emergencias que nadie ve a tiempo</li><li>Sismos sin aviso previo</li><li>Falsas alarmas: se mitigan con confirmación por niveles</li></ul></td></tr>
  </tbody></table>
  <div class="dos">
    <div><h2>Mercados y ruta de implementación</h2>
      <ul><li><b>Mercados:</b> restaurantes, hospitales y turismo médico, escuelas y guarderías, industria IMMEX, puertos y recintos fiscalizados, oficinas de gobierno, hoteles y centros comerciales.</li>
      <li><b>1.</b> Prototipo y prueba real en las instalaciones de ContenedorEns© (Ensenada, B.C.).</li>
      <li><b>2.</b> Propuesta de prueba adicional en el Puerto de Ensenada, sujeta a la autorización de ASIPONA Ensenada.</li>
      <li><b>3.</b> Evaluación de la conformidad ante organismos nacionales e internacionales.</li>
      <li><b>4.</b> Escalamiento con aliados institucionales y fondos de desarrollo.</li></ul></div>
    <div><h2>Oferta de referencia</h2>
      <table><tbody>
        <tr><td>Paquete para restaurante (pantalla 60 × 60 cm, dos radares, herrajes, instalación y calibración)</td><td class="num"><b>USD 1,667.50</b></td></tr>
        <tr><td>Servicio de monitoreo, mantenimiento y simulacro mensual</td><td class="num"><b>USD 35 / mes</b></td></tr>
        <tr><td>Diagnóstico del recinto</td><td class="num">Sin costo</td></tr></tbody></table>
      <p class="nota">Precios sin IVA; cotización final por recinto. SOSistem™ no sustituye a los servicios oficiales de emergencia.</p></div>
  </div>
  <h2>Normativa de referencia</h2>
  <p class="norm">ISO 7010:2019 · ISO 3864-1:2011 e ISO 3864-3 · NOM-026-STPS-2008 · ISO 8201:2017 · ISO 7731:2003 · OASIS CAP v1.2 · LFPDPPP (2025) · Ley Federal del Trabajo · Protección Civil de cada país de implementación.</p>
  <h2>Autor y respaldo</h2>
  <p class="aut">${esc(autor)}</p>
  <p class="nota"><b>Propiedad intelectual:</b> Sistema S.O.S.© y S.S.O.S.© (Safe Creative 2609046908578) · plataforma SOSistem™ (2610257442171) · Cubo Morse© (2610257441754) · Código Cúbico© (2610097276721) · ContenedorEns© (2609046908752).</p>
  <div class="cta"><div><b>Contacto</b> · WhatsApp 646 227 0490 · ${L(S, "sosistem.com")} · ${L(S + "terminal.html", "Terminal de pruebas abierta al público")}</div><div>© ${anio} Víctor Hugo Ramírez Salgado</div></div>
  <footer class="f"><b>Referencias (APA 7.ª ed.)</b><ol>${R.map((x) => `<li>${x}</li>`).join("")}</ol></footer>
</section>`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Presentación ejecutiva · SOSistem™ ${esc(ver)}</title><style>
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
footer.f{margin-top:auto;border-top:1px solid #0f1b2d;padding-top:4px;font-size:7pt;color:#4a5568}footer.f ol{margin:2px 0 0;padding-left:0}footer.f li{padding-left:1.6em;text-indent:-1.6em;list-style:none;margin:0}
${emblemaCss}</style></head><body>${hoja1}${hoja2}</body></html>`;

const p = await b.newPage();
await p.setContent(marcas(html), { waitUntil: "load" });
await p.pdf({ path: "assets/presentacion-ejecutiva-sosistem.pdf", format: "Letter", printBackground: true,
  displayHeaderFooter: true, headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;font:7pt Arial;color:#7a8699;padding:0 .5in;display:flex;justify-content:space-between"><span>Presentación ejecutiva · SOSistem™ ${esc(ver)} · ${hoy}</span><span>Hoja <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
  margin: { top: "0.42in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
await b.close();
console.log("Presentación ejecutiva lista · versión " + ver);
