/* ============================================================
   Tono © · Botón de ciclo de visibilidad para SOSistem™ (Sistema S.O.S.©)
   Obra de Víctor Hugo Ramírez Salgado · Safe Creative 2609046908578
   Un solo botón flotante. Cada toque SUBE la visibilidad:
     Oculto → Discreto → Noche → Día → (otra vez) Oculto
   En «Oculto» se esconden el nombre y el título de la página.
   El nombre va siempre como marca de agua (lo controla tono.css).
   Recuerda la elección en el equipo (localStorage). No envía nada.
   ============================================================ */
(function(){
  "use strict";
  var LS="sost_tono", root=document.documentElement;

  /* Orden del ciclo (de menos a más visible) y etiqueta de cada nivel */
  var CICLO=["oculto","discreto","noche","dia"];
  var ETIQUETA={oculto:"Oculto", discreto:"Discreto", noche:"Noche", dia:"Día"};

  var guardado=null; try{ guardado=localStorage.getItem(LS); }catch(e){}
  if(CICLO.indexOf(guardado)<0) guardado="dia";           // por defecto, Día
  aplicar(guardado, false);

  function aplicar(nivel, recordar){
    if(nivel==="oculto"){
      root.setAttribute("data-oculto","1");
      // deja el tono visual previo debajo de la cortina; usa discreto como lienzo oscuro
      root.setAttribute("data-tono","discreto");
    }else{
      root.setAttribute("data-oculto","0");
      root.setAttribute("data-tono",nivel);
    }
    root.setAttribute("data-nivel",nivel);
    if(recordar){ try{ localStorage.setItem(LS,nivel); }catch(e){} }
    sincronizarThemeColor();
    pintar(nivel);
  }

  function nivelActual(){
    var n=root.getAttribute("data-nivel");
    return CICLO.indexOf(n)>=0 ? n : "dia";
  }
  function siguiente(){
    var i=CICLO.indexOf(nivelActual());
    var n=CICLO[(i+1)%CICLO.length];
    aplicar(n, true);
  }
  function sincronizarThemeColor(){
    var m=document.querySelector('meta[name="theme-color"]');
    if(m){ var bg=getComputedStyle(root).getPropertyValue("--bg").trim(); if(bg) m.setAttribute("content",bg); }
  }

  var btn, etq;
  function pintar(nivel){
    if(!btn) return;
    btn.setAttribute("data-nivel",nivel);
    if(etq) etq.textContent=ETIQUETA[nivel];
    btn.setAttribute("aria-label","Tono: "+ETIQUETA[nivel]+". Tocar para cambiar.");
  }

  function montar(){
    btn=document.createElement("button");
    btn.type="button"; btn.className="tono-ciclo";
    var p=document.createElement("span"); p.className="punto"; p.setAttribute("aria-hidden","true");
    etq=document.createElement("span");
    btn.appendChild(p); btn.appendChild(etq);
    btn.addEventListener("click",siguiente);
    document.body.appendChild(btn);
    pintar(nivelActual());
  }

  function init(){ montar(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
