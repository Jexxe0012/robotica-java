'use strict';
(() => {
 const host=document.createElement('div');host.className='scene-surface';host.id='adventure-world';host.hidden=true;host.setAttribute('aria-busy','true');document.getElementById('phaser-world').append(host);
 const TILE=64,OX=128,OY=128,frames=[2,0,3,1];
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let game,scene,latest,mission,region=ExpeditionCampaign.chapter(0),progress=ExpeditionCampaign.derive(0,[]),cameraMode=0;
 const cameraLabels=['Ver mapa completo','Seguir a Miaubit','Área de misión'];
 class AdventureScene extends Phaser.Scene {
  constructor(){super('expedition');this.actors=new Map();this.boxLabels=new Map();this.focused=null;this.terrain=[];}
  preload(){for(const r of ExpeditionCampaign.regions){this.load.tilemapTiledJSON(r.id+'-map',SiteAssets.url(r.map));this.load.image(r.id+'-tiles',SiteAssets.url(r.tiles));}this.load.spritesheet('miaubit',SiteAssets.url('assets/atlas-directions.png'),{frameWidth:627,frameHeight:627});}
  create(){
   this.forest=this.add.graphics().setDepth(-1);this.props=this.add.graphics().setDepth(0);this.items=this.add.graphics().setDepth(2);this.focus=this.add.graphics().setDepth(9);
   this.coordinateText=this.add.text(OX+5,OY+5,'',{fontFamily:'monospace',fontSize:'11px',color:'#f0d394',backgroundColor:'#0b1714',padding:{x:4,y:3}}).setDepth(10);
   const cellStyle={fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#ffe4a0',backgroundColor:'#0b1714',padding:{x:2,y:1}};
   this.cellLabels=Array.from({length:30},(_,i)=>{const x=i%6,y=Math.floor(i/6);return this.add.text(OX+x*TILE+3,OY+y*TILE+3,`(${x},${y})`,cellStyle).setDepth(11).setVisible(false);});
   this.zoneLabel=this.add.text(OX,OY-22,'COORDENADAS (X,Y) · X → · Y ↓',{fontFamily:'Pixelify Sans, monospace',fontSize:'13px',color:'#b2c899',backgroundColor:'#14291e',padding:{x:5,y:3}}).setDepth(1).setVisible(false);
   this.scale.on('resize',()=>this.configureCamera());
   // Phaser polls its parent size; the camera button changes this element's
   // aspect ratio without resizing the window, so refresh before the next paint.
   this.hostObserver=new ResizeObserver(()=>{if(!host.hidden&&this.scale.getParentBounds())this.scale.refresh();});
   this.hostObserver.observe(host);
   this.events.once('shutdown',()=>this.hostObserver.disconnect());
   document.getElementById('show-coordinates').addEventListener('change',()=>this.drawFocus());
   this.input.on('pointermove',p=>{const cell=this.cellAt(p.x,p.y);if(cell&&(cell.x!==this.focused?.x||cell.y!==this.focused?.y)){this.focused=cell;this.drawFocus();}});
   this.input.on('pointerdown',p=>{const cell=this.cellAt(p.x,p.y);if(cell)this.inspect(cell.x,cell.y);else {const point=this.cameras.main.getWorldPoint(p.x,p.y);if(progress.complete&&point.x>700&&Math.abs(point.y-288)<64)this.continueRegion();}});
   const canvas=this.game.canvas;canvas.tabIndex=0;canvas.setAttribute('role','group');
   canvas.addEventListener('pointerleave',()=>{this.focused=null;this.drawFocus();});
   canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;e.preventDefault();this.focused??={x:0,y:0};
    if(e.key==='ArrowLeft')this.focused.x=Math.max(0,this.focused.x-1);if(e.key==='ArrowRight')this.focused.x=Math.min(5,this.focused.x+1);
    if(e.key==='ArrowUp')this.focused.y=Math.max(0,this.focused.y-1);if(e.key==='ArrowDown')this.focused.y=Math.min(4,this.focused.y+1);
    this.drawFocus();if(e.key==='Enter'||e.key===' ')this.inspect(this.focused.x,this.focused.y);
   });
   scene=this;this.changeRegion();if(latest)this.setState(latest,true);this.configureCamera();host.setAttribute('aria-busy','false');
   if(document.body.dataset.view!=='mission'){this.scene.sleep();this.game.loop.sleep();}
  }
  changeRegion(){
   for(const layer of this.terrain)layer.destroy();this.terrain=[];this.map?.destroy();
   this.map=this.make.tilemap({key:region.id+'-map'});const tiles=this.map.addTilesetImage(region.id,region.id+'-tiles');
   this.renderedRegion=region.index;this.worldSignature=null;
   for(const [i,name] of ['Suelo','Senderos','Vegetación'].entries())this.terrain.push(this.map.createLayer(name,tiles,0,0).setScale(2).setDepth(-10+i));
   this.focused=null;this.drawLandscape();this.drawProps();this.drawFocus();
   this.game.canvas.setAttribute('aria-label',`Escenario de ${region.title}. Flechas para explorar el área de programación; Intro para inspeccionar.`);
   host.dataset.region=region.id;this.configureCamera();
  }
  continueRegion(){location.hash=region.index===8?'#map-9':'#map-'+(region.index+2);}
  configureCamera(){
   if(!this.cameras)return;document.getElementById('world').dataset.camera=cameraMode===1?'overview':'focused';const camera=this.cameras.main,w=this.scale.width,h=this.scale.height;
   camera.stopFollow();camera.setBounds(0,0,768,576);camera.setBackgroundColor(region.palette[1]);
   const overview=Math.min(w/768,h/576),focused=Math.min(w/(6.9*TILE),h/(5.9*TILE));
   camera.setZoom(cameraMode===1?overview:focused);camera.centerOn(cameraMode===1?384:320,288);
   if(cameraMode===2){const actor=this.actors.values().next().value;if(actor)camera.startFollow(actor.sprite,true,reduced()?1:.13,reduced()?1:.13);}
  }
  cellAt(x,y){const p=this.cameras.main.getWorldPoint(x,y),cx=Math.floor((p.x-OX)/TILE),cy=Math.floor((p.y-OY)/TILE);return cx>=0&&cx<6&&cy>=0&&cy<5?{x:cx,y:cy}:null;}
  inspect(x,y){
   if(!this.state)return;this.focused={x,y};this.drawFocus();const w=this.state.world,parts=[`Casilla (${x}, ${y})`];
   if(w.walls.some(c=>c[0]===x&&c[1]===y))parts.push('roca');if(w.targets.some(c=>c[0]===x&&c[1]===y))parts.push('destino de la misión');
   const box=w.boxes.find(c=>c[0]===x&&c[1]===y&&c[2]>0);if(box)parts.push(`${box[2]} caja`);
   if(w.chargers.some(c=>c[0]===x&&c[1]===y))parts.push('estación de recarga');
   for(const o of this.state.objects)if(o.robot?.x===x&&o.robot?.y===y)parts.push(o.robot.name);
   document.dispatchEvent(new CustomEvent('atlas:tile-inspect',{detail:{x,y,summary:parts.join(' · ')}}));
  }
  drawLandscape(){
   const g=this.forest;g.clear();
   const tree=(x,y,s)=>{
    g.fillStyle(0x101e17,.4);g.fillEllipse(x,y+46*s,95*s,32*s);
    g.fillStyle(0x513f2c);g.fillRect(x-8*s,y+8*s,16*s,45*s);g.fillStyle(0x746044);g.fillRect(x-3*s,y+11*s,5*s,39*s);
    g.fillStyle(0x243e29);g.fillPoints([{x:x-43*s,y:y+18*s},{x:x-43*s,y:y-4*s},{x:x-26*s,y:y-4*s},{x:x-26*s,y:y-24*s},{x:x+16*s,y:y-24*s},{x:x+16*s,y:y-9*s},{x:x+40*s,y:y-9*s},{x:x+40*s,y:y+19*s},{x:x+24*s,y:y+19*s},{x:x+24*s,y:y+31*s},{x:x-27*s,y:y+31*s},{x:x-27*s,y:y+18*s}],true);
    g.fillStyle(0x41603a);g.fillRect(x-29*s,y-7*s,39*s,24*s);g.fillRect(x-12*s,y-20*s,25*s,21*s);g.fillRect(x+11*s,y+2*s,23*s,18*s);
    g.fillStyle(0x587947);g.fillRect(x-22*s,y-7*s,18*s,5*s);g.fillRect(x-6*s,y-18*s,13*s,4*s);g.fillRect(x+13*s,y+2*s,12*s,5*s);
   };
   const objects=this.map.getObjectLayer('Historia')?.objects??[];
   const landmarks=region.index===0?region.landmarks:objects.filter(o=>!['beacon','portal'].includes(o.type)).map(o=>[o.type,o.x,o.y,o.properties?.find(p=>p.name==='scale')?.value??1]);
   const c=value=>parseInt(value.slice(1),16),[,dark,path,stone,water,deep,wood,accent,leaf,light]=region.palette.map(c);
   const box=(x,y,w,h,color)=>{g.fillStyle(color);g.fillRect(x,y,w,h);};
   const triangle=(x1,y1,x2,y2,x3,y3,color)=>{g.fillStyle(color);g.fillTriangle(x1,y1,x2,y2,x3,y3);};
   const extents={crystal:[35,30],pine:[47,34],house:[36,32],manor:[36,32],gate:[33,34],tower:[33,34],arch:[34,34],pillar:[24,34],hedge:[10,25],fountain:[29,28],dock:[20,30],palm:[38,32],obelisk:[43,32],observatory:[51,33]};
   for(const [type,tx,ty,scale] of landmarks){
    const [top,bottom]=extents[type]??[0,0],s=ty<70?Math.min(scale*1.6,116/(top+bottom||1)):scale*1.6;
    const x=tx*2,y=ty<70?Math.max(6+top*s,Math.min(122-bottom*s,ty*2)):ty*2;
    if(type==='tree'){tree(tx*2,ty*2,scale);continue;}
    g.fillStyle(dark,.5);g.fillEllipse(x,y+24*s,58*s,12*s);
    if(type==='crystal'){
     for(const [dx,dy,k] of [[-15,7,.7],[12,5,.8],[0,0,1.2]]){triangle(x+dx*s-10*s*k,y+dy*s,x+dx*s,y+dy*s-28*s*k,x+dx*s+11*s*k,y+dy*s,accent);triangle(x+dx*s-10*s*k,y+dy*s,x+dx*s,y+dy*s+24*s*k,x+dx*s+11*s*k,y+dy*s,leaf);box(x+dx*s-2*s,y+dy*s-18*s*k,3*s,30*s*k,light);}
    }else if(type==='pine'){
     box(x-4*s,y+5*s,8*s,28*s,wood);for(let i=0;i<3;i++){const py=y-27*s+i*13*s;triangle(x,y-47*s+i*12*s,x-(17+i*4)*s,py+15*s,x+(17+i*4)*s,py+15*s,leaf);box(x-(11+i*3)*s,py+7*s,(22+i*6)*s,4*s,stone);}
    }else if(type==='house'||type==='manor'){
     const w=type==='manor'?70:44;box(x-w/2*s,y-12*s,w*s,40*s,stone);box(x-w/2*s+4*s,y-7*s,(w-8)*s,32*s,path);triangle(x-(w/2+5)*s,y-11*s,x,y-36*s,x+(w/2+5)*s,y-11*s,wood);box(x-7*s,y+8*s,14*s,20*s,dark);for(const dx of [-w/3,w/3]){box(x+dx*s-4*s,y-3*s,8*s,9*s,accent);box(x+dx*s-1*s,y-3*s,2*s,9*s,dark);}box(x-w/2*s,y+27*s,w*s,4*s,leaf);
    }else if(type==='gate'||type==='tower'){
     const tower=dx=>{box(x+dx*s-12*s,y-25*s,24*s,55*s,stone);box(x+dx*s-8*s,y-19*s,5*s,42*s,path);for(let n=0;n<3;n++)box(x+(dx-14+n*10)*s,y-33*s,8*s,12*s,stone);box(x+(dx-3)*s,y-14*s,6*s,13*s,dark);};
     if(type==='tower')tower(0);else{tower(-31);tower(31);box(x-20*s,y-20*s,40*s,11*s,stone);box(x-18*s,y-9*s,36*s,38*s,dark);for(let n=0;n<4;n++)box(x+(-15+n*9)*s,y-8*s,3*s,36*s,wood);}
    }else if(type==='arch'||type==='pillar'){
     const pillar=dx=>{box(x+(dx-8)*s,y-18*s,16*s,48*s,stone);box(x+(dx-11)*s,y-24*s,22*s,8*s,path);box(x+(dx-11)*s,y+26*s,22*s,7*s,path);box(x+(dx-5)*s,y-15*s,3*s,35*s,light);};
     if(type==='pillar')pillar(0);else{pillar(-23);pillar(23);box(x-25*s,y-29*s,50*s,12*s,stone);box(x-17*s,y-34*s,34*s,7*s,path);box(x-28*s,y-28*s,10*s,9*s,leaf);}
    }else if(type==='hedge'){
     box(x-25*s,y-3*s,50*s,26*s,dark);box(x-25*s,y-10*s,50*s,23*s,leaf);for(let i=0;i<5;i++){box(x+(-20+i*10)*s,y-6*s,5*s,5*s,accent);box(x+(-18+i*10)*s,y+6*s,4*s,4*s,light);}
    }else if(type==='fountain'){
     box(x-25*s,y+8*s,50*s,18*s,stone);box(x-20*s,y+9*s,40*s,9*s,water);box(x-4*s,y-13*s,8*s,30*s,stone);box(x-16*s,y-17*s,32*s,7*s,light);box(x-11*s,y-14*s,22*s,5*s,water);box(x-1*s,y-29*s,3*s,14*s,accent);
    }else if(type==='dock'){
     box(x-27*s,y-9*s,54*s,33*s,wood);for(let i=0;i<5;i++)box(x+(-25+i*12)*s,y-8*s,2*s,30*s,dark);for(const dx of [-24,24]){box(x+dx*s,y-17*s,5*s,46*s,path);box(x+(dx-1)*s,y-20*s,7*s,6*s,stone);}
    }else if(type==='palm'){
     box(x-4*s,y-7*s,8*s,37*s,wood);box(x-2*s,y-22*s,7*s,27*s,wood);for(const dx of [-1,1]){box(x+dx*5*s-(dx<0?25*s:0),y-27*s,25*s,8*s,leaf);box(x+dx*16*s-(dx<0?15*s:0),y-18*s,15*s,7*s,leaf);}box(x-9*s,y-38*s,18*s,14*s,leaf);box(x-4*s,y-34*s,5*s,5*s,accent);
    }else if(type==='obelisk'){
     box(x-14*s,y+23*s,28*s,8*s,path);box(x-9*s,y-28*s,18*s,52*s,stone);triangle(x-9*s,y-28*s,x,y-43*s,x+9*s,y-28*s,light);for(let i=0;i<4;i++)box(x-3*s,y+(-22+i*10)*s,6*s,4*s,accent);
    }else if(type==='observatory'){
     box(x-16*s,y-28*s,32*s,60*s,stone);box(x-23*s,y+22*s,46*s,10*s,path);box(x-12*s,y-29*s,6*s,48*s,light);triangle(x-24*s,y-28*s,x,y-51*s,x+24*s,y-28*s,leaf);box(x-4*s,y-15*s,8*s,12*s,deep);box(x-7*s,y+10*s,14*s,22*s,dark);g.lineStyle(2,accent);g.strokeEllipse(x,y-24*s,65*s,24*s);g.strokeEllipse(x,y-24*s,24*s,49*s);
    }
   }
   if(region.theme==='stars')for(let i=0;i<20;i++){const x=(i*137+17)%768,y=i%2?40:550;box(x,y,3,3,accent);}
  }
  drawProps(){
   if(!this.props)return;const g=this.props;g.clear();
   g.fillStyle(0x455644);g.fillRect(83,272,26,32);g.fillRect(80,266,32,10);
   const accent=parseInt(region.palette[7].slice(1),16),lit=progress.complete;
   g.fillStyle(progress.beacon?accent:0x647c65);g.fillTriangle(96,244,85,265,107,265);
   if(progress.beacon){g.fillStyle(0xe9c96f,.12);g.fillCircle(96,264,36);}
   for(let i=0;i<10;i++){g.fillStyle(i<progress.count?0xf0c564:0x536148,1);g.fillRect(133+i*26,92,9,9);}
   for(let i=0;i<6;i++){g.fillStyle(progress.trail?0x95bc87:0x4b5f48);g.fillRect(55+i*12,403,6,6);}
   g.lineStyle(3,lit?accent:0x776847);g.strokeRect(579,258,122,60);
   for(let i=0;i<6;i++){g.fillStyle(lit?accent:0x78674c);g.fillRect(585+i*21,261,6,6);g.fillRect(585+i*21,307,6,6);}
   g.fillStyle(lit?accent:0x6d6896,.9);g.fillTriangle(736,259,720,288,752,288);g.fillTriangle(720,288,752,288,736,316);
   if(lit){g.fillStyle(accent,.12);g.fillCircle(736,288,43);}
   // Each landmark has a small restoration light; later lights need the whole chapter.
   region.landmarks.forEach(([,x,y],i)=>{const on=i===0?progress.beacon:i===1?progress.trail:lit;g.fillStyle(on?accent:0x4e5558,on?1:.55);g.fillRect(x*2-4,y*2+40,8,8);if(on){g.fillStyle(accent,.14);g.fillCircle(x*2,y*2+44,17);}});
  }
  paintItems(){
   const g=this.items;g.clear();if(!this.state)return;
   const stone=parseInt(region.palette[3].slice(1),16),dark=parseInt(region.palette[1].slice(1),16),accent=parseInt(region.palette[7].slice(1),16);
   const point=(x,y)=>({x:OX+(x+.5)*TILE,y:OY+(y+.5)*TILE});
   for(const [x,y] of this.state.world.chargers){const p=point(x,y);g.fillStyle(0x386b6c);g.fillRect(p.x-18,p.y-15,36,30);g.lineStyle(2,0x8ccac1);g.strokeRect(p.x-13,p.y-10,26,20);g.fillStyle(0xc3e3c9);g.fillRect(p.x-3,p.y-9,6,18);}
   for(const [x,y] of this.state.world.targets){const p=point(x,y);g.lineStyle(3,accent,.9);g.strokeCircle(p.x,p.y,22);g.fillStyle(accent,.22);g.fillCircle(p.x,p.y,19);}
   for(const [x,y] of this.state.world.walls){const p=point(x,y);g.fillStyle(dark);g.fillRect(p.x-27,p.y-19,54,43);g.fillStyle(stone);g.fillTriangle(p.x-27,p.y-19,p.x-9,p.y-30,p.x+27,p.y-19);g.fillStyle(accent);g.fillRect(p.x-20,p.y-15,27,7);}
   const live=new Set();
   for(const [x,y,count] of this.state.world.boxes){if(!count)continue;const p=point(x,y);g.fillStyle(0x714c2d);g.fillRect(p.x-16,p.y-16,32,32);g.lineStyle(2,0xdcb56c);g.strokeRect(p.x-16,p.y-16,32,32);g.lineBetween(p.x-14,p.y-14,p.x+14,p.y+14);g.lineBetween(p.x-14,p.y+14,p.x+14,p.y-14);
    const key=x+','+y;live.add(key);let label=this.boxLabels.get(key);if(!label){label=this.add.text(p.x+18,p.y-22,'',{fontFamily:'monospace',fontSize:'12px',color:'#ffe5a3',backgroundColor:'#241b12',padding:{x:3,y:2}}).setDepth(8);this.boxLabels.set(key,label);}label.setText(String(count));
   }
   for(const [key,label] of this.boxLabels)if(!live.has(key)){label.destroy();this.boxLabels.delete(key);}
  }
  drawFocus(){
   if(!this.focus)return;this.focus.clear();const enabled=document.getElementById('show-coordinates').checked;this.zoneLabel.setVisible(enabled);this.cellLabels.forEach(label=>label.setVisible(enabled));
   this.coordinateText.setVisible(!enabled&&!!this.focused);
   if(enabled){this.focus.lineStyle(1,0x9db996,.35);for(let x=0;x<=6;x++)this.focus.lineBetween(OX+x*TILE,OY,OX+x*TILE,OY+5*TILE);for(let y=0;y<=5;y++)this.focus.lineBetween(OX,OY+y*TILE,OX+6*TILE,OY+y*TILE);}
   if(this.focused){const {x,y}=this.focused;this.focus.lineStyle(3,0xf0c564);this.focus.strokeRect(OX+x*TILE+2,OY+y*TILE+2,TILE-4,TILE-4);this.coordinateText.setText(`(${x}, ${y})`).setPosition(OX+x*TILE+3,OY+y*TILE+3);}
   else this.coordinateText.setText('Origen (0, 0)').setPosition(OX+3,OY+3);
  }
  idle(actor){if(reduced())return;this.tweens.add({targets:actor.sprite,angle:{from:-.7,to:.7},duration:1100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});}
  spark(x,y,color=0xf0c564,count=8){
   if(reduced())return;for(let i=0;i<count;i++){const a=i/count*Math.PI*2,p=this.add.rectangle(x,y,4,4,color).setDepth(8);this.tweens.add({targets:p,x:x+Math.cos(a)*30,y:y+Math.sin(a)*25,alpha:0,duration:500,onComplete:()=>p.destroy()});}
  }
  setState(state,snap=false){
   this.state=state;const signature=JSON.stringify(state.world);if(signature!==this.worldSignature){this.worldSignature=signature;this.paintItems();}const robots=state.objects.filter(o=>o.robot),live=new Set(robots.map(o=>o.id));
   for(const [id,a] of this.actors)if(!live.has(id)){this.tweens.killTweensOf([a.sprite,a.label,a.shadow,a.cargo]);a.sprite.destroy();a.label.destroy();a.shadow.destroy();a.cargo.destroy();this.actors.delete(id);}
   for(const [index,o] of robots.entries()){
    const r=o.robot,overlap=robots.filter(other=>other.robot.x===r.x&&other.robot.y===r.y),offset=(overlap.findIndex(other=>other.id===o.id)-(overlap.length-1)/2)*20,x=OX+(r.x+.5)*TILE+offset,y=OY+(r.y+.53)*TILE;let a=this.actors.get(o.id);
    if(!a){
     a={sprite:this.add.sprite(x,y,'miaubit',frames[r.dir]).setOrigin(.5,.62).setDepth(5+index),label:this.add.text(x,y+24,r.name,{fontFamily:'Pixelify Sans, monospace',fontSize:'11px',color:'#eef1d6',backgroundColor:'#14241b',padding:{x:3,y:1}}).setOrigin(.5,0).setDepth(10),shadow:this.add.ellipse(x,y+20,35,11,0x0a1710,.4).setDepth(3),cargo:this.add.rectangle(x+22,y-8,11,11,0xf0c564).setStrokeStyle(1,0xffe8a3).setDepth(8),x:r.x,y:r.y,load:r.cargo};
     this.actors.set(o.id,a);a.sprite.setDisplaySize(53,53);
    }
    this.tweens.killTweensOf([a.sprite,a.label,a.shadow,a.cargo]);a.sprite.setFrame(frames[r.dir]).setDisplaySize(53,53).setAngle(0);a.sprite.setTint(index?0x9fc2dd:0xffffff);a.cargo.setVisible(r.cargo>0);
    a.label.setText(`${r.name}${mission?.chapter>=5?' · #'+o.id:''}`);a.sprite.setData('objectId',o.id);a.sprite.setData('robotName',r.name);
    const moved=a.x!==r.x||a.y!==r.y;
    if(!snap&&!reduced()&&moved){
     this.tweens.add({targets:a.sprite,x,y,duration:280,ease:'Sine.easeInOut',onComplete:()=>this.idle(a)});
     a.sprite.angle=-3;this.tweens.add({targets:a.sprite,angle:3,duration:70,yoyo:true,repeat:1});
     this.tweens.add({targets:a.label,x,y:y+24,duration:280});this.tweens.add({targets:a.shadow,x,y:y+20,duration:280});this.tweens.add({targets:a.cargo,x:x+22,y:y-8,duration:280});
    }else{a.sprite.setPosition(x,y);a.label.setPosition(x,y+24);a.shadow.setPosition(x,y+20);a.cargo.setPosition(x+22,y-8);this.idle(a);}
    if(!snap&&r.cargo!==a.load)this.spark(x,y-12,0xf0d88b,6);
    a.x=r.x;a.y=r.y;a.load=r.cargo;
   }
   this.drawFocus();if(cameraMode===2)this.configureCamera();
  }
  celebrate(success){if(!success||!this.state)return;const actor=this.actors.values().next().value;if(actor){this.spark(actor.sprite.x,actor.sprite.y-15,0xf0c564,16);if(!reduced()){this.tweens.killTweensOf(actor.sprite);actor.sprite.setAngle(0);this.tweens.add({targets:actor.sprite,y:actor.sprite.y-9,duration:150,yoyo:true,onComplete:()=>this.idle(actor)});}}}
 }
 function mount(){if(game)return;game=new Phaser.Game({type:Phaser.AUTO,parent:host,width:host.clientWidth||720,height:host.clientHeight||520,transparent:false,backgroundColor:region.palette[1],render:{pixelArt:true,antialias:false,roundPixels:true},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[AdventureScene]});}
 function syncScene(snap=true){if(!scene)return;if(scene.renderedRegion!==region.index)scene.changeRegion();scene.drawProps();if(latest)scene.setState(latest,snap);scene.configureCamera();}
 function setActive(active){
  host.hidden=!active;
  if(active){if(!game)mount();else{game.loop.wake();scene?.scene.wake();syncScene();}}
  else{scene?.scene.sleep();game?.loop.sleep();}
 }
 globalThis.ExpeditionWorld={
  host,setActive,
  setState(state,snap){latest=state;if(document.body.dataset.view!=='mission')return;host.hidden=false;if(scene){if(scene.renderedRegion!==region.index)scene.changeRegion();scene.setState(state,snap);}else mount();},
  setMission(m){mission=m;if(region.index!==m.chapter){region=ExpeditionCampaign.chapter(m.chapter);progress=ExpeditionCampaign.derive(m.chapter,[]);}cameraMode=window.innerWidth<=850?0:1;document.getElementById('camera-mode').textContent=cameraLabels[cameraMode];},
  setProgress(value){const changed=JSON.stringify(progress)!==JSON.stringify(value);progress=value;if(changed&&scene?.renderedRegion===region.index&&!host.hidden)scene.drawProps();},
  cycleCamera(){cameraMode=(cameraMode+1)%3;scene?.configureCamera();return cameraLabels[cameraMode];},
  celebrate(success){scene?.celebrate(success);}
 };
})();
