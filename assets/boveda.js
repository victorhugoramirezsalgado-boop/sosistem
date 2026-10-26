/* SOSistem™ · Bóveda: cifra los datos de las pruebas y los muestra como Código de comunicación del Cubo (33)©.
   El contenido se cifra de verdad con AES-256-GCM; la clave sale de una frase que solo tú conoces (PBKDF2,
   200 000 iteraciones). La frase NUNCA se guarda: vive solo en memoria mientras la Terminal está abierta.
   Lo que se guarda, exporta o sube a GitHub es el texto del cubo: sin la frase no se puede leer, aunque se
   tenga el archivo o el código de la página.  © Víctor Hugo Ramírez Salgado */
(function (raiz) {
"use strict";
const subtle = (globalThis.crypto && globalThis.crypto.subtle) || null;
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";                 // alfabeto del cubo (26 letras + 2–7)
const te = new TextEncoder(), td = new TextDecoder();

function b32enc(u8) {
  let bits = 0, val = 0, out = "";
  for (let i = 0; i < u8.length; i++) { val = (val << 8) | u8[i]; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function b32dec(s) {
  s = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, val = 0; const out = [];
  for (const c of s) { const i = B32.indexOf(c); if (i < 0) continue; val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return new Uint8Array(out);
}
// Firma "3 inicio · 3 final" del sistema 33 (suma de verificación de 6 letras del cubo)
function firma33(u8) { let h = 2166136261 >>> 0; for (let i = 0; i < u8.length; i++) { h ^= u8[i]; h = Math.imul(h, 16777619) >>> 0; } return b32enc(new Uint8Array([h & 255, (h >>> 8) & 255, (h >>> 16) & 255, (h >>> 24) & 255])).slice(0, 6); }

let clave = null, pista = "";

async function derivar(frase, salt) {
  const base = await subtle.importKey("raw", te.encode(frase), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

// Presenta las letras del cubo en 6 caras (L1…L6), en pares, con la firma 3·3 al inicio y al final.
function enCubo(letras) {
  const f = firma33(te.encode(letras));
  const cuerpo = letras.replace(/(.{2})/g, "$1 ").trim();
  const partes = cuerpo.split(" ");
  const porCara = Math.ceil(partes.length / 6);
  let s = "CUBO·33 ◇ " + f.slice(0, 3) + " ▸\n";
  for (let c = 0; c < 6; c++) { const trozo = partes.slice(c * porCara, (c + 1) * porCara).join(" "); if (trozo) s += "L" + (c + 1) + " " + trozo + "\n"; }
  s += "◂ " + f.slice(3, 6) + " · © Cubo (33)";
  return s;
}

const api = {
  disponible: () => !!subtle,
  tieneClave: () => !!clave,
  async fijarClave(frase) { if (!subtle || !frase || frase.length < 6) { clave = null; return false; } pista = frase.slice(0, 2) + "…"; clave = { frase }; return true; },
  olvidarClave() { clave = null; pista = ""; },
  pista: () => pista,

  // objeto → texto del cubo (cifrado). Cada cifrado usa su propia sal e IV.
  async cifrarCubo(obj) {
    if (!clave) throw new Error("Falta la frase de la bóveda (Ajustes → Bóveda).");
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const k = await derivar(clave.frase, salt);
    const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, k, te.encode(JSON.stringify(obj))));
    const todo = new Uint8Array(1 + salt.length + iv.length + ct.length);
    todo[0] = 0x21; todo.set(salt, 1); todo.set(iv, 17); todo.set(ct, 29);        // 0x21 = versión 1
    return enCubo(b32enc(todo));
  },

  // texto del cubo → objeto (descifrado). Lanza si la frase no corresponde.
  async descifrarCubo(txt) {
    if (!clave) throw new Error("Falta la frase de la bóveda.");
    // Toma solo el contenido de las caras L1…L6 (sin encabezado, etiquetas ni firma).
    const caras = String(txt).split(/\r?\n/).map((l) => (l.match(/^\s*L\d\s+(.*)$/) || [])[1]).filter(Boolean);
    const u = b32dec((caras.length ? caras.join(" ") : txt).replace(/^.*?▸|◂.*$/gs, ""));
    if (u[0] !== 0x21) throw new Error("Esto no es un código de bóveda del Cubo (33).");
    const salt = u.slice(1, 17), iv = u.slice(17, 29), ct = u.slice(29);
    const k = await derivar(clave.frase, salt);
    try { return JSON.parse(td.decode(new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv }, k, ct)))); }
    catch (e) { throw new Error("La frase no coincide o el código está dañado."); }
  }
};
if (typeof module !== "undefined" && module.exports) module.exports = api; else raiz.SOSBoveda = api;
})(typeof self !== "undefined" ? self : this);
