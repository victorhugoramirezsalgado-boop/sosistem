// Pruebas reales de SOSistem™ contra el sitio PUBLICADO (https://sosistem.com) · © Víctor Hugo Ramírez Salgado
// Corre en GitHub Actions (navegador real con internet). Espera a que el sitio publicado tenga la misma versión
// que el repositorio, abre cada página como iPhone y como computadora, y prueba las funciones con datos reales
// (temperatura exterior real de Open-Meteo, PDF reales, motor de sonido real con audio bloqueado y luego permitido).
// Resultado: pruebas-reales/ultimo.json, pruebas-reales/<fecha>.json y beta/datos/pruebas-reales.json.
// Uso: SITIO=https://sosistem.com node herramientas/pruebas-reales.mjs
import { chromium, devices } from "playwright";
import fs from "fs";

const SITIO = (process.env.SITIO || "https://sosistem.com").replace(/\/$/, "");
const LOCAL = JSON.parse(fs.readFileSync("datos/version.json", "utf8")).version;
const R = [], t00 = Date.now();
const anota = (prueba, ok, detalle = "", ms = 0) => { R.push({ prueba, ok: !!ok, detalle: String(detalle).slice(0, 400), ms }); console.log(ok ? "✔" : "✖", prueba, "·", detalle); };
async function caso(nombre, fn) { const t = Date.now(); try { const d = await fn(); anota(nombre, d !== false, typeof d === "string" ? d : "", Date.now() - t); } catch (e) { anota(nombre, false, e.message, Date.now() - t); } }

// 1) ¿El sitio publicado ya tiene esta versión? (GitHub Pages tarda en publicar)
let publicada = "", propagacion = null;
{
  const t = Date.now();
  for (let i = 0; i < 40; i++) {
    try { publicada = (await (await fetch(`${SITIO}/datos/version.json?t=${Date.now()}`, { cache: "no-store" })).json()).version; } catch (e) { publicada = "sin respuesta"; }
    if (publicada === LOCAL) { propagacion = Math.round((Date.now() - t) / 1000); break; }
    await new Promise((r) => setTimeout(r, 20000));
  }
  anota("Versión publicada = versión del repositorio", publicada === LOCAL, `repositorio ${LOCAL} · publicada ${publicada}${propagacion != null ? ` · ${propagacion} s` : ""}`);
}

const b = await chromium.launch({ args: ["--autoplay-policy=document-user-activation-required"] });
const PERFILES = { iPhone: devices["iPhone 13"], computadora: { viewport: { width: 1280, height: 900 } } };

// 2) Cada página abre sin errores (como iPhone y como computadora)
for (const [perfil, disp] of Object.entries(PERFILES)) {
  for (const ruta of ["/", "/terminal.html", "/admin.html", "/verificar.html", "/beta/"]) {
    await caso(`Abre ${ruta} · ${perfil}`, async () => {
      const c = await b.newContext({ ...disp }), p = await c.newPage(), err = [];
      p.on("pageerror", (e) => err.push("JS: " + e.message));
      p.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(SITIO)) err.push(r.status() + " " + r.url().replace(SITIO, "")); });
      const r = await p.goto(SITIO + ruta, { waitUntil: "networkidle", timeout: 60000 }); await p.waitForTimeout(1500);
      await c.close();
      if (!r || r.status() >= 400) throw new Error("HTTP " + (r && r.status()));
      if (err.length) throw new Error(err.slice(0, 5).join(" | "));
      return "sin errores";
    });
  }
}

// 3) Descargas reales del Cubo de Aprendizaje
for (const f of ["carta", "oficio", "doble-carta", "a4", "gigante-carta"]) {
  await caso(`PDF ${f}`, async () => {
    const r = await fetch(`${SITIO}/assets/cubo-aprendizaje-${f}.pdf`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (!r.ok || buf.subarray(0, 4).toString() !== "%PDF") throw new Error("HTTP " + r.status);
    return `${(buf.length / 1048576).toFixed(1)} MB`;
  });
}

// 4) Terminal con datos reales
const ctx = await b.newContext({ ...devices["iPhone 13"], geolocation: { latitude: 31.8667, longitude: -116.5964 }, permissions: ["geolocation"] });
const p = await ctx.newPage(); const errT = []; p.on("pageerror", (e) => errT.push(e.message));
await p.goto(SITIO + "/terminal.html", { waitUntil: "networkidle", timeout: 60000 }); await p.waitForTimeout(1500);
await caso("Terminal · temperatura exterior real (Open-Meteo, Ensenada)", async () => {
  await p.evaluate(() => document.getElementById("temp-ext").click());
  await p.waitForFunction(() => /Exterior/.test(document.getElementById("temp-lect")?.textContent || ""), null, { timeout: 30000 });
  const t = await p.evaluate(() => document.getElementById("temp-lect").textContent.split("\n")[0]);
  const pant = await p.evaluate(() => { const e = document.getElementById("pt-temp"); return e && !e.hidden ? e.textContent : ""; });
  if (!pant) throw new Error("La pantalla no muestra la temperatura");
  return `${t} · pantalla «${pant}»`;
});
await caso("Terminal · Morse con audio bloqueado no se pierde (#133)", async () => {
  const o = await p.evaluate(async () => {
    const d = SOSMorse.reproducir("SOS", null, { motivo: "emergencia", vibrar: false });
    const pend = SOSMorse.pendiente(); await new Promise((r) => setTimeout(r, 1200));
    return { d, pend, destello: !!document.querySelector("body.sos-destello") || "entre pulsos" };
  });
  await p.mouse.click(10, 10); await p.waitForTimeout(5000);
  const reg = await p.evaluate(() => (window.SOSCajaNegra?.registros() || []).filter((r) => r.tipo === "sonido").pop());
  if (!reg || !/sonó/.test(reg.resultado)) throw new Error(`resultado: ${reg ? reg.resultado + " · " + reg.causa : "sin registro"} (pendiente al inicio: ${o.pend})`);
  return `pendiente al inicio: ${o.pend} · ${reg.resultado} a los ${reg.t_audio_ms} ms`;
});
await caso("Terminal · disparo descartado queda registrado (#135)", async () => {
  await p.evaluate(() => { const x = document.querySelector('[data-prueba="manual"]'); x.click(); x.click(); });
  await p.waitForTimeout(1500);
  const n = await p.evaluate(() => (window.SOSCajaNegra?.registros() || []).filter((r) => r.tipo === "descartado").length);
  await p.evaluate(() => document.getElementById("btn-atender")?.click());
  if (!n) throw new Error("no se registró el descarte");
  return `${n} descarte(s) en la Caja negra`;
});
await caso("Terminal · sin errores de JavaScript", async () => { if (errT.length) throw new Error(errT.slice(0, 4).join(" | ")); return "sin errores"; });
await ctx.close();

// 5) Datos de la Beta legibles
for (const f of ["pendientes.json", "mundo.json", "version.json"]) {
  await caso(`Beta · datos/${f}`, async () => { const r = await fetch(`${SITIO}/beta/datos/${f}?t=${Date.now()}`); JSON.parse(await r.text()); if (!r.ok) throw new Error("HTTP " + r.status); return "válido"; });
}
await b.close();

// 6) Reporte
const fallas = R.filter((x) => !x.ok);
const rep = { reporte: "pruebas-reales", sitio: SITIO, fecha: new Date().toISOString(), version_repositorio: LOCAL, version_publicada: publicada, propagacion_s: propagacion,
  duracion_s: Math.round((Date.now() - t00) / 1000), total: R.length, correctas: R.length - fallas.length, fallas: fallas.length, origen: process.env.GITHUB_EVENT_NAME || "manual", resultados: R };
fs.mkdirSync("pruebas-reales", { recursive: true });
const txt = JSON.stringify(rep, null, 1) + "\n";
fs.writeFileSync("pruebas-reales/ultimo.json", txt);
fs.writeFileSync(`pruebas-reales/${rep.fecha.slice(0, 19).replace(/[:T]/g, "-")}.json`, txt);
fs.writeFileSync("beta/datos/pruebas-reales.json", txt);
console.log(`\n${rep.correctas}/${rep.total} correctas · ${rep.fallas} fallas`);
process.exit(fallas.length ? 1 : 0);
