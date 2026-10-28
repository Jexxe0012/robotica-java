import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {loadStaticAssets} from '../scripts/static-assets.mjs';
import '../web/engine.js';import '../web/lessons.js';import '../web/proyectos/catalogo.js';
const {missionIds,projects,unlockState,available,isDevHost}=MiaubitProjects;

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

// The page loads every file of the mode; the adventure only gains one link to it.
const page=await readFile('web/proyectos.html','utf8'),home=await readFile('web/index.html','utf8');
for(const file of (await readdir('web/proyectos')).filter(name=>/\.(css|js)$/.test(name)))assert(page.includes(`"proyectos/${file}"`),file+' is referenced by proyectos.html');
for(const dependency of ['assets.js','worlds.js'])assert(page.includes(`"${dependency}"`),dependency);
assert(page.includes('src="assets/atlas-crt.png"'));
assert.equal(home.match(/href="proyectos\.html"/g)?.length,1);

// The Worker packages the page with versioned URLs and the right MIME types.
const {assets,version}=await loadStaticAssets(),packaged=assets['/proyectos.html'];
assert.equal(packaged?.type,'text/html; charset=utf-8');assert(packaged.body.includes(`data-asset-version="${version}"`));
for(const match of packaged.body.matchAll(/(?:src|href)="([^"#]+)"/g))if(!match[1].startsWith('data:'))assert(match[1].endsWith('?v='+version),match[1]+' versioned in proyectos.html');
for(const key of ['/proyectos/catalogo.js','/proyectos/pagina.js'])assert.equal(assets[key]?.type,'text/javascript; charset=utf-8',key);
assert.equal(assets['/proyectos/proyectos.css']?.type,'text/css; charset=utf-8');
assert(assets['/proyectos/proyectos.css'].body.includes(`url('../assets/fonts/pixelify-sans.ttf?v=${version}')`));
assert(assets['/index.html'].body.includes(`href="proyectos.html?v=${version}"`));

console.log('PASS: project mode catalog, 90-mission unlock, local-only early access, ordered projects, documented levels and versioned page.');
