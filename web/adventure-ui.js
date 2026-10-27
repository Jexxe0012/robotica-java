'use strict';
(() => {
 const $=id=>document.getElementById(id);
 let lastMission=null;
 function update(mission,completed){
  const first=mission.chapter===0,beat=AlbaChapter.mission(mission.id),state=AlbaChapter.derive(completed);
  document.body.dataset.adventure=String(first);
  $('chapter-story').hidden=!first;$('campaign-teaser').hidden=!first;$('camera-mode').hidden=!first;
  $('starter-guide').hidden=mission.id!=='m01';if(lastMission!==mission.id)$('result-shortcut').hidden=true;lastMission=mission.id;
  if(first){
   $('story-title').textContent=state.bridge?'El puente del Alba vuelve a brillar':'Devuelve la luz al sendero';
   $('story-mission').textContent=beat.title;$('story-description').textContent=beat.story;
   $('story-counter').textContent=`${state.count} / 10 balizas`;
   $('story-progress').replaceChildren(...AlbaChapter.ids.map((id,index)=>{const mark=document.createElement('span');const done=completed.has(id);mark.className=done?'lit':'';mark.textContent=done?'✦':String(index+1);mark.setAttribute('aria-label',`Misión ${index+1}${done?' completada':' pendiente'}`);return mark;}));
   $('continue-region').hidden=!state.bridge;
   $('quest-description').textContent=beat.story;
  }
  globalThis.AtlasPhaserWorld?.setProgress(state);
 }
 function init(){
  const result=document.createElement('button');result.id='result-shortcut';result.type='button';result.className='button secondary';result.textContent='Ver resultado';result.hidden=true;result.addEventListener('click',()=>$('feedback').scrollIntoView({block:'start',behavior:'instant'}));document.querySelector('.control-buttons').append(result);
  const notebook=$('notebook');document.querySelector('.task-panel').after(notebook);
  $('lesson-help').addEventListener('click',()=>{notebook.open=true;notebook.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  notebook.addEventListener('toggle',()=>$('lesson-help').setAttribute('aria-expanded',String(notebook.open)));
  $('camera-mode').addEventListener('click',()=>{$('camera-mode').textContent=AtlasPhaserWorld.cycleCamera();});
  $('continue-region').addEventListener('click',()=>{location.hash='#map-2';});
  $('campaign-start').addEventListener('click',()=>{const next=AlbaChapter.ids.find(id=>!document.querySelector(`[data-mission="${id}"].completed`));location.hash='#'+(next??'m01');});
  AdventureAudio.init();
 }
 function focusPlayback(){if(window.innerWidth<=850&&document.body.dataset.view==='mission')document.querySelector('.world-panel').scrollIntoView({block:'start',behavior:'instant'});}
 globalThis.AdventureUI={init,update,focusPlayback,finished(){$('result-shortcut').hidden=false;},reset(){$('result-shortcut').hidden=true;}};
})();
