'use strict';
(() => {
 const levels=JavaCourse.levels,byId=new Map(levels.map(m=>[m.id,m]));
 const count=(id,title,description,target,icon='star')=>({id,title,description,target,icon,group:'journey',value:s=>s.total});
 const catalog=[
  count('first-spark','La primera chispa','Resuelve tu primera misión.',1,'spark'),
  count('steady-steps','Paso firme','Completa 5 misiones diferentes.',5,'route'),
  count('new-horizons','Nuevos horizontes','Completa 25 misiones diferentes.',25,'compass'),
  count('halfway','A mitad del viaje','Completa 45 de las 90 misiones.',45,'flag'),
  count('miaubit-legend','La leyenda de Miaubit','Resuelve las 90 misiones de la expedición.',levels.length,'crown'),
  ...[
   ['predict','Ojo de explorador','Acierta la predicción en 5 misiones.','eye'],
   ['order','Cada pieza en su lugar','Resuelve 5 retos de ordenar instrucciones.','route'],
   ['fix','Cazador de errores','Corrige 5 programas de las misiones.','bug'],
   ['write','De tu puño y código','Resuelve 5 retos de programar.','code']
  ].map(([mode,title,description,icon])=>({id:'skill-'+mode,title,description,target:5,icon,group:'skills',value:s=>s.modes[mode]??0})),
  {id:'all-ways',title:'Una mente versátil',description:'Resuelve al menos un reto de cada tipo: predecir, ordenar, corregir, programar y proyecto.',target:5,icon:'book',group:'skills',value:s=>Object.values(s.modes).filter(n=>n>0).length},
  {id:'project-builder',title:'De la idea al mundo',description:'Completa 3 misiones de proyecto.',target:3,icon:'parcel',group:'skills',value:s=>s.modes.project??0},
  {id:'object-architect',title:'Arquitecto de objetos',description:'Completa las 20 misiones de POO: Objetos y Diseño.',target:20,icon:'cube',group:'skills',value:s=>s.chapters[5]+s.chapters[6]},
  ...[
   ['Guardián del Alba','tree'],['Memoria de cristal','crystal'],['Las puertas se abren','key'],['Voz del Santuario','leaf'],['Jardinero del crepúsculo','flower'],['Mensajero de los canales','parcel'],['Defensor del Bastión','shield'],['Guía de la caravana','compass'],['Bajo las Pléyades','moon']
  ].map(([title,icon],index)=>({id:'region-'+AtlasWorlds[index].id,title,description:`Resuelve las 10 misiones de ${AtlasWorlds[index].title}.`,target:10,icon,group:'regions',chapter:index,value:s=>s.chapters[index]})),
  {id:'final-delivery',title:'La última entrega',description:'Resuelve la misión 90: Central de reparto.',target:1,icon:'flag',group:'journey',value:s=>s.done.has('m90')?1:0}
 ].map(Object.freeze);
 function evaluate(completed){
  const done=new Set([...completed].filter(id=>byId.has(id))),chapters=JavaCourse.chapters.map(()=>0),modes={predict:0,order:0,fix:0,write:0,project:0};
  for(const id of done){const m=byId.get(id);chapters[m.chapter]++;modes[m.mode]++;}
  const state={done,total:done.size,chapters,modes};
  const achievements=catalog.map(def=>{const value=def.value(state);return {id:def.id,title:def.title,description:def.description,target:def.target,current:Math.min(def.target,value),unlocked:value>=def.target,icon:def.icon,group:def.group,chapter:def.chapter};});
  return {total:done.size,chapters,achievements,unlocked:achievements.filter(a=>a.unlocked).length,regions:chapters.filter(n=>n===10).length};
 }
 function nextMission(completed,lastMission){const done=new Set(completed),last=byId.get(lastMission);return last&&!done.has(last.id)?last:levels.find(m=>!done.has(m.id))??levels.at(-1);}
 globalThis.MiaubitAchievements={catalog:Object.freeze(catalog),evaluate,nextMission};
})();
