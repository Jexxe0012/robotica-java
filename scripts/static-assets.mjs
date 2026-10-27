import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
export const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};

export function versionReferences(text,key,version,keys){
 const resolve=value=>{
  if(/^(?:[a-z]+:|\/\/|#)/i.test(value))return value;
  const target=path.posix.resolve(path.posix.dirname(key),value);
  return keys.has(target)?value+'?v='+version:value;
 };
 if(key.endsWith('.html'))return text.replace('<html lang="es">',`<html lang="es" data-asset-version="${version}">`).replace(/\b(src|href)=(['"])([^'"]+)\2/g,(_,attribute,quote,value)=>attribute+'='+quote+resolve(value)+quote);
 if(key.endsWith('.css'))return text.replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(_,quote,value)=>'url('+quote+resolve(value)+quote+')');
 return text;
}
export async function loadStaticAssets(){
 const raw=new Map();
 async function collect(directory,prefix=''){
  for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
   const filename=path.join(directory,entry.name),key=prefix+'/'+entry.name;
   if(entry.isDirectory()){await collect(filename,key);continue;}
   const type=types[path.extname(entry.name)];if(entry.isFile()&&type)raw.set(key,{data:await readFile(filename),type});
  }
 }
 await collect('web');
 raw.set('/phaser.js',{data:await readFile('node_modules/phaser/dist/phaser.min.js'),type:types['.js']});
 const hash=createHash('sha256');for(const [key,{data}] of raw){hash.update(key);hash.update(data);}
 const version=hash.digest('hex').slice(0,16),keys=new Set(raw.keys()),assets={};
 for(const [key,{data,type}] of raw){
  const binary=type.startsWith('image/')||type.startsWith('font/');
  const body=binary?data.toString('base64'):versionReferences(data.toString('utf8'),key,version,keys);
  const bytes=binary?data:Buffer.from(body);
  assets[key]={body,type,binary,etag:'"'+createHash('sha256').update(bytes).digest('hex').slice(0,32)+'"'};
 }
 return {assets,version};
}
