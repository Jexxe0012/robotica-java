'use strict';
// Project mode data and rules, shared by proyectos.html and tests/projects.mjs. No DOM access here.
(() => {
 const missionIds=Array.from({length:90},(_,i)=>'m'+String(i+1).padStart(2,'0')),known=new Set(missionIds);
 // missions: where each level's concepts were taught in the adventure (the golden rule).
 const level=(title,activity,missions)=>({title,activity,missions:Object.freeze(missions)});
 const projects=[
  {id:'control',number:1,title:'El control de Miaubit',focus:'Fundamentos de un proyecto',
   summary:'Construye desde cero un control virtual y mueve a Miaubit con tus propios botones.',
   levels:[
    level('Crea el proyecto','Nombra el proyecto, crea la carpeta src y el archivo Boton.java.',['m51']),
    level('El plano del botón','Clase Boton con dirección, color y un constructor que usa this.',['m51','m52','m53','m26']),
    level('Cada botón sabe moverse','pulsar(Robot r) con una condición if y equals() por dirección.',['m26','m41','m48']),
    level('Arma el control','Control implementa Mando con cuatro botones privados.',['m57','m62','m65','m66','m90']),
    level('Diseña y juega','Cambia colores y etiquetas y lleva a Miaubit a la meta con tu control.',['m58','m68'])
   ]},
  {id:'cosecha',number:2,title:'La cosecha de cristales',focus:'Infraestructura y reglas',
   summary:'Convierte tu control en un juego: recoge cristales y gana antes de quedarte sin energía.',
   levels:[
    level('Infraestructura','Crea las carpetas juego y control y los archivos Marcador.java y Juego.java.',['m50','m90']),
    level('Marcador protegido','Puntos privados, sumar(int n) con validación y getPuntos().',['m61','m62','m68']),
    level('Reglas del juego','Juego contiene el robot y el marcador; revisar() recoge y suma puntos.',['m22','m24','m90']),
    level('Energía y meta','Recarga en la estación y termino() indica si alcanzaste la meta.',['m28','m49','m88']),
    level('Partida','El marcador de puntos y energía se dibuja leyendo tus objetos.',['m81','m82'])
   ]},
  {id:'piloto',number:3,title:'Piloto automático',focus:'Arquitectura y polimorfismo',
   summary:'Diseña pilotos intercambiables: Luna patrulla sola mientras Miaubit obedece tu control.',
   levels:[
    level('Arquitectura','Decide clases, contrato y composición en un diagrama antes de programar.',['m70','m90']),
    level('El contrato','La interfaz Piloto define paso(Robot r).',['m65','m66']),
    level('Dos pilotos','Patrulla usa puedeAvanzar(); Directo avanza con while hasta el obstáculo.',['m29','m38','m67']),
    level('La flota','Arreglos con robot, ayudante y un piloto para cada uno.',['m60','m77','m85']),
    level('Patrulla final','En cada turno Miaubit sigue el control y Luna da un paso con su piloto.',['m64','m85','m90'])
   ]}
 ].map(p=>Object.freeze({...p,levels:Object.freeze(p.levels.map(Object.freeze))}));
 // The workshop opens with the 90 real completions; unknown or repeated ids never count.
 function unlockState(completed,dev=false){
  const done=new Set((Array.isArray(completed)?completed:[]).filter(id=>known.has(id))),complete=done.size===missionIds.length;
  const regions=Array.from({length:9},(_,index)=>{const ids=missionIds.slice(index*10,index*10+10);return {index,done:ids.filter(id=>done.has(id)).length,total:ids.length,next:ids.find(id=>!done.has(id))??null};});
  return {done:done.size,total:missionIds.length,missing:missionIds.length-done.size,complete,unlocked:complete||dev,dev:dev&&!complete,next:missionIds.find(id=>!done.has(id))??null,regions};
 }
 // Each project opens after the previous one; finished holds the ids of projects completed in this browser.
 function available(index,unlocked,finished=new Set()){return unlocked&&index>=0&&index<projects.length&&(index===0||finished.has(projects[index-1].id));}
 const isDevHost=hostname=>['127.0.0.1','localhost','[::1]'].includes(hostname);
 globalThis.MiaubitProjects={missionIds:Object.freeze(missionIds),projects:Object.freeze(projects),unlockState,available,isDevHost};
})();
