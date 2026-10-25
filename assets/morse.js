/* Sistema S.O.S.© — código Morse sonoro y luminoso · © Víctor Hugo Ramírez Salgado
   REGLA DE SONIDO: solo suena en emergencia, desastre natural, advertencia, prueba del administrador
   o prueba del cliente en su módulo de pruebas. En cualquier otro caso solo destella.
   Uso: SOSMorse.reproducir("SOS", elementoQueDestella, { motivo: "emergencia" }) · SOSMorse.detener() */
(() => {
  // «cubo»: el visitante toca una cara del Cubo Morse© para escucharla (decisión del autor, oct-2026)
  const MOTIVOS_CON_SONIDO = new Set(["emergencia", "desastre", "advertencia", "prueba-admin", "prueba-cliente", "cubo"]);
  const T = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
    K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
    V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..", "Ñ": "--.--",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
    ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
    ":": "---...", "=": "-...-", "+": ".-.-.", "-": "-....-", "@": ".--.-." };
  const WPM = 15, HZ = 650;
  const U = 1.2 / WPM;               // duración de un punto en segundos
  let ctx = null, ganancia = null, gSirena = null, oSirena = null, timers = [], activo = null;

  // Texto → Morse. Quita acentos (el Morse internacional no los tiene) y omite símbolos sin código.
  function aMorse(texto) {
    const limpio = String(texto).replace(/Ñ/g, "\u0001").replace(/ñ/g, "\u0001").normalize("NFD")
      .replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "Ñ").toUpperCase();
    return limpio.split(/\s+/).map((p) => [...p].map((c) => T[c]).filter(Boolean)).filter((p) => p.length);
  }
  // Proporción del texto que puede escribirse en Morse internacional (para elegir texto de respaldo)
  function cobertura(texto) {
    const letras = [...String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "")].filter((c) => /\p{L}|\p{N}/u.test(c));
    if (!letras.length) return 0;
    return letras.filter((c) => T[c.toUpperCase()] || c === "ñ" || c === "Ñ").length / letras.length;
  }
  function visible(morse) {
    return morse.map((p) => p.map((l) => l.replace(/\./g, "·").replace(/-/g, "–")).join(" ")).join(" / ");
  }

  function detener() {
    timers.forEach(clearTimeout); timers = [];
    if (ganancia && ctx) { try { ganancia.gain.cancelScheduledValues(ctx.currentTime); ganancia.gain.setValueAtTime(0, ctx.currentTime); } catch (e) {} }
    if (gSirena && ctx) { try { gSirena.gain.cancelScheduledValues(ctx.currentTime); gSirena.gain.setValueAtTime(0, ctx.currentTime); oSirena.frequency.cancelScheduledValues(ctx.currentTime); } catch (e) {} }
    if (activo) { activo.luz?.classList.remove("morse-luz"); activo.boton?.classList.remove("morse-sonando"); activo.alTerminar?.(); }
    if (navigator.vibrate) navigator.vibrate(0);
    activo = null;
  }

  function reproducir(texto, luz, opciones = {}) {
    detener();
    const palabras = aMorse(texto);
    if (!palabras.length && !(opciones.sirenaSeg > 0)) return 0;
    const conSonido = MOTIVOS_CON_SONIDO.has(opciones.motivo);
    if (!conSonido) return destellar(palabras, luz, opciones);
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return destellar(palabras, luz, opciones);
    if (!ctx) {
      ctx = new AC();
      ganancia = ctx.createGain(); ganancia.gain.value = 0; ganancia.connect(ctx.destination);
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = HZ; osc.connect(ganancia); osc.start();
    }
    if (ctx.state === "suspended") ctx.resume();
    // Volumen relativo (0–1) y sirena bitonal opcional antes del Morse (FSK a 4 Hz, como la sirena del equipo)
    const vol = Math.max(0, Math.min(1, opciones.volumen ?? 1)), pico = 0.35 * vol;
    const sirSeg = Math.max(0, opciones.sirenaSeg || 0), sirVol = Math.max(0, Math.min(1, opciones.sirenaVolumen ?? vol));
    if (sirSeg > 0) {
      if (!gSirena) {
        gSirena = ctx.createGain(); gSirena.gain.value = 0; gSirena.connect(ctx.destination);
        oSirena = ctx.createOscillator(); oSirena.type = "square"; oSirena.frequency.value = 800; oSirena.connect(gSirena); oSirena.start();
      }
      const s0 = ctx.currentTime + 0.05;
      gSirena.gain.setValueAtTime(0, s0); gSirena.gain.linearRampToValueAtTime(0.12 * sirVol, s0 + 0.02);
      for (let k = 0; k * 0.125 < sirSeg; k++) oSirena.frequency.setValueAtTime(k % 2 ? 1250 : 800, s0 + k * 0.125);
      gSirena.gain.setValueAtTime(0.12 * sirVol, s0 + sirSeg - 0.02); gSirena.gain.linearRampToValueAtTime(0, s0 + sirSeg);
      if (luz) { timers.push(setTimeout(() => luz.classList.add("morse-luz"), 50)); timers.push(setTimeout(() => luz.classList.remove("morse-luz"), sirSeg * 1000)); }
    }
    const t0 = ctx.currentTime + 0.08 + (sirSeg ? sirSeg + 0.4 : 0), g = ganancia.gain, rampa = 0.005;
    let t = 0;
    const vib = [];
    const pulso = (dur) => {
      const a = t0 + t;
      g.setValueAtTime(0, a); g.linearRampToValueAtTime(pico, a + rampa);
      g.setValueAtTime(pico, a + dur - rampa); g.linearRampToValueAtTime(0, a + dur);
      if (luz) {
        timers.push(setTimeout(() => luz.classList.add("morse-luz"), (a - ctx.currentTime) * 1000));
        timers.push(setTimeout(() => luz.classList.remove("morse-luz"), (a + dur - ctx.currentTime) * 1000));
      }
      vib.push(Math.round(dur * 1000));
      t += dur;
    };
    const pausa = (u) => { t += u * U; vib.push(Math.round(u * U * 1000)); };
    palabras.forEach((p, pi) => {
      if (pi) pausa(7);
      p.forEach((letra, li) => {
        if (li) pausa(3);
        [...letra].forEach((s, si) => { if (si) pausa(1); pulso(s === "." ? U : 3 * U); });
      });
    });
    if (navigator.vibrate && opciones.vibrar !== false) { try { navigator.vibrate(vib); } catch (e) {} }
    activo = { luz, boton: opciones.boton, alTerminar: opciones.alTerminar };
    opciones.boton?.classList.add("morse-sonando");
    const total = t + (t0 - ctx.currentTime);
    timers.push(setTimeout(detener, (total + 0.15) * 1000));
    return total;
  }

  // Solo luz (sin sonido ni vibración), con los mismos tiempos del Morse
  function destellar(palabras, luz, opciones) {
    let t = 0;
    const pulso = (dur) => {
      if (luz) {
        timers.push(setTimeout(() => luz.classList.add("morse-luz"), t * 1000));
        timers.push(setTimeout(() => luz.classList.remove("morse-luz"), (t + dur) * 1000));
      }
      t += dur;
    };
    palabras.forEach((p, pi) => {
      if (pi) t += 7 * U;
      p.forEach((letra, li) => {
        if (li) t += 3 * U;
        [...letra].forEach((s, si) => { if (si) t += U; pulso(s === "." ? U : 3 * U); });
      });
    });
    activo = { luz, boton: opciones.boton, alTerminar: opciones.alTerminar, silencioso: true };
    opciones.boton?.classList.add("morse-sonando");
    timers.push(setTimeout(detener, (t + 0.1) * 1000));
    return t;
  }

  window.SOSMorse = { reproducir, detener, aMorse, visible, cobertura, sonando: () => !!activo && !activo.silencioso,
    activo: () => !!activo, motivos: [...MOTIVOS_CON_SONIDO] };
})();
