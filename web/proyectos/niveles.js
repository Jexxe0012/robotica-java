'use strict';
// Playable levels. Each task is checked against the workspace or, when needsRun is set, against the last run.
// Levels are cumulative: a level starts with the files the previous one left.
(() => {
 const W=MiaubitWorkshop,{projects}=MiaubitProjects;
 const task=(text,check,options={})=>Object.freeze({text,check,needsRun:false,...options});
 function classIn(ws,path,name){
  const text=ws.files[path];if(text===undefined)return null;
  try{return new RobotJava.Parser(text).parse().find(node=>node.kind==='class'&&node.name===name)??null;}catch{return null;}
 }
 const hasField=(c,name,type)=>!!c?.fields.some(f=>f.name===name&&f.type===type);
 const created=(run,cls)=>run?.compiled&&!run.error?run.result.final.objects.find(o=>o.cls===cls)??null:null;
 const BOTON='src/Boton.java';
 // A probe is one action the game performs at Probar; it passes when Miaubit moves exactly by `move`.
 const press=(name,dir,color,move)=>Object.freeze({label:`Boton("${dir}", "${color}")`,dir,code:`Boton ${name} = new Boton("${dir}", "${color}");\n${name}.pulsar(robot);`,move});
 const tested=level=>({...level,harness:level.probes.map(p=>p.code).join('\n')});
 const at=([x,y])=>`(${x}, ${y})`;
 const BOTON_PLANO='class Boton {\n  String direccion;\n  String color;\n\n  Boton(String direccion, String color) {\n    this.direccion = direccion;\n    this.color = color;\n  }\n';
 const levels={
  control:[
   {intro:'Todo proyecto empieza igual: un nombre, una carpeta para el código y un archivo por cada clase.',
    hints:['Escribe el nombre en la parte de arriba del explorador. Luego pulsa + Carpeta y crea src.','Selecciona la carpeta src, pulsa + Archivo y escribe Boton.java. Dentro escribe la clase vacía: class Boton { }'],
    tasks:[
     task('Ponle nombre al proyecto',ws=>!W.projectNameError(ws.name)),
     task('Crea la carpeta src',ws=>ws.folders.includes('src')),
     task('Crea el archivo Boton.java dentro de src',ws=>BOTON in ws.files),
     task('Declara la clase Boton en su archivo',ws=>!!classIn(ws,BOTON,'Boton')&&!W.analyze(BOTON,ws.files[BOTON]).problems.some(p=>p.severity==='error'))
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:'class Boton {\n}\n'}}},
   {intro:'Un botón recuerda dos datos: hacia dónde mueve a Miaubit y de qué color se dibuja. El constructor los guarda al crearlo.',
    harness:'Boton prueba = new Boton("norte", "violeta");',
    hints:['Dentro de class Boton declara String direccion; y String color; Después escribe el constructor Boton(String direccion, String color) { }','En el constructor, this.direccion = direccion; guarda el parámetro en el atributo del objeto, como en la misión 53. Haz lo mismo con color y pulsa Probar.'],
    tasks:[
     task('Boton tiene los atributos String direccion y String color',ws=>{const c=classIn(ws,BOTON,'Boton');return hasField(c,'direccion','String')&&hasField(c,'color','String');}),
     task('Un constructor recibe la dirección y el color',ws=>!!classIn(ws,BOTON,'Boton')?.methods.some(m=>m.name==='Boton'&&m.params.length===2&&m.params.every(p=>p.type==='String'))),
     task('Usa this para guardar cada parámetro en su atributo',ws=>{const text=W.strip(ws.files[BOTON]??'');return /this\s*\.\s*direccion\s*=/.test(text)&&/this\s*\.\s*color\s*=/.test(text);}),
     task('Al probar, new Boton("norte", "violeta") guarda esos valores',(ws,run)=>{const boton=created(run,'Boton');return boton?.fields.direccion?.text==='norte'&&boton?.fields.color?.text==='violeta';},{needsRun:true,
      explain:(ws,run)=>{const boton=created(run,'Boton');return boton&&Object.values(boton.fields).some(f=>f.text==='null')?'El botón se creó, pero sus atributos quedaron en null. Sin this, direccion = direccion; copia el parámetro sobre sí mismo y el atributo no cambia (misión 53).':null;}})
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:BOTON_PLANO+'}\n'}}},
   tested({intro:'Ahora cada botón mueve a Miaubit. Al pulsar Probar, el juego crea cuatro botones y los pulsa uno tras otro en el escenario.',
    stage:true,initial:{chargers:[],targets:[[1,2],[1,1],[0,1]]},
    probes:[press('derecha','este','dorado',[1,0]),press('arriba','norte','violeta',[0,-1]),press('izquierda','oeste','dorado',[-1,0]),press('abajo','sur','violeta',[0,1])],
    hints:['Dentro de Boton escribe el método void pulsar(Robot r) { }. Recibe el robot como parámetro, igual que en la misión 48.','Dentro de pulsar, una condición por dirección: if (direccion.equals("este")) { r.este(); } Repite con norte, sur y oeste; compara el texto con equals(), como en la misión 26.'],
    tasks:[
     task('Boton tiene el método void pulsar(Robot r)',ws=>!!classIn(ws,BOTON,'Boton')?.methods.some(m=>m.name==='pulsar'&&m.type==='void'&&m.params.length===1&&m.params[0].type==='Robot')),
     task('pulsar compara la dirección con equals()',ws=>{const text=W.strip(ws.files[BOTON]??'');return /direccion\s*\.\s*equals\s*\(/.test(text)||/"[^"]*"\s*\.\s*equals\s*\(\s*direccion\s*\)/.test(text);}),
     task('Cada botón mueve a Miaubit una casilla en su dirección',(ws,run,level)=>!!run?.compiled&&probe(level,ws).every(p=>p.state==='ok'),{needsRun:true,
      explain:(ws,run,level)=>{
       const bad=probe(level,ws).find(p=>p.state!=='ok');if(!bad)return null;
       if(bad.state==='error')return `Al pulsar ${bad.label}, el programa se detuvo: ${bad.message}`;
       if(at(bad.from)===at(bad.to))return `${bad.label} no movió a Miaubit. Compara la dirección con equals(), como en la misión 26, y llama al movimiento de r.`;
       return `${bad.label} llevó a Miaubit de ${at(bad.from)} a ${at(bad.to)}. Revisa qué movimiento llama la condición de "${bad.dir}".`;
      }})
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:BOTON_PLANO+'\n  void pulsar(Robot r) {\n    if (direccion.equals("norte")) { r.norte(); }\n    if (direccion.equals("sur")) { r.sur(); }\n    if (direccion.equals("este")) { r.este(); }\n    if (direccion.equals("oeste")) { r.oeste(); }\n  }\n}\n'}}})
  ]
 };
 // Runs the probes one by one, each from where the previous left Miaubit; stops at the first error.
 function probe(level,ws){
  if(!level.probes)return [];
  const start=RobotJava.execute('',level.initial??{}).initial.objects.find(o=>o.robot).robot;
  let from=[start.x,start.y],stopped=false;
  return level.probes.map((p,i)=>{
   if(stopped)return {...p,state:'skipped'};
   const run=W.run(ws,{harness:level.probes.slice(0,i+1).map(q=>q.code).join('\n'),initial:level.initial??{}});
   if(!run.compiled){stopped=true;return {...p,state:'error',message:'el proyecto tiene errores.',from,to:from};}
   const robot=run.result.final?.objects.find(o=>o.robot?.name==='Miaubit')?.robot,to=robot?[robot.x,robot.y]:from;
   if(run.error){stopped=true;return {...p,state:'error',message:run.error.message,from,to};}
   const result={...p,state:to[0]-from[0]===p.move[0]&&to[1]-from[1]===p.move[1]?'ok':'wrong',from,to};from=to;return result;
  });
 }
 for(const list of Object.values(levels))list.forEach(Object.freeze);
 const get=(projectId,index)=>levels[projectId]?.[index]??null,count=projectId=>levels[projectId]?.length??0;
 // explain(ws, run) may describe why a task still fails, in the terms of the mission that taught it.
 function evaluate(level,ws,run=null){
  const tasks=level.tasks.map(t=>{const done=!!t.check(ws,run,level);return {text:t.text,needsRun:t.needsRun,done,explain:!done&&t.explain&&run?t.explain(ws,run,level)??null:null};});
  return {tasks,complete:tasks.every(t=>t.done)};
 }
 // Browser progress: one entry per project with its workspace, current level and finished levels.
 function restore(raw){
  const saved={};
  for(const project of projects){
   const entry=raw?.projects?.[project.id];if(!entry||typeof entry!=='object')continue;
   const workspace=W.restore(entry.workspace);if(!workspace)continue;
   const total=project.levels.length,done=[...new Set(Array.isArray(entry.done)?entry.done:[])].filter(i=>Number.isInteger(i)&&i>=0&&i<total).sort((a,b)=>a-b);
   const level=Number.isInteger(entry.level)?Math.max(0,Math.min(entry.level,total-1)):0;
   saved[project.id]={workspace,level,done};
  }
  return {version:1,projects:saved};
 }
 const finished=saved=>new Set(projects.filter(p=>saved.projects[p.id]?.done.length===p.levels.length).map(p=>p.id));
 globalThis.MiaubitLevels={get,count,evaluate,probe,restore,finished};
})();
