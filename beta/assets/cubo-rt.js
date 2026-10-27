/* SOSistem™ · Cargador del Código de comunicación del Cubo (33)© — lee los scripts escritos en código del cubo
   y los ejecuta. Es solo ocultamiento (el navegador debe poder correr el código), no cifrado.
   El original legible de cada archivo vive en el repositorio privado del autor.  © Víctor Hugo Ramírez Salgado */
(function (raiz) {
"use strict";
var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", td = new TextDecoder();
function b32dec(s) {
  s = String(s).toUpperCase().replace(/[^A-Z2-7]/g, "");
  var bits = 0, val = 0, out = [];
  for (var i = 0; i < s.length; i++) { var j = B32.indexOf(s[i]); if (j < 0) continue; val = (val << 5) | j; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return new Uint8Array(out);
}
function caras(txt) {
  var ls = String(txt).split(/\r?\n/), r = [];
  for (var i = 0; i < ls.length; i++) { var m = ls[i].match(/^\s*L\d+\s+(.*)$/); if (m) r.push(m[1]); }
  return r.join(" ");
}
raiz.CUBO33 = {
  src: "",
  run: function (txt, nombre) {
    var fuente = td.decode(b32dec(caras(txt)));
    try { this.src = new URL(nombre || "cubo.js", location.href).href; } catch (e) { this.src = ""; }
    (0, eval)(fuente);              // ejecución en ámbito global, como un <script> normal
    this.src = "";
  }
};
})(typeof self !== "undefined" ? self : this);
