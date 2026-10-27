import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import '../web/worlds.js';
import '../web/lessons.js';
import '../web/campaign.js';
const campaign=globalThis.ExpeditionCampaign,layouts=new Set(),tilesets=new Set();
assert.equal(campaign.regions.length,9);
assert.deepEqual(campaign.regions.flatMap(r=>r.ids),JavaCourse.levels.map(m=>m.id),'Every real mission has a chapter story');
for(const region of campaign.regions){
 const map=JSON.parse(await readFile('web/'+region.map,'utf8')),tiles=map.tilesets[0];
 const p=Object.fromEntries(map.properties.map(p=>[p.name,p.value]));
 assert.equal(map.orientation,'orthogonal');assert.equal(tiles.name,region.id);
 assert.deepEqual([p.playfieldWidth,p.playfieldHeight],[6,5]);
 assert.deepEqual([p.playfieldX,p.playfieldY],[region.playfield.x,region.playfield.y]);
 assert(p.playfieldX+p.playfieldWidth<=map.width&&p.playfieldY+p.playfieldHeight<=map.height);
 const layers=map.layers.filter(l=>l.type==='tilelayer');assert.equal(layers.length,3);
 for(const l of layers){assert.equal(l.data.length,map.width*map.height);assert(l.data.every(n=>Number.isInteger(n)&&n>=0&&n<=tiles.tilecount));}
 for(let y=p.playfieldY;y<p.playfieldY+5;y++)for(let x=p.playfieldX;x<p.playfieldX+6;x++){
  assert(![5,6].includes(layers[0].data[y*map.width+x]),region.id+' has no decorative water/cliff under logical cells');
  assert.equal(layers[2].data[y*map.width+x],0,region.id+' has no decorative obstacles inside logical cells');
 }
 const svg=await readFile('web/'+region.tiles,'utf8');assert.match(svg,/shape-rendering="crispEdges"/);
 tilesets.add(createHash('sha256').update(svg).digest('hex'));layouts.add(JSON.stringify(layers.map(l=>l.data)));
 const unrelated=campaign.regions.filter(r=>r!==region).flatMap(r=>r.ids);
 assert.equal(campaign.derive(region.index,unrelated).count,0,'Other chapters never light this one');
 const last=region.ids.at(-1),partial=campaign.derive(region.index,[last,last,...unrelated,'unknown']);
 assert.equal(partial.count,1);assert.equal(partial.complete,false);assert.match(campaign.reward(last,[last]),/pendientes/);
 assert.equal(campaign.derive(region.index,[region.ids[1]]).beacon,true);
 assert.equal(campaign.derive(region.index,[region.ids[5]]).trail,true);
 assert.equal(campaign.derive(region.index,region.ids).complete,true);
 assert(campaign.reward(last,region.ids).includes(region.finish));
 for(const id of region.ids){assert(campaign.mission(id)?.story);assert(campaign.reward(id,[]));assert.equal(campaign.forMission(id).index,JavaCourse.levels.find(m=>m.id===id).chapter);}
}
assert.equal(layouts.size,9,'Nine distinct tile arrangements, not recolored copies');
assert.equal(tilesets.size,9,'Nine themed tilesets');
assert.equal(campaign.mission('m00'),null);assert.equal(campaign.reward('m91',[]),'');assert.equal(campaign.chapter(9),null);
assert(!campaign.reward('m90',campaign.regions[8].ids).includes('undefined'));
console.log('PASS: nine distinct playable maps, 90 narrative beats, isolated chapter progress and complete-only regional restoration.');
