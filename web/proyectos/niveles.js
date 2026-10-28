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
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:'class Boton {\n  String direccion;\n  String color;\n\n  Boton(String direccion, String color) {\n    this.direccion = direccion;\n    this.color = color;\n  }\n}\n'}}}
  ]
 };
 for(const list of Object.values(levels))list.forEach(Object.freeze);
 const get=(projectId,index)=>levels[projectId]?.[index]??null,count=projectId=>levels[projectId]?.length??0;
 // explain(ws, run) may describe why a task still fails, in the terms of the mission that taught it.
 function evaluate(level,ws,run=null){
  const tasks=level.tasks.map(t=>{const done=!!t.check(ws,run);return {text:t.text,needsRun:t.needsRun,done,explain:!done&&t.explain?t.explain(ws,run)??null:null};});
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
 globalThis.MiaubitLevels={get,count,evaluate,restore,finished};
})();
