// SOSistem™ · Resumen ejecutivo global (PDF con índice, APA 7.ª ed.) · © Víctor Hugo Ramírez Salgado
// Presentación mundial del sistema: cifras verificadas de personas, adultos mayores, trabajo, desastres, escuelas,
// puertos y celulares, con escenarios de adopción calculados a partir de esas cifras. Se regenera con cada versión.
// Uso: servir la raíz del sitio en http://localhost:8765 y correr: node herramientas/ejecutiva-global.mjs
//      →  assets/resumen-ejecutivo-global-sosistem.pdf
import { createRequire } from "module";
import fs from "fs";
import { emblema, emblemaCss, banderas, marcas, idiomasFila, idiomasCss, fotoTerminal, NAR } from "./marca.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");

const V = JSON.parse(fs.readFileSync("datos/version.json", "utf8"));
const C = JSON.parse(fs.readFileSync("datos/config.json", "utf8"));
const ver = V.version, anio = new Date().getFullYear();
const hoy = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Tijuana" });
const T = { N0: 2, N1: 4, N2: 7, N3: 10, ...(C.tiempos || {}) };
const S = "https://sosistem.com/";
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const L = (url, txt) => `<a href="${url}">${esc(txt || url.replace("https://", ""))}</a>`;
const n = (x) => Math.round(x).toLocaleString("en-US");
const img = (f) => "data:image/webp;base64," + fs.readFileSync("assets/img/" + f).toString("base64");
const fig = (f, pie) => `<figure><img src="${img(f)}" alt=""><figcaption>${pie}</figcaption></figure>`;

const b = await chromium.launch();
const flags = await banderas(b, "SOS", 30);
const celular = await fotoTerminal(b);

// ---------- Cifras verificadas (cada una con su fuente en Referencias) ----------
const D = {
  pob: 8.2e9, p65: 0.104, p60_2030: 1.4e9, p60_2050: 2.1e9, p80_2050: 426e6,
  caidasMuertes: 684000, caidasAtencion: 37.3e6, eua65caen: 14e6,
  trabMuertes: 3e6, trabAccidentes: 330000, trabLesiones: 395e6,
  des2024: 393, des2024Muertes: 16753, des2024Afect: 167e6, des2024Perd: 242e9,
  mhews: 119, mhewsPct: 60, sids: 43,
  celular: 82, escuelasMapa: 2.2e6, escuelasPaises: 140, estados: 193,
  mxEscuelas: 258522, mxAlumnos: 32516109, mxDocentes: 2061023, mx60: 17.7e6, mxPuertos: 117, mxSismos2024: 33396,
  precio: 1667.5, mensual: 35,
};
const p65n = D.pob * D.p65; // cálculo propio
const uno = (x) => Math.round(x * 0.01); // escenario ilustrativo del 1 %, en unidades enteras

// ---------- Referencias (APA 7.ª ed., orden alfabético) ----------
const REF = [
  `Centers for Disease Control and Prevention. (2026, 4 de septiembre). <i>Older adult falls data</i>. ${L("https://www.cdc.gov/falls/data-research/index.html")}`,
  `Centre for Research on the Epidemiology of Disasters. (2025). <i>2024 disasters in numbers</i>. CRED, UCLouvain. ${L("https://files.emdat.be/reports/2024_EMDAT_report.pdf")}`,
  `Giga. (s. f.). <i>It began with a question: Do you know how many schools there are?</i> UNICEF y Unión Internacional de Telecomunicaciones. Recuperado el ${hoy}, de ${L("https://giga.global/unicef-itu-partnership/our-story/")}`,
  `Instituto Nacional de Estadística y Geografía. (2026, 28 de septiembre). <i>Estadísticas a propósito del Día Internacional de las Personas Adultas Mayores</i> (Comunicado de prensa 89/26). ${L("https://www.inegi.org.mx/contenidos/saladeprensa/aproposito/2026/EAP_Adulmayor_26.pdf")}`,
  `Instituto Nacional de Estadística y Geografía. (2026). <i>Unidad de Medida y Actualización (UMA)</i>. ${L("https://www.inegi.org.mx/temas/uma/")}`,
  `International Organization for Standardization. (2011). <i>Graphical symbols — Safety colours and safety signs — Part 1: Design principles for safety signs and safety markings</i> (ISO 3864-1:2011). ${L("https://www.iso.org/standard/51021.html")}`,
  `International Organization for Standardization. (2019). <i>Graphical symbols — Safety colours and safety signs — Registered safety signs</i> (ISO 7010:2019). ${L("https://www.iso.org/standard/72424.html")}`,
  `Ley Federal de Protección de Datos Personales en Posesión de los Particulares. (2025). <i>Diario Oficial de la Federación</i>, 20 de marzo de 2025. ${L("https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf")}`,
  `Ley Federal del Trabajo. (s. f.). Artículo 994. Cámara de Diputados. Recuperado el ${hoy}, de ${L("https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf")}`,
  `Naciones Unidas. (2015). <i>Transformar nuestro mundo: la Agenda 2030 para el Desarrollo Sostenible</i> (A/RES/70/1). ${L("https://www.un.org/sustainabledevelopment/es/")}`,
  `Naciones Unidas. (2024, 11 de julio). <i>UN projects world population to peak within this century</i> [Comunicado de prensa sobre World Population Prospects 2024]. ${L("https://www.un.org/sustainabledevelopment/blog/2024/07/press-release-wpp2024/")}`,
  `OASIS. (2010). <i>Common Alerting Protocol version 1.2</i>. ${L("https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html")}`,
  `Oficina de las Naciones Unidas para la Reducción del Riesgo de Desastres. (2015). <i>Marco de Sendai para la Reducción del Riesgo de Desastres 2015-2030</i>. ${L("https://www.undrr.org/publication/sendai-framework-disaster-risk-reduction-2015-2030")}`,
  `Oficina de las Naciones Unidas para la Reducción del Riesgo de Desastres y Organización Meteorológica Mundial. (2024). <i>Global status of multi-hazard early warning systems 2024</i>. ${L("https://public.wmo.int/node/24875")}`,
  `Organización Internacional del Trabajo. (2023, 26 de noviembre). <i>Nearly 3 million people die of work-related accidents and diseases</i>. ${L("https://www.ilo.org/resource/news/nearly-3-million-people-die-work-related-accidents-and-diseases")}`,
  `Organización Meteorológica Mundial. (2025, 12 de noviembre). <i>Early warning systems reach new heights, but critical gaps jeopardize global progress</i>. ${L("https://public.wmo.int/node/37885")}`,
  `Organización Mundial de la Salud. (2021, 26 de abril). <i>Caídas</i> [Nota descriptiva]. ${L("https://www.who.int/es/news-room/fact-sheets/detail/falls")}`,
  `Organización Mundial de la Salud. (2025, 1 de octubre). <i>Envejecimiento y salud</i> [Nota descriptiva]. ${L("https://www.who.int/es/news-room/fact-sheets/detail/ageing-and-health")}`,
  `Pacheco, A. (2025, 9 de enero). <i>Estados que registraron más sismos en 2024</i> [con datos del Reporte Anual del Servicio Sismológico Nacional, UNAM]. adn40. ${L("https://www.adn40.mx/mexico/2025-01-09/estados-registraron-mas-sismos-2024-fallas-geologicas/")}`,
  `Ramírez Salgado, V. H. (${anio}). <i>SOSistem™: Sistema S.O.S.©, versión ${esc(ver)}</i> [Sitio web y documentación técnica]. ${L(S)}`,
  `Secretaría de Educación Pública. (2025). <i>Principales cifras del Sistema Educativo Nacional 2024-2025</i>. ${L("https://www.planeacion.sep.gob.mx/Doc/estadistica_e_indicadores/principales_cifras/principales_cifras_2024_2025.pdf")}`,
  `Secretaría del Trabajo y Previsión Social. (2008). <i>NOM-026-STPS-2008. Colores y señales de seguridad e higiene, e identificación de riesgos por fluidos conducidos en tuberías</i>. ${L("https://dof.gob.mx/normasOficiales/3541/stps.htm")}`,
  `The Logistics World. (2024, 17 de junio). <i>Infraestructura marítima en México: ¿Cuántos puertos tiene el país?</i> ${L("https://thelogisticsworld.com/logistica-y-distribucion/infraestructura-maritima-en-mexico-cuantos-puertos-tiene-el-pais/")}`,
  `Unión Internacional de Telecomunicaciones. (2025). <i>Facts and Figures 2025: Mobile phone ownership</i>. ${L("https://www.itu.int/itu-d/reports/statistics/2025/10/15/ff25-mobile-phone-ownership/")}`,
  `World Bank. (2025). <i>Population ages 65 and above (% of total population) — World</i> [SP.POP.65UP.TO.ZS], vía Federal Reserve Bank of St. Louis. ${L("https://fred.stlouisfed.org/series/SPPOP65UPTOZSWLD")}`,
];

// ---------- Índice ----------
const SEC = [
  ["s1", "1. Resumen ejecutivo"], ["s2", "2. El reto mundial en cifras"], ["s3", "3. Dónde puede operar: universo y escenarios"],
  ["s4", "4. La solución: sensores, terminales y pantallas"], ["s5", "5. Cada celular, un sensor: ayuda familiar las 24 horas"],
  ["s6", "6. Impacto, alineación mundial e indicadores"], ["s7", "7. Hoja de ruta, sostenibilidad y alianzas"], ["s8", "Referencias (APA 7.ª ed.)"],
];
const pie = (t) => `<footer class="f">${t}</footer>`;
const kpi = (v, t, f, c = "") => `<div class="k ${c}"><b>${v}</b><span>${t}</span><small>${f}</small></div>`;

const portada = `<section class="h">
  ${emblema({ titulo: "Resumen ejecutivo global · SOSistem™", sub: `Sistema S.O.S.© · Alerta temprana para salvar vidas · presentación mundial · versión ${esc(ver)} · ${hoy}`, flags })}
  ${idiomasFila()}
  <div class="hero"><div>
    <p class="claim">Sensores y terminales (pantallas) de observación e información al momento que detectan a una persona en el suelo, un sismo, una fuga de gas o una situación de violencia <b>sin cámaras ni grabación</b>, y escalan la alerta hasta el 911.</p>
    <div class="kp4">
      ${kpi("8.2 mil M", "personas en el mundo", "Naciones Unidas, 2024")}
      ${kpi("684,000", "muertes al año por caídas", "OMS, 2021", "r")}
      ${kpi("≈ 3 M", "muertes al año ligadas al trabajo", "OIT, 2023", "r")}
      ${kpi("82 %", "de las personas de 10 años o más tiene celular", "UIT, 2025", "a")}
    </div></div>
    ${celular ? `<figure class="tel"><img src="${celular}" alt=""><figcaption>Terminal SOSistem™ en un celular</figcaption></figure>` : ""}
  </div>
  <h2>Índice</h2>
  <table class="idx"><tbody>${SEC.map(([id, t], i) => `<tr><td><a href="#${id}">${t}</a></td><td class="pg">${i + 2}</td></tr>`).join("")}</tbody></table>
  ${pie(`© ${anio} Víctor Hugo Ramírez Salgado · Documento institucional para gobiernos, organismos multilaterales, banca de desarrollo y aliados. Las cifras se citan en formato APA 7.ª ed.; los escenarios son cálculos propios a partir de ellas.`)}
</section>`;

const s1 = `<section class="h" id="s1"><h2 class="t">1. Resumen ejecutivo</h2>
  <div class="caja"><b>Propósito</b>Salvar vidas con alerta temprana al instante en los lugares donde nadie puede ver: sanitarios, vestidores, cabinas, recintos confinados y hogares de personas mayores, respetando la privacidad.</div>
  <div class="g2">
    <div><h3>El problema</h3><p>Cada año mueren <b>684,000 personas por caídas</b> y <b>37.3 millones</b> de caídas requieren atención médica (OMS, 2021). Cerca de <b>3 millones de personas</b> mueren por causas ligadas al trabajo (OIT, 2023). Donde la ley y la dignidad impiden las cámaras, una emergencia puede pasar inadvertida durante minutos decisivos.</p></div>
    <div><h3>La solución</h3><p><b>SOSistem™</b> combina sensores sin imagen (radar mmWave, gas, humo, oxígeno, sonido y vibración) con terminales y pantallas que informan al momento. Avisa por niveles al responsable, a la central de monitoreo y al <b>911</b> con mensaje CAP v1.2, y opera hasta 30 días sin red eléctrica.</p></div>
    <div><h3>La escala</h3><p>El <b>82 %</b> de las personas de 10 años o más tiene celular (UIT, 2025): cada teléfono puede ser sensor, pantalla o ambos. Solo en México hay <b>${n(D.mxEscuelas)} escuelas</b> (SEP, 2025) y <b>${(D.mx60 / 1e6).toFixed(1)} millones</b> de personas de 60 años o más (INEGI, 2026).</p></div>
    <div><h3>La alineación</h3><p>Contribuye a los ODS 3, 8.8 y 11.5, a la meta G del Marco de Sendai y a la iniciativa «Alertas tempranas para todos». Donde la alerta temprana es limitada, la mortalidad por desastres es <b>casi seis veces mayor</b> (UNDRR y OMM, 2024).</p></div>
  </div>
  <h3>Qué distingue a SOSistem™</h3>
  <table class="dif"><tbody>
    <tr><th>Sin cámaras</th><td>Solo estados y medidas; no hay imagen, video ni grabación de voz.</td></tr>
    <tr><th>Al momento</th><td>Aviso escalonado: N0 ${T.N0} min · N1 ${T.N1} min · N2 ${T.N2} min · N3 ${T.N3} min; inmediato ante caída confirmada o sismo.</td></tr>
    <tr><th>Para todos</th><td>Luz, sonido, código Morse, braille, banderas del Código Internacional de Señales, 22 idiomas y lengua de señas en desarrollo.</td></tr>
    <tr><th>Resiliente</th><td>Batería LiFePO4 de hasta 30 días; funciona con red o sin red.</td></tr>
    <tr><th>Escalable</th><td>Del celular de una persona a un inmueble completo, a una ciudad o a un puerto.</td></tr>
  </tbody></table>
  <div class="caja n"><b>Etapa actual</b>Prototipo funcional y Terminal de pruebas abierta al público en ${L(S + "terminal.html", "sosistem.com/terminal.html")}. Piloto físico en las oficinas de ContenedorEns (Ensenada, Baja California, México).</div>
  ${pie("Fuentes: OMS (2021); OIT (2023); UIT (2025); SEP (2025); INEGI (2026); UNDRR y OMM (2024); OASIS (2010).")}
</section>`;

const s2 = `<section class="h" id="s2"><h2 class="t">2. El reto mundial en cifras</h2>
  <h3>Personas y envejecimiento</h3>
  <div class="kp3">
    ${kpi("8.2 mil M", "habitantes del planeta en 2024", "Naciones Unidas, 2024")}
    ${kpi("≈ " + n(p65n / 1e6) + " M", "personas de 65 años o más (10.4 % de la población)", "Cálculo propio con Banco Mundial, 2025")}
    ${kpi("1.4 mil M", "personas de 60 años o más en 2030: 1 de cada 6", "OMS, 2025")}
    ${kpi("2.1 mil M", "personas de 60 años o más en 2050", "OMS, 2025")}
    ${kpi("426 M", "personas de 80 años o más en 2050", "OMS, 2025")}
    ${kpi("14 M", "adultos de 65+ que caen cada año solo en EUA (1 de cada 4)", "CDC, 2026")}
  </div>
  <h3>Caídas y trabajo</h3>
  <div class="kp3">
    ${kpi("684,000", "muertes al año por caídas; segunda causa de muerte por traumatismos no intencionales", "OMS, 2021", "r")}
    ${kpi("37.3 M", "caídas al año que requieren atención médica", "OMS, 2021", "r")}
    ${kpi("≈ 3 M", "muertes al año por accidentes y enfermedades del trabajo; 330,000 por accidentes", "OIT, 2023", "r")}
    ${kpi("395 M", "personas trabajadoras con lesiones no mortales al año", "OIT, 2023", "r")}
    ${kpi("$586,550", "MXN, multa máxima por infracción a normas de seguridad e higiene en México (5,000 UMA)", "LFT, art. 994; INEGI, 2026", "r")}
    ${kpi("82 %", "de las personas de 10 años o más tiene celular", "UIT, 2025", "a")}
  </div>
  <h3>Desastres y alerta temprana</h3>
  <div class="kp3">
    ${kpi(String(D.des2024), "desastres registrados en 2024", "CRED, 2025", "n")}
    ${kpi(n(D.des2024Muertes), "muertes por desastres en 2024", "CRED, 2025", "n")}
    ${kpi("167 M", "personas afectadas y USD 242 mil M en pérdidas (2024)", "CRED, 2025", "n")}
    ${kpi("119", "países con sistemas de alerta temprana multirriesgo: 60 %; el 40 % aún no", "OMM, 2025", "n")}
    ${kpi("≈ 6×", "más mortalidad por desastres donde la alerta temprana es limitada", "UNDRR y OMM, 2024", "n")}
    ${kpi(n(D.mxSismos2024), "sismos registrados en México en 2024", "Pacheco, 2025, con datos del SSN", "n")}
  </div>
  ${pie("Fuentes: Naciones Unidas (2024); World Bank (2025); OMS (2021, 2025); CDC (2026); OIT (2023); LFT, art. 994; INEGI (2026); UIT (2025); CRED (2025); OMM (2025); UNDRR y OMM (2024); Pacheco (2025).")}
</section>`;

const fila = (u, uni, f, pct, val) => `<tr><td><b>${u}</b></td><td class="num">${uni}</td><td>${f}</td><td class="num">${pct}</td><td class="num">${val}</td></tr>`;
const s3 = `<section class="h" id="s3"><h2 class="t">3. Dónde puede operar: universo y escenarios</h2>
  <p>SOSistem™ funciona donde hay personas en espacios que no se pueden vigilar con cámaras. La tabla presenta el <b>universo atendible</b> con cifras oficiales y un <b>escenario ilustrativo de adopción del 1 %</b>, valorado con el paquete de referencia de USD ${D.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })} (pantalla, dos radares, instalación y calibración).</p>
  <table class="esc"><thead><tr><th>Universo</th><th>Tamaño</th><th>Fuente</th><th>Escenario 1 %</th><th>Valor de referencia</th></tr></thead><tbody>
    ${fila("Escuelas de México (todos los niveles)", n(D.mxEscuelas), "SEP, 2025", n(uno(D.mxEscuelas)) + " escuelas", "USD " + n(uno(D.mxEscuelas) * D.precio))}
    ${fila("Alumnos y docentes en México", n(D.mxAlumnos + D.mxDocentes), "SEP, 2025", "≈ " + n((D.mxAlumnos + D.mxDocentes) * 0.01) + " personas", "Protegidas en sus escuelas")}
    ${fila("Escuelas mapeadas en el mundo", "> 2.2 M", "Giga, s. f. (140 países)", n(uno(D.escuelasMapa)) + " escuelas", "USD " + n(uno(D.escuelasMapa) * D.precio))}
    ${fila("Personas de 60+ en México", n(D.mx60), "INEGI, 2026", n(D.mx60 * 0.01) + " personas", "Con su celular como sensor")}
    ${fila("Personas de 65+ en el mundo", "≈ " + n(p65n / 1e6) + " M", "World Bank, 2025 (cálculo propio)", "≈ " + n(p65n * 0.01 / 1e6) + " M personas", "Con su celular como sensor")}
    ${fila("Puertos marítimos de México", String(D.mxPuertos), "The Logistics World, 2024", "Piloto: Puerto de Ensenada", "Sujeto a autorización de ASIPONA")}
    ${fila("Gobiernos nacionales", String(D.estados), "Estados Miembros de las Naciones Unidas", "2 países", "Oficinas de atención al público")}
  </tbody></table>
  <p class="nota">Servicio mensual de referencia: USD ${D.mensual} por recinto. En el escenario de escuelas de México (1 %), equivale a USD ${n(uno(D.mxEscuelas) * D.mensual)} al mes (USD ${n(uno(D.mxEscuelas) * D.mensual * 12)} al año). Los escenarios son cálculos propios para dimensionar el alcance; no son proyecciones de venta.</p>
  <h3>Sectores prioritarios</h3>
  <div class="chips">${["Escuelas y guarderías", "Hospitales y turismo médico", "Estancias y hogares de adultos mayores", "Oficinas de gobierno con atención al público", "Puertos, aduanas y recintos fiscalizados", "Industria y maquiladoras IMMEX", "Restaurantes y hoteles", "Terminales de pasajeros y cruceros", "Estadios, templos y salones de eventos", "Albergues y refugios temporales", "Mini bodegas y espacios confinados", "Hogares: el celular de cada persona"].map((x) => `<span>${x}</span>`).join("")}</div>
  ${pie("Fuentes: SEP (2025); Giga (s. f.); INEGI (2026); World Bank (2025); The Logistics World (2024); Naciones Unidas (2024). Valor de referencia: Ramírez Salgado (2026).")}
</section>`;

const SERV = ["Inventario de personas", "Distribución y permanencia", "Persona en el suelo", "Aforo máximo excedido", "Zonas en m² y m³", "Pantallas ejecutivas",
  "Sismo, explosión y voz de auxilio", "Gases y oxígeno", "Enlace al 911 y bitácora", "Estadística ejecutiva", "Desastre y comité", "Luz, Morse y megafonía"];
const s4 = `<section class="h" id="s4"><h2 class="t">4. La solución: sensores, terminales y pantallas</h2>
  <div class="f3">${fig("ref-equipo-frontal.webp", "Terminal NODO S.O.S.©: pantalla, radar mmWave y sirena")}${fig("ref-despiece.webp", "Componentes y respaldo de energía de 30 días")}${fig("ref-pantalla-pasillo.webp", "Pantalla S.S.O.S.© en el acceso a sanitarios")}</div>
  <div class="f4">${fig("v3-pantalla-sanitarios-caida.webp", "Persona en el suelo")}${fig("v3-pantalla-sismo-dividida.webp", "Sismo: ruta de evacuación")}${fig("v3-pantalla-entrada-aforo.webp", "Inventario de personas")}${fig("v3-pantalla-cocina-gas.webp", "Fuga de gas")}</div>
  <div class="g2">
    <div><h3>Cómo avisa</h3><table class="niv"><thead><tr><th>Nivel</th><th>Tiempo</th><th>Aviso</th></tr></thead><tbody>
      <tr><td>N0</td><td>${T.N0} min</td><td>En la cabina o recinto: luz, sonido y Morse</td></tr><tr><td>N1</td><td>${T.N1} min</td><td>Responsable del lugar</td></tr>
      <tr><td>N2</td><td>${T.N2} min</td><td>Central de monitoreo</td></tr><tr><td>N3</td><td>${T.N3} min</td><td>911 con mensaje CAP v1.2</td></tr></tbody></table>
      <p class="nota">Ante una caída confirmada o un sismo, el aviso es inmediato. Colores de seguridad ISO 7010, ISO 3864-1 y NOM-026-STPS-2008.</p></div>
    <div><h3>Doce servicios</h3><div class="chips">${SERV.map((x, i) => `<span>${i + 1}. ${x}</span>`).join("")}</div></div>
  </div>
  ${pie("Imágenes: renders y pantallas de referencia del sistema (Ramírez Salgado, 2026). Fuentes: ISO (2011, 2019); STPS (2008); OASIS (2010).")}
</section>`;

const s5 = `<section class="h" id="s5"><h2 class="t">5. Cada celular, un sensor: ayuda familiar las 24 horas</h2>
  <p class="lead">Los <b>celulares, tabletas, computadoras y demás equipos, conectados a red o sin red</b>, pueden funcionar como <b>sensores</b>, como <b>terminales (pantallas) de observación e información</b>, o como <b>ambos a la vez</b>.</p>
  <div class="imp"><b>Impacto</b>Cada persona puede descargar SOSistem™ en su celular, activarlo y enlazarlo con un familiar las 24 horas, los 7 días: ante una caída, ante las palabras «S.O.S.» o «auxilio», o cuando el propio sistema detecta la caída, el familiar recibe el aviso al momento. Con el 82 % de las personas de 10 años o más con celular (UIT, 2025), la protección puede llegar a miles de millones de personas sin instalar un solo equipo.<span>Sin grabar video, voz ni conversaciones: solo es ayuda al momento.</span></div>
  <div class="cel"><div>
    <h3>Cómo funciona</h3>
    <ol><li><b>Descargar y activar</b> SOSistem™, sin registro.</li><li><b>Enlazar con un familiar</b> con la misma frase en ambos equipos, una sola vez.</li>
      <li><b>Detectar</b> la caída, las palabras de auxilio o la inmovilidad, aunque la persona no pueda tocar la pantalla.</li>
      <li><b>Avisar al momento</b> al familiar; si nadie atiende, el aviso escala hasta el 911.</li><li><b>Cancelar con la voz</b>: «todo bien» detiene una falsa alarma.</li></ol>
    <h3>Sensores · opciones actuales</h3>
    <table class="sens"><tbody>
      <tr><th>En el celular</th><td>Acelerómetro (caída e impacto), giroscopio (giro e inclinación), micrófono (solo reconoce «S.O.S.», «auxilio» y «todo bien»; no graba), ubicación con permiso, inmovilidad y modo bolsillo.</td></tr>
      <tr><th>Fijos</th><td>Radar mmWave, movimiento, distancia, volumen de sonido, humo, gas, oxígeno, hidrógeno, amoniaco, calor, frío, luz y oscuridad, agua en el piso, masa, espacio y capacidad, inventario de personas y tiempos de permanencia.</td></tr></tbody></table>
    <p class="nota"><b>Estado:</b> la Terminal en el celular funciona en versión de prueba abierta al público, con enlace entre celular y pantalla por frase; el enlace familiar permanente 24/7 está en desarrollo.</p>
  </div>${celular ? `<figure class="tel"><img src="${celular}" alt=""><figcaption>Prueba de «Persona en el suelo» con escalamiento N0–N3</figcaption></figure>` : ""}</div>
  ${pie("Fuentes: UIT (2025); LFPDPPP (2025); Ramírez Salgado (2026).")}
</section>`;

const s6 = `<section class="h" id="s6"><h2 class="t">6. Impacto, alineación mundial e indicadores</h2>
  <table class="ali"><thead><tr><th>Marco mundial</th><th>Contribución de SOSistem™</th></tr></thead><tbody>
    <tr><td><b>ODS 3</b> · Salud y bienestar</td><td>Reduce el tiempo entre una caída o crisis médica y la ayuda.</td></tr>
    <tr><td><b>ODS 8.8</b> · Entornos de trabajo seguros</td><td>Vigila espacios confinados, gases y aforo en centros de trabajo.</td></tr>
    <tr><td><b>ODS 11.5</b> · Menos muertes por desastres</td><td>Alerta de sismo, rutas de evacuación y conteo de personas por recinto.</td></tr>
    <tr><td><b>Marco de Sendai</b>, meta G</td><td>Amplía la alerta temprana multirriesgo al interior de los inmuebles.</td></tr>
    <tr><td><b>Alertas tempranas para todos</b> (ONU-OMM)</td><td>Lleva la alerta al «último metro»: la cabina, el sanitario y el celular de cada persona.</td></tr>
  </tbody></table>
  <div class="g2">
    <div><h3>Indicadores de resultados</h3><table><thead><tr><th>Indicador</th><th>Medición</th></tr></thead><tbody>
      <tr><td>Aviso al responsable</td><td>≤ ${T.N1} min; inmediato en caída o sismo</td></tr><tr><td>Aviso al 911 (CAP v1.2)</td><td>≤ ${T.N3} min</td></tr>
      <tr><td>Personas contadas por recinto</td><td>En tiempo real, sin identificarlas</td></tr><tr><td>Falsas alarmas</td><td>Porcentaje por evento, con bitácora auditable</td></tr>
      <tr><td>Recintos y personas protegidas</td><td>Conteo por país, sector y periodo</td></tr></tbody></table></div>
    <div><h3>Análisis FODA</h3><table class="foda"><tbody>
      <tr><td class="fo-f"><b>Fortalezas</b><br>Ve sin cámaras · aviso en segundos · 30 días sin red · celular como sensor</td><td class="fo-d"><b>Debilidades</b><br>Etapa piloto · evaluación de la conformidad en curso · costo inicial del equipo</td></tr>
      <tr><td class="fo-o"><b>Oportunidades</b><br>Alertas tempranas para todos · envejecimiento · obligación legal de prevenir</td><td class="fo-a"><b>Amenazas</b><br>Emergencias inadvertidas · sismos sin aviso · falsas alarmas (mitigadas por niveles)</td></tr></tbody></table></div>
  </div>
  <h3>Privacidad y normas</h3>
  <p>Sin cámaras ni grabación; solo se transmite el aviso del momento (tipo de evento, hora y, si se autoriza, ubicación), conforme a la LFPDPPP (2025). Normas de referencia: ISO 7010:2019, ISO 3864-1:2011, NOM-026-STPS-2008, ISO 8201, ISO 7731 y OASIS CAP v1.2.</p>
  ${pie("Fuentes: Naciones Unidas (2015); UNDRR (2015); UNDRR y OMM (2024); OMM (2025); LFPDPPP (2025); ISO (2011, 2019); STPS (2008); OASIS (2010).")}
</section>`;

const s7 = `<section class="h" id="s7"><h2 class="t">7. Hoja de ruta, sostenibilidad y alianzas</h2>
  <table class="ruta"><thead><tr><th>Fase</th><th>Alcance</th><th>Resultado</th></tr></thead><tbody>
    <tr><td><b>1 · Piloto</b></td><td>Prototipo y prueba real en ContenedorEns (Ensenada, B.C., México).</td><td>Tiempos de aviso y falsas alarmas medidos en operación real.</td></tr>
    <tr><td><b>2 · Puerto</b></td><td>Prueba adicional en el Puerto de Ensenada, sujeta a autorización de ASIPONA Ensenada.</td><td>Validación en recintos portuarios y fiscalizados.</td></tr>
    <tr><td><b>3 · Conformidad</b></td><td>Evaluación de la conformidad ante organismos nacionales e internacionales.</td><td>Equipo listo para instalación en sectores regulados.</td></tr>
    <tr><td><b>4 · Escala</b></td><td>Escuelas, hospitales, gobierno y celulares en México y América Latina.</td><td>Réplica por país con aliados institucionales.</td></tr>
  </tbody></table>
  <div class="g2">
    <div><h3>Modelo de sostenibilidad</h3><table><tbody>
      <tr><td>Paquete de referencia (pantalla, dos radares, instalación y calibración)</td><td class="num"><b>USD ${D.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })}</b></td></tr>
      <tr><td>Monitoreo, mantenimiento y simulacro mensual</td><td class="num"><b>USD ${D.mensual} / mes</b></td></tr>
      <tr><td>Diagnóstico del recinto</td><td class="num">Sin costo</td></tr></tbody></table>
      <p class="nota">Precios sin IVA; cotización final por recinto. SOSistem™ no sustituye a los servicios oficiales de emergencia.</p></div>
    <div><h3>Convocatoria a aliados</h3><ul>
      <li><b>Gobiernos y protección civil:</b> pilotos en escuelas y oficinas de atención al público.</li>
      <li><b>Banca de desarrollo y fondos:</b> financiamiento de equipos para pilotos y evaluación de la conformidad.</li>
      <li><b>Organismos multilaterales:</b> réplica regional dentro de «Alertas tempranas para todos».</li>
      <li><b>Academia:</b> validación científica de tiempos de aviso y falsas alarmas.</li></ul></div>
  </div>
  <div class="firma">
    <div class="fi-l"><span class="linea"></span><b>Víctor Hugo Ramírez Salgado</b><span>Autor de Sistema S.O.S.© y SOSistem™</span>
      <span class="leyenda">Más de 20 años en puertos; cursos internacionales OEA-CIP, OMI, Universidad de Cantabria, ValenciaPort y China.</span></div>
    <div class="fi-r"><span>MBA · CETYS Universidad · Cédula profesional <b>11197647</b></span><span>Lic. en Comercio Internacional · Cédula profesional <b>10392206</b></span>
      <span>Técnico en Contabilidad · DGETI · Registro <b>6226780</b></span><span>Certificación CONOCER EC0217 · Folio <b>01837017</b></span>
      <span class="pi">Safe Creative: Sistema S.O.S.© 2609046908578 · SOSistem™ 2610257442171 · Cubo Morse© 2610257441754</span></div>
  </div>
  <div class="cta"><div><b>Contacto</b> · WhatsApp +52 646 227 0490 · ${L(S, "sosistem.com")} · ${L(S + "terminal.html", "Terminal de pruebas")}</div><div>© ${anio} Víctor Hugo Ramírez Salgado</div></div>
  ${pie("Fuente: Ramírez Salgado (2026).")}
</section>`;

const s8 = `<section class="h" id="s8"><h2 class="t">Referencias</h2>
  <p class="nota">Formato APA, 7.ª edición, en orden alfabético. Las cifras sin fuente explícita son cálculos propios a partir de las fuentes citadas.</p>
  <ol class="refs">${REF.map((r) => `<li>${r}</li>`).join("")}</ol>
  ${pie(`© ${anio} Víctor Hugo Ramírez Salgado · SOSistem™ · Sistema S.O.S.© (Safe Creative 2609046908578) · Plataforma SOSistem™ (2610257442171).`)}
</section>`;

const css = `@page{size:letter}*{box-sizing:border-box}body{margin:0;font:9.8pt/1.45 Inter,"Segoe UI",Roboto,Arial,sans-serif;color:#0f1b2d}
.h{page-break-after:always;height:9.85in;display:flex;flex-direction:column;overflow:hidden}.h:last-child{page-break-after:auto}
h1{font-size:17pt;margin:0}.sub{margin:2px 0 0;color:#4a5568;font-size:8.4pt}
h2{font-size:11pt;margin:9px 0 5px;padding-left:8px;border-left:5px solid #005387}h2.t{font-size:15pt;margin:0 0 8px;border-left:6px solid ${NAR};padding-left:10px}
h3{font-size:9.8pt;margin:8px 0 3px;color:#005387}p{margin:3px 0}
.hero{display:grid;grid-template-columns:1fr 2.1in;gap:14px;margin-top:8px;align-items:start}.claim{font-size:11.5pt;line-height:1.45;margin:2px 0 10px}
.k{border:1px solid #c9ced6;border-top:4px solid #005387;border-radius:6px;padding:6px 8px;display:flex;flex-direction:column}
.k b{font-size:17pt;line-height:1.1;color:#005387}.k span{font-size:8pt;color:#334155}.k small{font-size:6.8pt;color:#6b7687;margin-top:auto;padding-top:2px}
.k.r{border-top-color:#D9221A}.k.r b{color:#D9221A}.k.a{border-top-color:${NAR}}.k.a b{color:${NAR}}.k.n{border-top-color:#0f2a4a}.k.n b{color:#0f2a4a}
.kp4{display:grid;grid-template-columns:1fr 1fr;gap:7px}.kp3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.tel{border-radius:16px;border:3px solid #1e293b;background:#0b1018;margin:0;overflow:hidden}.tel img{display:block;width:100%}
.tel figcaption{background:#fff;font-size:7pt;padding:2px 6px;color:#334155}
.idx{width:100%;border-collapse:collapse;font-size:10pt}.idx td{border:0;border-bottom:1px dotted #9aa5b5;padding:4px 2px}.idx .pg{text-align:right;width:3em;font-weight:700}.idx a{color:#0f1b2d;text-decoration:none}
table{width:100%;border-collapse:collapse;font-size:9pt}th,td{border:1px solid #c9ced6;padding:3px 6px;text-align:left;vertical-align:top}th{background:#eef1f5}.num{text-align:right;white-space:nowrap}
.caja{margin:4px 0 6px;padding:8px 12px;border-radius:8px;background:#0f2a4a;color:#fff;font-size:10.5pt;line-height:1.45}.caja b{display:block;color:#ffb27a;font-size:8pt;letter-spacing:.14em;text-transform:uppercase}
.caja.n{background:#f3f7fc;color:#0f1b2d;border:1px solid #c9d6e6;font-size:9pt}.caja.n b{color:#005387}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}.dif th{width:7.5em;background:#fff7f1;color:#8a4a20}
.esc td,.esc th{font-size:8.8pt}.chips{display:flex;flex-wrap:wrap;gap:4px}.chips span{border:1px solid #f0c8ae;background:#fff7f1;border-radius:10px;padding:1px 8px;font-size:8pt}
figure{margin:0;border:1px solid #c9ced6;border-radius:6px;overflow:hidden;background:#0b1018}figure img{display:block;width:100%;object-fit:cover}
figcaption{background:#fff;color:#334155;font-size:7.2pt;padding:2px 5px;line-height:1.25}
.f3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.f3 img{height:1.75in}.f4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:7px}.f4 img{height:1.5in;object-fit:contain}
.niv td:first-child{color:${NAR};font-weight:800}
.lead{font-size:10pt}.imp{margin:6px 0;padding:9px 12px;border-radius:8px;background:#0f2a4a;color:#fff;font-size:10pt;line-height:1.45}.imp b{display:block;color:#ffb27a;font-size:8pt;letter-spacing:.14em;text-transform:uppercase}.imp span{display:block;margin-top:4px;color:#ffd29e;font-weight:700}
.cel{display:grid;grid-template-columns:1fr 2.3in;gap:14px;align-items:start}.sens th{width:6.5em;background:#fff7f1;color:#8a4a20}ol,ul{margin:3px 0;padding-left:18px}li{margin:2px 0}
.foda td{width:50%;font-size:8pt}.fo-f{border-left:4px solid #15803D}.fo-d{border-left:4px solid #F9A900}.fo-o{border-left:4px solid #1F6FB2}.fo-a{border-left:4px solid #D9221A}
.ali td:first-child{width:38%}.ruta td:first-child{width:7.5em;color:${NAR}}
.firma{display:grid;grid-template-columns:1fr 1.25fr;gap:14px;margin-top:10px;padding:8px 10px;border:1px solid #c9ced6;border-left:5px solid ${NAR};border-radius:6px}
.firma span{display:block}.fi-l .linea{border-bottom:1px solid #0f1b2d;height:24px;margin-bottom:3px;width:85%}.fi-l b{font-size:10.5pt}
.leyenda{font-size:7.8pt;color:#8a4a20;margin-top:3px;font-style:italic}.fi-r{font-size:8pt;line-height:1.5}.fi-r .pi{font-size:7pt;color:#4a5568;margin-top:2px}
.cta div:last-child{white-space:nowrap}.cta{display:flex;justify-content:space-between;gap:10px;background:#0f2a4a;color:#fff;border-radius:6px;padding:6px 10px;margin-top:8px;font-size:8.6pt}.cta a{color:#ffd29e}
.refs{padding-left:0;margin:4px 0}.refs li{list-style:none;padding-left:2.2em;text-indent:-2.2em;margin:0 0 5px;font-size:8.4pt;line-height:1.4}
.nota{font-size:7.9pt;color:#4a5568;margin:4px 0}a{color:#005387}
footer.f{margin-top:auto;border-top:1px solid #0f1b2d;padding-top:4px;font-size:7pt;color:#4a5568}
${emblemaCss}${idiomasCss}`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Resumen ejecutivo global · SOSistem™ ${esc(ver)}</title><style>${css}</style></head>
<body>${portada}${s1}${s2}${s3}${s4}${s5}${s6}${s7}${s8}</body></html>`;

const p = await b.newPage();
await p.setContent(marcas(html), { waitUntil: "load" });
const desborde = await p.$$eval(".h", (hs) => hs.map((h, i) => (h.scrollHeight > h.clientHeight + 1 ? `hoja ${i + 1}: ${h.scrollHeight - h.clientHeight}px` : "")).filter(Boolean));
if (desborde.length) console.warn("AVISO · el contenido no cabe en:", desborde.join(", "));
await p.pdf({ path: "assets/resumen-ejecutivo-global-sosistem.pdf", format: "Letter", printBackground: true, outline: true,
  displayHeaderFooter: true, headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;font:7pt Arial;color:#7a8699;padding:0 .5in;display:flex;justify-content:space-between"><span>Resumen ejecutivo global · SOSistem™ ${esc(ver)} · ${hoy}</span><span>Hoja <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
  margin: { top: "0.42in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
await b.close();
console.log("Resumen ejecutivo global listo · versión " + ver);
