/* SOSistem™ · Puerta de la Página Beta · © Víctor Hugo Ramírez Salgado
   - La primera clave que fije el administrador queda como contraseña de la Beta.
   - Solo se guarda una huella PBKDF2-SHA256 (310,000 iteraciones, sal aleatoria) en beta/datos/beta-acceso.json; nunca la clave.
   - Para fijarla por primera vez se necesita un token de GitHub con permiso de escritura sobre el repositorio:
     así nadie más puede ganarle la «primera clave». El token se usa una vez y no se guarda.
   - 5 intentos fallidos bloquean 5 minutos. Se puede recordar el acceso en este equipo. */
(() => {
  const H = document.documentElement;
  H.classList.add("beta-cerrada");
  const st = document.createElement("style");
  st.textContent = `html.beta-cerrada body > *:not(#beta-puerta){display:none!important}
#beta-puerta{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#0E1218;color:#EEF2F7;font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px}
#beta-puerta .bp{width:min(420px,100%);background:#151B24;border:1px solid #263142;border-radius:16px;padding:22px;display:grid;gap:12px;box-shadow:0 18px 40px rgba(0,0,0,.4)}
#beta-puerta h1{font-size:1.2rem;margin:0}#beta-puerta p{margin:0;color:#93A0B2;font-size:.9rem}
#beta-puerta label{display:grid;gap:4px;font-size:.85rem;font-weight:600}
#beta-puerta input{font:inherit;padding:10px 12px;border-radius:10px;border:1px solid #263142;background:#0E1218;color:#EEF2F7}
#beta-puerta button{font:700 1rem system-ui,sans-serif;padding:11px;border-radius:10px;border:0;background:#DB641C;color:#fff;cursor:pointer}
#beta-puerta button.sec{background:#263142}#beta-puerta .msg{min-height:1.2em;font-size:.85rem;color:#F9A900}
#beta-puerta .chk{display:flex;gap:8px;align-items:center;font-weight:500}#beta-puerta .chk input{width:18px;height:18px}
#beta-puerta .logo{width:46px;height:46px}#beta-puerta textarea{width:100%;min-height:90px;font:12px ui-monospace,Menlo,monospace;background:#0E1218;color:#EEF2F7;border:1px solid #263142;border-radius:10px;padding:8px}
#beta-puerta a{color:#F9A900}`;
  document.head.appendChild(st);

  const REPO = "victorhugoramirezsalgado-boop/sosistem", RUTA = "beta/datos/beta-acceso.json", ITER = 310000;
  const base = location.pathname.replace(/[^/]*$/, ""), ARCH = base + "datos/beta-acceso.json";
  const te = new TextEncoder();
  const b64 = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8)));
  const deb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function huella(clave, sal) {
    const k = await crypto.subtle.importKey("raw", te.encode(clave), "PBKDF2", false, ["deriveBits"]);
    return b64(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: ITER }, k, 256));
  }
  // Llave de sesión: se deriva de la clave con otra sal; en el repositorio solo queda su SHA-256 (no sirve para entrar)
  const sal2 = (sal) => Uint8Array.from(sal).reverse();
  const sha = async (t) => b64(await crypto.subtle.digest("SHA-256", te.encode(t)));
  const abrir = () => { H.classList.remove("beta-cerrada"); document.getElementById("beta-puerta")?.remove(); };
  const leerLS = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const leerSS = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

  async function iniciar() {
    let cfg = null;
    try { cfg = await (await fetch(ARCH + "?t=" + Date.now(), { cache: "no-store" })).json(); } catch (e) {}
    const recordado = leerSS("beta_ok") || leerLS("beta_ok");
    if (cfg && cfg.hash && cfg.ver && recordado && (await sha(recordado)) === cfg.ver) return abrir();
    const div = document.createElement("div"); div.id = "beta-puerta";
    document.body.prepend(div);
    if (!cfg || !cfg.hash) crear(div); else entrar(div, cfg);
  }

  function marco(div, titulo, texto, cuerpo) {
    div.innerHTML = `<form class="bp" autocomplete="off"><img class="logo" src="${base}assets/icono.svg" alt=""><h1>${titulo}</h1><p>${texto}</p>${cuerpo}<div class="msg" role="status"></div></form>`;
    return div.querySelector("form");
  }

  function entrar(div, cfg) {
    const f = marco(div, "SOSistem™ · Página Beta", "Acceso solo para el administrador. Escriba la clave de la Beta.",
      `<label>Clave<input type="password" name="c" autocomplete="current-password" required></label>
       <label class="chk"><input type="checkbox" name="r"> Recordar en este equipo</label>
       <button>Entrar</button><p><a href="${base}../">Ir al sitio oficial</a></p>`);
    const msg = f.querySelector(".msg");
    f.c.focus();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const bloq = Number(leerLS("beta_bloq") || 0);
      if (Date.now() < bloq) { msg.textContent = "Demasiados intentos. Espere unos minutos."; return; }
      msg.textContent = "Verificando…";
      const h = await huella(f.c.value, deb64(cfg.sal));
      if (h === cfg.hash) {
        const llave = await huella(f.c.value, sal2(deb64(cfg.sal)));
        try { sessionStorage.setItem("beta_ok", llave); if (f.r.checked) localStorage.setItem("beta_ok", llave); localStorage.removeItem("beta_fallos"); } catch (e2) {}
        abrir();
      } else {
        const n = Number(leerLS("beta_fallos") || 0) + 1;
        try { localStorage.setItem("beta_fallos", n >= 5 ? 0 : n); if (n >= 5) localStorage.setItem("beta_bloq", Date.now() + 5 * 60000); } catch (e2) {}
        msg.textContent = n >= 5 ? "Demasiados intentos: espere 5 minutos." : "Clave incorrecta.";
        f.c.value = ""; f.c.focus();
      }
    };
  }

  function crear(div) {
    const f = marco(div, "Crear la clave de la Beta", "Aún no hay clave. La primera que fije el administrador quedará como contraseña de la Página Beta. Use al menos 10 caracteres; no se guarda la clave, solo su huella.",
      `<label>Nueva clave<input type="password" name="c" autocomplete="new-password" minlength="10" required></label>
       <label>Repita la clave<input type="password" name="c2" autocomplete="new-password" minlength="10" required></label>
       <label>Token de GitHub (escritura sobre ${REPO})<input type="password" name="t" placeholder="github_pat_…"></label>
       <p>El token comprueba que usted es el administrador; se usa una sola vez y no se guarda. <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Crear token</a> (Contents: Read and write, solo este repositorio).</p>
       <button>Guardar clave</button>
       <button type="button" class="sec" id="bp-sin">No tengo token: generar código para guardarlo después</button>`);
    const msg = f.querySelector(".msg");
    f.c.focus();
    async function preparar() {
      if (f.c.value.length < 10) { msg.textContent = "La clave debe tener al menos 10 caracteres."; return null; }
      if (f.c.value !== f.c2.value) { msg.textContent = "Las claves no coinciden."; return null; }
      msg.textContent = "Generando huella…";
      const sal = crypto.getRandomValues(new Uint8Array(16));
      const llave = await huella(f.c.value, sal2(sal));
      preparar.llave = llave;
      return { v: 1, alg: "PBKDF2-SHA256", iter: ITER, sal: b64(sal), hash: await huella(f.c.value, sal), ver: await sha(llave), creada: new Date().toISOString() };
    }
    f.onsubmit = async (e) => {
      e.preventDefault();
      const tk = f.t.value.trim();
      if (!tk) { msg.textContent = "Escriba el token de GitHub o use «generar código»."; return; }
      const cfg = await preparar(); if (!cfg) return;
      msg.textContent = "Guardando en GitHub…";
      const Hh = { Authorization: "Bearer " + tk, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
      try {
        const url = `https://api.github.com/repos/${REPO}/contents/${RUTA}`;
        const ant = await fetch(url, { headers: Hh });
        if (ant.status === 401 || ant.status === 403) throw new Error("El token no tiene permiso sobre el repositorio.");
        const prev = ant.ok ? await ant.json() : null;
        if (prev) { const actual = JSON.parse(decodeURIComponent(escape(atob(prev.content.replace(/\n/g, ""))))); if (actual.hash) throw new Error("La clave ya fue creada. Recargue la página."); }
        const cuerpo = { message: "Beta: clave de administrador creada", content: btoa(unescape(encodeURIComponent(JSON.stringify(cfg, null, 2) + "\n"))) };
        if (prev) cuerpo.sha = prev.sha;
        const r = await fetch(url, { method: "PUT", headers: Hh, body: JSON.stringify(cuerpo) });
        if (!r.ok) throw new Error("GitHub respondió " + r.status + ".");
        try { sessionStorage.setItem("beta_ok", preparar.llave); } catch (e2) {}
        f.c.value = f.c2.value = f.t.value = "";
        msg.textContent = "Clave guardada. La Beta se abre; en 1–2 minutos la clave rige en todos los equipos.";
        setTimeout(abrir, 1200);
      } catch (err) { msg.textContent = err.message || "No se pudo guardar."; }
    };
    f.querySelector("#bp-sin").onclick = async () => {
      const cfg = await preparar(); if (!cfg) return;
      f.c.value = f.c2.value = "";
      msg.textContent = "";
      const ta = document.createElement("textarea"); ta.readOnly = true; ta.value = JSON.stringify(cfg, null, 2);
      const p = document.createElement("p"); p.textContent = "Copie este código y péguelo en beta/datos/beta-acceso.json (o envíeselo a Claude). Solo contiene la huella, no la clave.";
      f.querySelector("#bp-sin").replaceWith(p, ta); ta.select();
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
