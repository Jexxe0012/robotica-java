import {mkdir,writeFile} from 'node:fs/promises';
// Original, code-authored pixel tiles. The generated JSON is editable in Tiled.
const colors=['#283f2d','#314b32','#705b3c','#826c46','#244b57','#1c3b48','#85683e','#20362a','#456946','#76806d','#314d37','#426c40','#977a4c','#647365','#708574','#665b43','#526350','#7d7157','#37513e','#6d6896'];
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="128" viewBox="0 0 160 128" shape-rendering="crispEdges">';
for(let i=0;i<20;i++){
 const x=i%5*32,y=Math.floor(i/5)*32;
 svg+=`<g transform="translate(${x} ${y})"><rect width="32" height="32" fill="${colors[i]}"/>`;
 for(let n=0;n<11;n++){const px=(n*13+i*7)%30,py=(n*9+i*11)%30;svg+=`<rect x="${px}" y="${py}" width="2" height="1" fill="${i<4?'#9c9960':'#7ca38b'}" opacity=".22"/>`;}
 if(i===4||i===5)svg+='<path d="M2 7h9m7 12h12M1 28h13" stroke="#6aa2a1" stroke-width="1" opacity=".55"/>';
 if(i===6||i===12)svg+='<path d="M0 7h32M0 15h32M0 23h32" stroke="#483d2c" stroke-width="2"/><path d="M3 0v32m25-32v32" stroke="#bda56d" stroke-width="2"/>';
 if(i===8||i===10||i===11)svg+='<path d="M6 25V12h4V6h14v6h3v15H9" fill="#182f25"/><path d="M8 19v-7h5V7h9v9h4v8H11" fill="#4a7545"/><path d="M12 10h8v3h-8m5 5h7v2h-7" fill="#6c9456"/>';
 if(i===9||i===16)svg+='<path d="M5 25V13l7-7h10l6 10v10H5" fill="#2e4038"/><path d="M7 20v-8l7-5h6l5 9H12v4" fill="#84947b"/>';
 if(i===13||i===14)svg+='<path d="M11 28V15h10v13z" fill="#3e4940"/><path d="M8 17V8h16v9z" fill="#607668"/><path d="M13 5h6v12h-6z" fill="#a4c49b"/>';
 if(i===15)svg+='<path d="M3 3h4v27H3m22-27h4v27h-4M0 11h32v4H0m0 7h32v4H0" fill="#a08b5a"/>';
 if(i===17)svg+='<path d="M3 25v-9l8-8h10l8 8v9z" fill="#354b3e"/><path d="M8 20l8-9 8 9-8 5z" fill="#9aab7f"/>';
 if(i===1||i===18)svg+='<path d="M7 5h2v5H7m15 10h2v5h-2" fill="#527b4c"/><path d="M6 5h4v2H6m15 15h4v2h-4" fill="#bea5cd"/>';
 svg+='</g>';
}
svg+='</svg>';
const width=12,height=9,ground=[],paths=[],scenery=[];
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const water=(x===9||x===10);ground.push(water?(x+y)%2?5:6:(x+y*3)%7===0?19:1);
 paths.push((y===4&&!water)||(x>=2&&x<8&&y>=2&&y<7)?((x+y)%3?3:4):0);
 scenery.push((y===0||y===8||x===0&&y!==4)&&!water?((x+y)%3===0?10:9):0);
}
paths[4*width+9]=13;paths[4*width+10]=13;
const layer=(id,name,data)=>({id,name,type:'tilelayer',width,height,x:0,y:0,visible:true,opacity:1,data});
const map={type:'map',version:'1.10',orientation:'orthogonal',renderorder:'right-down',infinite:false,width,height,tilewidth:32,tileheight:32,nextlayerid:5,nextobjectid:4,
 properties:[{name:'playfieldX',type:'int',value:2},{name:'playfieldY',type:'int',value:2},{name:'playfieldWidth',type:'int',value:6},{name:'playfieldHeight',type:'int',value:5}],
 tilesets:[{firstgid:1,name:'alba',tilewidth:32,tileheight:32,tilecount:20,columns:5,image:'../tiles/alba.svg',imagewidth:160,imageheight:128,margin:0,spacing:0}],
 layers:[layer(1,'Suelo',ground),layer(2,'Senderos',paths),layer(3,'Vegetación',scenery),{id:4,name:'Historia',type:'objectgroup',visible:true,opacity:1,x:0,y:0,objects:[
  {id:1,name:'baliza',type:'beacon',x:32,y:128,width:32,height:32,properties:[{name:'mission',type:'string',value:'m02'}]},
  {id:2,name:'puente',type:'bridge',x:288,y:128,width:64,height:32},
  {id:3,name:'portal',type:'portal',x:352,y:128,width:32,height:32}]}]};
await mkdir('web/assets/tiles',{recursive:true});
await writeFile('web/assets/tiles/alba.svg',svg);
await writeFile('web/assets/maps/alba-village.json',JSON.stringify(map,null,2)+'\n');
console.log('Generated original tileset and layered Tiled map for the Alba chapter.');
