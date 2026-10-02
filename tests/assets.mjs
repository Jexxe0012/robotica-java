import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../dist/server/index.js';

// Test the packaged Worker, including binary bytes and HTTP semantics.
for(const [url,file,type] of [
 ['/', 'web/index.html', 'text/html'],
 ['/journey.js', 'web/journey.js', 'text/javascript'],
 ['/assets/atlas.png', 'web/assets/atlas.png', 'image/png'],
 ['/assets/world.png', 'web/assets/world.png', 'image/png']
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
assert.equal((await worker.fetch(new Request('https://example.test/assets/atlas.png',{method:'POST'}),{})).status,405);
assert.equal((await worker.fetch(new Request('https://example.test/api/progress'),{})).status,401);
console.log('PASS: packaged pixel assets, HTML/JS, MIME types, HEAD, missing files and API authentication.');
