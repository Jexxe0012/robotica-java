'use strict';
// Workshop screen: explorer, editor, run and objectives. Each project's workspace is saved in this browser.
(() => {
 const W=MiaubitWorkshop,L=MiaubitLevels,{projects}=MiaubitProjects,$=id=>document.getElementById(id);
 const KEY='miaubit-proyectos-v1',LINE=22,reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let saved=load(),project=null,entry=null,level=null,levelIndex=0,run=null,openFiles=[],current=null,folder='',creating=null;
 let hintIndex=0,doneTasks=new Set(),pendingDelete=null,resetArmed=false,escapeArmed=false,saveTimer,checkTimer,resetTimer;
 let runId=0,replay=null,session=null;
 const ARROWS={arriba:'▲',abajo:'▼',derecha:'▶',izquierda:'◀'},KEYS={ArrowUp:'arriba',ArrowDown:'abajo',ArrowRight:'derecha',ArrowLeft:'izquierda'};
 const TOWARD={este:'al este',oeste:'al oeste',norte:'al norte',sur:'al sur'},at=([x,y])=>`(${x}, ${y})`;
 const pad=n=>String(n).padStart(2,'0'),node=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
 const files=()=>Object.keys(entry.workspace.files).sort();
 // Game files (like the Mando interface) are shown and opened read-only; they are never part of the workspace.
 const gameFiles=()=>level?.game??[],isGame=path=>gameFiles().some(f=>f.path===path);
 const textOf=path=>isGame(path)?gameFiles().find(f=>f.path===path).text:entry.workspace.files[path];
 function load(){try{return L.restore(JSON.parse(localStorage.getItem(KEY)??'null'));}catch{return L.restore(null);}}
 function persist(now=false){
  clearTimeout(saveTimer);
  const write=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved));$('saved').textContent='Guardado en este navegador.';}catch{$('saved').textContent='Este navegador no permite guardar: tu avance se perderá al cerrar la página.';}};
  if(now)write();else saveTimer=setTimeout(write,400);
 }
 function say(text,tone='info'){const bubble=$('assistant');bubble.textContent=text;bubble.dataset.tone=tone;bubble.classList.remove('talk');void bubble.offsetWidth;bubble.classList.add('talk');}
 // The interpreter reports a missing ';' on the next token, so point at the previous line too.
 const friendly=message=>message.includes('Se esperaba «;»')?message+' Revisa también el final de la línea anterior.':message;
 function setLevel(index){
  levelIndex=index;level=L.get(project.id,index);run=null;hintIndex=0;pendingDelete=null;
  $('run-status').textContent='';delete $('run-status').dataset.tone;
  doneTasks=new Set(L.evaluate(level,entry.workspace).tasks.filter(t=>t.done).map(t=>t.text));
  $('hint').textContent='Pedir una pista';say(level.intro);
  openFiles=openFiles.filter(f=>textOf(f)!==undefined);if(current&&textOf(current)===undefined)current=openFiles[0]??null;
  prepareStage();
 }
 // The stage shows the level's board and, after Probar, Miaubit acting out the run.
 function prepareStage(){
  $('stage').hidden=!level.stage;replay=null;$('stage-replay').disabled=true;session=null;
  if(!level.stage)return;
  $('probes-panel').hidden=!level.probes;$('pad-panel').hidden=!level.pad;$('hud-panel').hidden=!level.hud;MiaubitStage.setLook(level.look);
  renderProbes(null);renderPad(null);renderHud(null);padInfo('Pulsa Probar para encender tu control.');fitStage();
  const frame=W.frames({initial:RobotJava.execute('',level.initial??{}).initial,trace:[]})[0],loading=$('stage-loading');
  loading.hidden=false;loading.textContent='Preparando el escenario…';
  MiaubitStage.mount($('stage-canvas')).then(()=>{MiaubitStage.show(frame);loading.hidden=true;describe(frame);}).catch(()=>{loading.textContent='No se pudo cargar el escenario. Revisa tu conexión y recarga la página.';});
 }
 function fitStage(){MiaubitStage.setZoom($('stage').clientWidth>=MiaubitStage.size.width*2+300?2:1);}
 function describe(frame){const robot=frame?.robots[0];$('stage-canvas').setAttribute('aria-label',robot?`Escenario de pruebas: ${robot.name} en ${at([robot.x,robot.y])}.`:'Escenario de pruebas.');}
 function renderProbes(results){
  $('probes').replaceChildren(...(level.probes??[]).map((p,i)=>{
   const result=results?.[i],state=result?.state??'pending',item=node('li');item.dataset.state=state;
   const detail=state==='pending'?`Debe mover a Miaubit una casilla ${TOWARD[p.dir]}.`:state==='ok'?`Movió a Miaubit de ${at(result.from)} a ${at(result.to)}.`
    :state==='wrong'?`Movió a Miaubit de ${at(result.from)} a ${at(result.to)}; debía ir una casilla ${TOWARD[p.dir]}.`:state==='error'?`Se detuvo: ${result.message}`:'No se llegó a probar.';
   item.append(node('span','probe-mark',{ok:'✓',wrong:'✗',error:'✗',skipped:'·'}[state]??String(i+1)),node('code','',p.call),node('span','probe-detail',detail));
   return item;
  }));
 }
 // The virtual control: each arrow is drawn from the Boton the player's Control holds for that direction.
 function renderPad(layout){
  if(!level?.pad)return;
  for(const key of $('pad').querySelectorAll('.pad-key')){
   const name=key.dataset.key,button=layout?.[name];
   key.disabled=!session||!button;key.style.setProperty('--key',button?.hex??'#24332e');
   key.replaceChildren(node('span','pad-arrow',ARROWS[name]),node('span','pad-label',button?button.color:layout?'sin botón':name));
   key.setAttribute('aria-label',button?`${name}: botón ${button.field}, dirección ${button.direccion}, color ${button.color}`:layout?`${name}: tu control no tiene un botón para esta flecha`:`${name}: control apagado`);
  }
  $('pad-reset').disabled=!session;
 }
 function padInfo(text){$('pad-info').textContent=text;}
 // The scoreboard shows what the player's objects hold; before a run it shows the level's starting values.
 function renderHud(result){
  if(!level?.hud)return;
  const hud=L.hudOf(level,result),show=value=>value===null||value===undefined?'—':String(value);
  const total=(level.initial?.boxes??[]).reduce((sum,box)=>sum+box[2],0),energy=level.initial?.robot?.energy??20;
  const rows=[['Puntos',hud?show(hud.puntos)+(hud.meta!==null?` / ${hud.meta}`:''):'—'],['Energía',show(hud?hud.energia:energy)],['Cristales por recoger',`${show(hud?hud.cristales:total)} de ${total}`]];
  $('hud').replaceChildren(...rows.flatMap(([term,value])=>[node('dt','',term),node('dd','',value)]));
 }
 function counterOf(result){
  const final=result.result.final,control=final.objects.find(o=>o.id===final.vars.mando?.objectId),field=Object.entries(control?.fields??{}).find(([,f])=>f.type==='int');
  return field?` · Tu contador ${field[0]}: ${field[1].text}`:'';
 }
 // A play session replays every press from the start: the interpreter is deterministic, so only the new part is animated.
 function startSession(){
  const base=W.run(entry.workspace,{game:level.game??[],harness:L.playHarness(level,[]),initial:level.initial??{}});
  if(!base.compiled||base.error){session=null;renderPad(null);padInfo(base.error?`Tu control no se pudo crear: ${base.error.message}`:'Corrige los errores y pulsa Probar.');return;}
  const frames=W.frames(base.result);session={presses:[],count:frames.length,first:frames[0],good:frames.at(-1),base,busy:false};
  renderPad(L.padLayout(base));padInfo(`Tu control está encendido: usa las flechas o el teclado.${level.play?' Lleva a Miaubit hasta la estrella.':''}`);
 }
 function stopSession(message){session=null;if(level?.pad){renderPad(null);padInfo(message);}}
 async function pressPad(name){
  const s=session;if(!s||s.busy||!(name in L.PAD))return;
  s.busy=true;s.presses.push(name);
  const result=W.run(entry.workspace,{game:level.game??[],harness:L.playHarness(level,s.presses),initial:level.initial??{}});
  if(!result.compiled){stopSession('Corrige los errores y pulsa Probar para usar el control.');return;}
  const frames=W.frames(result.result),fresh=frames.slice(s.count-1);
  if(result.error){
   s.presses.pop();const dir=W.blocked(result,entry.workspace);
   say(dir!==null?'¡Pum! Ahí hay un borde o una roca: prueba otra flecha.':/energía/.test(result.error.message)?'Miaubit se quedó sin energía: pulsa Reiniciar tablero para empezar otra vez.':`Al presionar "${name}" ocurrió esto: ${result.error.message}`,'error');
   await MiaubitStage.play(fresh,{bump:dir});
   if(session===s){MiaubitStage.show(s.good);s.busy=false;}
   return;
  }
  s.count=frames.length;s.good=frames.at(-1);run=result;run.presses=s.presses.length;
  const goal=!!level.play&&L.won(level,result);
  await MiaubitStage.play(fresh,{success:goal});
  if(session!==s)return;
  s.busy=false;describe(s.good);renderOutput();renderHud(result);padInfo(`Pulsaciones: ${s.presses.length}${counterOf(result)}`);
  renderTasks();
 }
 async function playStage(results){
  const success=results.every(p=>p.state==='ok')&&!run.error;
  replay={frames:W.frames(run.result),bump:W.blocked(run,entry.workspace),success};
  renderProbes(null);$('run').disabled=true;$('stage-replay').disabled=true;
  await MiaubitStage.play(replay.frames,{bump:replay.bump,success});
  $('run').disabled=false;$('stage-replay').disabled=false;renderProbes(results);describe(replay.frames.at(-1));
 }
 function open(projectId){
  const found=projects.find(p=>p.id===projectId);if(!found||!L.count(projectId))return false;
  if(project?.id===projectId&&!$('taller').hidden)return true;
  project=found;entry=saved.projects[found.id]??={workspace:L.startWorkspace(found.id,saved),level:0,done:[]};
  // Continue on the next playable level when the current one is already finished.
  while(entry.done.includes(entry.level)&&L.get(found.id,entry.level+1))entry.level++;
  entry.level=Math.min(entry.level,L.count(found.id)-1);
  openFiles=files().slice(0,1);current=openFiles[0]??null;folder=current?W.dirname(current):'';creating=null;
  setLevel(entry.level);
  $('project-name').value=entry.workspace.name;$('project-name-error').textContent='';$('create-form').hidden=true;$('level-done').hidden=true;$('taller-grid').inert=false;
  $('taller').hidden=false;if(level.stage)fitStage();renderAll();showOutput('problems');$('taller-title').focus();
  return true;
 }
 function close(){if(!project)return;persist(true);runId++;session=null;MiaubitStage.sleep();$('run').disabled=false;$('taller').hidden=true;$('level-done').hidden=true;project=null;document.title='Modo Proyecto · Las aventuras de Miaubit';}
 function renderAll(){renderHeader();renderTree();renderTabs();renderEditor();renderProblems();renderOutput();renderTasks();}
 function renderHeader(){
  const info=project.levels[levelIndex];
  $('taller-kicker').textContent=`PROYECTO ${pad(project.number)} · NIVEL ${levelIndex+1} DE ${project.levels.length}`;
  $('taller-title').textContent=info.title;document.title=`${info.title} · Modo Proyecto`;
  $('taller-pips').replaceChildren(...project.levels.map((item,i)=>{
   const pip=node('li','pip',entry.done.includes(i)?'✓':String(i+1)),ready=!!L.get(project.id,i);
   pip.dataset.state=i===levelIndex?'current':entry.done.includes(i)?'done':ready?'next':'soon';
   pip.title=`Nivel ${i+1}: ${item.title}${ready?'':' · llega pronto'}`;pip.setAttribute('aria-label',pip.title+(entry.done.includes(i)?' · completado':i===levelIndex?' · actual':''));
   return pip;
  }));
  const learned=$('learned');learned.replaceChildren(node('span','missions-label','Aprendido en'));learned.classList.add('missions');
  for(const id of info.missions){const link=node('a','',`m${Number(id.slice(1))}`);link.href='./#'+id;link.setAttribute('aria-label',`Repasar la misión ${Number(id.slice(1))} en la aventura`);learned.append(link);}
 }
 // Explorer: folders first, then files; a folder is where new items are created.
 function renderTree(){
  const ws=entry.workspace,errors=new Set(W.problemsOf(ws).filter(p=>p.severity==='error').map(p=>p.path));
  if(run?.error&&!run.error.harness)errors.add(run.error.path);
  const branch=parent=>{
   const list=node('ul');
   for(const path of ws.folders.filter(f=>W.dirname(f)===parent)){const item=node('li');item.append(row(path,W.basename(path),'folder',false),branch(path));list.append(item);}
   for(const path of files().filter(f=>W.dirname(f)===parent)){const item=node('li');item.append(row(path,W.basename(path),'file',errors.has(path)));list.append(item);}
   return list;
  };
  const root=node('li'),items=[root];root.append(row('',ws.name.trim()||'Proyecto sin nombre','project',false),branch(''));
  if(gameFiles().length){
   const section=node('li','tree-game'),list=node('ul');section.append(node('p','tree-game-title','Archivos del juego · solo lectura'),list);
   for(const file of gameFiles()){const item=node('li');item.append(row(file.path,file.path,'game',false));list.append(item);}
   items.push(section);
  }
  $('tree').replaceChildren(...items);
 }
 function row(path,label,kind,hasError){
  const wrap=node('div','tree-row'),item=node('button','tree-item');item.type='button';item.dataset.kind=kind;
  item.append(node('span','tree-icon'),node('span','tree-label',label));
  if(hasError){const dot=node('span','tree-error');dot.title='Este archivo tiene errores';item.append(dot);item.setAttribute('aria-label',`${label}, tiene errores`);}
  if(kind==='file'||kind==='game'){item.classList.toggle('active',path===current);item.addEventListener('click',()=>openFile(path));if(kind==='game'){item.title='Archivo del juego: puedes leerlo, pero no cambiarlo';item.setAttribute('aria-label',`${label}, archivo del juego de solo lectura`);}}
  else{item.setAttribute('aria-current',String(path===folder));item.title=`Crear dentro de ${kind==='project'?'la raíz del proyecto':path}`;item.addEventListener('click',()=>{folder=path;renderTree();if(creating)updateWhere();});}
  wrap.append(item);
  if(kind==='folder'||kind==='file'){
   const remove=node('button','tree-delete',pendingDelete===path?'¿Borrar?':'✕');remove.type='button';remove.dataset.armed=String(pendingDelete===path);
   remove.setAttribute('aria-label',pendingDelete===path?`Confirmar: borrar ${path}`:`Borrar ${path}`);
   remove.addEventListener('click',()=>{if(pendingDelete!==path){pendingDelete=path;renderTree();wrap.querySelector('.tree-delete')?.focus();return;}deletePath(path);});
   wrap.append(remove);
  }
  return wrap;
 }
 function deletePath(path){
  pendingDelete=null;entry.workspace=W.remove(entry.workspace,path);
  openFiles=openFiles.filter(f=>textOf(f)!==undefined);if(textOf(current)===undefined)current=openFiles.at(-1)??null;
  if(folder===path||folder.startsWith(path+'/'))folder=W.dirname(path);
  say(`Borraste ${path}.`);changed(true);renderTabs();renderEditor();
 }
 function updateWhere(){$('create-where').textContent=`Se creará en: ${folder?folder+'/':'la raíz del proyecto'}`;}
 function startCreate(kind){
  creating=kind;$('create-form').hidden=false;$('create-label').textContent=kind==='folder'?'Nombre de la carpeta':'Nombre del archivo';
  $('create-name').value='';$('create-name').placeholder=kind==='folder'?'src':'Boton.java';$('create-error').textContent='';updateWhere();$('create-name').focus();
 }
 function stopCreate(){creating=null;$('create-form').hidden=true;$('create-error').textContent='';}
 function validateCreate(name){return creating==='folder'?W.folderNameError(entry.workspace,folder,name):W.fileNameError(entry.workspace,name,(level.game??[]).map(f=>W.basename(f.path).slice(0,-5)));}
 function submitCreate(){
  const name=$('create-name').value.trim(),reserved=(level.game??[]).map(f=>W.basename(f.path).slice(0,-5));
  const result=creating==='folder'?W.addFolder(entry.workspace,folder,name):W.addFile(entry.workspace,folder,name,reserved);
  if(result.error){$('create-error').textContent=result.error;say(result.error,'error');$('create-name').focus();return;}
  const kind=creating;entry.workspace=result.workspace;
  if(kind==='folder'){folder=result.path;say(`Carpeta ${result.path} creada. Los archivos nuevos se guardarán dentro.`,'ok');}
  else{say(`Archivo ${result.path} creado. Cada archivo de Java guarda una clase con su mismo nombre.`,'ok');openFile(result.path,false);}
  stopCreate();changed(true);
  $(kind==='file'?'code':'new-file').focus();
 }
 function openFile(path,focus=true){
  if(!openFiles.includes(path))openFiles.push(path);current=path;if(!isGame(path))folder=W.dirname(path);pendingDelete=null;
  renderTabs();renderEditor();renderTree();if(focus)$('code').focus();
 }
 function closeFile(path){openFiles=openFiles.filter(f=>f!==path);if(current===path)current=openFiles.at(-1)??null;renderTabs();renderEditor();renderTree();}
 function renderTabs(){
  $('tabs').replaceChildren(...openFiles.map(path=>{
   const tab=node('div','tab'),select=node('button','',W.basename(path)),shut=node('button','tab-close','✕');
   if(path===current)tab.dataset.active='';if(isGame(path))tab.dataset.game='';select.type=shut.type='button';select.setAttribute('role','tab');select.setAttribute('aria-selected',String(path===current));select.title=path;
   shut.setAttribute('aria-label',`Cerrar ${W.basename(path)}`);select.addEventListener('click',()=>openFile(path));shut.addEventListener('click',()=>closeFile(path));
   tab.append(select,shut);return tab;
  }));
 }
 function renderEditor(){
  const code=$('code'),has=!!current&&textOf(current)!==undefined,game=has&&isGame(current);
  for(const id of ['code','highlight','gutter'])$(id).hidden=!has;$('editor-empty').hidden=has;
  $('editor').dataset.readonly=String(game);code.readOnly=game;
  $('editor-help').textContent=game?'Archivo del juego: puedes leerlo y usarlo, pero no cambiarlo.':'Tab inserta espacios. Pulsa Esc y después Tab para salir del editor.';
  if(!has)return;
  if(code.value!==textOf(current))code.value=textOf(current);
  code.setAttribute('aria-label',`Código de ${current}${game?', archivo del juego de solo lectura':''}`);paint();
 }
 function paint(){
  const code=$('code'),text=code.value,marks=new Map();
  for(const p of isGame(current)?[]:W.analyze(current,text).problems)if(!marks.has(p.line)||p.severity==='error')marks.set(p.line,p.severity);
  if(run?.error?.path===current)marks.set(run.error.line,'error');
  $('highlight').innerHTML=W.highlight(text)+'\n';
  $('gutter').replaceChildren(...text.split('\n').map((_,i)=>{const n=node('li',marks.get(i+1)==='error'?'err':marks.get(i+1)==='warning'?'warn':'',String(i+1));return n;}));
  syncScroll();
 }
 function syncScroll(){const code=$('code');$('highlight').scrollTop=code.scrollTop;$('highlight').scrollLeft=code.scrollLeft;$('gutter').scrollTop=code.scrollTop;}
 function insert(text){const code=$('code');if(!document.execCommand?.('insertText',false,text)){code.setRangeText(text,code.selectionStart,code.selectionEnd,'end');onEdit();}}
 function onEdit(){if(!current||isGame(current))return;entry.workspace.files[current]=$('code').value;paint();changed(true);}
 // Any edit makes the last run stale: tasks that need a run wait for the next Probar.
 function changed(edited=false){
  if(edited){if(run)run=null;$('run-status').textContent='';if(session)stopSession('Cambiaste el código: pulsa Probar para usar el control con la versión nueva.');}
  clearTimeout(checkTimer);checkTimer=setTimeout(()=>{renderTree();renderProblems();renderTasks();if(current)paint();},180);
  persist();
 }
 function goTo(path,line){
  if(textOf(path)===undefined)return;openFile(path,false);
  const code=$('code'),lines=code.value.split('\n'),start=lines.slice(0,line-1).reduce((sum,l)=>sum+l.length+1,0);
  code.focus();code.setSelectionRange(start,start+(lines[line-1]?.length??0));code.scrollTop=Math.max(0,(line-4)*LINE);syncScroll();
 }
 function renderProblems(){
  const problems=W.problemsOf(entry.workspace),items=problems.map(p=>({...p,message:friendly(p.message)}));
  if(run?.error)items.unshift({path:run.error.path,line:run.error.line,severity:'error',message:run.error.harness?`Al probar, el juego ejecutó ${run.error.code} y ocurrió esto: ${run.error.message}`:`Al ejecutar: ${run.error.message}`,harness:run.error.harness});
  const errors=items.filter(p=>p.severity==='error').length,count=$('problem-count');
  count.textContent=String(items.length);if(errors)count.dataset.errors='';else delete count.dataset.errors;
  if(!items.length){$('problems').replaceChildren(node('li','empty',files().length?'Sin problemas. Pulsa Probar para ejecutar tu proyecto.':'Todavía no hay archivos .java en el proyecto.'));return;}
  $('problems').replaceChildren(...items.map(p=>{
   const item=node('li'),button=node('button');item.dataset.severity=p.severity;button.type='button';
   button.append(node('span','where',p.harness?'Prueba del juego':`${p.path}:${p.line}`),node('span','',(p.severity==='warning'?'Aviso · ':'')+p.message));
   if(p.harness)button.disabled=true;else button.addEventListener('click',()=>goTo(p.path,p.line));
   item.append(button);return item;
  }));
 }
 function renderOutput(){
  const final=run?.compiled?run.result.final:null;
  $('console').textContent=!run?'Pulsa Probar para ejecutar tu proyecto.':!final?'No se ejecutó: primero corrige los errores.':final.output.length?final.output.join('\n'):'(La consola no recibió mensajes.)';
  const objects=final?.objects??[];
  if(!objects.length){$('objects').replaceChildren(node('p','muted',run?'No se creó ningún objeto.':'Aquí aparecerán los objetos que cree tu programa.'));return;}
  $('objects').replaceChildren(...objects.map(o=>{
   const card=node('article','object'),list=node('dl');
   if(o.robot){card.dataset.robot='';card.append(node('h3','',`Robot · ${o.robot.name}`));for(const [k,v] of [['posición',`(${o.robot.x}, ${o.robot.y})`],['energía',String(o.robot.energy)]]){list.append(node('dt','',k),node('dd','',v));}}
   else{card.append(node('h3','',`${o.cls} #${o.id}`));const fields=Object.entries(o.fields);if(!fields.length)list.append(node('dt','','sin atributos'),node('dd','',''));for(const [name,field] of fields)list.append(node('dt','',`${field.type} ${name}`),node('dd','',field.type==='String'&&field.text!=='null'?`"${field.text}"`:field.text));}
   card.append(list);return card;
  }));
 }
 function renderTasks(quiet=false){
  const state=L.evaluate(level,entry.workspace,run),fresh=state.tasks.filter(t=>t.done&&!doneTasks.has(t.text));
  $('tasks').replaceChildren(...state.tasks.map(t=>{
   const item=node('li');item.dataset.state=t.done?'done':t.needsRun&&!run?'run':'todo';if(fresh.includes(t)&&!reduced())item.classList.add('just-done');
   const body=node('span','task-text',t.text);if(t.needsRun&&!t.done)body.append(node('span','run-tag','Se comprueba al pulsar Probar'));
   item.append(node('span','check',t.done?'✓':''),body);item.setAttribute('aria-label',`${t.text}: ${t.done?'hecho':'pendiente'}`);return item;
  }));
  doneTasks=new Set(state.tasks.filter(t=>t.done).map(t=>t.text));
  if(fresh.length&&!state.complete&&!quiet)say(`¡Listo! ${fresh.at(-1).text}.`,'ok');
  if(state.complete&&!entry.done.includes(levelIndex)){entry.done.push(levelIndex);entry.done.sort((a,b)=>a-b);persist(true);renderHeader();celebrate();}
  return state;
 }
 async function runCode(){
  const id=++runId;
  run=W.run(entry.workspace,{game:level.game??[],harness:L.harnessFor(level),initial:level.initial??{}});
  const status=$('run-status');
  if(!run.compiled){
   const first=run.problems.find(p=>p.severity==='error');status.textContent='✗ No se pudo ejecutar: corrige los errores marcados.';status.dataset.tone='error';
   say(`${first.path}, línea ${first.line}: ${friendly(first.message)}`,'error');showOutput('problems');
  }else if(run.error){
   status.textContent='✗ El programa se detuvo con un error.';status.dataset.tone='error';showOutput('problems');
   say(run.error.harness?`Al probar, el juego ejecutó ${run.error.code} y ocurrió esto: ${run.error.message}`:`${run.error.path}, línea ${run.error.line}: ${run.error.message}`,'error');
  }else{
   status.textContent='✓ Compiló y se ejecutó sin errores.';status.dataset.tone='ok';
   showOutput(run.result.final.objects.some(o=>!o.robot)?'objects':'console');
  }
  if(!reduced()){const bar=document.querySelector('.run-bar');bar.dataset.flash=run.compiled&&!run.error?'ok':'error';setTimeout(()=>delete bar.dataset.flash,600);}
  renderTree();renderProblems();renderOutput();if(current)paint();
  // Objectives are revealed after Miaubit finishes acting out the run, so the celebration never hides it.
  if(level.stage&&run.compiled){
   if(level.probes){await playStage(L.probe(level,entry.workspace));if(id!==runId||!project)return;}
   else{
    // Levels without probes still act out their run, for example the harvest rules picking up crystals.
    const frames=W.frames(run.result);$('run').disabled=true;
    await MiaubitStage.play(frames,{bump:W.blocked(run,entry.workspace)});
    $('run').disabled=false;if(id!==runId||!project)return;describe(frames.at(-1));
   }
   renderHud(run);
  }
  if(level.pad){if(run.compiled&&!run.error)startSession();else stopSession('Corrige el error y pulsa Probar para encender tu control.');}
  const state=renderTasks(true),pending=state.tasks.find(t=>!t.done&&t.explain)??state.tasks.find(t=>!t.done);
  // A runtime error keeps the interpreter's message unless an objective explains it in mission terms.
  if(run?.compiled&&pending&&(!run.error||pending.explain))say(pending.explain??`Tu programa funciona, pero falta esto: ${pending.text}.`,run.error?'error':'hint');
 }
 function showOutput(name){for(const tab of ['problems','console','objects']){$('tab-'+tab).setAttribute('aria-selected',String(tab===name));$('out-'+tab).hidden=tab!==name;}}
 function celebrate(){
  const next=L.get(project.id,levelIndex+1),total=project.levels.length,dialog=$('level-done');
  $('level-done-kicker').textContent=`PROYECTO ${pad(project.number)} · NIVEL ${levelIndex+1} DE ${total}`;
  $('level-done-title').textContent='¡Nivel completado!';
  const rest=total-levelIndex-1,coming=rest===1?`El nivel ${total} llega`:rest===2?`Los niveles ${total-1} y ${total} llegan`:`Los niveles ${levelIndex+2} a ${total} llegan`;
  $('level-done-text').textContent=next?`Tu código pasa al siguiente nivel: ${project.levels[levelIndex+1].title}.`:rest>0?`Completaste los niveles disponibles. ${coming} en una próxima actualización; tu proyecto queda guardado en este navegador.`
   :`¡Terminaste ${project.title}! ${project.built}${projects[project.number]?` El Proyecto ${project.number+1}, ${projects[project.number].title}, ya está desbloqueado.`:''}`;
  $('level-next').textContent=next?'Siguiente nivel ▶':'Volver a los proyectos';
  const confetti=dialog.querySelector('.confetti');confetti.replaceChildren();
  if(!reduced())for(let i=0;i<28;i++){const bit=node('i');bit.style.left=`${(i*37)%100}%`;bit.style.background=['#ffd95a','#b3a9d8','#6dbb91','#d59b48'][i%4];bit.style.animationDelay=`${(i%7)*60}ms`;confetti.append(bit);}
  dialog.hidden=false;$('taller-grid').inert=true;say('¡Nivel completado!','ok');$('level-next').focus();
 }
 function closeDialog(){$('level-done').hidden=true;$('taller-grid').inert=false;}
 $('level-next').addEventListener('click',()=>{
  closeDialog();
  if(L.get(project.id,levelIndex+1)){entry.level=levelIndex+1;setLevel(entry.level);persist(true);renderAll();showOutput('problems');$('taller-title').focus();}
  else location.hash='';
 });
 $('level-stay').addEventListener('click',()=>{closeDialog();$('run').focus();});
 $('level-done').addEventListener('keydown',e=>{if(e.key==='Escape'){closeDialog();$('run').focus();}});
 $('project-name').addEventListener('input',e=>{entry.workspace.name=e.target.value;const error=e.target.value.trim()?W.projectNameError(e.target.value):null;$('project-name-error').textContent=error??'';changed();});
 $('new-folder').addEventListener('click',()=>startCreate('folder'));
 $('new-file').addEventListener('click',()=>startCreate('file'));
 $('create-cancel').addEventListener('click',stopCreate);
 $('create-form').addEventListener('submit',e=>{e.preventDefault();submitCreate();});
 $('create-name').addEventListener('input',e=>{const name=e.target.value.trim();$('create-error').textContent=name?validateCreate(name)??'':'';});
 $('create-name').addEventListener('keydown',e=>{if(e.key==='Escape')stopCreate();});
 $('reset-project').addEventListener('click',e=>{
  if(!resetArmed){resetArmed=true;e.target.textContent='¿Seguro? Pulsa otra vez para borrar este proyecto';clearTimeout(resetTimer);resetTimer=setTimeout(()=>{resetArmed=false;e.target.textContent='Empezar el proyecto de nuevo';},4000);return;}
  resetArmed=false;e.target.textContent='Empezar el proyecto de nuevo';const id=project.id;delete saved.projects[id];persist(true);project=null;open(id);say('Proyecto reiniciado. Empieza por darle un nombre.');
 });
 $('hint').addEventListener('click',()=>{const hints=level.hints??[];if(!hints.length)return;say(hints[hintIndex%hints.length],'hint');hintIndex++;$('hint').textContent='Otra pista';});
 $('run').addEventListener('click',runCode);
 $('stage-replay').addEventListener('click',async()=>{if(!replay)return;$('stage-replay').disabled=true;await MiaubitStage.play(replay.frames,{bump:replay.bump,success:replay.success});$('stage-replay').disabled=false;});
 addEventListener('resize',()=>{if(project&&level?.stage)fitStage();});
 for(const key of $('pad').querySelectorAll('.pad-key'))key.addEventListener('click',()=>pressPad(key.dataset.key));
 $('pad').addEventListener('keydown',e=>{if(KEYS[e.key]){e.preventDefault();pressPad(KEYS[e.key]);}});
 $('pad-reset').addEventListener('click',()=>{if(!session)return;const first=session.first;startSession();if(session){run=session.base;MiaubitStage.show(first);describe(first);renderOutput();renderHud(run);renderTasks();}});
 for(const tab of ['problems','console','objects'])$('tab-'+tab).addEventListener('click',()=>showOutput(tab));
 const code=$('code');
 code.addEventListener('input',onEdit);
 code.addEventListener('scroll',syncScroll);
 code.addEventListener('keydown',e=>{
  if(e.key==='Escape'){escapeArmed=true;return;}
  if(code.readOnly)return;
  if(e.key==='Tab'&&!e.shiftKey&&!escapeArmed){e.preventDefault();insert('  ');return;}
  if(e.key==='Enter'&&!e.isComposing){
   const before=code.value.slice(0,code.selectionStart),indent=before.slice(before.lastIndexOf('\n')+1).match(/^ */)[0];
   e.preventDefault();insert('\n'+indent+(/\{\s*$/.test(before)?'  ':''));return;
  }
  // A closing brace typed on an indented empty line moves back one level.
  if(e.key==='}'&&code.selectionStart===code.selectionEnd){
   const start=code.selectionStart,line=code.value.slice(code.value.lastIndexOf('\n',start-1)+1,start);
   if(/^ {2,}$/.test(line)){e.preventDefault();code.setSelectionRange(start-2,start);insert('}');return;}
  }
  escapeArmed=false;
 });
 code.addEventListener('blur',()=>{escapeArmed=false;});
 addEventListener('pagehide',()=>{if(project)persist(true);});
 globalThis.MiaubitTaller={open,close,finished:()=>L.finished(saved),progress:id=>saved.projects[id]??null};
})();
