// © Código de comunicación del Cubo (33) — codificación por caras (versión pública)
(()=>{const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const enc=(t,k)=>t.toUpperCase().split('').map(c=>{const i=A.indexOf(c);return i<0?c:A[(i+k)%26]}).join('');
const n=document.querySelector('[data-nombre]').dataset.nombre.replace(/[^A-Za-z0-9]/g,'');
const caras=document.querySelectorAll('.cara');const rot=['translateZ(55px)','rotateY(90deg) translateZ(55px)','rotateY(180deg) translateZ(55px)','rotateY(-90deg) translateZ(55px)','rotateX(90deg) translateZ(55px)','rotateX(-90deg) translateZ(55px)'];
const pinta=()=>caras.forEach((c,i)=>{const k=1+Math.floor(Math.random()*25);c.style.transform=rot[i];c.textContent='L'+(i+1)+'·'+enc(n,k)});
pinta();setInterval(pinta,3000);})();