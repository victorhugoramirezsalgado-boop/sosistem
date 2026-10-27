// SOSistem™ · Imagen para compartir (Open Graph, 1200 × 630) · © Víctor Hugo Ramírez Salgado
// Toma una foto real de la terminal NODO S.O.S.© del sitio y la compone con el Cubo Morse© naranja.
// Uso: servir la raíz del sitio en http://localhost:8765 y correr: node herramientas/og.mjs
// Escribe assets/og-sosistem.png y pone en index.html la versión en la liga de la imagen (rompe la caché de redes sociales).
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "fs";
const SITIO = process.env.SITIO || "http://localhost:8765/";
const ver = JSON.parse(fs.readFileSync("datos/version.json", "utf8")).version;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { localStorage.setItem("sos_idioma", "es"); localStorage.setItem("sos_pantalla_tema", '"interior"'); });
await p.goto(SITIO + "index.html", { waitUntil: "networkidle" });
await p.addStyleTag({ content: ".top,.pestanas,#ver-pestanas{display:none!important} .eq-cubo{transition:none!important} .eq-alerta,.eq-leds i{animation:none!important}" });
await p.waitForTimeout(1200);
const cara = await p.$('.eq-cara[data-n="1"] .eq-bisel');
const terminal = (await cara.screenshot({ type: "png" })).toString("base64");
const logo = fs.readFileSync("assets/logo.svg", "utf8");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;
background:radial-gradient(1200px 630px at 15% 20%,#1b2433 0,#0b1018 60%);color:#EEF2F7;position:relative}
.izq{position:absolute;left:64px;top:64px;width:600px}
.logo{width:120px;height:130px}.logo svg{width:100%;height:100%}
h1{font-size:76px;line-height:1;margin:18px 0 10px;font-weight:800;letter-spacing:-.01em}h1 span{color:#DB641C}
h2{font-size:30px;margin:0 0 14px;font-weight:700;color:#fff}
p{font-size:23px;line-height:1.35;color:#AEB9C8;margin:0 0 22px}
.url{font-size:22px;color:#DB641C;font-weight:700;letter-spacing:.02em}
.ley{display:flex;gap:14px;margin-top:18px;font-size:16px;color:#AEB9C8}.ley i{display:inline-block;width:14px;height:14px;border-radius:4px;margin-right:6px;vertical-align:-2px}
.term{position:absolute;right:46px;top:44px;width:470px;filter:drop-shadow(0 24px 40px rgba(0,0,0,.55));transform:perspective(1400px) rotateY(-12deg)}
.term img{width:100%;display:block;border-radius:20px}
.pie{position:absolute;left:64px;bottom:26px;font-size:14px;color:#6B7687}</style></head><body>
<div class="izq"><div class="logo">${logo}</div><h1>SOS<span>istem</span>™</h1><h2>Alerta temprana para salvar vidas</h2>
<p>Terminales sin cámaras que detectan a una persona en el suelo, avisan de sismos y escalan la alerta hasta el 911.</p>
<div class="url">sosistem.com</div>
<div class="ley"><span><i style="background:#15803D"></i>Normal</span><span><i style="background:#F9A900"></i>Advertencia</span><span><i style="background:#D9221A"></i>Auxilio urgente</span><span><i style="background:#F5F5EF"></i>Sismo</span></div></div>
<div class="term"><img src="data:image/png;base64,${terminal}"></div>
<div class="pie">© Víctor Hugo Ramírez Salgado · Sistema S.O.S.© · versión ${ver}</div></body></html>`;
const o = await b.newPage({ viewport: { width: 1200, height: 630 } });
await o.setContent(html, { waitUntil: "load" });
await o.screenshot({ path: "assets/og-sosistem.png" });
await b.close();
// Liga versionada en index.html para que WhatsApp, Instagram y Facebook pidan la imagen nueva
let idx = fs.readFileSync("index.html", "utf8");
idx = idx.replace(/(<meta property="og:image" content="https:\/\/sosistem\.com\/assets\/og-sosistem\.png)(\?v=[^"]*)?"/, `$1?v=${ver}"`);
fs.writeFileSync("index.html", idx);
console.log("Imagen para compartir lista · versión " + ver);
