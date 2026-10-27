import {mkdir,writeFile} from 'node:fs/promises';
import '../web/worlds.js';
import '../web/campaign.js';

// Original pixel tiles and distinct layouts. Run explicitly: never during build.
await mkdir('web/assets/maps',{recursive:true});
await mkdir('web/assets/tiles',{recursive:true});
for(const region of ExpeditionCampaign.regions.slice(1)){
 const [ground,dark,path,stone,water,deep,wood,accent,leaf,light]=region.palette;
 const rect=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="128" viewBox="0 0 160 128" shape-rendering="crispEdges">';
 for(let i=0;i<20;i++){
  svg+=`<g transform="translate(${i%5*32} ${Math.floor(i/5)*32})">`;
  if(i<8||i===12||i===18)svg+=rect(0,0,32,32,[ground,dark,path,path,water,deep,wood,dark][i]??ground);
  if(i<4||i===7||i===18){for(let n=0;n<7;n++)svg+=rect((n*13+i*7)%29,(n*9+i*11)%29,2,1,i<2?leaf:stone);}
  if(i===2||i===3)svg+=`<path d="M3 5h9v4H3m17 6h9v5h-9M5 24h11v4H5" fill="${stone}"/><path d="M3 9h9m8 11h9M5 28h11" stroke="${dark}"/>`;
  if(i===4||i===5)svg+=`<path d="M2 7h9m7 12h12M1 28h13" stroke="${accent}" opacity=".5"/>`;
  if(i===6||i===12)svg+=`<path d="M0 7h32M0 15h32M0 23h32" stroke="${dark}" stroke-width="2"/><path d="M3 0v32m25-32v32" stroke="${stone}" stroke-width="2"/>`;
  if([8,10,11].includes(i)){
   if(region.theme==='ice'||region.theme==='stars')svg+=`<path d="m16 3 10 13-10 14L6 16z" fill="${accent}"/><path d="M16 3v27L10 16z" fill="${light}"/>`;
   else if(region.theme==='desert')svg+=`<path d="M14 29V12h4v17M6 23V12h4v9h4m4-4h5V8h4v13h-9" fill="${leaf}"/>`;
   else svg+=`<path d="M5 27V12h5V6h13v6h4v15z" fill="${dark}"/><path d="M8 22V12h5V9h7v7h4v7z" fill="${leaf}"/><path d="M12 11h8v3h-8" fill="${accent}"/>`;
  }
  if(i===9||i===16)svg+=`<path d="M4 26V14l8-8h11l6 12v8z" fill="${dark}"/><path d="m7 19 7-11h7l5 9H14v3z" fill="${stone}"/>`;
  if(i===13||i===14)svg+=rect(11,13,10,16,dark)+rect(8,8,16,10,stone)+rect(13,5,6,13,accent);
  if(i===15)svg+=`<path d="M3 3h4v27H3m22-27h4v27h-4M0 11h32v4H0m0 7h32v4H0" fill="${wood}"/>`;
  if(i===17)svg+=`<path d="M3 25V15l8-7h10l8 7v10z" fill="${dark}"/><path d="m8 19 8-8 8 8-8 6z" fill="${accent}"/>`;
  if(i===18){if(region.theme==='garden')svg+=rect(7,6,3,4,accent)+rect(21,21,4,3,light);if(region.theme==='ice')svg+=`<path d="M4 7h8m-4-4v8m12 12h8m-4-4v8" stroke="${light}"/>`;if(region.theme==='stars')svg+=`<path d="M6 8h6m-3-3v6m11 13h8m-4-4v8" stroke="${light}"/>`;}
  if(i===19)svg+=`<path d="m16 2 11 14-11 14L5 16z" fill="${accent}"/><path d="M16 5v21" stroke="${light}" stroke-width="2"/>`;
  svg+='</g>';
 }
 svg+='</svg>';
 const width=12,height=9,groundTiles=[],paths=[],scenery=[];
 const inBoard=(x,y)=>x>=2&&x<8&&y>=2&&y<7;
 function terrain(x,y){
  if(inBoard(x,y))return (x+y)%7===0?19:1;
  switch(region.theme){
   case 'ice':return x===9||x===10||y===7&&x>7?5+(x+y)%2:(x*3+y)%5===0?19:1;
   case 'city':return (x===0||x===11)&&y!==4?2:(x+y)%3?3:4;
   case 'ruins':return y===7&&x>4||x===9&&y>4?5:(x+y)%4?1:2;
   case 'garden':return x===9&&y!==4||y===7&&x>1&&x<10?5:(x+y)%3===0?19:1;
   case 'canals':return x===1||x===9||x===10||y===7?5+(x+y)%2:3;
   case 'clouds':return (x===0||x===11||y===8)&&!(y===4||x===5)?6:3+(x+y)%2;
   case 'desert':return (x<2&&y>5)||(x===9&&y===6)?5:(x+y)%6===0?19:1;
   case 'stars':return x===10||y===8?6:(x*3+y)%4===0?19:2;
  }
 }
 function isPath(x,y){
  if(y===4)return true;
  switch(region.theme){
   case 'ice':return y===2&&x>=2&&x<=7||x===7&&y>=2&&y<=6;
   case 'city':return x===4||y===6&&x>1&&x<9;
   case 'ruins':return (x===2||x===7)&&y>=2&&y<=6||y===2&&x>2&&x<7;
   case 'garden':return y===2||y===6||x===4;
   case 'canals':return x===2&&y>1&&y<8||x===7&&y>1&&y<8;
   case 'clouds':return x===5||y===6&&x>2&&x<9;
   case 'desert':return y===6&&x<8||y===2&&x>3&&x<10||x===4&&y>1&&y<7;
   case 'stars':return x===2&&y>=2&&y<=6||x===7&&y>=2&&y<=6||y===6&&x>2&&x<7;
  }
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const base=terrain(x,y);groundTiles.push(base);
  paths.push(isPath(x,y)?(base===5||base===6?13:(x+y)%2?3:4):0);
  const border=y===0||y===8||x===0||x===11;
  scenery.push(border&&!isPath(x,y)&&base!==5&&base!==6?((x+y)%3===0?10:9):0);
 }
 const layer=(id,name,data)=>({id,name,type:'tilelayer',width,height,x:0,y:0,visible:true,opacity:1,data});
 const objects=region.landmarks.map(([type,x,y,scale],index)=>({id:index+1,name:`${type}-${index}`,type,x,y,width:0,height:0,properties:[{name:'scale',type:'float',value:scale}]}));
 objects.push({id:6,name:'baliza',type:'beacon',x:48,y:144,width:0,height:0},{id:7,name:'salida',type:'portal',x:368,y:144,width:0,height:0});
 const map={type:'map',version:'1.10',orientation:'orthogonal',renderorder:'right-down',infinite:false,width,height,tilewidth:32,tileheight:32,nextlayerid:5,nextobjectid:8,
  properties:[{name:'chapter',type:'int',value:region.index},{name:'playfieldX',type:'int',value:2},{name:'playfieldY',type:'int',value:2},{name:'playfieldWidth',type:'int',value:6},{name:'playfieldHeight',type:'int',value:5}],
  tilesets:[{firstgid:1,name:region.id,tilewidth:32,tileheight:32,tilecount:20,columns:5,image:`../tiles/${region.id}.svg`,imagewidth:160,imageheight:128,margin:0,spacing:0}],
  layers:[layer(1,'Suelo',groundTiles),layer(2,'Senderos',paths),layer(3,'Vegetación',scenery),{id:4,name:'Historia',type:'objectgroup',visible:true,opacity:1,x:0,y:0,objects}]};
 await writeFile('web/'+region.tiles,svg+'\n');
 await writeFile('web/'+region.map,JSON.stringify(map,null,2)+'\n');
}
console.log('Generated eight distinct layered chapter maps, original tilesets and Tiled landmark objects.');
