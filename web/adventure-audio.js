'use strict';
(() => {
 let context,musicGain,effectsGain,enabled=false,active=false,timer,previous=null,button;
 const voices=new Set();
 function tone(frequency,duration,delay=0,bus=effectsGain,volume=.08){
  if(!context||!enabled||!active||document.hidden)return;
  const at=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();
  osc.type='triangle';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  const voice={osc,bus};voices.add(voice);osc.connect(gain);gain.connect(bus);osc.start(at);osc.stop(at+duration+.02);osc.onended=()=>{voices.delete(voice);osc.disconnect();gain.disconnect();};
 }
 function phrase(){const notes=[293.66,349.23,440,349.23,261.63,329.63,392,329.63,233.08,293.66,349.23,293.66,220,261.63,329.63,261.63];notes.forEach((note,i)=>tone(note,.7,i*.42,musicGain,.025));}
 function refresh(){
  clearInterval(timer);timer=null;
  if(!context)return;
  for(const voice of voices)if(voice.bus===musicGain){try{voice.osc.stop();}catch{}}
  const play=enabled&&active&&!document.hidden;
  musicGain.gain.setTargetAtTime(play ? .32 : 0,context.currentTime,.05);
  effectsGain.gain.setTargetAtTime(play ? .5 : 0,context.currentTime,.03);
  if(play){phrase();timer=setInterval(phrase,6720);}
 }
 async function toggle(){
  try{
   if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error();context=new Audio();musicGain=context.createGain();effectsGain=context.createGain();musicGain.connect(context.destination);effectsGain.connect(context.destination);}
   if(context.state==='suspended')await context.resume();enabled=!enabled;
   button.textContent=enabled?'♫ Sonido activado':'♫ Activar sonido';button.setAttribute('aria-pressed',String(enabled));refresh();
  }catch{enabled=false;button.textContent='Sonido no disponible';button.setAttribute('aria-pressed','false');}
 }
 function observe(state,snap){
  const robots=state.objects.filter(o=>o.robot).map(o=>({id:o.id,...o.robot}));
  if(previous&&!snap){for(const r of robots){const old=previous.find(o=>o.id===r.id);if(!old)continue;if(r.x!==old.x||r.y!==old.y)tone(140,.09);if(r.cargo>old.cargo){tone(520,.18);tone(780,.18,.08);}if(r.delivered>old.delivered){tone(440,.25);tone(660,.25,.1);}if(r.energy>old.energy)tone(880,.3);}}
  previous=robots;
 }
 function result(success){if(success)[523.25,659.25,783.99].forEach((n,i)=>tone(n,.45,i*.12));else tone(196,.24);}
 function init(){button=document.getElementById('audio-toggle');button.addEventListener('click',toggle);document.addEventListener('visibilitychange',refresh);window.addEventListener('pagehide',()=>{active=false;refresh();});}
 globalThis.AdventureAudio={init,observe,result,setActive(value){active=value;refresh();}};
})();
