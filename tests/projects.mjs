import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {loadStaticAssets} from '../scripts/static-assets.mjs';
import {sheet} from '../tools/miaubit-arte/cat48.mjs';
import '../web/engine.js';import '../web/lessons.js';import '../web/proyectos/catalogo.js';import '../web/proyectos/espacio.js';import '../web/proyectos/niveles.js';
const {missionIds,projects,unlockState,available,isDevHost}=MiaubitProjects,W=MiaubitWorkshop,Levels=MiaubitLevels;

// The workshop counts exactly the adventure's 90 missions.
assert.deepEqual([...missionIds],JavaCourse.levels.map(m=>m.id));
const all=[...missionIds];

// Opening requires every real completion; unknown and repeated ids never count.
let state=unlockState([]);
assert.equal(state.unlocked,false);assert.equal(state.done,0);assert.equal(state.missing,90);assert.equal(state.next,'m01');
assert.equal(state.regions.length,9);assert(state.regions.every(r=>r.done===0&&r.total===10));
state=unlockState(all);
assert.equal(state.unlocked,true);assert.equal(state.complete,true);assert.equal(state.dev,false);assert.equal(state.next,null);
assert(state.regions.every(r=>r.done===10&&r.next===null));
state=unlockState([...all.slice(0,89),'m91','m00','x',null,'m01','m01']);
assert.equal(state.unlocked,false);assert.equal(state.done,89);assert.equal(state.missing,1);assert.equal(state.next,'m90');assert.equal(state.regions[8].next,'m90');
state=unlockState(['m15','m12','m47','m12']);
assert.deepEqual(state.regions.map(r=>r.done),[0,2,0,0,1,0,0,0,0]);assert.equal(state.regions[1].next,'m11');assert.equal(state.regions[4].next,'m41');
for(const value of [null,undefined,'m01',{completed:all}])assert.equal(unlockState(value).done,0);

// Only the local preview may open the workshop early, and the state says so.
state=unlockState(['m01'],true);
assert.equal(state.unlocked,true);assert.equal(state.dev,true);assert.equal(state.complete,false);assert.equal(state.done,1);
assert.equal(unlockState(all,true).dev,false);
for(const host of ['127.0.0.1','localhost','[::1]'])assert(isDevHost(host),host);
for(const host of ['huerto-java-josue.sandobaljosue16.chatgpt.site','localhost.example.com','127.0.0.2','example.test',''])assert(!isDevHost(host),host);

// Projects open in order, and only once the workshop is open.
assert(!available(0,false));assert(available(0,true));assert(!available(1,true));
assert(available(1,true,new Set(['control'])));assert(!available(2,true,new Set(['control'])));
assert(available(2,true,new Set(['control','cosecha'])));assert(!available(1,false,new Set(['control'])));
assert(!available(3,true,new Set(projects.map(p=>p.id))));assert(!available(-1,true));

// Three projects of five levels; every level cites missions that exist and match the design document.
const known=new Set(JavaCourse.levels.map(m=>m.id)),design=await readFile('docs/modo-proyecto.md','utf8'),rows=design.split(/\r?\n/);
assert.equal(projects.length,3);assert.equal(new Set(projects.map(p=>p.id)).size,3);
for(const [index,project] of projects.entries()){
 assert.equal(project.number,index+1);assert(project.title&&project.focus&&project.summary,project.id);
 assert(design.includes(`### Proyecto ${project.number} · ${project.title}`),project.title+' is documented');
 assert.equal(project.levels.length,5,project.id);
 for(const [i,level] of project.levels.entries()){
  assert(level.title&&level.activity,`${project.id} level ${i+1}`);assert(level.missions.length>0,level.title);
  for(const id of level.missions)assert(known.has(id),`${project.id}: ${id}`);
  const row=rows.find(line=>line.startsWith(`| ${i+1} · ${level.title} |`));
  assert(row,`${level.title} is documented`);assert.deepEqual(row.split('|').at(-2).match(/m\d\d/g),[...level.missions],`${level.title} cites the documented missions`);
 }
}

// Workshop names follow Java conventions and explain how to fix them; operations never mutate their input.
let ws=W.empty();
assert.match(W.projectNameError(''),/nombre/);assert.equal(W.projectNameError('Control de Miaubit'),null);assert(W.projectNameError('a/b'));assert(W.projectNameError('x'.repeat(31)));
assert.match(W.addFolder(ws,'','Src').error,/minúsculas/);assert.match(W.addFolder(ws,'','mi carpeta').error,/espacios/);
let step=W.addFolder(ws,'','src');assert.deepEqual(ws.folders,[]);ws=step.workspace;assert.equal(step.path,'src');assert.match(W.addFolder(ws,'','src').error,/Ya existe/);
assert.match(W.addFile(ws,'src','boton.java').error,/mayúscula: Boton\.java/);assert.match(W.addFile(ws,'src','Boton').error,/Boton\.java/);
assert.match(W.addFile(ws,'src','Boton.txt').error,/\.java/);assert.match(W.addFile(ws,'src','Botón.java').error,/sin acentos/);
assert.match(W.addFile(ws,'src','Robot.java').error,/juego/);assert.match(W.addFile(ws,'src','Mando.java',['Mando']).error,/juego/);
step=W.addFile(ws,'src','Boton.java');ws=step.workspace;assert.equal(step.path,'src/Boton.java');assert.match(ws.files['src/Boton.java'],/Boton/);
assert.match(W.addFile(ws,'','Boton.java').error,/Ya existe/);
let nested=W.addFolder(ws,'src','ui').workspace;nested=W.addFile(nested,'src/ui','Panel.java').workspace;
const pruned=W.remove(nested,'src/ui');assert.deepEqual(pruned.folders,['src']);assert.deepEqual(Object.keys(pruned.files),['src/Boton.java']);assert.equal(Object.keys(nested.files).length,2);

// One class per file, named like the file, with nothing outside it; excluded constructions get the missions' alternative.
const problems=(text,path='src/Boton.java')=>W.analyze(path,text).problems;
assert.match(problems('// nada\n')[0].message,/Declara la clase/);assert.equal(problems('class Boton {\n}\n').length,0);
assert.match(problems('class Panel { }')[0].message,/debe contener la clase Boton/);
assert.match(problems('class Boton { }\nclass Panel { }')[0].message,/una sola clase/);assert.equal(problems('class Boton { }\nclass Panel { }')[0].line,2);
assert.match(problems('class Boton { }\nrobot.este();')[0].message,/sueltas/);
assert.deepEqual(problems('class Boton {\n  int x\n}').map(p=>[p.severity,p.line]),[['error',3]]);
for(const [code,pattern,line] of [['class Boton {\n  void f(int a) {\n    if (a == 0) { } else if (a == 1) { }\n  }\n}',/else if/,3],['class Boton {\n  void f(int a) {\n    switch (a) { }\n  }\n}',/switch/,3],['import java.util.*;\nclass Boton { }',/import/,1],['class Boton { }\npackage juego;',/package/,2]]){
 const warning=problems(code).find(p=>p.severity==='warning');assert(warning,code);assert.match(warning.message,pattern);assert.equal(warning.line,line,code);
}
assert.equal(problems('class Boton {\n  // else if y switch en un comentario\n}').length,0);

// Files join in a stable order; errors point back to their own file and line.
const l1=Levels.get('control',0),l2=Levels.get('control',1),boton=l2.solution.files['src/Boton.java'];
const project={name:'P',folders:['src','src/ui'],files:{'src/ui/Control.java':'class Control {\n  Boton b = new Boton("sur", "rojo");\n  void romper() {\n    Robot r = null;\n    r.este();\n  }\n}','src/Boton.java':boton}};
const joined=W.combine(project,{game:[{path:'Mando.java',text:'interface Mando { void presionar(String b, Robot r); }'}],harness:'Control c = new Control();\nc.romper();'});
assert.deepEqual(joined.starts.map(s=>s.path),['Mando.java','src/Boton.java','src/ui/Control.java','(prueba)']);
for(const start of joined.starts)assert.deepEqual(W.locate(joined.starts,start.from),{path:start.path,line:1,game:start.game,harness:start.harness});
let result=W.run(project,{harness:'Control c = new Control();\nc.romper();'});
assert.equal(result.compiled,true);assert.deepEqual([result.error.path,result.error.line,result.error.harness],['src/ui/Control.java',5,false]);
result=W.run({...project,files:{'src/Boton.java':'class Boton { }'}},{harness:'Boton b = new Boton("x", "y");'});
assert.equal(result.error.harness,true);assert.equal(result.error.code,'Boton b = new Boton("x", "y");');
result=W.run({...project,files:{'src/Boton.java':'class Boton {\n  int x\n}'}},{harness:'Boton b = new Boton();'});
assert.equal(result.compiled,false);assert.equal(result.result,null);
const replay=()=>W.run(project,{harness:'Control c = new Control();'}).result.final;assert.deepEqual(replay(),replay());

// Workspaces saved in the browser are sanitized before use.
const restored=W.restore({name:'x'.repeat(50),folders:['src','../etc','Src',7],files:{'src/Boton.java':'class Boton {}','../x.java':'x','ui/Panel.java':'class Panel {}','src/nota.txt':'x','src/Largo.java':'x'.repeat(20001)}});
assert.equal(restored.name.length,30);assert.deepEqual(restored.folders,['src','ui']);assert.deepEqual(Object.keys(restored.files).sort(),['src/Boton.java','ui/Panel.java']);
for(const bad of [null,'x',{name:1,folders:[],files:{}},{name:'',folders:{},files:{}}])assert.equal(W.restore(bad),null);

// The editor's highlighter escapes the code it colors.
const colored=W.highlight('class A { String s = "<b>"; } // fin');
assert(colored.includes('&lt;b&gt;'));assert(!colored.includes('<b>'));assert.match(colored,/tk-k">class/);assert.match(colored,/tk-c">\/\/ fin/);
assert.equal(W.highlight('a < b && c > d').replace(/<span[^>]*>|<\/span>/g,''),'a &lt; b &amp;&amp; c &gt; d');

// Playable levels: each starts unfinished from the previous level's files, and its solution completes it without warnings.
for(const project of projects){
 let previous=W.empty();
 for(let i=0;i<Levels.count(project.id);i++){
  const level=Levels.get(project.id,i),run=ws=>W.run(ws,{game:level.game??[],harness:Levels.harnessFor(level),initial:level.initial??{}});
  // Play levels are won with the control: their solution is checked after pressing the reference route.
  const solved=ws=>level.play?Object.assign(W.run(ws,{game:level.game??[],harness:Levels.playHarness(level,level.route),initial:level.initial??{}}),{presses:level.route.length}):run(ws);
  assert(level.intro&&level.hints.length&&level.tasks.length,`${project.id} level ${i+1}`);
  assert.equal(Levels.evaluate(level,previous,run(previous)).complete,false,`${project.id} level ${i+1} starts unfinished`);
  assert.equal(Levels.evaluate(level,level.solution,solved(level.solution)).complete,true,`${project.id} level ${i+1} solution`);
  assert.deepEqual(W.problemsOf(level.solution),[],`${project.id} level ${i+1} solution follows the rules`);
  if(level.tasks.some(t=>t.needsRun))assert.equal(Levels.evaluate(level,level.solution).complete,false,'run tasks wait for a run');
  previous=level.solution;
 }
}
assert.equal(Levels.count('control'),5);assert.equal(Levels.get('control',5),null);assert.equal(Levels.count('cosecha'),0);
const noThis={...l2.solution,files:{'src/Boton.java':boton.replace(/this\./g,'')}},missing=Levels.evaluate(l2,noThis,W.run(noThis,{harness:l2.harness}));
assert.equal(missing.complete,false);assert.match(missing.tasks.find(t=>t.explain).explain,/misión 53/);

// Level 3 probes each button from where the previous one left Miaubit, so one mistake does not hide the rest.
const l3=Levels.get('control',2),pulsar=l3.solution.files['src/Boton.java'],withBoton=text=>({...l3.solution,files:{'src/Boton.java':text}});
const run3=ws=>W.run(ws,{harness:l3.harness,initial:l3.initial});
assert.deepEqual(Levels.probe(l3,l3.solution).map(p=>[p.state,p.to]),[['ok',[1,2]],['ok',[1,1]],['ok',[0,1]],['ok',[0,2]]]);
const crossed=withBoton(pulsar.replace('r.norte();','TMP').replace('r.sur();','r.norte();').replace('TMP','r.sur();'));
assert.deepEqual(Levels.probe(l3,crossed).map(p=>p.state),['ok','wrong','ok','wrong']);
const crossedState=Levels.evaluate(l3,crossed,run3(crossed));assert.equal(crossedState.complete,false);assert.match(crossedState.tasks.at(-1).explain,/de \(1, 2\) a \(1, 3\).*"norte"/);
const wall=withBoton(pulsar.replace('{ r.oeste(); }','{ r.oeste(); r.oeste(); }')),wallRun=run3(wall);
assert.deepEqual(Levels.probe(l3,wall).map(p=>p.state),['ok','ok','error','skipped']);
assert.equal(W.blocked(wallRun,wall),2);assert.equal(wallRun.error.path,'src/Boton.java');
const noMove=withBoton(pulsar.replace(/r\.\w+\(\); /g,''));assert.match(Levels.evaluate(l3,noMove,run3(noMove)).tasks.at(-1).explain,/no movió a Miaubit.*misión 26/);
assert.match(Levels.evaluate(l3,withBoton(pulsar.replace(/direccion\.equals\(("\w+")\)/g,'direccion == $1')),run3(withBoton(pulsar.replace(/direccion\.equals\(("\w+")\)/g,'direccion == $1')))).tasks.at(-1).explain,/equals/);

// The stage animates the visual frames of a run and knows which way a blocked robot was heading.
assert.deepEqual(W.frames(run3(l3.solution).result).map(f=>f.robots.map(r=>[r.x,r.y]).flat()),[[0,2],[1,2],[1,1],[0,1],[0,2]]);
assert.deepEqual(W.frames(null),[]);assert.equal(W.blocked(run3(l3.solution),l3.solution),null);
const paso={name:'x',folders:[],files:{'Paso.java':'class Paso {\n  void dar(Robot r) {\n    r.girarIzquierda();\n    r.avanzar();\n    r.avanzar();\n    r.avanzar();\n  }\n}'}},ahead=W.run(paso,{harness:'Paso p = new Paso();\np.dar(robot);'});
assert.deepEqual([ahead.error.path,ahead.error.line],['Paso.java',6]);assert.equal(W.blocked(ahead,paso),3);
assert.equal(W.blocked(W.run(project,{harness:'Control c = new Control();\nc.romper();'}),project),null);

// Level 4: the game's Mando contract is read-only, reserved and joined first; the arrows are probed through it.
const l4=Levels.get('control',3),l5=Levels.get('control',4),control4=l4.solution.files['src/Control.java'],control5=l5.solution.files['src/Control.java'];
const withControl=(level,text)=>({...level.solution,files:{...level.solution.files,'src/Control.java':text}});
assert.deepEqual(l4.game.map(f=>f.path),['juego/Mando.java']);assert.match(l4.game[0].text,/interface Mando \{\n  void presionar\(String boton, Robot r\);/);
assert.match(W.fileNameError(l4.solution,'Mando.java',['Mando']),/juego/);assert.equal(W.combine(l4.solution,{game:l4.game}).starts[0].path,'juego/Mando.java');
const explain4=ws=>Levels.evaluate(l4,ws,W.run(ws,{game:l4.game,harness:l4.harness,initial:l4.initial})).tasks.find(t=>t.explain)?.explain;
assert.match(explain4(withControl(l4,control4.replace(' implements Mando',''))),/implements Mando/);
assert.match(explain4(withControl(l4,control4.replace('{ arriba.pulsar(r); }','{ abajo.pulsar(r); }'))),/"arriba".*\(1, 2\) a \(1, 3\)/);
assert.match(explain4(withControl(l4,control4.replace(/\w+\.pulsar\(r\); /g,''))),/no movió/);
assert.equal(Levels.evaluate(l4,withControl(l4,control4.replace(/private /g,''))).tasks[2].done,false);

// The control is drawn from the player's objects: each arrow uses the Boton whose direction matches it.
const setupRun=ws=>W.run(ws,{game:l5.game,harness:Levels.playHarness(l5,[]),initial:l5.initial});
const layout=Levels.padLayout(setupRun(l5.solution));
assert.deepEqual(Object.fromEntries(Object.entries(layout).map(([key,b])=>[key,[b.direccion,b.color,b.known]])),{arriba:['norte','violeta',true],abajo:['sur','azul',true],derecha:['este','dorado',true],izquierda:['oeste','rosa',true]});
const oddLayout=Levels.padLayout(setupRun(withControl(l5,control5.replace('"rosa"','"fucsia"').replace('new Boton("norte", "violeta")','new Boton("sur", "violeta")'))));
assert.equal(oddLayout.arriba?.direccion,undefined);assert.equal(oddLayout.izquierda.known,false);assert.equal(oddLayout.izquierda.hex,'#5d6b66');
assert.equal(Levels.padLayout(null),null);assert.equal(Levels.playHarness(l5,['arriba','salto']),l5.setup+'\nmando.presionar("arriba", robot);');

// A play session replays every press from the start; energy 20 limits it, and the replay is deterministic.
const playRun=(presses,initial={chargers:[]})=>W.run(l5.solution,{game:l5.game,harness:Levels.playHarness(l5,presses),initial});
const twenty=Array.from({length:20},(_,i)=>i%2?'izquierda':'derecha');
assert.equal(playRun(twenty).error,null);assert(playRun(twenty).result.trace.length<1200);assert.match(playRun([...twenty,'derecha']).error.message,/energía/);
const short=W.frames(playRun(['derecha','arriba']).result),long=W.frames(playRun(['derecha','arriba','arriba']).result);assert.deepEqual(long.slice(0,short.length),short);
assert(Levels.reached(playRun(l5.route,l5.initial),l5));assert(!Levels.reached(playRun(l5.route.slice(0,-1),l5.initial),l5));
const rock=playRun(['derecha','derecha'],l5.initial);assert.match(rock.error.message,/obstáculo/);assert.equal(W.blocked(rock,l5.solution),0);

// Level 5 explains the counter and the design in the terms of its missions.
const explain5=ws=>Levels.evaluate(l5,ws,W.run(ws,{game:l5.game,harness:l5.setup,initial:l5.initial})).tasks.filter(t=>t.explain).map(t=>t.explain);
assert.match(explain5(withControl(l5,control5.replace('    pulsaciones++;\n','')))[0],/devolvió 0/);
assert(explain5(withControl(l5,control5.replace('  public int getPulsaciones() {\n    return pulsaciones;\n  }\n',''))).some(e=>/public int getPulsaciones/.test(e)));
assert(explain5(withControl(l5,control5.replace('"azul"','"fucsia"'))).some(e=>/"fucsia"/.test(e)));
assert(explain5(withControl(l5,control5.replace('"azul"','"violeta"').replace('"rosa"','"violeta"'))).some(e=>/2 colores/.test(e)));
assert.equal(Levels.harnessFor(l5),l5.setup);assert.equal(Levels.harnessFor(l4),l4.harness);assert.equal(Levels.harnessFor(l1),'');
const notPlayed=Levels.evaluate(l5,l5.solution,W.run(l5.solution,{game:l5.game,harness:Levels.harnessFor(l5),initial:l5.initial}));
assert.deepEqual(notPlayed.tasks.map(t=>t.done),[true,true,true,false]);assert.match(notPlayed.tasks[3].explain,/estrella/);

// The project mode walk sheet is exactly what the versioned generator draws: 192 × 192, four rows of four 48 px frames.
const walk=await readFile('web/proyectos/assets/miaubit-camina.png');
assert(walk.equals(sheet().pix.png()),'miaubit-camina.png matches tools/miaubit-arte');assert.deepEqual([walk.readUInt32BE(16),walk.readUInt32BE(20)],[192,192]);
assert((await readFile('web/proyectos/escena.js','utf8')).includes("'proyectos/assets/miaubit-camina.png'"));

// Browser progress is sanitized; a project is finished only with all its levels.
const progress=Levels.restore({projects:{control:{workspace:l1.solution,level:9,done:[1,1,0,7,'x']},piloto:{workspace:null},otro:{workspace:l1.solution}}});
assert.deepEqual(Object.keys(progress.projects),['control']);assert.deepEqual(progress.projects.control.done,[0,1]);assert.equal(progress.projects.control.level,4);
assert.deepEqual([...Levels.finished(progress)],[]);assert.deepEqual(Levels.restore(null),{version:1,projects:{}});
assert.deepEqual([...Levels.finished(Levels.restore({projects:{control:{workspace:l1.solution,level:4,done:[0,1,2,3,4]}}}))],['control']);

// The page loads every file of the mode; the adventure only gains one link to it.
const page=await readFile('web/proyectos.html','utf8'),home=await readFile('web/index.html','utf8');
for(const file of (await readdir('web/proyectos')).filter(name=>/\.(css|js)$/.test(name)))assert(page.includes(`"proyectos/${file}"`),file+' is referenced by proyectos.html');
for(const dependency of ['assets.js','worlds.js','engine.js'])assert(page.includes(`"${dependency}"`),dependency);
assert(page.includes('src="assets/atlas-crt.png"'));
assert.equal(home.match(/href="proyectos\.html"/g)?.length,1);

// The Worker packages the page with versioned URLs and the right MIME types.
const {assets,version}=await loadStaticAssets(),packaged=assets['/proyectos.html'];
assert.equal(packaged?.type,'text/html; charset=utf-8');assert(packaged.body.includes(`data-asset-version="${version}"`));
for(const match of packaged.body.matchAll(/(?:src|href)="([^"#]+)"/g))if(!match[1].startsWith('data:'))assert(match[1].endsWith('?v='+version),match[1]+' versioned in proyectos.html');
for(const key of ['/proyectos/catalogo.js','/proyectos/pagina.js'])assert.equal(assets[key]?.type,'text/javascript; charset=utf-8',key);
assert.equal(assets['/proyectos/proyectos.css']?.type,'text/css; charset=utf-8');assert.equal(assets['/proyectos/assets/miaubit-camina.png']?.type,'image/png');assert.equal(assets['/phaser.js']?.type,'text/javascript; charset=utf-8');
assert(assets['/proyectos/proyectos.css'].body.includes(`url('../assets/fonts/pixelify-sans.ttf?v=${version}')`));
assert(assets['/index.html'].body.includes(`href="proyectos.html?v=${version}"`));

console.log('PASS: project mode catalog, 90-mission unlock, local-only early access, ordered projects, documented levels, workshop files and errors, playable levels, stage frames and probes, generated walk sheet and versioned page.');
