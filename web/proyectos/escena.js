'use strict';
// Workshop stage: a Phaser scene of its own (adventure-scene.js is not used) that shows the interpreter's 6 × 5 board
// and Miaubit walking through the frames of a run. Phaser is loaded the first time a level needs the stage.
(() => {
 const CELL=48,COLS=6,ROWS=5,PAD=8,W=COLS*CELL+PAD*2,H=ROWS*CELL+PAD*2,STEP=300;
 // Interpreter directions are 0 east, 1 south, 2 west, 3 north; the sheet rows are south, north, east and west.
 const ROW=[2,0,3,1],idle=dir=>ROW[dir]*4,DIR={'1,0':0,'0,1':1,'-1,0':2,'0,-1':3},SHIFT=[[1,0],[0,1],[-1,0],[0,-1]];
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches,center=(x,y)=>({x:PAD+(x+.5)*CELL,y:PAD+(y+.5)*CELL});
 let game=null,scene=null,loading=null,latest=null,token=0,zoom=1;
 function loadPhaser(){
  if(globalThis.Phaser)return Promise.resolve();
  return loading??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=SiteAssets.url('phaser.js');script.onload=resolve;script.onerror=()=>{loading=null;reject(new Error('phaser'));};document.head.append(script);});
 }
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const tween=(config)=>new Promise(resolve=>scene.tweens.add({...config,onComplete:resolve}));
 function drawBoard(g){
  g.fillStyle(0x08110f).fillRect(0,0,W,H).lineStyle(2,0x5a4f96).strokeRect(PAD-3,PAD-3,COLS*CELL+6,ROWS*CELL+6);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const px=PAD+x*CELL,py=PAD+y*CELL;g.fillStyle((x+y)%2?0x13221f:0x172a25).fillRect(px,py,CELL,CELL);
   g.fillStyle(0x1f3a30).fillRect(px,py,CELL,2).fillRect(px,py,2,CELL);
   g.fillStyle(0x2c4038);for(const [dx,dy] of [[5,5],[CELL-7,5],[5,CELL-7],[CELL-7,CELL-7]])g.fillRect(px+dx,py+dy,2,2);
  }
 }
 function drawItems(world){
  const g=scene.items;g.clear();
  for(const [x,y] of world.chargers){const p=center(x,y);g.fillStyle(0x1b4a47).fillRect(p.x-16,p.y-12,32,24).lineStyle(2,0x8ccac1).strokeRect(p.x-16,p.y-12,32,24);g.fillStyle(0xffd95a).fillTriangle(p.x+2,p.y-9,p.x-6,p.y+2,p.x,p.y+2).fillTriangle(p.x-2,p.y+9,p.x+6,p.y-2,p.x,p.y-2);}
  for(const [x,y] of world.targets){const p=center(x,y);g.lineStyle(2,0xffd95a,.9).strokeCircle(p.x,p.y,16);g.fillStyle(0xffd95a,.16).fillCircle(p.x,p.y,14);g.fillStyle(0xffd95a).fillRect(p.x-1,p.y-6,2,12).fillRect(p.x-6,p.y-1,12,2);}
  for(const [x,y] of world.walls){const p=center(x,y);g.fillStyle(0x2a2440).fillRect(p.x-20,p.y-14,40,32);g.fillStyle(0x56498e).fillRect(p.x-20,p.y-18,40,8);g.fillStyle(0x8176b0).fillRect(p.x-16,p.y-16,14,3);}
  const live=new Set();
  for(const [x,y,count] of world.boxes){
   if(!count)continue;const p=center(x,y),key=x+','+y;live.add(key);
   g.fillStyle(0x714c2d).fillRect(p.x-13,p.y-13,26,26).lineStyle(2,0xdcb56c).strokeRect(p.x-13,p.y-13,26,26).lineBetween(p.x-11,p.y-11,p.x+11,p.y+11);
   let label=scene.boxLabels.get(key);if(!label){label=scene.add.text(p.x+10,p.y-22,'',{fontFamily:'monospace',fontSize:'10px',color:'#ffe5a3',backgroundColor:'#241b12',padding:{x:2,y:1}}).setDepth(8);scene.boxLabels.set(key,label);}label.setText(String(count));
  }
  for(const [key,label] of scene.boxLabels)if(!live.has(key)){label.destroy();scene.boxLabels.delete(key);}
 }
 function actorFor(robot,index){
  let actor=scene.actors.get(robot.id);
  if(!actor){
   const p=center(robot.x,robot.y);
   actor={shadow:scene.add.ellipse(p.x,p.y+18,30,8,0x050a0b,.5).setDepth(4),sprite:scene.add.sprite(p.x,p.y-4,'miaubit-camina',idle(robot.dir)).setDepth(5+index),label:scene.add.text(p.x,p.y+16,robot.name,{fontFamily:'monospace',fontSize:'9px',color:'#eef1d6',backgroundColor:'#14241bcc',padding:{x:2,y:0}}).setOrigin(.5,0).setDepth(10)};
   if(index)actor.sprite.setTint(0x9fc2dd);scene.actors.set(robot.id,actor);
  }
  return actor;
 }
 function place(actor,robot){const p=center(robot.x,robot.y);actor.sprite.setPosition(p.x,p.y-4);actor.shadow.setPosition(p.x,p.y+18);actor.label.setPosition(p.x,p.y+16);}
 function snap(frame){
  if(!scene||!frame)return;
  drawItems(frame.world);const live=new Set(frame.robots.map(r=>r.id));
  for(const [id,actor] of scene.actors)if(!live.has(id)){scene.tweens.killTweensOf([actor.sprite,actor.shadow,actor.label]);for(const part of Object.values(actor))part.destroy();scene.actors.delete(id);}
  frame.robots.forEach((robot,i)=>{const actor=actorFor(robot,i);scene.tweens.killTweensOf([actor.sprite,actor.shadow,actor.label]);actor.sprite.stop();actor.sprite.setFrame(idle(robot.dir)).setAngle(0);place(actor,robot);});
 }
 function spark(x,y,color=0xffd95a,count=8){
  if(reduced())return;
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2,bit=scene.add.rectangle(x,y,3,3,color).setDepth(12);scene.tweens.add({targets:bit,x:x+Math.cos(a)*22,y:y+Math.sin(a)*18,alpha:0,duration:420,onComplete:()=>bit.destroy()});}
 }
 // One step of the animation: every robot that changed cell walks there, facing the way it moves.
 async function step(previous,next){
  if(JSON.stringify(previous.world)!==JSON.stringify(next.world))drawItems(next.world);
  const moves=[];
  next.robots.forEach((robot,i)=>{
   const before=previous.robots.find(r=>r.id===robot.id),actor=actorFor(robot,i);
   if(!before){place(actor,robot);return;}
   if(before.cargo!==robot.cargo){const p=center(robot.x,robot.y);spark(p.x,p.y-10,0xf0d88b,6);}
   const dx=robot.x-before.x,dy=robot.y-before.y;
   if(!dx&&!dy){actor.sprite.setFrame(idle(robot.dir));return;}
   const p=center(robot.x,robot.y),walk=DIR[`${Math.sign(dx)},${Math.sign(dy)}`]??robot.dir;
   actor.sprite.play('walk-'+ROW[walk]);
   moves.push(Promise.all([tween({targets:actor.sprite,x:p.x,y:p.y-4,duration:STEP*Math.max(Math.abs(dx),Math.abs(dy))}),tween({targets:[actor.shadow],x:p.x,y:p.y+18,duration:STEP}),tween({targets:[actor.label],x:p.x,y:p.y+16,duration:STEP})]).then(()=>{actor.sprite.stop();actor.sprite.setFrame(idle(robot.dir));}));
  });
  await Promise.all(moves);
 }
 async function bump(frame,dir){
  const robot=frame.robots[0];if(!robot)return;
  const actor=scene.actors.get(robot.id),[sx,sy]=SHIFT[dir],p=center(robot.x,robot.y);
  actor.sprite.setFrame(idle(dir));
  scene.fx.clear().fillStyle(0xe38d79,.55).fillRect(p.x+sx*CELL/2-(sy?20:3),p.y+sy*CELL/2-(sx?20:3),sy?40:6,sx?40:6);
  if(!reduced()){scene.cameras.main.shake(140,.006);await tween({targets:actor.sprite,x:p.x+sx*9,y:p.y-4+sy*9,duration:90,yoyo:true});}
  await wait(500);scene.fx.clear();
 }
 async function cheer(frame){
  const robot=frame.robots[0];if(!robot||reduced())return;
  const actor=scene.actors.get(robot.id),p=center(robot.x,robot.y);spark(p.x,p.y-14,0xffd95a,14);
  await tween({targets:actor.sprite,y:p.y-14,duration:150,yoyo:true});
 }
 async function mount(container){
  if(game){if(!container.contains(game.canvas))container.append(game.canvas);game.loop.wake();return;}
  await loadPhaser();
  if(game)return;
  await new Promise(resolve=>{
   class StageScene extends Phaser.Scene{
    constructor(){super('taller');this.actors=new Map();this.boxLabels=new Map();}
    preload(){this.load.spritesheet('miaubit-camina',SiteAssets.url('proyectos/assets/miaubit-camina.png'),{frameWidth:48,frameHeight:48});}
    create(){
     scene=this;drawBoard(this.add.graphics());this.items=this.add.graphics().setDepth(2);this.fx=this.add.graphics().setDepth(11);
     for(let row=0;row<4;row++)this.anims.create({key:'walk-'+row,frames:this.anims.generateFrameNumbers('miaubit-camina',{start:row*4,end:row*4+3}),frameRate:10,repeat:-1});
     snap(latest);resolve();
    }
   }
   game=new Phaser.Game({type:Phaser.AUTO,parent:container,width:W,height:H,backgroundColor:'#08110f',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.NONE,zoom},banner:false,scene:[StageScene]});
  });
 }
 globalThis.MiaubitStage={
  size:{width:W,height:H},
  mount,
  // Snap to a frame (the initial board) and cancel any animation in progress.
  show(frame){token++;latest=frame;snap(frame);},
  // Animate the frames of a run; bump is the direction of a blocked move, success adds a small celebration.
  async play(frames,{bump:blockedDir=null,success=false}={}){
   const mine=++token;latest=frames.at(-1)??latest;if(!scene||!frames.length)return;
   snap(frames[0]);
   if(reduced()){snap(frames.at(-1));}
   else for(let i=1;i<frames.length;i++){if(mine!==token)return;await step(frames[i-1],frames[i]);}
   if(mine!==token)return;
   if(blockedDir!==null)await bump(frames.at(-1),blockedDir);else if(success)await cheer(frames.at(-1));
  },
  setZoom(value){zoom=value;game?.scale.setZoom(value);},
  sleep(){token++;game?.loop.sleep();},
  wake(){game?.loop.wake();}
 };
})();
