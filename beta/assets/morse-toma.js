/* Sitios VHRS · AudioWorklet del Receptor Morse: entrega el audio del micrófono en bloques de 2048 muestras.
   © Víctor Hugo Ramírez Salgado */
class TomaMorse extends AudioWorkletProcessor {
  constructor() { super(); this.b = new Float32Array(2048); this.n = 0; }
  process(entradas) {
    const c = entradas[0] && entradas[0][0];
    if (c) {
      this.b.set(c, this.n); this.n += c.length;
      if (this.n >= 2048) { this.port.postMessage(this.b.slice(0, this.n)); this.n = 0; }
    }
    return true;
  }
}
registerProcessor('vhrs-toma-morse', TomaMorse);
