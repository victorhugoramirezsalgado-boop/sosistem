/* ============================================================
   Tono © · Selector de ambiente para SOSistem™ (Sistema S.O.S.©)
   Obra de Víctor Hugo Ramírez Salgado · Safe Creative 2609046908578
   Inserta una barra Día/Noche/Discreto + botón Ocultar, recuerda la
   elección en el equipo (localStorage) y no envía nada a ningún lado.
   Uso: <div id="tono"></div> + <script src="assets/tono.js" defer></script>
   ============================================================ */
(function(){
  "use strict";
  var LS="sost_tono", root=document.documentElement;
  var guardado=null; try{ guardado=localStorage.getItem(LS); }catch(e){}
  if(guardado==="dia"||guardado==="noche"||guardado==="discreto") root.setAttribute("data-tono",guardado);

  function fijar(t){
    root.setAttribute("data-tono",t);
    try{ localStorage.setItem(LS,t); }catch(e){}
    pintar();
    if(root.getAttribute("theme-color-sync")!=="0"){
      var m=document.querySelector('meta[name="theme-color"]');
      if(m){ var bg=getComputedStyle(root).getPropertyValue("--bg").trim(); if(bg) m.setAttribute("content",bg); }
    }
  }
  function tonoActual(){
    var t=root.getAttribute("data-tono");
    if(t) return t;
    return (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "noche" : "dia";
  }
  function ocultar(on){
    root.setAttribute("data-oculto", on?"1":"0");
  }
  var botones=[];
  function pintar(){
    var act=tonoActual();
    botones.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.tono===act ? "true":"false"); });
  }

  function montar(host){
    var bar=document.createElement("div");
    bar.className="tono-bar";
    bar.setAttribute("role","group");
    bar.setAttribute("aria-label","Tono de pantalla");
    var defs=[["dia","Día"],["noche","Noche"],["discreto","Discreto"]];
    defs.forEach(function(d){
      var b=document.createElement("button");
      b.type="button"; b.dataset.tono=d[0]; b.textContent=d[1];
      b.setAttribute("aria-pressed","false");
      b.addEventListener("click",function(){ fijar(d[0]); });
      bar.appendChild(b); botones.push(b);
    });
    var oc=document.createElement("button");
    oc.type="button"; oc.className="tono-ocultar"; oc.textContent="Ocultar";
    oc.setAttribute("aria-label","Ocultar la pantalla al instante");
    oc.addEventListener("click",function(){ ocultar(true); });
    bar.appendChild(oc);
    host.appendChild(bar);

    // Cortina de «Ocultar»: tocar para volver
    var cor=document.createElement("div");
    cor.className="tono-cortina";
    cor.textContent="Toque para volver";
    cor.addEventListener("click",function(){ ocultar(false); });
    document.body.appendChild(cor);

    pintar();
  }

  function init(){
    // La barra es flotante y fija: si existe #tono la usa, si no, se monta en el body (infalible)
    var host=document.getElementById("tono") || document.body;
    montar(host);
    if(window.matchMedia){
      try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",pintar); }catch(e){}
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
