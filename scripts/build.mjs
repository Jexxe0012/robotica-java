import {readFile,writeFile,mkdir,rm,readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.'), output=path.resolve(root,'dist');
if(path.relative(root,output)!=='dist')throw new Error('Unexpected build directory');
await rm(output,{recursive:true,force:true});await mkdir(path.join(output,'server'),{recursive:true});await mkdir(path.join(output,'.openai'),{recursive:true});
const assets={};for(const filename of await readdir('web')){if(!/\.(html|css|js)$/.test(filename))continue;assets['/'+filename]=await readFile(path.join('web',filename),'utf8');}
const api=await readFile('server/api.js','utf8');
const worker=`${api}\nconst ASSETS=${JSON.stringify(assets)};\nconst IDS=new Set(Array.from({length:90},(_,i)=>'m'+String(i+1).padStart(2,'0')));\nexport default {async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/api/progress')return progressAPI(request,env,IDS);if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});const key=url.pathname==='/'?'/index.html':url.pathname;const body=ASSETS[key];if(body===undefined)return new Response('Not found',{status:404});const type=key.endsWith('.css')?'text/css':key.endsWith('.js')?'text/javascript':'text/html';return new Response(request.method==='HEAD'?null:body,{headers:{'content-type':type+'; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'same-origin'}});}};\n`;
await writeFile(path.join(output,'server/index.js'),worker);await copyFile('.openai/hosting.json',path.join(output,'.openai/hosting.json'));
console.log('Built Robótica Java: Worker, assets and progress API.');
