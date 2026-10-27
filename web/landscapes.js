'use strict';
(() => {
 const images=new Map();
 let selected=-1,visible=false,revision=0,warmTimer;
 const $=id=>document.getElementById(id);
 function trim(){for(const [index,record] of images){if(images.size<=3)break;if(index!==selected&&record.ready)images.delete(index);}}
 function prepare(index,priority='high'){
  if(!AtlasWorlds[index])return Promise.resolve(null);
  if(images.has(index)){const record=images.get(index);if(priority==='high')record.image.fetchPriority='high';return record.promise;}
  const image=new Image();image.decoding='async';image.fetchPriority=priority;
  const record={image,ready:false,promise:null};
  record.promise=new Promise((resolve,reject)=>{
   image.onload=async()=>{try{await image.decode();record.ready=true;trim();resolve(image);}catch(error){images.delete(index);reject(error);}};
   image.onerror=()=>{images.delete(index);reject(new Error('Landscape unavailable'));};
  });
  images.set(index,record);image.src=SiteAssets.url(AtlasWorlds[index].image);return record.promise;
 }
 function prefetch(index){
  const connection=navigator.connection;if(connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType))return;
  // One likely destination, rather than downloading every region at startup.
  prepare(index,'low').catch(()=>{});
 }
 async function display(){
  if(!visible||selected<0)return;const index=selected,token=++revision,region=AtlasWorlds[index],stage=$('map-stage');
  stage.dataset.landscape='loading';$('map-image-status').textContent='Preparando paisaje…';$('retry-landscape').hidden=true;
  document.body.style.setProperty('--region-image','none');
  try{
   const image=await prepare(index);
   if(token!==revision||!visible)return;
   image.id='map-landscape';image.className='map-landscape';image.alt=region.alt;image.width=1024;image.height=683;
   const previous=$('map-landscape');if(previous!==image)previous.replaceWith(image);
   document.body.style.setProperty('--region-image',`url("${image.src}")`);stage.dataset.landscape='ready';$('map-image-status').textContent='';
   clearTimeout(warmTimer);warmTimer=setTimeout(()=>{if(visible&&selected===index)prefetch(index+1<AtlasWorlds.length?index+1:index-1);},150);
  }catch{
   if(token!==revision||!visible)return;
   stage.dataset.landscape='error';$('map-image-status').textContent='El paisaje no se pudo cargar.';$('retry-landscape').hidden=false;
  }
 }
 function setRegion(index){if(index===selected)return;selected=index;if(visible)display();}
 function setVisible(value){if(visible===value)return;visible=value;clearTimeout(warmTimer);if(value)display();else revision++;}
 function init(){
  $('retry-landscape').addEventListener('click',display);
  const warm=event=>{const button=event.target.closest('[data-chapter]');if(button)prefetch(Number(button.dataset.chapter));};
  $('chapters').addEventListener('pointerover',warm);$('chapters').addEventListener('focusin',warm);
 }
 globalThis.ChapterLandscapes={init,setRegion,setVisible,prefetch};
})();
