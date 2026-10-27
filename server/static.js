export function staticAsset(request,url,assets,version){
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{allow:'GET, HEAD'}});
 const key=url.pathname==='/'?'/index.html':url.pathname,asset=Object.hasOwn(assets,key)?assets[key]:null;
 if(!asset)return new Response('Not found',{status:404});
 const immutable=key!=='/index.html'&&url.searchParams.get('v')===version;
 const headers={'content-type':asset.type,'cache-control':immutable?'private, max-age=31536000, immutable':'no-cache',etag:asset.etag,'x-content-type-options':'nosniff','referrer-policy':'same-origin'};
 const matches=request.headers.get('if-none-match')?.split(',').some(tag=>tag.trim()==='*'||tag.trim().replace(/^W\//,'')===asset.etag);
 if(matches)return new Response(null,{status:304,headers});
 if(request.method==='HEAD')return new Response(null,{headers});
 // Decode an image once per Worker instance, rather than on every request.
 if(asset.binary&&typeof asset.body==='string')asset.body=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
 return new Response(asset.body,{headers});
}
