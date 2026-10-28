import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import '../web/worlds.js';
import '../web/campaign.js';
import worker,{ASSET_VERSION} from '../dist/server/index.js';
import {loadStaticAssets} from '../scripts/static-assets.mjs';
const {assets:expectedAssets,version:expectedVersion}=await loadStaticAssets();
assert.equal(ASSET_VERSION,expectedVersion,'Build matches the current source');

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
 ['/assets.js','web/assets.js','text/javascript'],
 ['/landscapes.js','web/landscapes.js','text/javascript'],
 ['/journey.js', 'web/journey.js', 'text/javascript'],
 ['/worlds.js', 'web/worlds.js', 'text/javascript'],
 ['/worlds.css', 'web/worlds.css', 'text/css'],
 ['/retro.css', 'web/retro.css', 'text/css'],
 ['/adventure-scene.js', 'web/adventure-scene.js', 'text/javascript'],
 ['/campaign.js', 'web/campaign.js', 'text/javascript'],
 ['/achievements.js','web/achievements.js','text/javascript'],
 ['/game-hub.js','web/game-hub.js','text/javascript'],
 ['/game-hub.css','web/game-hub.css','text/css'],
 ['/adventure-ui.js', 'web/adventure-ui.js', 'text/javascript'],
 ['/adventure-audio.js', 'web/adventure-audio.js', 'text/javascript'],
 ['/adventure.css', 'web/adventure.css', 'text/css'],
 ['/assets/maps/alba-village.json', 'web/assets/maps/alba-village.json', 'application/json'],
 ['/assets/tiles/alba.svg', 'web/assets/tiles/alba.svg', 'image/svg+xml'],
 ...ExpeditionCampaign.regions.slice(1).flatMap(r=>[['/'+r.map,'web/'+r.map,'application/json'],['/'+r.tiles,'web/'+r.tiles,'image/svg+xml']]),
 ['/assets/fonts/pixelify-sans.ttf', 'web/assets/fonts/pixelify-sans.ttf', 'font/ttf'],
 ['/assets/fonts/OFL.txt', 'web/assets/fonts/OFL.txt', 'text/plain'],
 ['/assets/atlas-crt.png', 'web/assets/atlas-crt.png', 'image/png'],
 ['/assets/atlas-directions.png', 'web/assets/atlas-directions.png', 'image/png'],
 ...regions.map(r=>['/'+r.image,'web/'+r.image,'image/webp'])
]){
 const response=await worker.fetch(new Request('https://example.test'+url),{});
 assert.equal(response.status,200,url);
 assert(response.headers.get('content-type').startsWith(type),url+' MIME');
 const source=expectedAssets[url==='/'?'/index.html':url];
 const expected=source.binary?await readFile(file):Buffer.from(source.body);
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected,url+' bytes');
 const head=await worker.fetch(new Request('https://example.test'+url,{method:'HEAD'}),{});
 assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 assert.equal(head.headers.get('content-type'),response.headers.get('content-type'));
}
for(const path of ['/missing.png','/assets/../../package.json','/constructor','/__proto__']){
 assert.equal((await worker.fetch(new Request('https://example.test'+path),{})).status,404,path);
}
assert.equal((await worker.fetch(new Request('https://example.test/assets/atlas-crt.png',{method:'POST'}),{})).status,405);
assert.equal((await worker.fetch(new Request('https://example.test/api/progress'),{})).status,401);

const imagePath='/'+regions[1].image,versioned='https://example.test'+imagePath+'?v='+ASSET_VERSION;
const cached=await worker.fetch(new Request(versioned),{}),etag=cached.headers.get('etag');
assert.equal(cached.headers.get('cache-control'),'private, max-age=31536000, immutable');assert(etag);
assert.deepEqual(Buffer.from(await cached.arrayBuffer()),await readFile('web'+imagePath));
const repeated=await worker.fetch(new Request(versioned),{});assert.deepEqual(Buffer.from(await repeated.arrayBuffer()),await readFile('web'+imagePath),'Repeated binary response stays intact');
for(const method of ['GET','HEAD']){
 const unchanged=await worker.fetch(new Request(versioned,{method,headers:{'if-none-match':'"another", W/'+etag}}),{});
 assert.equal(unchanged.status,304);assert.equal((await unchanged.arrayBuffer()).byteLength,0);
}
assert.equal((await worker.fetch(new Request('https://example.test'+imagePath+'?v=older'),{})).headers.get('cache-control'),'no-cache','Old URLs cannot cache a new deployment forever');
assert.equal((await worker.fetch(new Request('https://example.test/?v='+ASSET_VERSION),{})).headers.get('cache-control'),'no-cache','HTML always revalidates');
assert.equal((await worker.fetch(new Request('https://example.test/api/progress'),{})).headers.get('cache-control'),'no-store','Progress is never cached');
const builtHTML=await (await worker.fetch(new Request('https://example.test/'),{})).text();
assert(builtHTML.includes(`data-asset-version="${ASSET_VERSION}"`));
for(const match of builtHTML.matchAll(/(?:src|href)="([^"#]+)"/g))if(!match[1].startsWith('data:'))assert(match[1].includes('?v='+ASSET_VERSION),match[1]+' versioned in HTML');

// Runtime files must have an actual entry point, not just exist in web/.
const html=await readFile('web/index.html','utf8'),runtime=await readdir('web');
for(const file of runtime.filter(name=>/\.(css|js)$/.test(name)))assert(html.includes(`"${file}"`),file+' is referenced by the page');
for(const removed of ['chapter-one.js','phaser-world.js','robot.css']){
 assert(!runtime.includes(removed),removed+' stays removed');
 assert.equal((await worker.fetch(new Request('https://example.test/'+removed),{})).status,404);
}
const usedAssets=new Set(['assets/PHASER-LICENSE.txt','assets/fonts/OFL.txt',...regions.map(r=>r.image),...ExpeditionCampaign.regions.flatMap(r=>[r.map,r.tiles])]);
const texts=[html,...await Promise.all(runtime.filter(name=>/\.(css|js)$/.test(name)).map(name=>readFile('web/'+name,'utf8')))];
for(const text of texts)for(const match of text.matchAll(/assets\/[\w./-]+\.(?:png|webp|ttf|txt|svg)/g))usedAssets.add(match[0]);
async function inspect(directory,prefix='assets'){
 for(const entry of await readdir(directory,{withFileTypes:true})){const name=prefix+'/'+entry.name;if(entry.isDirectory())await inspect(directory+'/'+entry.name,name);else assert(usedAssets.has(name),name+' is used by the game or required attribution');}
}
await inspect('web/assets');
console.log('PASS: nine unique landscapes; packaged bytes/MIME/HEAD; private versioned cache, ETag/304, deployment invalidation, API isolation and no orphan runtime files.');
