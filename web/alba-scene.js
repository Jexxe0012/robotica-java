'use strict';
(() => {
 const host=document.createElement('div');host.className='scene-surface';host.id='alba-world';host.hidden=true;host.setAttribute('aria-busy','true');document.getElementById('phaser-world').append(host);
 const TILE=64,OX=128,OY=128,frames=[2,0,3,1];
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let game,scene,latest,mission,progress=AlbaChapter.derive([]),cameraMode=0;
 const cameraLabels=['Ver mapa completo','Seguir a Miaubit','Área de misión'];
 class AlbaScene extends Phaser.Scene {
  constructor(){super('alba-village');this.actors=new Map();this.focused=null;}
  preload(){this.load.tilemapTiledJSON('alba-map',AlbaChapter.map);this.load.image('alba-tiles',AlbaChapter.tiles);this.load.spritesheet('miaubit','assets/atlas-directions.png',{frameWidth:627,frameHeight:627});}
  create(){
   const map=this.make.tilemap({key:'alba-map'}),tiles=map.addTilesetImage('alba','alba-tiles');
   for(const [i,name] of ['Suelo','Senderos','Vegetación'].entries())map.createLayer(name,tiles,0,0).setScale(2).setDepth(-10+i);
   this.forest=this.add.graphics().setDepth(-1);this.drawForest();this.props=this.add.graphics().setDepth(0);this.items=this.add.graphics().setDepth(2);this.focus=this.add.graphics().setDepth(9);
   this.coordinateText=this.add.text(OX+5,OY+5,'',{fontFamily:'monospace',fontSize:'11px',color:'#f0d394',backgroundColor:'#0b1714',padding:{x:4,y:3}}).setDepth(10);
   this.zoneLabel=this.add.text(OX,OY-22,'ÁREA DE PROGRAMACIÓN · 6 × 5',{fontFamily:'Pixelify Sans, monospace',fontSize:'13px',color:'#b2c899',backgroundColor:'#14291e',padding:{x:5,y:3}}).setDepth(1).setVisible(false);
   this.scale.on('resize',()=>this.configureCamera());
   document.getElementById('show-coordinates').addEventListener('change',()=>this.drawFocus());
   this.input.on('pointermove',p=>{const cell=this.cellAt(p.x,p.y);if(cell){this.focused=cell;this.drawFocus();}});
   this.input.on('pointerdown',p=>{const cell=this.cellAt(p.x,p.y);if(cell)this.inspect(cell.x,cell.y);else {const point=this.cameras.main.getWorldPoint(p.x,p.y);if(progress.bridge&&point.x>700&&Math.abs(point.y-288)<64)location.hash='#map-2';}});
   const canvas=this.game.canvas;canvas.tabIndex=0;canvas.setAttribute('role','group');canvas.setAttribute('aria-label','Escenario del Árbol del Alba. Flechas para explorar el área de programación; Intro para inspeccionar.');
   canvas.addEventListener('pointerleave',()=>{this.focused=null;this.drawFocus();});
   canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;e.preventDefault();this.focused??={x:0,y:0};
    if(e.key==='ArrowLeft')this.focused.x=Math.max(0,this.focused.x-1);if(e.key==='ArrowRight')this.focused.x=Math.min(5,this.focused.x+1);
    if(e.key==='ArrowUp')this.focused.y=Math.max(0,this.focused.y-1);if(e.key==='ArrowDown')this.focused.y=Math.min(4,this.focused.y+1);
    this.drawFocus();if(e.key==='Enter'||e.key===' ')this.inspect(this.focused.x,this.focused.y);
   });
   scene=this;this.drawProps();if(latest)this.setState(latest,true);this.configureCamera();host.setAttribute('aria-busy','false');
   if(document.body.dataset.view!=='mission'||mission?.chapter!==0)this.scene.sleep();
  }
  configureCamera(){
   if(!this.cameras)return;const camera=this.cameras.main,w=this.scale.width,h=this.scale.height;
   camera.stopFollow();camera.setBounds(0,0,768,576);camera.setBackgroundColor('#182d24');
   const overview=Math.min(w/768,h/576),focused=Math.min(w/(6.9*TILE),h/(5.9*TILE));
   camera.setZoom(cameraMode===1?overview:focused);camera.centerOn(cameraMode===1?384:320,288);
   if(cameraMode===2){const actor=this.actors.values().next().value;if(actor)camera.startFollow(actor.sprite,true,reduced()?1:.13,reduced()?1:.13);}
  }
  cellAt(x,y){const p=this.cameras.main.getWorldPoint(x,y),cx=Math.floor((p.x-OX)/TILE),cy=Math.floor((p.y-OY)/TILE);return cx>=0&&cx<6&&cy>=0&&cy<5?{x:cx,y:cy}:null;}
  inspect(x,y){
   if(!this.state)return;this.focused={x,y};this.drawFocus();const w=this.state.world,parts=[`Casilla (${x}, ${y})`];
   if(w.walls.some(c=>c[0]===x&&c[1]===y))parts.push('roca');if(w.targets.some(c=>c[0]===x&&c[1]===y))parts.push('destino de la misión');
   const box=w.boxes.find(c=>c[0]===x&&c[1]===y&&c[2]>0);if(box)parts.push(`${box[2]} caja`);
   for(const o of this.state.objects)if(o.robot?.x===x&&o.robot?.y===y)parts.push(o.robot.name);
   document.dispatchEvent(new CustomEvent('atlas:tile-inspect',{detail:{x,y,summary:parts.join(' · ')}}));
  }
  drawForest(){
   const g=this.forest;
   const tree=(x,y,s)=>{
    g.fillStyle(0x101e17,.4);g.fillEllipse(x,y+46*s,95*s,32*s);
    g.fillStyle(0x513f2c);g.fillRect(x-8*s,y+8*s,16*s,45*s);g.fillStyle(0x746044);g.fillRect(x-3*s,y+11*s,5*s,39*s);
    g.fillStyle(0x243e29);g.fillPoints([{x:x-43*s,y:y+18*s},{x:x-43*s,y:y-4*s},{x:x-26*s,y:y-4*s},{x:x-26*s,y:y-24*s},{x:x+16*s,y:y-24*s},{x:x+16*s,y:y-9*s},{x:x+40*s,y:y-9*s},{x:x+40*s,y:y+19*s},{x:x+24*s,y:y+19*s},{x:x+24*s,y:y+31*s},{x:x-27*s,y:y+31*s},{x:x-27*s,y:y+18*s}],true);
    g.fillStyle(0x41603a);g.fillRect(x-29*s,y-7*s,39*s,24*s);g.fillRect(x-12*s,y-20*s,25*s,21*s);g.fillRect(x+11*s,y+2*s,23*s,18*s);
    g.fillStyle(0x587947);g.fillRect(x-22*s,y-7*s,18*s,5*s);g.fillRect(x-6*s,y-18*s,13*s,4*s);g.fillRect(x+13*s,y+2*s,12*s,5*s);
   };
   tree(350,60,2.1);tree(42,89,.85);tree(74,487,1);tree(720,65,.9);tree(722,510,.9);
  }
  drawProps(){
   if(!this.props)return;const g=this.props;g.clear();
   g.fillStyle(0x455644);g.fillRect(83,272,26,32);g.fillRect(80,266,32,10);
   g.fillStyle(progress.beacon?0xf1cf7c:0x647c65);g.fillTriangle(96,244,85,265,107,265);
   if(progress.beacon){g.fillStyle(0xe9c96f,.12);g.fillCircle(96,264,36);}
   for(let i=0;i<10;i++){g.fillStyle(i<progress.count?0xf0c564:0x536148,1);g.fillRect(133+i*26,92,9,9);}
   for(let i=0;i<6;i++){g.fillStyle(progress.trail?0x95bc87:0x4b5f48);g.fillRect(55+i*12,403,6,6);}
   g.lineStyle(3,progress.bridge?0xf0d88a:0x776847);g.strokeRect(579,258,122,60);
   for(let i=0;i<6;i++){g.fillStyle(progress.bridge?0xf0c564:0x78674c);g.fillRect(585+i*21,261,6,6);g.fillRect(585+i*21,307,6,6);}
   g.fillStyle(progress.bridge?0xa6d29e:0x6d6896,.9);g.fillTriangle(736,259,720,288,752,288);g.fillTriangle(720,288,752,288,736,316);
   if(progress.bridge){g.fillStyle(0x9bcdab,.12);g.fillCircle(736,288,43);}
  }
  paintItems(){
   const g=this.items;g.clear();if(!this.state)return;
   const point=(x,y)=>({x:OX+(x+.5)*TILE,y:OY+(y+.5)*TILE});
   for(const [x,y] of this.state.world.chargers){const p=point(x,y);g.fillStyle(0x386b6c);g.fillRect(p.x-18,p.y-15,36,30);g.lineStyle(2,0x8ccac1);g.strokeRect(p.x-13,p.y-10,26,20);g.fillStyle(0xc3e3c9);g.fillRect(p.x-3,p.y-9,6,18);}
   for(const [x,y] of this.state.world.targets){const p=point(x,y);g.lineStyle(3,0xd9c584,.9);g.strokeCircle(p.x,p.y,22);g.fillStyle(0x9db97b,.22);g.fillCircle(p.x,p.y,19);}
   for(const [x,y] of this.state.world.walls){const p=point(x,y);g.fillStyle(0x263e33);g.fillRect(p.x-27,p.y-19,54,43);g.fillStyle(0x687e65);g.fillTriangle(p.x-27,p.y-19,p.x-9,p.y-30,p.x+27,p.y-19);g.fillStyle(0x839177);g.fillRect(p.x-20,p.y-15,27,7);}
   for(const [x,y,count] of this.state.world.boxes){if(!count)continue;const p=point(x,y);g.fillStyle(0x714c2d);g.fillRect(p.x-16,p.y-16,32,32);g.lineStyle(2,0xdcb56c);g.strokeRect(p.x-16,p.y-16,32,32);g.lineBetween(p.x-14,p.y-14,p.x+14,p.y+14);g.lineBetween(p.x-14,p.y+14,p.x+14,p.y-14);}
  }
  drawFocus(){
   if(!this.focus)return;this.focus.clear();const enabled=document.getElementById('show-coordinates').checked;this.zoneLabel.setVisible(enabled);
   this.coordinateText.setVisible(enabled||!!this.focused);
   if(enabled){this.focus.lineStyle(1,0x9db996,.35);for(let x=0;x<=6;x++)this.focus.lineBetween(OX+x*TILE,OY,OX+x*TILE,OY+5*TILE);for(let y=0;y<=5;y++)this.focus.lineBetween(OX,OY+y*TILE,OX+6*TILE,OY+y*TILE);}
   if(this.focused){const {x,y}=this.focused;this.focus.lineStyle(3,0xf0c564);this.focus.strokeRect(OX+x*TILE+2,OY+y*TILE+2,TILE-4,TILE-4);this.coordinateText.setText(`(${x}, ${y})`).setPosition(OX+x*TILE+3,OY+y*TILE+3);}
   else this.coordinateText.setText('Origen (0, 0)').setPosition(OX+3,OY+3);
  }
  idle(actor){if(reduced())return;actor.idle=this.tweens.add({targets:actor.sprite,angle:{from:-.7,to:.7},duration:1100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});}
  spark(x,y,color=0xf0c564,count=8){
   if(reduced())return;for(let i=0;i<count;i++){const a=i/count*Math.PI*2,p=this.add.rectangle(x,y,4,4,color).setDepth(8);this.tweens.add({targets:p,x:x+Math.cos(a)*30,y:y+Math.sin(a)*25,alpha:0,duration:500,onComplete:()=>p.destroy()});}
  }
  setState(state,snap=false){
   this.state=state;this.paintItems();const robots=state.objects.filter(o=>o.robot),live=new Set(robots.map(o=>o.id));
   for(const [id,a] of this.actors)if(!live.has(id)){this.tweens.killTweensOf([a.sprite,a.label,a.shadow,a.cargo]);a.sprite.destroy();a.label.destroy();a.shadow.destroy();a.cargo.destroy();this.actors.delete(id);}
   for(const [index,o] of robots.entries()){
    const r=o.robot,x=OX+(r.x+.5)*TILE,y=OY+(r.y+.53)*TILE;let a=this.actors.get(o.id);
    if(!a){
     a={sprite:this.add.sprite(x,y,'miaubit',frames[r.dir]).setOrigin(.5,.62).setDepth(5+index),label:this.add.text(x,y+24,r.name,{fontFamily:'Pixelify Sans, monospace',fontSize:'11px',color:'#eef1d6',backgroundColor:'#14241b',padding:{x:3,y:1}}).setOrigin(.5,0).setDepth(10),shadow:this.add.ellipse(x,y+20,35,11,0x0a1710,.4).setDepth(3),cargo:this.add.rectangle(x+22,y-8,11,11,0xf0c564).setStrokeStyle(1,0xffe8a3).setDepth(8),x:r.x,y:r.y,load:r.cargo};
     this.actors.set(o.id,a);a.sprite.setDisplaySize(53,53);this.idle(a);
    }
    this.tweens.killTweensOf([a.sprite,a.label,a.shadow,a.cargo]);a.sprite.setFrame(frames[r.dir]).setDisplaySize(53,53).setAngle(0);a.sprite.setTint(index?0x9fc2dd:0xffffff);a.cargo.setVisible(r.cargo>0);
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
 function mount(){if(game)return;game=new Phaser.Game({type:Phaser.AUTO,parent:host,width:host.clientWidth||720,height:host.clientHeight||520,transparent:false,backgroundColor:'#182d24',render:{pixelArt:true,antialias:false,roundPixels:true},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[AlbaScene]});}
 function setActive(active){host.hidden=!active;if(active){if(!game)mount();else scene?.scene.wake();}else scene?.scene.sleep();}
 globalThis.AlbaWorld={host,setActive,setState(state,snap){latest=state;if(document.body.dataset.view==='mission'&&mission?.chapter===0)host.hidden=false;if(scene)scene.setState(state,snap);else if(document.body.dataset.view==='mission'&&mission?.chapter===0)mount();},setMission(m){mission=m;cameraMode=window.innerWidth<=850?0:1;scene?.configureCamera();return cameraLabels[cameraMode];},setProgress(value){progress=value;scene?.drawProps();},cycleCamera(){cameraMode=(cameraMode+1)%3;scene?.configureCamera();return cameraLabels[cameraMode];},celebrate(success){scene?.celebrate(success);}};
})();
