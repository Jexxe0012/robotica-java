import assert from 'node:assert/strict';
import '../web/lessons.js';
import '../web/worlds.js';
import '../web/achievements.js';
const model=MiaubitAchievements,ids=JavaCourse.levels.map(m=>m.id),badge=(state,id)=>state.achievements.find(a=>a.id===id);
assert.equal(model.catalog.length,22);assert.equal(new Set(model.catalog.map(a=>a.id)).size,22);
assert.equal(model.evaluate([]).unlocked,0);
const first=model.evaluate(['m01','m01','m00','m91','invalid']);assert.equal(first.total,1);assert.equal(first.unlocked,1);assert.equal(badge(first,'first-spark').unlocked,true);
assert.equal(badge(model.evaluate(ids.slice(0,4)),'steady-steps').unlocked,false);assert.equal(badge(model.evaluate(ids.slice(0,5)),'steady-steps').unlocked,true);
assert.equal(badge(model.evaluate(ids.slice(0,44)),'halfway').unlocked,false);assert.equal(badge(model.evaluate(ids.slice(0,45)),'halfway').unlocked,true);
for(let chapter=0;chapter<9;chapter++){
 const own=JavaCourse.levels.filter(m=>m.chapter===chapter).map(m=>m.id),other=ids.filter(id=>!own.includes(id)),id='region-'+AtlasWorlds[chapter].id;
 assert.equal(badge(model.evaluate(other),id).current,0);assert.equal(badge(model.evaluate(own.slice(1)),id).unlocked,false);assert.equal(badge(model.evaluate(own),id).unlocked,true);
}
for(const mode of ['predict','order','fix','write']){
 const own=JavaCourse.levels.filter(m=>m.mode===mode).slice(0,5).map(m=>m.id);
 assert.equal(badge(model.evaluate(own.slice(0,4)),'skill-'+mode).unlocked,false);assert.equal(badge(model.evaluate(own),'skill-'+mode).unlocked,true);
}
const varied=['predict','order','fix','write','project'].map(mode=>JavaCourse.levels.find(m=>m.mode===mode).id);
assert.equal(badge(model.evaluate(varied),'all-ways').unlocked,true);assert.equal(badge(model.evaluate(varied.slice(0,4)),'all-ways').unlocked,false);
const projects=JavaCourse.levels.filter(m=>m.mode==='project').slice(0,3).map(m=>m.id);
assert.equal(badge(model.evaluate(projects.slice(0,2)),'project-builder').unlocked,false);assert.equal(badge(model.evaluate(projects),'project-builder').unlocked,true);
const poo=JavaCourse.levels.filter(m=>m.chapter===5||m.chapter===6).map(m=>m.id);
assert.equal(badge(model.evaluate(poo.slice(1)),'object-architect').unlocked,false);assert.equal(badge(model.evaluate(poo),'object-architect').unlocked,true);
assert.equal(badge(model.evaluate(['m90']),'final-delivery').unlocked,true);assert.equal(badge(model.evaluate(['m90']),'miaubit-legend').unlocked,false);
const all=model.evaluate(ids);assert.equal(all.unlocked,22);assert.equal(all.regions,9);assert(all.achievements.every(a=>a.current===a.target));
assert.deepEqual(model.evaluate(new Set(ids)),model.evaluate([...ids,...ids]),'Duplicates never award extra progress');
assert.equal(model.nextMission([],null).id,'m01');assert.equal(model.nextMission(['m01'],'m01').id,'m02');assert.equal(model.nextMission(['m01'],'m51').id,'m51');assert.equal(model.nextMission(ids,'m90').id,'m90');
console.log('PASS: 22 achievements, real completion thresholds, isolated chapters, five challenge types, POO, retroactive progress and safe resume.');
