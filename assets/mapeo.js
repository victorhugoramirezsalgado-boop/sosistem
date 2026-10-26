/* SOSistem™ · Mapeo del espacio con el celular (navegación a pie: pasos + brújula)
   Caminando pegado a las paredes, el celular cuenta pasos con el acelerómetro y toma el rumbo con la brújula;
   con eso traza el polígono del recinto. Cada recorrido se guarda y se calcula un polígono promedio
   (más recorridos = plano más confiable). El alto se estima levantando el celular del piso al punto más alto.
   Todo es aproximado: sin GPS en interiores el error típico es de 5 a 15 % por recorrido.
   © 2026 Víctor Hugo Ramírez Salgado · Sistema S.O.S.© (Safe Creative 2609046908578) */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  if (!$("mp-lienzo")) return;
  const G = 9.80665, N = 64;
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const M = { activo: false, pts: [], x: 0, y: 0, pasos: 0, rumbo: null, rumbo0: null, filtro: G, arriba: false, ultPaso: 0, pico: 0, sube: 0, baja: 0, vert: [],
    paso_m: LS.get("sost_paso_m", 0.7), recorridos: LS.get("sost_recorridos", []), alto: LS.get("sost_alto", null), midiendo: null };

  // ---- Sensores (permiso ya concedido al iniciar el monitoreo; si no, se pide aquí) ----
  async function permisos() {
    try {
      if (typeof DeviceMotionEvent?.requestPermission === "function") await DeviceMotionEvent.requestPermission();
      if (typeof DeviceOrientationEvent?.requestPermission === "function") await DeviceOrientationEvent.requestPermission();
    } catch (e) {}
  }
  function orientacion(e) {
    let h = null;
    if (e.webkitCompassHeading != null) h = e.webkitCompassHeading;          // iPhone: grados desde el norte
    else if (e.absolute && e.alpha != null) h = (360 - e.alpha) % 360;        // Android con brújula absoluta
    if (h != null) M.rumbo = M.rumbo == null ? h : suavizar(M.rumbo, h, 0.25);
  }
  const suavizar = (a, b, k) => { let d = ((b - a + 540) % 360) - 180; return (a + d * k + 360) % 360; };
  function movimiento(e) {
    const g = e.accelerationIncludingGravity, a = e.acceleration; if (!g || g.x == null) return;
    const mag = Math.hypot(g.x, g.y, g.z), t = performance.now();
    if (M.midiendo) return medirAlto(e, t);
    if (!M.activo) return;
    // Paso = pico de |a| filtrada por encima de 1.12 g, con al menos 300 ms entre pasos
    M.filtro += (mag - M.filtro) * 0.3;
    if (!M.arriba && M.filtro > G * 1.12) { M.arriba = true; M.pico = M.filtro; }
    if (M.arriba) { M.pico = Math.max(M.pico, M.filtro); if (M.filtro < G * 1.02) { M.arriba = false; if (t - M.ultPaso > 300) { M.ultPaso = t; paso(); } } }
    // Subidas y bajadas: aceleración vertical (proyección sobre la gravedad) sostenida
    if (a && a.x != null) { const v = (a.x * g.x + a.y * g.y + a.z * g.z) / (mag || 1); M.vert.push(v); if (M.vert.length > 60) M.vert.shift(); }
  }
  function paso() {
    if (M.rumbo == null) { aviso("Sin brújula: el plano necesita el permiso de orientación (iPhone: Ajustes → Safari → Movimiento y orientación)."); return; }
    const r = (M.rumbo * Math.PI) / 180;
    M.x += M.paso_m * Math.sin(r); M.y += M.paso_m * Math.cos(r); M.pasos++;
    // escalón: pico vertical marcado al dar el paso
    const vmax = Math.max(...M.vert), vmin = Math.min(...M.vert);
    if (vmax > 2.2 && vmax > -vmin * 1.4) M.sube++; else if (vmin < -2.2 && -vmin > vmax * 1.4) M.baja++;
    M.pts.push([+M.x.toFixed(2), +M.y.toFixed(2)]); pintar();
  }

  // ---- Alto: del piso al punto más alto, doble integración con corrección de velocidad cero al final ----
  function medirAlto(e, t) {
    const g = e.accelerationIncludingGravity, a = e.acceleration; if (!a || a.x == null) return;
    const mag = Math.hypot(g.x, g.y, g.z) || G, v = -(a.x * g.x + a.y * g.y + a.z * g.z) / mag;   // positivo hacia arriba
    const m = M.midiendo; m.s.push([t, v]);
    const ult = m.s.slice(-30), quieto = ult.length === 30 && Math.max(...ult.map((x) => Math.abs(x[1]))) < 0.25;
    if (t - m.t0 > 1500 && quieto) terminarAlto();
    if (t - m.t0 > 15000) terminarAlto();
  }
  function terminarAlto() {
    const s = M.midiendo.s; M.midiendo = null; if (s.length < 20) return aviso("Muy pocas lecturas; repite la medición.");
    const n = s.length, dt = (i) => (s[i][0] - s[i - 1][0]) / 1000; let vel = [0];
    for (let i = 1; i < n; i++) vel.push(vel[i - 1] + s[i][1] * dt(i));
    const deriva = vel[n - 1] / (s[n - 1][0] - s[0][0]);                    // al final el celular está quieto: v = 0
    let h = 0, hmax = 0;
    for (let i = 1; i < n; i++) { const vc = vel[i] - deriva * (s[i][0] - s[0][0]); h += vc * dt(i); hmax = Math.max(hmax, h); }
    const alto = +(hmax + 0.0).toFixed(2);
    if (alto < 0.3 || alto > 4) return aviso(`Resultado fuera de rango (${alto} m). Repite: celular en el piso, sube de un solo movimiento y detente arriba.`);
    M.alto = alto; LS.set("sost_alto", alto); $("mp-alto").textContent = `${alto} m (aprox.)`; aviso(`Alto alcanzado: ${alto} m. Súmale la distancia de tu mano al techo para la altura del recinto.`);
    pintar();
  }

  // ---- Polígono: simplificar, cerrar, área, perímetro, ancho y largo ----
  function rdp(p, eps) {
    if (p.length < 3) return p;
    const [a, b] = [p[0], p[p.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9; let im = 0, dm = 0;
    for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((b[1] - a[1]) * p[i][0] - (b[0] - a[0]) * p[i][1] + b[0] * a[1] - b[1] * a[0]) / L; if (d > dm) { dm = d; im = i; } }
    return dm > eps ? rdp(p.slice(0, im + 1), eps).slice(0, -1).concat(rdp(p.slice(im), eps)) : [a, b];
  }
  // polígono cerrado (empieza y termina en el mismo punto): se parte en el punto más lejano del inicio
  function rdpCerrado(p, eps) {
    let im = 0, dm = 0; p.forEach((q, i) => { const d = Math.hypot(q[0] - p[0][0], q[1] - p[0][1]); if (d > dm) { dm = d; im = i; } });
    if (im === 0) return p.slice(0, 1);
    return rdp(p.slice(0, im + 1), eps).slice(0, -1).concat(rdp(p.slice(im), eps)).slice(0, -1);
  }
  const area = (p) => Math.abs(p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0)) / 2;
  const perimetro = (p) => p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + Math.hypot(r[0] - q[0], r[1] - q[1]); }, 0);
  function cerrar(pts) {
    // reparte el error de cierre a lo largo del recorrido para que termine donde empezó
    const n = pts.length, [ex, ey] = pts[n - 1];
    return pts.map(([x, y], i) => [x - (ex * i) / (n - 1), y - (ey * i) / (n - 1)]);
  }
  function normalizar(p) {
    // centra, gira para que la pared más larga quede horizontal y remuestrea a N puntos por longitud
    const c = p.reduce((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length], [0, 0]);
    let q = p.map(([x, y]) => [x - c[0], y - c[1]]), im = 0, lm = 0;
    q.forEach((a, i) => { const b = q[(i + 1) % q.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > lm) { lm = l; im = i; } });
    const a = q[im], b = q[(im + 1) % q.length], ang = -Math.atan2(b[1] - a[1], b[0] - a[0]), cs = Math.cos(ang), sn = Math.sin(ang);
    q = q.slice(im).concat(q.slice(0, im)).map(([x, y]) => [x * cs - y * sn, x * sn + y * cs]);
    const per = perimetro(q), sal = []; let acum = 0, j = 0;
    for (let k = 0; k < N; k++) {
      const meta = (per * k) / N;
      while (true) { const u = q[j % q.length], v = q[(j + 1) % q.length], l = Math.hypot(v[0] - u[0], v[1] - u[1]);
        if (acum + l >= meta || j > q.length * 2) { const f = l ? (meta - acum) / l : 0; sal.push([u[0] + (v[0] - u[0]) * f, u[1] + (v[1] - u[1]) * f]); break; }
        acum += l; j++; }
    }
    return sal;
  }
  function medidas(p) {
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    return { area: +area(p).toFixed(1), perimetro: +perimetro(p).toFixed(1), largo: +(Math.max(...xs) - Math.min(...xs)).toFixed(1), ancho: +(Math.max(...ys) - Math.min(...ys)).toFixed(1) };
  }
  function promedio() {
    const R = M.recorridos; if (!R.length) return null;
    const P = R.map((r) => normalizar(r.poligono)), prom = Array.from({ length: N }, (_, k) => [P.reduce((s, p) => s + p[k][0], 0) / P.length, P.reduce((s, p) => s + p[k][1], 0) / P.length]);
    const areas = R.map((r) => r.medidas.area), ma = areas.reduce((a, b) => a + b, 0) / areas.length, de = Math.sqrt(areas.reduce((s, a) => s + (a - ma) ** 2, 0) / areas.length);
    const pol = rdpCerrado(prom.concat([prom[0]]), 0.25);
    return { poligono: pol.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]), ...medidas(prom), recorridos: R.length, area_desv: +de.toFixed(1), vertices: pol.length, alto: M.alto, todos: P };
  }

  // ---- Interfaz ----
  function aviso(t) { $("mp-msg").textContent = t; }
  function pintar() {
    const c = $("mp-lienzo"), dpr = devicePixelRatio || 1, w = c.offsetWidth, h = c.offsetHeight; if (!w) return;
    c.width = w * dpr; c.height = h * dpr; const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    const pr = promedio(), capas = [...(pr?.todos || []).map((p) => ({ p, c: "#4f8fd655", a: 1 }))];
    if (pr) capas.push({ p: pr.poligono, c: "#3fbf7f", a: 2.5, cerrar: true });
    if (M.activo && M.pts.length) capas.push({ p: [[0, 0], ...M.pts], c: "#e8a33d", a: 2 });
    const todos = capas.flatMap((k) => k.p); if (!todos.length) { x.fillStyle = "#7c879b"; x.font = "12px system-ui"; x.fillText("Sin recorridos todavía", 12, 22); return; }
    const xs = todos.map((q) => q[0]), ys = todos.map((q) => q[1]), mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys);
    const esc = Math.min((w - 30) / Math.max(1, Mx - mx), (h - 30) / Math.max(1, My - my)), X = (v) => 15 + (v - mx) * esc, Y = (v) => h - 15 - (v - my) * esc;
    capas.forEach((k) => { x.strokeStyle = k.c; x.lineWidth = k.a; x.beginPath(); k.p.forEach(([a, b], i) => (i ? x.lineTo(X(a), Y(b)) : x.moveTo(X(a), Y(b)))); if (k.cerrar) x.closePath(); x.stroke(); });
    if (M.activo) { x.fillStyle = "#e8a33d"; x.beginPath(); x.arc(X(M.x), Y(M.y), 4, 0, 7); x.fill(); }
    x.fillStyle = "#aab4c5"; x.font = "11px ui-monospace,monospace"; x.fillText(`1 m = ${esc.toFixed(0)} px`, w - 90, h - 4);
    $("mp-pasos").textContent = M.activo ? `${M.pasos} pasos · ${(M.pasos * M.paso_m).toFixed(1)} m · rumbo ${M.rumbo != null ? Math.round(M.rumbo) + "°" : "sin brújula"}` : "—";
    $("mp-res").innerHTML = pr ? `Área <b>${pr.area} m²</b> ±${pr.area_desv} · largo ${pr.largo} m · ancho ${pr.ancho} m · perímetro ${pr.perimetro} m · ${pr.vertices} esquinas · ${pr.recorridos} recorrido(s)${pr.alto ? ` · alto alcanzado ${pr.alto} m` : ""}` : "Haz al menos un recorrido.";
    $("mp-lista").innerHTML = M.recorridos.map((r, i) => `<li><div class="cab"><span class="tp">Recorrido ${i + 1}</span><time>${new Date(r.t).toLocaleString("sv-SE").slice(0, 16)}</time></div><div class="dt">${r.medidas.area} m² · ${r.pasos} pasos · cierre ${r.cierre_m} m · subidas ${r.sube} · bajadas ${r.baja}</div><div class="bt"><button type="button" data-mpdel="${i}">Quitar</button></div></li>`).join("");
  }
  $("mp-iniciar").onclick = async () => {
    if (M.activo) return terminar();
    await permisos(); addEventListener("devicemotion", movimiento); addEventListener("deviceorientation", orientacion); addEventListener("deviceorientationabsolute", orientacion);
    Object.assign(M, { activo: true, pts: [], x: 0, y: 0, pasos: 0, sube: 0, baja: 0, rumbo0: M.rumbo });
    $("mp-iniciar").textContent = "Terminar recorrido (ya regresé a la esquina inicial)"; aviso("Camina normal pegado a la pared, con el celular plano frente a ti, hasta volver a la esquina donde empezaste.");
    pintar();
  };
  function terminar() {
    M.activo = false; $("mp-iniciar").textContent = "Iniciar recorrido";
    if (M.pts.length < 8) { aviso("Recorrido muy corto (menos de 8 pasos); no se guardó."); return pintar(); }
    const crudo = [[0, 0], ...M.pts], cierre = +Math.hypot(M.x, M.y).toFixed(2), per = M.pasos * M.paso_m;
    const pol = rdpCerrado(cerrar(crudo), 0.4);
    if (cierre > per * 0.35) aviso(`El recorrido no cerró bien (terminó a ${cierre} m del inicio). Se guardó, pero repítelo para mejorar el promedio.`);
    else aviso(`Recorrido guardado: error de cierre ${cierre} m (${((cierre / per) * 100).toFixed(0)} %).`);
    M.recorridos.push({ t: Date.now(), pasos: M.pasos, paso_m: M.paso_m, cierre_m: cierre, sube: M.sube, baja: M.baja, poligono: pol, medidas: medidas(pol) });
    LS.set("sost_recorridos", M.recorridos.slice(-20)); pintar(); window.SOSTerminal?.log?.("sis", `Mapeo: recorrido ${M.recorridos.length} · ${medidas(pol).area} m² · cierre ${cierre} m`);
  }
  $("mp-alto-btn").onclick = async () => {
    await permisos(); addEventListener("devicemotion", movimiento);
    M.midiendo = { t0: performance.now(), s: [] }; aviso("Celular apoyado en el piso: súbelo de un solo movimiento hasta lo más alto que alcances y detente quieto 1 segundo.");
  };
  $("mp-paso").value = M.paso_m;
  $("mp-paso").onchange = (e) => { M.paso_m = Math.max(0.3, Math.min(1.2, +e.target.value || 0.7)); LS.set("sost_paso_m", M.paso_m); };
  $("mp-estatura").onchange = (e) => { const cm = +e.target.value; if (cm > 100 && cm < 230) { M.paso_m = +(cm * 0.00415).toFixed(2); $("mp-paso").value = M.paso_m; LS.set("sost_paso_m", M.paso_m); aviso(`Largo de paso calculado: ${M.paso_m} m (41.5 % de la estatura).`); } };
  $("mp-lista").addEventListener("click", (e) => { const b = e.target.closest("[data-mpdel]"); if (!b) return; M.recorridos.splice(+b.dataset.mpdel, 1); LS.set("sost_recorridos", M.recorridos); pintar(); });
  $("mp-borrar").onclick = () => { if (!confirm("¿Borrar todos los recorridos del mapeo?")) return; M.recorridos = []; LS.set("sost_recorridos", []); pintar(); };
  if (M.alto) $("mp-alto").textContent = `${M.alto} m (aprox.)`;
  addEventListener("resize", pintar, { passive: true });
  const obs = new MutationObserver(() => { if ($("v-sensores")?.dataset.activa === "true") pintar(); }); if ($("v-sensores")) obs.observe($("v-sensores"), { attributes: true });
  window.SOSMapa = { promedio: () => { const p = promedio(); if (!p) return null; const { todos, ...r } = p; return r; }, recorridos: () => M.recorridos };
  pintar();
})();
