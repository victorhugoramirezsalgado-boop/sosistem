/* Sitios VHRS · Motor del Receptor Morse (decodifica audio o pulsaciones a texto).
   Todo se procesa en el dispositivo: no envía audio a ningún servidor.
   - Detección de tono: banco de filtros Goertzel de 300 a 1300 Hz en bloques de 8 ms.
   - Umbral adaptativo con histéresis (ruido y señal se miden solos).
   - Velocidad automática: separa puntos y rayas por agrupamiento de duraciones (no requiere fijar WPM).
   © Víctor Hugo Ramírez Salgado */
(function (root) {
"use strict";

const TABLA = {
  '.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M',
  '-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z',
  '-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9',
  '--.--':'Ñ','.--.-':'Á','..-..':'É','..--':'Ü','----':'CH',
  '.-.-.-':'.','--..--':',','..--..':'?','.----.':"'",'-.-.--':'!','-..-.':'/','-.--.':'(','-.--.-':')','.-...':'&','---...':':',
  '-.-.-.':';','-...-':'=','.-.-.':'+','-....-':'-','..--.-':'_','.-..-.':'"','...-..-':'$','.--.-.':'@',
  '...---...':'SOS','...-.-':'<SK>','-.--.':'(','-.-.-':'<KA>','........':'<ERR>'
};

class MotorMorse {
  /* sr: frecuencia de muestreo (Hz). op: { wpm, hz (fijo o null), alCaracter(c), alCodigo(codigoPendiente), alSOS() } */
  constructor(sr, op) {
    op = op || {};
    this.sr = sr || 48000;
    this.N = Math.max(64, Math.round(this.sr * 0.008));
    this.dt = this.N / this.sr * 1000;
    this.frec = [];
    for (let f = 300; f <= 1300; f += 25) this.frec.push(f);
    this.coef = this.frec.map(f => 2 * Math.cos(2 * Math.PI * f / this.sr));
    this.pico = new Float64Array(this.frec.length);
    this.buf = new Float32Array(this.N);
    this.pos = 0;
    this.op = op;
    this.reiniciar(op.wpm || 15);
    this.fijarHz(op.hz || null);
  }

  reiniciar(wpm) {
    this.t = 0;                 // ms
    this.u = 1200 / (wpm || 15); // duración del punto (ms)
    this.hist = [];             // duraciones de marcas recientes
    this.umbral = 2 * this.u;
    this.on = false;
    this.borde = 0;
    this.pend = [];             // duraciones de la letra en curso
    this.huboTexto = false;
    this.espacioDado = true;
    this.cand = false; this.candN = 0;
    this.nivel = -120; this.lo = null; this.hi = null; this.snr = 0;
    this.ti = -1;
    this.pico.fill(0);
    this.huecos = []; this.umbralPal = 5 * this.u;
  }

  fijarHz(hz) {
    this.hzFijo = null;
    if (hz) {
      let mejor = 0;
      this.frec.forEach((f, i) => { if (Math.abs(f - hz) < Math.abs(this.frec[mejor] - hz)) mejor = i; });
      this.hzFijo = mejor; this.ti = mejor;
    }
  }

  get hz() { return this.ti >= 0 ? this.frec[this.ti] : null; }
  get wpm() { return Math.round(1200 / this.u); }

  /* Audio: muestras Float32 (-1..1) */
  push(m) {
    for (let k = 0; k < m.length; k++) {
      this.buf[this.pos++] = m[k];
      if (this.pos === this.N) { this._bloque(); this.pos = 0; }
    }
  }

  _bloque() {
    const N = this.N, b = this.buf, P = new Float64Array(this.frec.length);
    for (let i = 0; i < this.coef.length; i++) {
      const c = this.coef[i]; let s1 = 0, s2 = 0;
      for (let n = 0; n < N; n++) { const s0 = b[n] + c * s1 - s2; s2 = s1; s1 = s0; }
      P[i] = (s1 * s1 + s2 * s2 - c * s1 * s2) / (N * N);
    }
    // tono: el de mayor energía sostenida (pico con decaimiento ~3 s)
    if (this.hzFijo === null) {
      const dec = Math.pow(0.5, this.dt / 1500);
      let m = 0;
      for (let i = 0; i < P.length; i++) { this.pico[i] = Math.max(this.pico[i] * dec, P[i]); if (this.pico[i] > this.pico[m]) m = i; }
      if (this.ti < 0 || this.pico[m] > 2 * this.pico[this.ti]) this.ti = m;
    }
    const i = this.ti;
    const p = Math.max(P[i], i > 0 ? P[i - 1] * 0.7 : 0, i < P.length - 1 ? P[i + 1] * 0.7 : 0);
    const L = Math.max(-100, 10 * Math.log10(p + 1e-14)); // piso: el silencio digital no debe fijar el umbral
    this.nivel = L;
    // calibración: ignora el silencio digital inicial y mide 0.25 s de ruido de fondo antes de detectar
    if (this.lo === null) {
      if (L <= -99) { this.t += this.dt; this._reloj(); return; }
      this.lo = L; this.hi = L; this.calib = Math.round(250 / this.dt);
    }
    if (this.calib > 0) {
      this.calib--; this.lo = Math.min(this.lo + (L - this.lo) * 0.2, Math.max(this.lo, L)); this.hi = Math.max(this.hi, L);
      this.t += this.dt; return;
    }
    const thr = this.lo + (this.hi - this.lo) / 2;
    if (L > thr) { this.hi += (L - this.hi) * 0.25; this.lo += (L - this.lo) * 0.003; } // el ruido de fondo sube despacio si cambia el entorno
    else this.lo += (L - this.lo) * 0.08;
    this.hi -= this.dt * 0.002;            // la referencia de señal baja despacio si no hay tono
    if (this.hi < this.lo) this.hi = this.lo;
    this.snr = this.hi - this.lo;
    const histe = (this.hi - this.lo) * 0.12;
    let on = this.snr > 9 && (this.on ? L > thr - histe : L > thr + histe);
    // antirrebote: el cambio debe sostenerse 2 bloques
    if (on !== this.on) {
      if (this.cand === on) this.candN++; else { this.cand = on; this.candN = 1; }
      if (this.candN >= 2) { this._cambio(on, this.t - this.dt); this.candN = 0; }
    } else this.candN = 0;
    this.t += this.dt;
    this._reloj();
  }

  /* Manipulador táctil o teclado: on = presionado, t = ms (performance.now) */
  tecla(on, t) { this.t = t; this._reloj(); if (on !== this.on) this._cambio(on, t); }
  tic(t) { if (t !== undefined) this.t = t; this._reloj(); }

  _cambio(on, t) {
    const d = t - this.borde, corto = Math.max(12, Math.min(0.3 * this.u, 24));
    if (this.on && !on) {
      // marca demasiado corta: ruido; se ignora y el silencio sigue contando desde antes
      if (d < corto) { this.on = false; this.borde = this.bordePrevio; return; }
      this._marca(d);
    } else if (!this.on && on) {
      // hueco demasiado corto dentro de una marca: se une con la marca anterior
      if (d < corto && this.pend.length && this.inicioMarca !== undefined) {
        const m = this.pend.pop(); this.hist.pop();
        this.on = true; this.borde = this.inicioMarca; this.bordePrevio = this.offPrevio;
        return;
      }
      this.bordePrevio = this.borde; this.offPrevio = this.borde; this.inicioMarca = t;
      if (d > 2 * this.u && d < 40 * this.u) { this.huecos.push(d); if (this.huecos.length > 20) this.huecos.shift(); this._palabra(); }
    }
    this.on = on; this.borde = t;
    if (on) this.espacioDado = false;
  }

  _marca(d) {
    if (d < 12) return; // chasquido
    this.pend.push(d);
    this.hist.push(d); if (this.hist.length > 24) this.hist.shift();
    this._recalcular();
    if (this.op.alCodigo) this.op.alCodigo(this._codigo());
  }

  _recalcular() {
    const h = this.hist.map(Math.log).sort((a, b) => a - b);
    const n = h.length;
    if (n >= 2) {
      let mejor = -1, k = 0;
      for (let j = 1; j < n; j++) {
        const a = h.slice(0, j), c = h.slice(j);
        const ma = a.reduce((x, y) => x + y, 0) / a.length, mc = c.reduce((x, y) => x + y, 0) / c.length;
        const v = a.length * c.length * (mc - ma) * (mc - ma);
        if (v > mejor) { mejor = v; k = j; }
      }
      const a = h.slice(0, k), c = h.slice(k);
      const ma = a.reduce((x, y) => x + y, 0) / a.length, mc = c.reduce((x, y) => x + y, 0) / c.length;
      if (mc - ma > Math.log(1.8)) {
        this.umbral = Math.exp((ma + mc) / 2);
        this.u = Math.min(400, Math.max(20, (Math.exp(ma) + Math.exp(mc) / 3) / 2));
        return;
      }
    }
    // un solo grupo de duraciones: decide con la velocidad previa
    const media = Math.exp(h.reduce((x, y) => x + y, 0) / n);
    if (media < 2 * this.u) this.u = this.u * 0.6 + media * 0.4; else this.u = this.u * 0.6 + media / 3 * 0.4;
    this.u = Math.min(400, Math.max(20, this.u));
    this.umbral = 2 * this.u;
  }

  /* Separación de palabras: aprende los silencios entre letras y entre palabras (sirve para Farnsworth y manual) */
  _palabra() {
    const h = this.huecos.map(Math.log).sort((a, b) => a - b), n = h.length, piso = 4.5 * this.u;
    let thr = 5 * this.u;
    if (n >= 4) {
      let mejor = -1, k = 0;
      for (let j = 1; j < n; j++) {
        const ma = h.slice(0, j).reduce((x, y) => x + y, 0) / j, mc = h.slice(j).reduce((x, y) => x + y, 0) / (n - j);
        const v = j * (n - j) * (mc - ma) * (mc - ma); if (v > mejor) { mejor = v; k = j; }
      }
      const ma = h.slice(0, k).reduce((x, y) => x + y, 0) / k, mc = h.slice(k).reduce((x, y) => x + y, 0) / (n - k);
      thr = mc - ma > Math.log(1.8) ? Math.exp((ma + mc) / 2) : Math.exp(mc) * 1.6;
    }
    this.umbralPal = Math.max(piso, Math.min(thr, 14 * this.u));
  }

  _codigo() { return this.pend.map(d => d < this.umbral ? '.' : '-').join(''); }

  _reloj() {
    if (this.on) return;
    const g = this.t - this.borde;
    if (this.pend.length && g > 2.0 * this.u) this._letra();
    if (!this.espacioDado && this.huboTexto && g > Math.max(this.umbralPal, 4.5 * this.u)) { this.espacioDado = true; this._emitir(' '); }
  }

  _letra() {
    const cod = this._codigo(); this.pend = [];
    const c = TABLA[cod] || ('[' + cod + ']');
    this.huboTexto = true;
    this._emitir(c);
    if (cod === '...---...' && this.op.alSOS) this.op.alSOS();
    if (this.op.alCodigo) this.op.alCodigo('');
  }

  _emitir(c) {
    if (this.op.alCaracter) this.op.alCaracter(c);
    this.ult = ((this.ult || '') + c).slice(-6);
    if (c !== 'SOS' && /(^|[^A-Z])SOS$/.test(this.ult) && this.op.alSOS) this.op.alSOS(); // S O S separado por letras
  }

  /* Al terminar un archivo: vacía lo pendiente */
  fin() { if (this.on) this._cambio(false, this.t); if (this.pend.length) this._letra(); }
}

/* Texto → código, para pruebas y para el botón de prueba */
const INV = {};
for (const k in TABLA) if (!INV[TABLA[k]] && TABLA[k].length === 1) INV[TABLA[k]] = k;
function aCodigo(txt) {
  return txt.normalize('NFC').toUpperCase().split(' ').map(p => p.split('').map(c => INV[c] || '').filter(Boolean).join(' ')).join(' / ');
}

const api = { MotorMorse, TABLA, aCodigo };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.VHRSMorse = api;
})(typeof self !== 'undefined' ? self : this);
