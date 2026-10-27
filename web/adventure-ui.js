'use strict';
(() => {
 const $=id=>document.getElementById(id);
 let lastMission=null,currentRegion=null,finished=new Set();
 function update(mission,completed){
  const region=ExpeditionCampaign.chapter(mission.chapter),beat=ExpeditionCampaign.mission(mission.id),state=ExpeditionCampaign.derive(mission.chapter,completed);currentRegion=region;finished=new Set(completed);
  document.body.style.setProperty('--adventure-dark',region.palette[1]);document.body.style.setProperty('--adventure-ground',region.palette[0]);
  $('chapter-story').hidden=false;$('campaign-teaser').hidden=false;$('camera-mode').hidden=false;
  $('starter-guide').hidden=mission.id!=='m01';if(lastMission!==mission.id)$('result-shortcut').hidden=true;lastMission=mission.id;
  {
   $('story-title').textContent=state.complete?region.restored:region.quest;
   $('story-mission').textContent=beat.title;$('story-description').textContent=beat.story;
   $('story-counter').textContent=`${state.count} / ${state.total} ${region.unit}`;
   $('story-progress').setAttribute('aria-label',`Misiones de ${region.title}`);
   $('story-progress').replaceChildren(...region.ids.map((id,index)=>{const mark=document.createElement('span');const done=completed.has(id);mark.className=done?'lit':'';mark.textContent=done?'✦':String(index+1);mark.setAttribute('aria-label',`Misión ${mission.chapter*10+index+1}${done?' completada':' pendiente'}`);return mark;}));
   $('continue-region').hidden=!state.complete;
   $('continue-region').textContent=region.index===8?'Ver mi recorrido →':`Viajar a ${ExpeditionCampaign.chapter(region.index+1).title} →`;
   $('campaign-teaser-title').textContent=region.quest;$('campaign-teaser-description').textContent=region.brief;
   $('campaign-start').textContent=state.complete?'Volver a explorar':'Continuar aventura';
   $('quest-description').textContent=beat.story;
  }
  globalThis.ExpeditionWorld?.setProgress(state);
 }
 function init(){
  const result=document.createElement('button');result.id='result-shortcut';result.type='button';result.className='button secondary';result.textContent='Ver resultado';result.hidden=true;result.addEventListener('click',()=>$('feedback').scrollIntoView({block:'start',behavior:'instant'}));document.querySelector('.control-buttons').append(result);
  const notebook=$('notebook');document.querySelector('.task-panel').after(notebook);
  $('lesson-help').addEventListener('click',()=>{notebook.open=true;notebook.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  notebook.addEventListener('toggle',()=>$('lesson-help').setAttribute('aria-expanded',String(notebook.open)));
  $('camera-mode').addEventListener('click',()=>{$('camera-mode').textContent=ExpeditionWorld.cycleCamera();});
  $('continue-region').addEventListener('click',()=>{location.hash='#map-'+Math.min(9,currentRegion.index+2);});
  $('campaign-start').addEventListener('click',()=>{const next=currentRegion.ids.find(id=>!finished.has(id));location.hash='#'+(next??currentRegion.ids[0]);});
  $('inspect-state').addEventListener('click',()=>{const inspector=$('inspector');inspector.open=true;inspector.scrollIntoView({block:'nearest',behavior:'instant'});});
  AdventureAudio.init();
 }
 function focusPlayback(){if(window.innerWidth<=850&&document.body.dataset.view==='mission')document.querySelector('.world-panel').scrollIntoView({block:'start',behavior:'instant'});}
 function observe(state){
  const robots=state.objects.filter(o=>o.robot),others=state.objects.length-robots.length;
  const values=Object.entries(state.vars).slice(0,3).map(([name,v])=>`${name} = ${v.text}`);
  $('scene-observation').textContent=state.output.length?'Consola: '+state.output.at(-1):values.length?values.join(' · '):`${robots.length} robot${robots.length===1?'':'s'} en el escenario${others?` · ${others} objeto${others===1?'':'s'} en el inspector`:''}`;
 }
 globalThis.AdventureUI={init,update,observe,focusPlayback,finished(){$('result-shortcut').hidden=false;},reset(){$('result-shortcut').hidden=true;}};
})();
