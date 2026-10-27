'use strict';
(() => {
 const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
 const paths={
  star:'M10 2h4v5h5v3h3v4h-6v3h-2v5h-4v-5H8v-3H2v-4h3V7h5z',
  spark:'M10 1h4v7h3v3h6v3h-8v3h-2v6H9v-7H6v-3H1v-3h7V7h2z',
  route:'M3 2h6v6H3zM15 16h6v6h-6zM6 9h3v5h9v-3h3v6h-6v-1H6z',
  compass:'M9 1h6v3h5v5h3v6h-3v5h-5v3H9v-3H4v-5H1V9h3V4h5zM10 7v9h4V7z',
  flag:'M4 2h3v21H4zM8 2h12v7h-5v3H8z',
  crown:'M2 5h4v4h3V3h6v6h3V5h4v13H2zM4 20h16v3H4z',
  eye:'M7 4h10v3h4v3h3v5h-3v3h-4v3H7v-3H3v-3H0v-5h3V7h4zM9 8v9h6V8z',
  bug:'M8 2h2v4h4V2h2v4h3v4h4v3h-4v3h4v3h-5v3H6v-3H1v-3h4v-3H1v-3h4V6h3zM10 9v10h4V9z',
  code:'M6 4h4v4H7v3H4v2h3v3h3v4H6v-3H3v-3H0v-4h3V7h3zM14 4h4v3h3v3h3v4h-3v3h-3v3h-4v-4h3v-3h3v-2h-3V8h-3z',
  book:'M1 3h9v2h4V3h9v18h-9v2h-4v-2H1zM10 7v11h4V7z',
  parcel:'M3 3h18v18H3zM10 3v7h4V3zM5 13v3h14v-3z',
  cube:'M7 2h10v3h4v14h-4v3H7v-3H3V5h4zM7 7v9h3V7zM14 7v9h3V7z',
  tree:'M10 1h4v3h4v4h3v7h-7v8h-4v-8H3V8h3V4h4z',
  crystal:'M10 1h4v3h3v4h3v9h-3v3h-3v3h-4v-3H7v-3H4V8h3V4h3zM10 5v13h3V5z',
  key:'M3 2h9v3h3v8h-3v3H7v7H3v-7H0V5h3zM4 6v5h6V6zM7 18h6v3H7z',
  leaf:'M15 2h7v7h-3v6h-4v4H9v3H2v-7h3V9h4V5h6zM9 10v4h5v-4z',
  flower:'M9 1h6v6h7v7h-7v8H9v-8H2V7h7zM9 8v6h6V8z',
  shield:'M10 1h4v3h8v10h-3v5h-4v4H9v-4H5v-5H2V4h8zM10 7v9h4V7z',
  moon:'M6 2h9v3h-5v5H7v5h3v4h6v-3h5v4h-5v3H7v-3H3v-5H0V8h3V4h3zM19 1h3v4h-3z'
 };
 let navigate,filter='all',ready=false,observed=new Set(),snapshot=MiaubitAchievements.evaluate([]),current=null,backHash='#home',toastTimer,completedIds=new Set(),progressKey=null;
 const cards=new Map();
 function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
 function icon(kind){const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('shape-rendering','crispEdges');const path=document.createElementNS(NS,'path');path.setAttribute('d',paths[kind]??paths.star);path.setAttribute('fill','currentColor');path.setAttribute('fill-rule','evenodd');svg.append(path);return svg;}
 function buildCards(){
  const fragment=document.createDocumentFragment();
  for(const a of snapshot.achievements){
   const card=node('article',undefined,'achievement-card'),emblem=node('span',undefined,'achievement-emblem');card.dataset.achievement=a.id;card.setAttribute('aria-labelledby','badge-'+a.id);emblem.append(icon(a.icon));
   const heading=node('h2',a.title);heading.id='badge-'+a.id;const state=node('span','Por descubrir','achievement-state'),description=node('p',a.description),progress=document.createElement('progress');progress.max=a.target;progress.value=0;progress.setAttribute('aria-label',a.title);
   const count=node('span','0 / '+a.target,'achievement-count'),details=node('div',undefined,'achievement-details');details.append(heading,state,description,progress,count);card.append(emblem,details);fragment.append(card);cards.set(a.id,{card,state,progress,count});
  }
  $('achievements-grid').append(fragment);
 }
 function renderCollection(){
  let shown=0;
  for(const a of snapshot.achievements){const {card,state,progress,count}=cards.get(a.id);const show=filter==='all'||(filter==='unlocked'?a.unlocked:!a.unlocked);card.hidden=!show;if(show)shown++;card.dataset.unlocked=String(a.unlocked);state.textContent=a.unlocked?'Conseguido':'Por descubrir';progress.value=a.current;count.textContent=`${a.current} / ${a.target}`;}
  $('achievements-count').textContent=`${snapshot.unlocked} / ${snapshot.achievements.length}`;$('achievements-summary').textContent=`${snapshot.unlocked} logros conseguidos de ${snapshot.achievements.length}. Cada misión completada deja su huella.`;
  $('achievements-empty').hidden=shown>0;
  $('achievements-empty').textContent=filter==='unlocked'?'Toda aventura empieza con una chispa. Resuelve tu primera misión para conseguir un logro.':'Ya encontraste todos los logros. ¡La expedición está completa!';
  for(const button of $('achievement-filters').children)button.setAttribute('aria-pressed',String(button.dataset.filter===filter));
 }
 function renderHome(){
  const total=JavaCourse.levels.length,all=snapshot.total===total;
  $('home-progress').value=snapshot.total;$('home-progress-count').textContent=`${snapshot.total} / ${total} misiones`;
  $('home-achievement-count').textContent=`${snapshot.unlocked} / ${snapshot.achievements.length}`;
  $('nav-achievement-count').textContent=String(snapshot.unlocked);$('achievements-nav').setAttribute('aria-label',`Logros: ${snapshot.unlocked} de ${snapshot.achievements.length} conseguidos`);
  $('home-journey-copy').textContent=all?'De la primera chispa a las Pléyades. Completaste toda la expedición.':snapshot.total?`${snapshot.regions} de 9 regiones restauradas. Aún hay caminos por iluminar.`:'Tu primera chispa está al otro lado del camino.';
  $('home-play').disabled=!ready;$('home-play').textContent=!ready?'Preparando aventura…':all?'Volver a explorar':snapshot.total?'Continuar aventura':'Comenzar aventura';
  const recent=snapshot.achievements.filter(a=>a.unlocked).slice(-3);$('home-treasures').replaceChildren();
  for(const a of recent){const token=node('span',undefined,'home-medal');token.append(icon(a.icon));token.title=a.title;token.setAttribute('aria-label',a.title);$('home-treasures').append(token);}
  $('home-treasure-copy').textContent=recent.length?'Pequeños recuerdos de un gran viaje.':'Cada misión puede encender un nuevo logro.';
 }
 function closeToast(){clearTimeout(toastTimer);const focused=$('achievement-toast').contains(document.activeElement);$('achievement-toast').hidden=true;if(focused)$(document.body.dataset.view==='home'?'home-achievements':'achievements-nav').focus({preventScroll:true});}
 function scheduleToast(){clearTimeout(toastTimer);toastTimer=setTimeout(closeToast,8000);}
 function announce(achievements){
  clearTimeout(toastTimer);const first=achievements[0];$('toast-emblem').replaceChildren(icon(first.icon));
  $('toast-label').textContent=achievements.length===1?'¡Nuevo logro!':`¡${achievements.length} nuevos logros!`;
  $('toast-title').textContent=achievements.map(a=>a.title).join(' · ');$('achievement-toast').hidden=false;$('achievement-announcer').textContent=$('toast-label').textContent+' '+$('toast-title').textContent;scheduleToast();
 }
 function update(mission,completed,{announce:shouldAnnounce=false}={}){
  current=mission;const key=[...completed].sort().join(',');if(key===progressKey)return;progressKey=key;
  snapshot=MiaubitAchievements.evaluate(completed);const unlocked=snapshot.achievements.filter(a=>a.unlocked),fresh=unlocked.filter(a=>!observed.has(a.id));observed=new Set(unlocked.map(a=>a.id));
  renderHome();renderCollection();if(shouldAnnounce&&fresh.length)announce(fresh);
 }
 function show(name,returnHash){
  if(name==='home'){
   const image=$('home-landscape');if(!image.hasAttribute('src'))image.src=SiteAssets.url('assets/maps/01-alba.webp');
  }
  if(name==='achievements'){if(returnHash)backHash=returnHash;closeToast();}
 }
 function init(onNavigate){
  navigate=onNavigate;buildCards();
  $('home-landscape').addEventListener('error',()=>{$('home-landscape').hidden=true;});
  $('home-play').addEventListener('click',()=>{const m=MiaubitAchievements.nextMission(completedIds,current?.id);navigate(snapshot.total===JavaCourse.levels.length?'#map-9':snapshot.total?'#'+m.id:'#map-1');});
  $('home-worlds').addEventListener('click',()=>navigate('#map-'+((current?.chapter??0)+1)));
  for(const id of ['home-achievements','achievements-nav'])$(id).addEventListener('click',()=>navigate('#logros'));
  $('achievements-back').addEventListener('click',()=>navigate(backHash));
  for(const button of $('achievement-filters').children)button.addEventListener('click',()=>{filter=button.dataset.filter;renderCollection();});
  $('toast-open').addEventListener('click',()=>{closeToast();navigate('#logros');});$('toast-close').addEventListener('click',closeToast);
  $('achievement-toast').addEventListener('pointerenter',()=>clearTimeout(toastTimer));$('achievement-toast').addEventListener('pointerleave',scheduleToast);
  $('achievement-toast').addEventListener('focusin',()=>clearTimeout(toastTimer));$('achievement-toast').addEventListener('focusout',e=>{if(!$('achievement-toast').contains(e.relatedTarget))scheduleToast();});
  $('achievement-toast').addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();closeToast();}});
 }
 globalThis.GameHub={init,show,ready(){ready=true;renderHome();},update(mission,completed,options){completedIds=new Set(completed);update(mission,completed,options);}};
})();
