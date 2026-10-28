'use strict';
// Project mode page: reads the adventure progress (GET only, never writes) and draws the workshop gate and projects.
(() => {
 const {projects,unlockState,available,isDevHost}=MiaubitProjects,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
 const icons={
  control:'M9 1h6v8h8v6h-8v8H9v-8H1V9h8zM11 3v4h2V3zM11 17v4h2v-4zM3 11v2h4v-2zM17 11v2h4v-2z',
  cosecha:'M10 1h4v3h3v4h3v9h-3v3h-3v3h-4v-3H7v-3H4V8h3V4h3zM10 5v13h3V5z',
  piloto:'M9 1h6v3h5v5h3v6h-3v5h-5v3H9v-3H4v-5H1V9h3V4h5zM10 7v9h4V7z',
  lock:'M7 2h10v3h2v6h2v12H3V11h2V5h2zM9 6v5h6V6zM11 14v5h2v-5z'
 };
 const DEV_KEY='miaubit-proyectos-dev',local=isDevHost(location.hostname);
 let completed=null,failed=false,attempt=0;
 const regionName=index=>globalThis.AtlasWorlds?.[index]?.title??`Región ${index+1}`,accent=index=>globalThis.AtlasWorlds?.[index]?.accent??'#6dbb91';
 const missionNumber=id=>Number(id.slice(1));
 function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
 function icon(kind){const svg=document.createElementNS(NS,'svg'),path=document.createElementNS(NS,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');path.setAttribute('d',icons[kind]);path.setAttribute('fill-rule','evenodd');svg.append(path);return svg;}
 // The early opening is a convenience for the local preview only; sessionStorage may be unavailable.
 function devMode(){if(!local)return false;try{return sessionStorage.getItem(DEV_KEY)==='1';}catch{return false;}}
 function setDevMode(on){try{if(on)sessionStorage.setItem(DEV_KEY,'1');else sessionStorage.removeItem(DEV_KEY);}catch{}render();}
 function renderStats(){
  const list=$('hero-stats'),levels=projects.reduce((sum,p)=>sum+p.levels.length,0);
  list.replaceChildren(...[`${projects.length} PROYECTOS`,`${levels} NIVELES`,'SOLO LO QUE YA APRENDISTE'].map(text=>node('li','',text)));
 }
 function renderRegions(state){
  const items=state.regions.map(region=>{
   const item=node('li'),link=node('a'),cells=node('span','cells');
   link.href='./#'+(region.next??`map-${region.index+1}`);link.style.setProperty('--accent',accent(region.index));
   link.title=`${regionName(region.index)}: ${region.done} de ${region.total}`;
   link.setAttribute('aria-label',region.next?`${regionName(region.index)}: ${region.done} de ${region.total} misiones. Continuar en la misión ${missionNumber(region.next)}.`:`${regionName(region.index)}: región completa.`);
   for(let i=0;i<region.total;i++){const cell=node('i');if(i<region.done){cell.className='on';cell.style.setProperty('--n',region.index*3+i);}cells.append(cell);}
   link.append(cells,node('span','region-number',String(region.index+1)));item.append(link);return item;
  });
  $('gate-regions').replaceChildren(...items);
 }
 function playableText(){
  const ready=projects.filter(p=>MiaubitLevels.count(p.id)===p.levels.length).length,rest=projects.length-ready;
  const done=ready===1?'El Proyecto 1 ya se puede jugar completo':`Los proyectos 1 ${ready===2?'y':'a'} ${ready} ya se pueden jugar completos`;
  return rest?`${done}; ${rest===1?'el último llega en la próxima actualización':'los demás llegan en las próximas actualizaciones'}.`:`Los ${['','','dos','tres'][ready]??ready} proyectos ya se pueden jugar completos.`;
 }
 function renderGate(state){
  const gate=$('gate'),dev=$('gate-dev'),next=$('gate-continue');
  gate.setAttribute('aria-busy',String(!state&&!failed));
  dev.hidden=!local||!state||state.complete;dev.textContent=devMode()?'Volver a exigir las 90 misiones':'Abrir sin las 90 misiones · solo local';
  $('gate-retry').hidden=!failed;next.hidden=true;
  if(failed){
   gate.dataset.state='error';$('gate-label').textContent='SIN CONEXIÓN CON LA BITÁCORA';$('gate-title').textContent='No pudimos leer tu avance';
   $('gate-text').textContent='Revisa tu conexión y vuelve a intentarlo. Esta página solo consulta tu progreso; nunca lo modifica.';$('gate-done').textContent='–';
   return;
  }
  if(!state){gate.dataset.state='loading';renderRegions(unlockState([]));return;}
  $('gate-done').textContent=String(state.done);renderRegions(state);
  if(state.unlocked){
   gate.dataset.state='open';
   $('gate-label').textContent=state.dev?'MODO DESARROLLO · SOLO EN ESTE EQUIPO':'TALLER ABIERTO';
   $('gate-title').textContent=state.dev?'Taller abierto para desarrollar':'¡Completaste la expedición!';
   $('gate-text').textContent=(state.dev?`El taller se abrió sin las 90 misiones; llevas ${state.done}. `:'Las 90 misiones te dieron todas las piezas. ')+playableText();
  }else{
   gate.dataset.state='locked';$('gate-label').textContent='TALLER CERRADO';
   $('gate-title').textContent='Completa las 90 misiones para abrir el taller';
   $('gate-text').textContent=`Llevas ${state.done} de 90. ${state.missing===1?'Te falta 1 misión':`Te faltan ${state.missing} misiones`}: cada proyecto usa lo que aprendes en la aventura.`;
   next.hidden=false;next.href='./#'+state.next;next.textContent=`Continuar en la misión ${missionNumber(state.next)}`;
  }
 }
 function projectCard(project,index,state){
  const open=available(index,!!state?.unlocked,MiaubitTaller.finished()),playable=MiaubitLevels.count(project.id)>0,progress=MiaubitTaller.progress(project.id);
  const status=!state?.unlocked?['locked','Bloqueado','Completa las 90 misiones']:!open?['locked','Bloqueado',`Termina el Proyecto ${index}`]
   :playable?progress?.done.length===project.levels.length?['open','¡Completado!','Volver a tu proyecto ▶']:['open',progress?.done.length?`${progress.done.length} de ${project.levels.length} niveles`:'Disponible',progress?'Continuar en el taller ▶':'Abrir el taller ▶']
   :['building','En construcción','Llega en la próxima actualización'];
  const card=node('article','project');card.dataset.state=status[0];card.setAttribute('aria-labelledby',`project-${project.id}`);
  const head=node('header','project-head'),badge=node('span','project-icon'),titles=node('div'),title=node('h3','',project.title);
  title.id=`project-${project.id}`;badge.append(icon(status[0]==='locked'?'lock':project.id));
  titles.append(node('p','project-number',`PROYECTO ${String(project.number).padStart(2,'0')} · ${project.focus.toUpperCase()}`),title);head.append(badge,titles);
  const levels=node('ol','levels');
  project.levels.forEach((level,i)=>{
   const item=node('li'),body=node('div'),missions=node('p','missions');
   missions.append(node('span','missions-label','Aprendido en'));
   for(const id of level.missions){const link=node('a','',`m${missionNumber(id)}`);link.href='./#'+id;link.setAttribute('aria-label',`Repasar la misión ${missionNumber(id)}`);missions.append(link);}
   const done=!!progress?.done.includes(i),heading=node('strong','',level.title);
   if(status[0]==='open'&&!MiaubitLevels.get(project.id,i))heading.append(node('span','soon-tag','Pronto'));
   body.append(heading,node('p','',level.activity),missions);item.append(node('span',done?'level-number done':'level-number',done?'✓':String(i+1)),body);levels.append(item);
  });
  const foot=node('footer','project-foot');let button;
  if(status[0]==='open'){button=node('a','button primary',status[2]);button.href=`#taller-${project.id}`;}
  else{button=node('button','button',status[2]);button.type='button';button.disabled=true;}
  foot.append(node('span','project-state',status[1]),button);
  card.append(head,node('p','project-summary',project.summary),levels,foot);
  return card;
 }
 function render(){
  const state=completed&&unlockState(completed,devMode());
  renderGate(state);$('project-list').replaceChildren(...projects.map((p,i)=>projectCard(p,i,state)));
  $('gate-status').textContent=failed?'No se pudo leer el avance.':state?(state.unlocked?'Taller abierto.':`Taller cerrado: ${state.done} de 90 misiones.`):'';
 }
 async function load(){
  const current=++attempt,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6000);
  failed=false;completed=null;render();
  try{
   const response=await fetch('/api/progress',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error();
   const data=await response.json();if(!Array.isArray(data.completed))throw new Error();
   if(current===attempt)completed=data.completed;
  }catch{if(current===attempt)failed=true;}
  finally{clearTimeout(timeout);}
  if(current===attempt){render();route();}
 }
 // #taller-<project> opens the workshop once the progress says the project is available.
 function route(){
  const match=location.hash.match(/^#taller-([a-z]+)$/),state=completed&&unlockState(completed,devMode()),index=match?projects.findIndex(p=>p.id===match[1]):-1;
  if(index>=0&&state&&available(index,state.unlocked,MiaubitTaller.finished())&&MiaubitTaller.open(projects[index].id)){$('inicio').hidden=true;scrollTo(0,0);return;}
  if(match&&(state||failed))history.replaceState(null,'',location.pathname+location.search);
  const leaving=!$('taller').hidden;MiaubitTaller.close();$('inicio').hidden=false;
  if(leaving){render();$('projects-title').scrollIntoView();}
 }
 $('gate-retry').addEventListener('click',load);
 $('gate-dev').addEventListener('click',()=>setDevMode(!devMode()));
 addEventListener('hashchange',route);
 renderStats();load();
})();
