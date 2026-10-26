/* Sitios VHRS · Receptor Morse: escucha por micrófono, abre archivos de audio o recibe toques y lo convierte a texto.
   Requiere /_comun/morse-motor.js. Se abre con VHRSReceptor.abrir() (botón RX de cada sitio) o en /_comun/receptor.html.
   © Víctor Hugo Ramírez Salgado */
(function () {
"use strict";
const L = {
  titulo:  {es:'Receptor Morse',en:'Morse receiver',fr:'Récepteur Morse',pt:'Receptor Morse',it:'Ricevitore Morse',de:'Morse-Empfänger',zh:'摩尔斯接收器',ja:'モールス受信機',ko:'모스 수신기',ar:'مستقبل مورس',ru:'Приёмник Морзе',hi:'मोर्स रिसीवर',nl:'Morse-ontvanger',ca:'Receptor Morse',gl:'Receptor Morse',eu:'Morse hargailua',da:'Morse-modtager',sv:'Morsemottagare',nb:'Morsemottaker',ga:'Glacadóir Morse',el:'Δέκτης Μορς',uk:'Приймач Морзе',he:'מקלט מורס'},
  escuchar:{es:'Escuchar',en:'Listen',fr:'Écouter',pt:'Ouvir',it:'Ascolta',de:'Zuhören',zh:'收听',ja:'受信開始',ko:'듣기',ar:'استمع',ru:'Слушать',hi:'सुनें',nl:'Luisteren',ca:'Escoltar',gl:'Escoitar',eu:'Entzun',da:'Lyt',sv:'Lyssna',nb:'Lytt',ga:'Éist',el:'Ακρόαση',uk:'Слухати',he:'האזן'},
  detener: {es:'Detener',en:'Stop',fr:'Arrêter',pt:'Parar',it:'Ferma',de:'Stopp',zh:'停止',ja:'停止',ko:'중지',ar:'إيقاف',ru:'Стоп',hi:'रोकें',nl:'Stoppen',ca:'Aturar',gl:'Deter',eu:'Gelditu',da:'Stop',sv:'Stoppa',nb:'Stopp',ga:'Stop',el:'Διακοπή',uk:'Стоп',he:'עצור'},
  archivo: {es:'Abrir audio',en:'Open audio',fr:'Ouvrir un audio',pt:'Abrir áudio',it:'Apri audio',de:'Audio öffnen',zh:'打开音频',ja:'音声を開く',ko:'오디오 열기',ar:'فتح ملف صوتي',ru:'Открыть аудио',hi:'ऑडियो खोलें',nl:'Audio openen',ca:'Obrir àudio',gl:'Abrir audio',eu:'Ireki audioa',da:'Åbn lyd',sv:'Öppna ljud',nb:'Åpne lyd',ga:'Oscail fuaim',el:'Άνοιγμα ήχου',uk:'Відкрити аудіо',he:'פתח שמע'},
  probar:  {es:'Probar (emite SOS)',en:'Test (plays SOS)',fr:'Tester (émet SOS)',pt:'Testar (toca SOS)',it:'Prova (suona SOS)',de:'Test (spielt SOS)',zh:'测试（播放SOS）',ja:'テスト（SOSを再生）',ko:'테스트 (SOS 재생)',ar:'اختبار (يبث SOS)',ru:'Тест (сигнал SOS)',hi:'परीक्षण (SOS बजाएँ)',nl:'Testen (speelt SOS)',ca:'Provar (emet SOS)',gl:'Probar (emite SOS)',eu:'Probatu (SOS jotzen du)',da:'Test (afspiller SOS)',sv:'Testa (spelar SOS)',nb:'Test (spiller SOS)',ga:'Tástáil (seinneann SOS)',el:'Δοκιμή (παίζει SOS)',uk:'Тест (сигнал SOS)',he:'בדיקה (משמיע SOS)'},
  limpiar: {es:'Limpiar',en:'Clear',fr:'Effacer',pt:'Limpar',it:'Pulisci',de:'Löschen',zh:'清除',ja:'消去',ko:'지우기',ar:'مسح',ru:'Очистить',hi:'साफ़ करें',nl:'Wissen',ca:'Netejar',gl:'Limpar',eu:'Garbitu',da:'Ryd',sv:'Rensa',nb:'Tøm',ga:'Glan',el:'Καθαρισμός',uk:'Очистити',he:'נקה'},
  copiar:  {es:'Copiar',en:'Copy',fr:'Copier',pt:'Copiar',it:'Copia',de:'Kopieren',zh:'复制',ja:'コピー',ko:'복사',ar:'نسخ',ru:'Копировать',hi:'कॉपी',nl:'Kopiëren',ca:'Copiar',gl:'Copiar',eu:'Kopiatu',da:'Kopiér',sv:'Kopiera',nb:'Kopier',ga:'Cóipeáil',el:'Αντιγραφή',uk:'Копіювати',he:'העתק'},
  copiado: {es:'Copiado',en:'Copied',fr:'Copié',pt:'Copiado',it:'Copiato',de:'Kopiert',zh:'已复制',ja:'コピーしました',ko:'복사됨',ar:'تم النسخ',ru:'Скопировано',hi:'कॉपी हो गया',nl:'Gekopieerd',ca:'Copiat',gl:'Copiado',eu:'Kopiatuta',da:'Kopieret',sv:'Kopierat',nb:'Kopiert',ga:'Cóipeáilte',el:'Αντιγράφηκε',uk:'Скопійовано',he:'הועתק'},
  tecla:   {es:'Mantén presionado para enviar Morse con el dedo',en:'Press and hold to key Morse with your finger',fr:'Maintenez appuyé pour manipuler en Morse',pt:'Mantenha pressionado para teclar Morse',it:'Tieni premuto per manipolare in Morse',de:'Gedrückt halten, um Morse zu tasten',zh:'按住即可用手指发送摩尔斯码',ja:'押し続けて指でモールスを打つ',ko:'길게 눌러 손가락으로 모스 입력',ar:'اضغط مطولًا لإرسال مورس بإصبعك',ru:'Удерживайте, чтобы передавать Морзе пальцем',hi:'उंगली से मोर्स भेजने के लिए दबाकर रखें',nl:'Houd ingedrukt om Morse met je vinger te seinen',ca:'Mantén premut per enviar Morse amb el dit',gl:'Mantén premido para enviar Morse co dedo',eu:'Eutsi sakatuta Morse hatzarekin bidaltzeko',da:'Hold nede for at sende morse med fingeren',sv:'Håll nedtryckt för att sända morse med fingret',nb:'Hold inne for å sende morse med fingeren',ga:'Coinnigh brúite chun Morse a sheoladh le do mhéar',el:'Κρατήστε πατημένο για να στείλετε Μορς με το δάχτυλο',uk:'Утримуйте, щоб передавати Морзе пальцем',he:'לחץ והחזק כדי לשדר מורס באצבע'},
  privado: {es:'El audio se procesa solo en este dispositivo; nada se envía a internet.',en:'Audio is processed only on this device; nothing is sent online.',fr:'L’audio est traité uniquement sur cet appareil ; rien n’est envoyé.',pt:'O áudio é processado só neste dispositivo; nada é enviado.',it:'L’audio è elaborato solo su questo dispositivo; nulla viene inviato.',de:'Audio wird nur auf diesem Gerät verarbeitet; nichts wird gesendet.',zh:'音频仅在本设备上处理，不会上传。',ja:'音声はこの端末内だけで処理され、送信されません。',ko:'오디오는 이 기기에서만 처리되며 전송되지 않습니다.',ar:'تتم معالجة الصوت على هذا الجهاز فقط ولا يُرسل شيء.',ru:'Звук обрабатывается только на этом устройстве и никуда не отправляется.',hi:'ऑडियो केवल इसी डिवाइस पर संसाधित होता है; कुछ भी भेजा नहीं जाता।',nl:'Audio wordt alleen op dit apparaat verwerkt; er wordt niets verzonden.',ca:'L’àudio es processa només en aquest dispositiu; no s’envia res.',gl:'O audio procésase só neste dispositivo; non se envía nada.',eu:'Audioa gailu honetan bakarrik prozesatzen da; ez da ezer bidaltzen.',da:'Lyd behandles kun på denne enhed; intet sendes.',sv:'Ljudet behandlas bara på den här enheten; inget skickas.',nb:'Lyd behandles bare på denne enheten; ingenting sendes.',ga:'Próiseáiltear an fhuaim ar an ngléas seo amháin; ní sheoltar aon rud.',el:'Ο ήχος επεξεργάζεται μόνο σε αυτή τη συσκευή· τίποτα δεν αποστέλλεται.',uk:'Звук обробляється лише на цьому пристрої й нікуди не надсилається.',he:'השמע מעובד רק במכשיר זה; דבר אינו נשלח.'},
  sos:     {es:'¡SOS detectado!',en:'SOS detected!',fr:'SOS détecté !',pt:'SOS detectado!',it:'SOS rilevato!',de:'SOS erkannt!',zh:'检测到SOS！',ja:'SOSを検出！',ko:'SOS 감지!',ar:'تم رصد SOS!',ru:'Обнаружен SOS!',hi:'SOS मिला!',nl:'SOS gedetecteerd!',ca:'SOS detectat!',gl:'SOS detectado!',eu:'SOS detektatu da!',da:'SOS registreret!',sv:'SOS upptäckt!',nb:'SOS oppdaget!',ga:'SOS braite!',el:'Εντοπίστηκε SOS!',uk:'Виявлено SOS!',he:'זוהה SOS!'},
  sinmic:  {es:'No se pudo usar el micrófono. Revisa el permiso del navegador.',en:'Microphone unavailable. Check the browser permission.',fr:'Micro indisponible. Vérifiez l’autorisation du navigateur.',pt:'Microfone indisponível. Verifique a permissão do navegador.',it:'Microfono non disponibile. Controlla il permesso del browser.',de:'Mikrofon nicht verfügbar. Browser-Berechtigung prüfen.',zh:'无法使用麦克风，请检查浏览器权限。',ja:'マイクを使用できません。ブラウザの許可を確認してください。',ko:'마이크를 사용할 수 없습니다. 브라우저 권한을 확인하세요.',ar:'تعذر استخدام الميكروفون. تحقق من إذن المتصفح.',ru:'Микрофон недоступен. Проверьте разрешение браузера.',hi:'माइक्रोफ़ोन उपलब्ध नहीं। ब्राउज़र अनुमति जाँचें।',nl:'Microfoon niet beschikbaar. Controleer de toestemming van de browser.',ca:'No s’ha pogut usar el micròfon. Revisa el permís del navegador.',gl:'Non se puido usar o micrófono. Revisa o permiso do navegador.',eu:'Ezin izan da mikrofonoa erabili. Egiaztatu nabigatzailearen baimena.',da:'Mikrofonen er ikke tilgængelig. Tjek browserens tilladelse.',sv:'Mikrofonen är inte tillgänglig. Kontrollera webbläsarens behörighet.',nb:'Mikrofonen er ikke tilgjengelig. Sjekk nettleserens tillatelse.',ga:'Níl an micreafón ar fáil. Seiceáil cead an bhrabhsálaí.',el:'Το μικρόφωνο δεν είναι διαθέσιμο. Ελέγξτε την άδεια του προγράμματος περιήγησης.',uk:'Мікрофон недоступний. Перевірте дозвіл браузера.',he:'המיקרופון אינו זמין. בדוק את הרשאת הדפדפן.'},
  tono:    {es:'Tono',en:'Tone',fr:'Tonalité',pt:'Tom',it:'Tono',de:'Ton',zh:'音调',ja:'トーン',ko:'톤',ar:'النغمة',ru:'Тон',hi:'टोन',nl:'Toon',ca:'To',gl:'Ton',eu:'Tonua',da:'Tone',sv:'Ton',nb:'Tone',ga:'Ton',el:'Τόνος',uk:'Тон',he:'צליל'},
  auto:    {es:'automático',en:'automatic',fr:'automatique',pt:'automático',it:'automatico',de:'automatisch',zh:'自动',ja:'自動',ko:'자동',ar:'تلقائي',ru:'авто',hi:'स्वचालित',nl:'automatisch',ca:'automàtic',gl:'automático',eu:'automatikoa',da:'automatisk',sv:'automatisk',nb:'automatisk',ga:'uathoibríoch',el:'αυτόματο',uk:'авто',he:'אוטומטי'},
  vel:     {es:'Velocidad',en:'Speed',fr:'Vitesse',pt:'Velocidade',it:'Velocità',de:'Tempo',zh:'速度',ja:'速度',ko:'속도',ar:'السرعة',ru:'Скорость',hi:'गति',nl:'Snelheid',ca:'Velocitat',gl:'Velocidade',eu:'Abiadura',da:'Hastighed',sv:'Hastighet',nb:'Hastighet',ga:'Luas',el:'Ταχύτητα',uk:'Швидкість',he:'מהירות'},
  cerrar:  {es:'Cerrar',en:'Close',fr:'Fermer',pt:'Fechar',it:'Chiudi',de:'Schließen',zh:'关闭',ja:'閉じる',ko:'닫기',ar:'إغلاق',ru:'Закрыть',hi:'बंद करें',nl:'Sluiten',ca:'Tancar',gl:'Pechar',eu:'Itxi',da:'Luk',sv:'Stäng',nb:'Lukk',ga:'Dún',el:'Κλείσιμο',uk:'Закрити',he:'סגור'}
};
const idioma = () => { const l = (document.documentElement.lang || 'es').slice(0, 2); return L.titulo[l] ? l : 'es'; };
const tr = k => L[k][idioma()] || L[k].es;
const AQUI = (document.currentScript && document.currentScript.src) || '/_comun/receptor.js';
const TOMA = new URL('morse-toma.js', AQUI).href;

const CSS = `
.rx-dlg{border:1px solid var(--line,#ccc);border-radius:var(--radius,12px);background:var(--surface,#fff);color:var(--fg,#111);padding:0;width:min(560px,calc(100vw - 24px));max-height:calc(100dvh - 24px);font:15px/1.5 var(--body,system-ui,sans-serif)}
.rx-dlg::backdrop{background:rgba(0,0,0,.45)}
.rx-pagina .rx-dlg{position:static;width:100%;max-width:640px;margin:0 auto;border:0;background:transparent;max-height:none}
.rx-in{display:grid;gap:14px;padding:18px}
.rx-cab{display:flex;align-items:center;gap:10px}
.rx-cab h2{font:700 1.25rem/1.1 var(--display,inherit);margin:0;margin-right:auto}
.rx-x{font:600 1.1rem var(--body,inherit);background:none;border:1px solid var(--line,#ccc);color:var(--fg,#111);border-radius:999px;width:36px;height:36px;cursor:pointer}
.rx-est{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 .78rem var(--mono,ui-monospace,monospace);color:var(--muted,#666);align-items:center}
.rx-med{flex:1 1 120px;height:8px;border-radius:999px;background:color-mix(in srgb,var(--fg,#111) 10%,transparent);overflow:hidden;min-width:100px}
.rx-med i{display:block;height:100%;width:0;background:var(--accent,#111);transition:width .06s linear}
.rx-med.on i{background:var(--rust,var(--accent,#c30))}
.rx-btns{display:flex;flex-wrap:wrap;gap:8px}
.rx-btns button,.rx-btns label{font:600 .88rem var(--body,inherit);padding:10px 14px;border-radius:var(--radius,10px);border:1px solid var(--line,#ccc);background:transparent;color:var(--fg,#111);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.rx-btns .rx-pri{background:var(--accent,#111);color:var(--accent-ink,#fff);border-color:var(--accent,#111)}
.rx-btns input{position:absolute;width:1px;height:1px;opacity:0}
.rx-txt{min-height:120px;max-height:34vh;overflow:auto;border:1px solid var(--line,#ccc);border-radius:var(--radius,10px);padding:12px;font:600 1.15rem/1.5 var(--mono,ui-monospace,monospace);letter-spacing:.04em;white-space:pre-wrap;word-break:break-word;background:var(--bg,#fafafa)}
.rx-txt .rx-cod{color:var(--muted,#888);font-weight:500}
.rx-tecla{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none;font:600 .9rem var(--body,inherit);min-height:84px;border-radius:var(--radius,12px);border:2px dashed var(--line,#ccc);background:transparent;color:var(--muted,#666);cursor:pointer;padding:12px}
.rx-tecla.on{background:var(--accent,#111);color:var(--accent-ink,#fff);border-style:solid;border-color:var(--accent,#111)}
.rx-cfg{display:flex;flex-wrap:wrap;gap:10px 18px;font-size:.84rem;color:var(--muted,#666);align-items:center}
.rx-cfg select{font:500 .84rem var(--body,inherit);color:var(--fg,#111);background:var(--surface,#fff);border:1px solid var(--line,#ccc);border-radius:999px;padding:5px 9px}
.rx-sos{font:700 1rem var(--body,inherit);padding:10px 14px;border-radius:var(--radius,10px);background:#B42318;color:#fff}
.rx-aviso{font-size:.78rem;color:var(--muted,#666);margin:0}
.rx-err{font-size:.86rem;color:#B42318;margin:0}
`;

let dlg, motor, ctx, fuente, nodo, flujo, salida = '', cod = '', escuchando = false, ticker, tonoTecla, lienzoPagina = false;
const $ = s => dlg.querySelector(s);

function pintar() {
  const t = $('.rx-txt');
  t.textContent = salida;
  if (cod) { const s = document.createElement('span'); s.className = 'rx-cod'; s.textContent = cod; t.appendChild(s); }
  t.scrollTop = t.scrollHeight;
}
function nuevoMotor(sr) {
  const hz = +$('#rx-hz').value || null, wpm = +$('#rx-wpm').value || 15;
  motor = new VHRSMorse.MotorMorse(sr, {
    wpm, hz,
    alCaracter: c => { salida += c; pintar(); },
    alCodigo: c => { cod = c; pintar(); },
    alSOS: () => { const a = $('.rx-sos'); a.hidden = false; try { navigator.vibrate && navigator.vibrate([300, 100, 300, 100, 300]); } catch (e) {} setTimeout(() => { a.hidden = true; }, 8000); }
  });
}
function estado() {
  if (!motor) return;
  const lleno = Math.max(0, Math.min(100, (motor.nivel - (motor.lo || -100)) / 30 * 100));
  const m = $('.rx-med'); m.firstChild.style.width = lleno + '%'; m.classList.toggle('on', motor.on);
  $('#rx-info').textContent = `${motor.hz ? motor.hz + ' Hz' : '— Hz'} · ${motor.wpm} WPM · S/R ${Math.round(motor.snr)} dB`;
}

async function escuchar() {
  const err = $('.rx-err'); err.hidden = true;
  if (escuchando) return parar();
  try {
    flujo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (e) { err.textContent = tr('sinmic'); err.hidden = false; return; }
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  await ctx.resume();
  nuevoMotor(ctx.sampleRate);
  fuente = ctx.createMediaStreamSource(flujo);
  const mudo = ctx.createGain(); mudo.gain.value = 0; mudo.connect(ctx.destination);
  try {
    await ctx.audioWorklet.addModule(TOMA);
    nodo = new AudioWorkletNode(ctx, 'vhrs-toma-morse');
    nodo.port.onmessage = e => { motor.push(e.data); };
  } catch (e) { // navegadores sin AudioWorklet
    nodo = ctx.createScriptProcessor(2048, 1, 1);
    nodo.onaudioprocess = e => motor.push(e.inputBuffer.getChannelData(0));
  }
  fuente.connect(nodo); nodo.connect(mudo);
  escuchando = true;
  const b = $('#rx-esc'); b.textContent = '■ ' + tr('detener');
  ticker = setInterval(estado, 80);
}
function parar() {
  escuchando = false; clearInterval(ticker);
  try { fuente && fuente.disconnect(); nodo && nodo.disconnect(); } catch (e) {}
  if (flujo) flujo.getTracks().forEach(t => t.stop());
  if (motor) motor.fin();
  const b = $('#rx-esc'); if (b) b.textContent = '● ' + tr('escuchar');
}

async function archivo(f) {
  if (!f) return;
  const err = $('.rx-err'); err.hidden = true;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const datos = await ctx.decodeAudioData(await f.arrayBuffer());
    const canal = datos.getChannelData(0);
    nuevoMotor(datos.sampleRate);
    if (salida && !salida.endsWith('\n')) salida += '\n';
    let i = 0;
    const paso = () => { const fin = Math.min(canal.length, i + datos.sampleRate * 2); motor.push(canal.subarray(i, fin)); i = fin; estado(); if (i < canal.length) setTimeout(paso, 0); else { motor.fin(); cod = ''; pintar(); } };
    paso();
  } catch (e) { err.textContent = e.message || String(e); err.hidden = false; }
}

function probar() { // emite SOS por la bocina para comprobar el micrófono
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  ctx.resume();
  const u = 0.075; let t = ctx.currentTime + 0.1;
  for (const s of '...---...') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 700; o.connect(g); g.connect(ctx.destination);
    const d = s === '.' ? u : 3 * u;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.005); g.gain.setValueAtTime(0.35, t + d - 0.005); g.gain.linearRampToValueAtTime(0, t + d);
    o.start(t); o.stop(t + d + 0.01); t += d + u;
  }
}

// Manipulador táctil (también barra espaciadora)
let tMotor = null;
function teclaMotor() {
  if (!tMotor) {
    tMotor = new VHRSMorse.MotorMorse(48000, {
      wpm: +$('#rx-wpm').value || 12,
      alCaracter: c => { salida += c; pintar(); },
      alCodigo: c => { cod = c; pintar(); },
      alSOS: () => { const a = $('.rx-sos'); a.hidden = false; setTimeout(() => { a.hidden = true; }, 8000); }
    });
    setInterval(() => tMotor.tic(performance.now()), 20);
  }
  return tMotor;
}
function tecla(on) {
  const m = teclaMotor();
  $('.rx-tecla').classList.toggle('on', on);
  m.tecla(on, performance.now());
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (on) { ctx.resume(); tonoTecla = ctx.createOscillator(); const g = ctx.createGain(); g.gain.value = 0.18; tonoTecla.frequency.value = 640; tonoTecla.connect(g); g.connect(ctx.destination); tonoTecla.start(); }
    else if (tonoTecla) { tonoTecla.stop(); tonoTecla = null; }
  } catch (e) {}
}

function rotular() {
  if (!dlg) return;
  dlg.querySelectorAll('[data-rx]').forEach(e => { e.textContent = tr(e.dataset.rx); });
  dlg.setAttribute('aria-label', tr('titulo'));
  const a = $('#rx-hz option[value=""]'); if (a) a.textContent = tr('auto');
  const b = $('#rx-esc'); if (b) b.textContent = escuchando ? '■ ' + tr('detener') : '● ' + tr('escuchar');
  const x = $('.rx-x'); if (x) x.setAttribute('aria-label', tr('cerrar'));
}

function construir() {
  if (!document.getElementById('rx-css')) { const s = document.createElement('style'); s.id = 'rx-css'; s.textContent = CSS; document.head.appendChild(s); }
  dlg = document.createElement(lienzoPagina ? 'div' : 'dialog');
  dlg.className = 'rx-dlg no-traducir notranslate';
  dlg.setAttribute('aria-label', tr('titulo'));
  const op = (v, t) => `<option value="${v}">${t}</option>`;
  dlg.innerHTML = `<div class="rx-in">
    <div class="rx-cab"><h2 data-rx="titulo">${tr('titulo')}</h2>${lienzoPagina ? '' : `<button type="button" class="rx-x" aria-label="${tr('cerrar')}">×</button>`}</div>
    <div class="rx-est"><span class="rx-med"><i></i></span><span id="rx-info">— Hz · — WPM</span></div>
    <div class="rx-btns">
      <button type="button" class="rx-pri" id="rx-esc">● ${tr('escuchar')}</button>
      <label><span data-rx="archivo">${tr('archivo')}</span><input type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg" id="rx-arch"></label>
      <button type="button" id="rx-prb" data-rx="probar">${tr('probar')}</button>
      <button type="button" id="rx-cop" data-rx="copiar">${tr('copiar')}</button>
      <button type="button" id="rx-lim" data-rx="limpiar">${tr('limpiar')}</button>
    </div>
    <p class="rx-err" hidden></p>
    <div class="rx-sos" role="alert" data-rx="sos" hidden>${tr('sos')}</div>
    <div class="rx-txt" aria-live="polite"></div>
    <button type="button" class="rx-tecla" data-rx="tecla">${tr('tecla')}</button>
    <div class="rx-cfg">
      <label><span data-rx="tono">${tr('tono')}</span> <select id="rx-hz">${op('', tr('auto'))}${[400, 500, 600, 650, 700, 750, 800, 900, 1000, 1200].map(h => op(h, h + ' Hz')).join('')}</select></label>
      <label><span data-rx="vel">${tr('vel')}</span> <select id="rx-wpm">${[5, 10, 12, 15, 20, 25, 30, 40].map(w => op(w, w + ' WPM')).join('')}</select></label>
    </div>
    <p class="rx-aviso"><span data-rx="privado">${tr('privado')}</span> · © Víctor Hugo Ramírez Salgado</p>
  </div>`;
  $('#rx-wpm').value = '15';
  // cambia los textos cuando el sitio cambia de idioma
  new MutationObserver(rotular).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  $('#rx-esc').onclick = escuchar;
  $('#rx-arch').onchange = e => archivo(e.target.files[0]);
  $('#rx-prb').onclick = probar;
  $('#rx-lim').onclick = () => { salida = ''; cod = ''; pintar(); };
  $('#rx-cop').onclick = async () => { try { await navigator.clipboard.writeText(salida.trim()); const b = $('#rx-cop'); b.textContent = tr('copiado'); setTimeout(() => { b.textContent = tr('copiar'); }, 1500); } catch (e) {} };
  $('#rx-hz').onchange = () => { if (motor) motor.fijarHz(+$('#rx-hz').value || null); };
  $('#rx-wpm').onchange = () => { if (motor) motor.reiniciar(+$('#rx-wpm').value); tMotor && tMotor.reiniciar(+$('#rx-wpm').value); };
  const k = $('.rx-tecla');
  k.addEventListener('pointerdown', e => { e.preventDefault(); k.setPointerCapture(e.pointerId); tecla(true); });
  k.addEventListener('pointerup', () => tecla(false));
  k.addEventListener('pointercancel', () => tecla(false));
  k.addEventListener('contextmenu', e => e.preventDefault());
  dlg.addEventListener('keydown', e => { if (e.code === 'Space' && e.target === k) { e.preventDefault(); if (!e.repeat) tecla(true); } });
  dlg.addEventListener('keyup', e => { if (e.code === 'Space' && e.target === k) { e.preventDefault(); tecla(false); } });
  if (!lienzoPagina) {
    $('.rx-x').onclick = () => dlg.close();
    dlg.addEventListener('close', parar);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
  return dlg;
}

window.VHRSReceptor = {
  abrir() {
    if (!dlg) { document.body.appendChild(construir()); }
    if (dlg.showModal && !dlg.open) dlg.showModal();
  },
  pagina(destino) { lienzoPagina = true; document.documentElement.classList.add('rx-pagina'); (destino || document.body).appendChild(construir()); }
};
})();
