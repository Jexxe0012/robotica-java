import {readFile,writeFile,mkdir,rm,readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.'), output=path.resolve(root,'dist');
if(path.relative(root,output)!=='dist')throw new Error('Unexpected build directory');
await rm(output,{recursive:true,force:true});await mkdir(path.join(output,'server'),{recursive:true});await mkdir(path.join(output,'.openai'),{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const assets={};
async function collect(directory,prefix=''){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const filename=path.join(directory,entry.name),key=prefix+'/'+entry.name;
  if(entry.isDirectory()){await collect(filename,key);continue;}
  const type=types[path.extname(entry.name)];if(!entry.isFile()||!type)continue;
  const binary=type.startsWith('image/')||type.startsWith('font/'),data=await readFile(filename);
  assets[key]={body:data.toString(binary?'base64':'utf8'),type,binary};
 }
}
await collect('web');
const api=await readFile('server/api.js','utf8');
const worker=`${api}\nconst ASSETS=${JSON.stringify(assets)};\nconst IDS=new Set(Array.from({length:90},(_,i)=>'m'+String(i+1).padStart(2,'0')));\nexport default {async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/api/progress')return progressAPI(request,env,IDS);if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});const key=url.pathname==='/'?'/index.html':url.pathname;const asset=Object.hasOwn(ASSETS,key)?ASSETS[key]:undefined;if(asset===undefined)return new Response('Not found',{status:404});const body=request.method==='HEAD'?null:asset.binary?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):asset.body;return new Response(body,{headers:{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'same-origin'}});}};\n`;
await writeFile(path.join(output,'server/index.js'),worker);await copyFile('.openai/hosting.json',path.join(output,'.openai/hosting.json'));
console.log('Built Robótica Java: Worker, assets and progress API.');
