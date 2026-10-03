import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import '../web/worlds.js';
import worker from '../dist/server/index.js';

const regions=globalThis.AtlasWorlds;
assert.equal(regions.length,9,'Nine chapter regions');
assert.equal(new Set(regions.map(r=>r.image)).size,9,'Each chapter has its own image');
assert.equal(new Set(regions.map(r=>JSON.stringify(r.points))).size,9,'Each chapter has its own route');
const hashes=new Set();
for(const region of regions){
 assert.equal(region.points.length,10,region.id+' has ten mission nodes');
 assert.equal(new Set(region.points.map(p=>p.join(','))).size,10,region.id+' nodes are distinct');
 for(const [x,y] of region.points)assert(x>=10&&x<=90&&y>=28&&y<=86,region.id+' route fits the map');
 const bytes=await readFile('web/'+region.image);
 assert.equal(bytes.toString('ascii',0,4),'RIFF',region.id+' WebP container');
 assert.equal(bytes.toString('ascii',8,12),'WEBP',region.id+' WebP format');
 hashes.add(createHash('sha256').update(bytes).digest('hex'));
}
assert.equal(hashes.size,9,'Nine distinct landscapes, not renamed copies');
// Test the packaged Worker, including binary bytes and HTTP semantics.
for(const [url,file,type] of [
 ['/', 'web/index.html', 'text/html'],
 ['/journey.js', 'web/journey.js', 'text/javascript'],
 ['/worlds.js', 'web/worlds.js', 'text/javascript'],
 ['/worlds.css', 'web/worlds.css', 'text/css'],
 ['/robot.css', 'web/robot.css', 'text/css'],
 ['/retro.css', 'web/retro.css', 'text/css'],
 ['/assets/fonts/pixelify-sans.ttf', 'web/assets/fonts/pixelify-sans.ttf', 'font/ttf'],
 ['/assets/fonts/OFL.txt', 'web/assets/fonts/OFL.txt', 'text/plain'],
 ['/assets/atlas-crt.png', 'web/assets/atlas-crt.png', 'image/png'],
 ['/assets/atlas-directions.png', 'web/assets/atlas-directions.png', 'image/png'],
 ...regions.map(r=>['/'+r.image,'web/'+r.image,'image/webp'])
]){
 const response=await worker.fetch(new Request('https://example.test'+url),{});
 assert.equal(response.status,200,url);
 assert(response.headers.get('content-type').startsWith(type),url+' MIME');
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),await readFile(file),url+' bytes');
 const head=await worker.fetch(new Request('https://example.test'+url,{method:'HEAD'}),{});
 assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 assert.equal(head.headers.get('content-type'),response.headers.get('content-type'));
}
for(const path of ['/missing.png','/assets/../../package.json','/constructor','/__proto__']){
 assert.equal((await worker.fetch(new Request('https://example.test'+path),{})).status,404,path);
}
assert.equal((await worker.fetch(new Request('https://example.test/assets/atlas-crt.png',{method:'POST'}),{})).status,405);
assert.equal((await worker.fetch(new Request('https://example.test/api/progress'),{})).status,401);
console.log('PASS: nine unique landscapes and routes; packaged assets, MIME types, HEAD, missing files and API authentication.');
