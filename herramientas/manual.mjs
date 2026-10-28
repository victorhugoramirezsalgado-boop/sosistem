// SOSistem™ · Manual de configuración (PDF, 5 hojas, APA 7.ª ed.) · © Víctor Hugo Ramírez Salgado
// Se genera solo con los datos vigentes del sitio (versión, tiempos de escalamiento, alertas y recintos)
// para que el manual siempre esté actualizado. Uso: node herramientas/manual.mjs  →  assets/manual-configuracion-sosistem.pdf
import { createRequire } from "module";
import fs from "fs";
const { chromium } = createRequire(import.meta.url)("playwright");

const V = JSON.parse(fs.readFileSync("datos/version.json", "utf8"));
const C = JSON.parse(fs.readFileSync("datos/config.json", "utf8"));
const ver = V.version, hoy = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Tijuana" });
const T = C.tiempos || {}, A = C.alertas || {};
const S = "https://sosistem.com/";
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const L = (url, txt) => `<a href="${url}">${esc(txt || url.replace("https://", ""))}</a>`;
const PAT = { t3: "T-3 (ISO 8201)", solas: "7 cortas + 1 larga (SOLAS)", pulsos: "pulsos (ISO 7731)", fsk: "bitonal 800/1250 Hz" };

// Referencias (APA 7.ª ed.)
const R = {
  cap: `OASIS. (2010). <i>Common Alerting Protocol version 1.2</i>. ${L("https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html")}`,
  gh: `GitHub. (s. f.). <i>Managing your personal access tokens</i>. Recuperado el ${hoy}, de ${L("https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens", "docs.github.com")}`,
  i8201: `International Organization for Standardization. (2017). <i>Alarm systems — Audible emergency evacuation signal</i> (ISO 8201:2017).`,
  i7731: `International Organization for Standardization. (2003). <i>Ergonomics — Danger signals for public and work areas — Auditory danger signals</i> (ISO 7731:2003).`,
  i3864: `International Organization for Standardization. (2011). <i>Graphical symbols — Safety colours and safety signs — Part 1: Design principles for safety signs and safety markings</i> (ISO 3864-1:2011). ${L("https://www.iso.org/standard/51021.html")}`,
  i7010: `International Organization for Standardization. (2019). <i>Graphical symbols — Safety colours and safety signs — Registered safety signs</i> (ISO 7010:2019, con Amd. 1–11). ${L("https://www.iso.org/standard/72424.html")}`,
  nom026: `Secretaría del Trabajo y Previsión Social. (2008). <i>NOM-026-STPS-2008. Colores y señales de seguridad e higiene</i>. ${L("https://dof.gob.mx/normasOficiales/3541/stps.htm", "dof.gob.mx")}`,
  rfc8018: `Moriarty, K., Kaliski, B., & Rusch, A. (2017). <i>PKCS #5: Password-based cryptography specification version 2.1</i> (RFC 8018). ${L("https://www.rfc-editor.org/rfc/rfc8018")}`,
  gcm: `Dworkin, M. (2007). <i>Recommendation for block cipher modes of operation: Galois/Counter Mode (GCM) and GMAC</i> (NIST SP 800-38D). ${L("https://doi.org/10.6028/NIST.SP.800-38D")}`,
  lfpdppp: `Ley Federal de Protección de Datos Personales en Posesión de los Particulares. (2025). <i>Diario Oficial de la Federación</i>, 20 de marzo de 2025. ${L("https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf", "diputados.gob.mx")}`,
  ots: `OpenTimestamps. (s. f.). <i>OpenTimestamps: Scalable, trust-minimized, distributed timestamping</i>. Recuperado el ${hoy}, de ${L("https://opentimestamps.org")}`,
  sos: `Ramírez Salgado, V. H. (${new Date().getFullYear()}). <i>SOSistem™: Sistema S.O.S.©, versión ${esc(ver)}</i> [Sitio web y documentación técnica]. ${L(S)}`,
};
const fuentes = (...k) => `<footer class="f"><b>Fuentes de esta hoja</b><ol>${k.map((x) => `<li>${R[x]}</li>`).join("")}</ol></footer>`;
const al = (k) => A[k] || {};
const filaAl = (k, n) => `<tr><td>${n}</td><td>${esc(al(k).texto || "—")}</td><td>${al(k).sirena_db ?? "—"} dB</td><td>${PAT[al(k).patron] || "—"}</td><td>${al(k).cada_s ? al(k).cada_s + " s" : "—"}</td><td>${al(k).llamada_911_s ? al(k).llamada_911_s + " s" : "No"}</td></tr>`;

const IDX = [
  ["s1", "1. Accesos y versiones", S, "sosistem.com"],
  ["s2", "2. Terminal de pruebas con el celular", S + "terminal.html", "sosistem.com/terminal.html"],
  ["s3", "3. Panel de administrador", S + "admin.html", "sosistem.com/admin.html"],
  ["s4", "4. Alertas, escalamiento y nube", S + "#funciona", "sosistem.com/#funciona"],
  ["s5", "5. Pantallas, fondos y colores por falla", S + "#pantalla-demo", "sosistem.com/#pantalla-demo"],
  ["s6", "6. Arquitectura e instalación", S + "#modalidades", "sosistem.com/#modalidades"],
  ["s7", "7. Seguridad y privacidad", S + "#normativa", "sosistem.com/#normativa"],
  ["s8", "8. Cambios, autorización y versiones", S + "beta/", "sosistem.com/beta/ (administrador)"],
];

const hojas = [
`<section class="h">
  <div class="port"><img src="data:image/svg+xml;base64,${Buffer.from(fs.readFileSync("assets/logo.svg")).toString("base64")}" alt=""><div><h1>Manual de configuración · SOSistem™</h1>
  <p class="sub">Sistema S.O.S.© · versión ${esc(ver)} · actualizado el ${hoy} · se regenera con cada versión del sitio</p></div></div>
  <h2>Índice</h2>
  <table class="idx"><thead><tr><th>Sección</th><th>Hoja</th><th>Dónde está en el sistema</th></tr></thead><tbody>
  ${IDX.map(([id, t, url, u], i) => `<tr><td><a href="#${id}">${t}</a></td><td>${[1, 2, 2, 3, 3, 4, 4, 5][i]}</td><td>${L(url, u)}</td></tr>`).join("")}
  </tbody></table>
  <h2 id="s1">1. Accesos y versiones</h2>
  <table><thead><tr><th>Acceso</th><th>Para qué sirve</th><th>Quién</th></tr></thead><tbody>
    <tr><td>${L(S, "sosistem.com")}</td><td>Sitio oficial: información, simulador, Aprendizaje y contacto, en 22 idiomas.</td><td>Público</td></tr>
    <tr><td>${L(S + "terminal.html", "/terminal.html")}</td><td>Terminal de pruebas: el celular funciona como sensor y pantalla (sección 2).</td><td>Público, sin registro</td></tr>
    <tr><td>${L(S + "admin.html", "/admin.html")}</td><td>Panel de administrador con doble clave (sección 3).</td><td>Administradores</td></tr>
    <tr><td>${L(S + "beta/", "/beta/")}</td><td>Página Beta: cambios por autorizar; pide clave de administrador (sección 8).</td><td>Administrador principal</td></tr>
  </tbody></table>
  <ul><li><b>Versión vigente:</b> ${esc(ver)} (${esc(V.fecha || "")}). Los ajustes menores llevan un tercer número interno (p. ej., 5.7.1) que no se muestra en el sitio.</li>
  <li><b>Sin internet:</b> el sitio y la terminal se guardan en el teléfono al abrirlos con conexión; el panel de administrador nunca se guarda.</li>
  <li><b>Idioma:</b> selector en la barra superior; la versión oficial es en español.</li></ul>
  ${fuentes("sos")}
</section>`,

`<section class="h">
  <h2 id="s2">2. Terminal de pruebas con el celular</h2>
  <ol class="pasos"><li><b>Abrir e instalar:</b> abra ${L(S + "terminal.html", "sosistem.com/terminal.html")} y use <i>Compartir → Agregar a inicio</i> (iPhone) o <i>Instalar app</i> (Android/Chrome).</li>
  <li><b>Permisos:</b> movimiento y orientación, micrófono (solo nivel de sonido; no se graba audio), ubicación y notificaciones. Sin permisos, esos detectores quedan apagados.</li>
  <li><b>Escenario:</b> elija lugar y modo (prueba o real). Detectores: caída de persona, vibración tipo sismo, ruido fuerte o grito, palabra «S.O.S.»/«auxilio» y sin movimiento prolongado (tiempo en <i>Ajustes</i>).</li>
  <li><b>Vincular una pantalla:</b> en <i>Enlace</i>, escriba la misma frase del recinto en el celular y en la pantalla (una sola vez); se reconecta sola.</li>
  <li><b>Exportar y enviar:</b> CSV/JSON o archivo cifrado <code>.cubo.txt</code> (AES-256-GCM con frase que no se guarda); opcionalmente a un repositorio privado de GitHub.</li></ol>
  <p class="nota">Vistas de la terminal: Monitor · Sensores · Eventos · Estadísticas · Plataforma · Ajustes.</p>
  <h2 id="s3">3. Panel de administrador</h2>
  <ol class="pasos"><li><b>Entrar:</b> ${L(S + "admin.html", "sosistem.com/admin.html")} → clave de pre-ingreso → clave de 2.ª autorización. Cinco intentos fallidos bloquean 5 minutos.</li>
  <li><b>Token de GitHub (para guardar cambios):</b> <i>Ajustes</i> → token <i>fine-grained</i> con <i>Contents: Read and write</i> solo sobre el repositorio del sitio; se borra al cerrar la pestaña.</li>
  <li><b>Guardar y publicar:</b> los ajustes se escriben en <code>datos/config.json</code>; el sitio cambia en 1–2 minutos.</li></ol>
  <table><thead><tr><th>Pestaña del panel</th><th>Qué se configura</th></tr></thead><tbody>
  <tr><td>Resumen · Visitas · Eventos</td><td>Indicadores, visitas anónimas, interés por sección y bitácora de eventos.</td></tr>
  <tr><td>Pruebas de terminal · Supervisor de sensores</td><td>Pruebas recibidas de celulares; latido firmado, señal y batería de cada sensor.</td></tr>
  <tr><td>Sirena y Morse · Módulos, recintos y nube</td><td>Sonido por estado, recintos y polígonos, pantalla exterior y con quién se comparte cada evento (sección 4).</td></tr>
  <tr><td>Financiera · Datos técnicos · Ejecutivo</td><td>Costos, especificación de referencia, memoria energética y presentación para clientes.</td></tr>
  <tr><td>Usuarios · Cambios y comentarios · Ajustes</td><td>Usuarios, cambio de claves, apariencia, contador y publicación en GitHub.</td></tr>
  </tbody></table>
  ${fuentes("gh", "gcm")}
</section>`,

`<section class="h">
  <h2 id="s4">4. Alertas, escalamiento y nube</h2>
  <p><b>Escalamiento vigente (segundos):</b> N0 voz en cabina ${T.N0 ?? "—"} s → N1 encargado ${T.N1 ?? "—"} s → N2 central ${T.N2 ?? "—"} s → N3 911 (CAP v1.2) ${T.N3 ?? "—"} s. Se cambia en <i>Panel → Ajustes → Tiempos de escalamiento</i>.</p>
  <table><thead><tr><th>Estado</th><th>Morse</th><th>Sirena</th><th>Patrón</th><th>Repite</th><th>Llamada 911</th></tr></thead><tbody>
  ${filaAl("advertencia", "Advertencia")}${filaAl("caida", "Persona caída")}${filaAl("sismo", "Sismo")}${filaAl("prueba", "Prueba")}</tbody></table>
  <ul><li><b>Regla de sonido:</b> el Morse suena solo en emergencia, desastre natural, advertencia y pruebas autorizadas; en lo demás solo destella.</li>
  <li><b>Recintos:</b> ${(C.recintos || []).map((r) => esc(r.id + " " + r.nombre)).join(" · ")}. Entrada principal y sanitarios son obligatorios.</li>
  <li><b>Nube con permiso:</b> por tipo de evento (caída, sismo, otro evento natural, otros módulos) se elige si se comparte con C5/911, central, Protección Civil, encargados u otros recintos; solo conteos, sin identidad.</li>
  <li><b>Pantalla exterior:</b> se enciende con sismo u otro evento natural, o cuando el cliente lo decide.</li></ul>
  <h2 id="s5">5. Pantallas, fondos y colores por falla</h2>
  <ol class="pasos"><li><b>Fondo según la luz:</b> ${L(S + "#pantalla-demo", "simulador")} → <i>Fondo de la pantalla</i>: Automático (hora o sensor de luz), Interior, Día · mucha luz, Noche · poca luz, Alto contraste.</li>
  <li><b>Colores por falla:</b> toque un color para cambiarlo; se marca en ámbar si sale de la familia ISO 3864-1 o si su texto baja de 4.5:1 de contraste. <i>Restablecer colores ISO</i> regresa a norma.</li>
  <li><b>Cubo de estado:</b> verde normal · ámbar advertencia · rojo auxilio urgente · blanco con vibración en sismo.</li></ol>
  <table><thead><tr><th>Familia</th><th>HEX</th><th>RAL</th><th>Uso</th></tr></thead><tbody>
  <tr><td>Rojo</td><td>#D9221A</td><td>3001</td><td>Persona en el suelo, 911</td></tr><tr><td>Ámbar</td><td>#F9A900</td><td>1003</td><td>Permanencia, aforo, gas</td></tr>
  <tr><td>Verde</td><td>#15803D</td><td>6032</td><td>Condición segura, salidas</td></tr><tr><td>Azul</td><td>#1F6FB2</td><td>5005</td><td>Falla de sensor o equipo</td></tr>
  <tr><td>Blanco</td><td>#F5F5EF</td><td>9003</td><td>Sismo y evacuación</td></tr></tbody></table>
  ${fuentes("cap", "i8201", "i7731", "i3864", "nom026")}
</section>`,

`<section class="h">
  <h2 id="s6">6. Arquitectura e instalación</h2>
  <table><thead><tr><th>Elemento</th><th>Configuración</th></tr></thead><tbody>
  <tr><td>Modalidad rápida</td><td>Celulares como terminal (sección 2): sin instalación, para pruebas, eventos temporales o emergencias.</td></tr>
  <tr><td>Modalidad principal</td><td>Sensores fijos en cabinas, sanitarios y recintos confinados, con pantallas S.S.O.S.© fabricadas para cada lugar.</td></tr>
  <tr><td>Pantallas compatibles</td><td>S.S.O.S.©, iPad y tabletas, celulares, computadoras y monitores de oficina con módulo lector.</td></tr>
  <tr><td>Administración</td><td>Principal y secundario (director general, de operaciones o encargado de seguridad) con las mismas facultades: autorizar módulos de instalación, de vista y de lectura por recinto.</td></tr>
  <tr><td>Sensores</td><td>Paquete completo (todos los niveles de lectura) o básico a elección: humo, gas, movimiento, nivel de sonido, calor, frío, oxígeno, hidrógeno, CO, agua en el piso, vibración, inventario de personas, permanencia, masa, volumen y aforo mínimo/máximo.</td></tr>
  </tbody></table>
  <p class="nota">Antes de instalar: definir recintos y polígonos (sección 4), medir ruido de fondo (la sirena debe superarlo en 15 dB o más) y colocar la señalética ISO 7010 de salidas y punto de reunión.</p>
  <h2 id="s7">7. Seguridad y privacidad</h2>
  <ul><li><b>Sin cámaras ni grabación:</b> radar y sensores de distancia; solo estados y medidas.</li>
  <li><b>Claves:</b> nunca se guardan; se derivan llaves PBKDF2-SHA256 con sal aleatoria. El acceso a la Beta usa la misma técnica.</li>
  <li><b>Datos de pruebas:</b> cifrado AES-256-GCM con frase que no se guarda; sin la frase no se pueden leer.</li>
  <li><b>Tokens de GitHub:</b> mínimos permisos, un solo repositorio, con caducidad; se pueden borrar al terminar.</li>
  <li><b>Datos personales:</b> aviso de privacidad y retención mínima; las constancias de aportación registran solo folio, huella e iniciales.</li>
  <li><b>No sustituye</b> a los servicios oficiales de emergencia; en una emergencia llame al 911.</li></ul>
  ${fuentes("rfc8018", "gcm", "lfpdppp", "i7010")}
</section>`,

`<section class="h">
  <h2 id="s8">8. Cambios, autorización y versiones</h2>
  <ol class="pasos"><li><b>Todo cambio nuevo va primero a la Beta</b> (${L(S + "beta/", "sosistem.com/beta/")}), protegida con la clave del administrador.</li>
  <li><b>Pendientes Beta:</b> cada renglón dice qué es, dónde va y qué modifica; se marca ✓ Autorizar, ✎ Con cambios o ✗ No, con comentario.</li>
  <li><b>Enviar:</b> <i>Enviar autorizaciones al sistema</i> (token de GitHub) o <i>Copiar decisiones para Claude</i> y pegarlas en el chat.</li>
  <li><b>Publicación:</b> lo autorizado pasa al sitio oficial con nuevo número de versión; lo «con cambios» regresa a «por autorizar»; lo rechazado se retira.</li>
  <li><b>Automático en cada publicación:</b> sello de tiempo OpenTimestamps de todos los archivos, imagen para compartir actualizada y este manual regenerado.</li></ol>
  <table><thead><tr><th>Versión</th><th>Fecha</th><th>Cambio principal</th></tr></thead><tbody>
  ${(V.historial || []).slice(0, 4).map((h) => `<tr><td>${esc(h.v)}</td><td>${esc(h.fecha)}</td><td>${esc(String(h.resumen).slice(0, 210))}${String(h.resumen).length > 210 ? "…" : ""}</td></tr>`).join("")}
  </tbody></table>
  <p class="nota">Soporte: WhatsApp 646 227 0490 · ${L(S + "#contacto", "sosistem.com/#contacto")}. © ${new Date().getFullYear()} Víctor Hugo Ramírez Salgado. Sistema S.O.S.© (Safe Creative 2609046908578), Cubo Morse© (2610257441754), Código Cúbico© (2610097276721).</p>
  ${fuentes("ots", "gh", "sos")}
</section>`,
];

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Manual de configuración · SOSistem ${esc(ver)}</title><style>
@page{size:letter;margin:.45in .5in .5in}*{box-sizing:border-box}body{margin:0;font:9.4pt/1.38 Inter,"Segoe UI",Roboto,Arial,sans-serif;color:#0f1b2d}
.h{page-break-after:always;min-height:9.9in;display:flex;flex-direction:column}.h:last-child{page-break-after:auto}
.port{display:flex;gap:14px;align-items:center;border-bottom:4px solid #DB641C;padding-bottom:8px}.port img{width:58px;height:62px}
h1{font-size:18pt;margin:0}.sub{margin:2px 0 0;color:#4a5568;font-size:8.6pt}
h2{font-size:12pt;margin:12px 0 6px;padding-left:8px;border-left:5px solid #005387}
table{width:100%;border-collapse:collapse;margin:4px 0 6px;font-size:8.6pt}th,td{border:1px solid #c9ced6;padding:3px 6px;text-align:left;vertical-align:top}th{background:#eef1f5}
.idx td:nth-child(2){text-align:center;width:3em}a{color:#005387}code{font:8.4pt ui-monospace,Menlo,monospace;background:#eef1f5;padding:0 3px;border-radius:3px}
ul,ol{margin:4px 0 6px;padding-left:18px}li{margin:1px 0}.pasos li::marker{font-weight:700;color:#DB641C}.nota{font-size:8.4pt;color:#4a5568;margin:4px 0}
footer.f{margin-top:auto;border-top:1px solid #0f1b2d;padding-top:4px;font-size:7.4pt;color:#4a5568}footer.f ol{margin:2px 0 0;padding-left:16px}footer.f li{padding-left:1.6em;text-indent:-1.6em;list-style:none}
</style></head><body>${hojas.join("")}</body></html>`;

const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(html, { waitUntil: "load" });
await p.pdf({ path: "assets/manual-configuracion-sosistem.pdf", format: "Letter", printBackground: true, outline: true,
  displayHeaderFooter: true, headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;font:7pt Arial;color:#7a8699;padding:0 .5in;display:flex;justify-content:space-between"><span>Manual de configuración · SOSistem™ ${esc(ver)} · ${hoy}</span><span>Hoja <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
  margin: { top: "0.45in", bottom: "0.55in", left: "0.5in", right: "0.5in" } });
await b.close();
console.log("Manual de configuración listo · versión " + ver);
