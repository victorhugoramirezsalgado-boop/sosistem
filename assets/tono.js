/* ============================================================
   Tono © · Deslizador de luminancia para SOSistem™ (Sistema S.O.S.©)
   Obra de Víctor Hugo Ramírez Salgado · Safe Creative 2609046908578
   Un solo deslizador continuo (0–100) gradúa la luminancia de toda la
   página: de la marca de agua casi invisible (0) al día claro (100),
   pasando por discreto y noche. Abre en la misma posición en que se dejó.
   Recuerda la elección en el equipo (localStorage). No envía nada.
   ============================================================ */
(function(){
  "use strict";
  var LS="sost_lum", root=document.documentElement;

  var val=50; try{ var g=localStorage.getItem(LS); if(g!=null) val=Math.max(0,Math.min(100,parseInt(g,10)||0)); }catch(e){}
  aplicar(val, false);

  /* Traduce 0–100 a un tono (para las variables de color) y a un nivel de brillo */
  function aplicar(v, recordar){
    v=Math.max(0,Math.min(100,v));
    // Franjas de color: 0–20 oculto · 20–45 discreto · 45–70 noche · 70–100 día
    var tono = v<20 ? "discreto" : v<45 ? "discreto" : v<70 ? "noche" : "dia";
    root.setAttribute("data-tono", tono);
    root.setAttribute("data-oculto", v<12 ? "1" : "0");
    // Brillo fino continuo: la página entera se atenúa con --lum (0.45 … 1)
    var lum = (0.45 + (v/100)*0.55).toFixed(3);
    root.style.setProperty("--lum", lum);
    if(recordar){ try{ localStorage.setItem(LS, String(v)); }catch(e){} }
    sincronizarThemeColor();
  }
  function sincronizarThemeColor(){
    var m=document.querySelector('meta[name="theme-color"]');
    if(m){ var bg=getComputedStyle(root).getPropertyValue("--bg").trim(); if(bg) m.setAttribute("content",bg); }
  }

  function montar(){
    var caja=document.createElement("div");
    caja.className="tono-lum";
    caja.setAttribute("role","group");
    caja.setAttribute("aria-label","Luminancia de la pantalla");

    var sol=document.createElement("span"); sol.className="tono-ico"; sol.textContent="◐"; sol.setAttribute("aria-hidden","true");

    var r=document.createElement("input");
    r.type="range"; r.min="0"; r.max="100"; r.step="1"; r.value=String(val);
    r.className="tono-range";
    r.setAttribute("aria-label","Luminancia: 0 oculto, 100 día claro");
    r.addEventListener("input",function(){ val=parseInt(r.value,10)||0; aplicar(val,true); });

    caja.appendChild(sol);
    caja.appendChild(r);
    // Se monta en <html>, FUERA del filtro de brillo del body, para que el
    // control nunca se atenúe y siempre se pueda volver a subir la luz.
    root.appendChild(caja);
  }

  function init(){ montar(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
