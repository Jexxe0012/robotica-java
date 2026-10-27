import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../web/chapter-one.js';
const chapter=globalThis.AlbaChapter,map=JSON.parse(await readFile('web/'+chapter.map,'utf8'));
assert.equal(map.orientation,'orthogonal');assert.equal(map.layers.filter(l=>l.type==='tilelayer').length,3);
const tiles=map.tilesets[0];
for(const layer of map.layers.filter(l=>l.type==='tilelayer')){assert.equal(layer.data.length,map.width*map.height);assert(layer.data.every(id=>Number.isInteger(id)&&id>=0&&id<=tiles.tilecount));}
const p=Object.fromEntries(map.properties.map(p=>[p.name,p.value]));
assert.equal(p.playfieldWidth,6);assert.equal(p.playfieldHeight,5);
assert(p.playfieldX+p.playfieldWidth<=map.width&&p.playfieldY+p.playfieldHeight<=map.height);
assert.equal(chapter.derive([]).bridge,false);assert.equal(chapter.derive(['m10']).bridge,false);
assert.equal(chapter.derive(['m02','m02','m90']).count,1);assert.equal(chapter.derive(['m02']).beacon,true);
assert.equal(chapter.derive(['m06']).trail,true);assert.equal(chapter.derive(chapter.ids).bridge,true);
for(const id of chapter.ids){assert(chapter.mission(id)?.story);assert(chapter.reward(id,[]));}
assert.match(chapter.reward('m10',['m10']),/pendientes/);assert.match(chapter.reward('m10',chapter.ids),/puente del Alba/);
assert.equal(chapter.mission('m51'),null);assert.equal(chapter.reward('m51',[]),'');
assert.match(await readFile('web/'+chapter.tiles,'utf8'),/shape-rendering="crispEdges"/);
console.log('PASS: layered Tiled map, tile bounds, ten story beats and progress derived only from completed missions.');
