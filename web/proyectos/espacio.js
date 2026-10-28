'use strict';
// Workshop model, without DOM: a project's folders and files, the Java file rules, and running the files
// with the adventure interpreter exactly as it is (RobotJava.execute). Shared by taller.js and tests/projects.mjs.
(() => {
 const {Parser,execute}=RobotJava;
 // The golden rule: constructions no mission teaches are pointed out with the alternative the missions do teach.
 const EXCLUDED=[
  [/\belse\s+if\b/,'else if no aparece en las misiones: escribe condiciones if separadas.'],
  [/\bswitch\s*\(/,'switch no aparece en las misiones: usa condiciones if.'],
  [/^\s*import\b/m,'Las misiones no usan import: todo lo que necesitas ya está disponible.'],
  [/^\s*package\b/m,'Las carpetas del taller ordenan el proyecto; no necesitas package.']
 ];
 const KEYWORDS=new Set(['class','interface','implements','extends','new','return','if','else','for','while','break','continue','private','public','static','this','super','true','false','null']);
 const TYPES=new Set(['void','int','double','boolean','String']);
 const LIMITS={files:30,folders:20,text:20000};
 const basename=path=>path.slice(path.lastIndexOf('/')+1),dirname=path=>path.includes('/')?path.slice(0,path.lastIndexOf('/')):'';
 const join=(folder,name)=>folder?folder+'/'+name:name;
 const empty=()=>({name:'',folders:[],files:{}});
 const clone=ws=>({name:ws.name,folders:[...ws.folders],files:{...ws.files}});
 // Comments are blanked out character by character so line numbers stay the same.
 const strip=text=>text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,match=>match.replace(/[^\n]/g,' '));
 const lineAt=(text,index)=>text.slice(0,index).split('\n').length;
 function projectNameError(name){
  const value=name.trim();
  if(!value)return 'Escribe un nombre para el proyecto.';
  if(value.length>30)return 'Usa como máximo 30 caracteres.';
  if(!/^[\p{L}\d][\p{L}\d -]*$/u.test(value))return 'Usa letras, números, espacios o guiones.';
  return null;
 }
 function folderNameError(ws,parent,name){
  if(!name)return 'Escribe el nombre de la carpeta.';
  if(/\s/.test(name))return 'Los nombres de carpeta no llevan espacios.';
  if(!/^[a-z][a-z0-9]*$/.test(name))return 'Usa minúsculas sin acentos y números, empezando por una letra: por ejemplo src.';
  if(name.length>20)return 'Usa como máximo 20 caracteres.';
  if(ws.folders.includes(join(parent,name)))return `Ya existe la carpeta ${join(parent,name)}.`;
  if(ws.folders.length>=LIMITS.folders)return 'El proyecto ya tiene demasiadas carpetas.';
  return null;
 }
 function fileNameError(ws,name,reserved=[]){
  if(!name)return 'Escribe el nombre del archivo.';
  if(/\s/.test(name))return 'Los nombres de archivo no llevan espacios.';
  if(!name.endsWith('.java'))return name.includes('.')?'Los archivos de Java terminan en .java.':`Agrega la extensión de Java: ${name}.java`;
  const base=name.slice(0,-5);
  if(!base)return 'Escribe el nombre de la clase antes de .java.';
  if(/^[a-z]/.test(base))return `En Java las clases empiezan con mayúscula: ${base[0].toUpperCase()+base.slice(1)}.java`;
  if(!/^[A-Z][A-Za-z0-9]*$/.test(base))return 'Usa letras sin acentos y números, empezando con mayúscula: por ejemplo Boton.java.';
  if(base.length>30)return 'Usa como máximo 30 caracteres.';
  if(base==='Robot'||reserved.includes(base))return `${base} ya existe: lo proporciona el juego.`;
  if(Object.keys(ws.files).some(path=>basename(path)===name))return `Ya existe ${name}: cada clase tiene un solo archivo en el proyecto.`;
  if(Object.keys(ws.files).length>=LIMITS.files)return 'El proyecto ya tiene demasiados archivos.';
  return null;
 }
 function addFolder(ws,parent,name){
  const error=folderNameError(ws,parent,name);if(error)return {error};
  const next=clone(ws),path=join(parent,name);next.folders.push(path);next.folders.sort();return {workspace:next,path};
 }
 function addFile(ws,folder,name,reserved=[]){
  const error=fileNameError(ws,name,reserved);if(error)return {error};
  const next=clone(ws),path=join(folder,name);next.files[path]=`// Escribe aquí la clase ${name.slice(0,-5)}.\n`;return {workspace:next,path};
 }
 function remove(ws,path){
  const next=clone(ws),inside=p=>p===path||p.startsWith(path+'/');
  next.folders=next.folders.filter(folder=>!inside(folder));for(const file of Object.keys(next.files))if(inside(file))delete next.files[file];
  return next;
 }
 // A Java file holds exactly one class or interface, named like the file, and nothing outside it.
 function analyze(path,text){
  const problems=[],base=basename(path).slice(0,-5);let ast=null;
  try{ast=new Parser(text).parse();}catch(error){problems.push({path,line:error.line??1,message:error.message,severity:'error'});}
  if(ast){
   const classes=ast.filter(node=>node.kind==='class'),loose=ast.find(node=>node.kind!=='class');
   if(loose)problems.push({path,line:loose.line,message:`Las instrucciones no pueden quedar sueltas: en ${base}.java solo va la clase ${base}.`,severity:'error'});
   else if(!classes.length)problems.push({path,line:1,message:`Declara la clase en su archivo: class ${base} { }`,severity:'error'});
   else{
    if(classes[0].name!==base)problems.push({path,line:classes[0].line,message:`El archivo ${base}.java debe contener la clase ${base}, no ${classes[0].name}.`,severity:'error'});
    if(classes.length>1)problems.push({path,line:classes[1].line,message:`Cada archivo contiene una sola clase: mueve ${classes[1].name} a ${classes[1].name}.java.`,severity:'error'});
   }
  }
  const plain=strip(text);
  for(const [pattern,message] of EXCLUDED){const match=pattern.exec(plain);if(match)problems.push({path,line:lineAt(plain,match.index+match[0].search(/\S/)),message,severity:'warning'});}
  return {ast,problems};
 }
 const problemsOf=ws=>Object.keys(ws.files).sort().flatMap(path=>analyze(path,ws.files[path]).problems);
 // Game files go first, then the player's files by path, then the test the game runs.
 function combine(ws,{game=[],harness=''}={}){
  const parts=[...game.map(file=>({...file,game:true})),...Object.keys(ws.files).sort().map(path=>({path,text:ws.files[path]}))];
  if(harness)parts.push({path:'(prueba)',text:harness,harness:true});
  const starts=[],chunks=[];let line=1;
  for(const part of parts){starts.push({path:part.path,from:line,game:!!part.game,harness:!!part.harness});chunks.push(part.text);line+=part.text.split('\n').length;}
  return {source:chunks.join('\n'),starts};
 }
 function locate(starts,line){const part=starts.filter(start=>start.from<=line).at(-1)??starts[0];return {path:part.path,line:line-part.from+1,game:part.game,harness:part.harness};}
 // Like compiling and then running: any file error stops the run before the interpreter starts.
 function run(ws,{game=[],harness='',initial={}}={}){
  const problems=problemsOf(ws);
  if(problems.some(p=>p.severity==='error'))return {compiled:false,problems,result:null,error:null};
  const {source,starts}=combine(ws,{game,harness}),result=execute(source,initial);
  const error=result.error?{...locate(starts,result.error.line),message:result.error.message}:null;
  if(error?.harness)error.code=harness.split('\n')[error.line-1]?.trim()??'';
  return {compiled:true,problems,result,error};
 }
 // Saved workspaces come from the browser; anything unexpected is dropped instead of trusted.
 function restore(raw){
  if(!raw||typeof raw!=='object'||typeof raw.name!=='string'||!Array.isArray(raw.folders)||!raw.files||typeof raw.files!=='object')return null;
  const folder=/^[a-z][a-z0-9]{0,19}(\/[a-z][a-z0-9]{0,19})*$/,file=/^([a-z][a-z0-9]{0,19}\/)*[A-Z][A-Za-z0-9]{0,29}\.java$/;
  const ws={name:raw.name.slice(0,30),folders:[...new Set(raw.folders.filter(f=>typeof f==='string'&&folder.test(f)))].slice(0,LIMITS.folders),files:{}};
  for(const [path,text] of Object.entries(raw.files).slice(0,LIMITS.files)){
   if(!file.test(path)||typeof text!=='string'||text.length>LIMITS.text)continue;
   ws.files[path]=text;
   for(let dir=dirname(path);dir&&!ws.folders.includes(dir);dir=dirname(dir))ws.folders.push(dir);
  }
  ws.folders.sort();return ws;
 }
 function highlight(text){
  const escape=value=>value.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
  const span=(kind,value)=>`<span class="tk-${kind}">${escape(value)}</span>`;
  return text.replace(/(\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"?)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b|([&<>])/g,(match,comment,string,number,word,special)=>{
   if(comment)return span('c',comment);if(string)return span('s',string);if(number)return span('n',number);if(special)return escape(special);
   return KEYWORDS.has(word)?span('k',word):TYPES.has(word)||/^[A-Z]/.test(word)?span('t',word):word;
  });
 }
 globalThis.MiaubitWorkshop={empty,clone,basename,dirname,join,strip,projectNameError,folderNameError,fileNameError,addFolder,addFile,remove,analyze,problemsOf,combine,locate,run,restore,highlight};
})();
