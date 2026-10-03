'use strict';
// Phaser owns only the 2D presentation; JavaCourse and RobotJava remain authoritative.
(() => {
  const host = document.getElementById('phaser-world');
  const frames = [2, 0, 3, 1];
  const arrows = ['→', '↓', '←', '↑'];
  let game = null, scene = null, latestState = null;

  function color(value, fallback = 0x6dbb91) {
    const match = String(value || '').match(/#([\da-f]{6})([\da-f]{2})?/i);
    return match ? {hex:parseInt(match[1],16), alpha:match[2] ? parseInt(match[2],16)/255 : 1} : {hex:fallback,alpha:1};
  }
  function regionColor(name, fallback) {
    return color(getComputedStyle(document.body).getPropertyValue(name).trim(), fallback);
  }
  function summaryFor(state, x, y) {
    const parts = [`Casilla (${x}, ${y})`];
    if (state.world.walls.some(cell => cell[0]===x && cell[1]===y)) parts.push('obstáculo');
    if (state.world.targets.some(cell => cell[0]===x && cell[1]===y)) parts.push('destino');
    if (state.world.chargers.some(cell => cell[0]===x && cell[1]===y)) parts.push('estación de recarga');
    const box = state.world.boxes.find(cell => cell[0]===x && cell[1]===y && cell[2]>0);
    if (box) parts.push(`${box[2]} caja${box[2]===1?'':'s'}`);
    for (const object of state.objects.filter(item => item.robot && item.robot.x===x && item.robot.y===y)) parts.push(object.robot.name);
    return parts.join(' · ');
  }
  class ExpeditionScene extends Phaser.Scene {
    constructor() { super({key:'atlas-expedition'}); this.actors = new Map(); this.boxLabels = new Map(); this.coordinateLabels = new Map(); this.focusedCell = null; }
    preload() {
      this.load.spritesheet('atlas','assets/atlas-directions.png',{frameWidth:627,frameHeight:627});
    }
    create() {
      this.board = this.add.graphics().setDepth(0);
      this.highlights = this.add.graphics().setDepth(8);
      this.dataState = null;
      this.scale.on('resize',() => { this.paint(); if(this.dataState)this.syncActors(this.dataState,true); },this);
      document.getElementById('show-coordinates').addEventListener('change',()=>this.syncCoordinates());
      this.input.on('pointermove',pointer => {
        const cell=this.cellAt(pointer.x,pointer.y);
        if (cell) {
          this.keyboardFocus=false;
          if(!this.focusedCell||cell.x!==this.focusedCell.x||cell.y!==this.focusedCell.y){this.focusedCell=cell;this.paintHighlights();}
        }
      });
      this.input.on('pointerdown',pointer => { const cell=this.cellAt(pointer.x,pointer.y); if(cell)this.inspect(cell.x,cell.y); });
      this.bindKeyboard();
      scene=this;
      if (latestState) this.setState(latestState,true);
      else this.paint();
      if(document.body.dataset.view!=='mission')this.scene.sleep();
    }
    dimensions() {
      return {width:Math.max(1,this.scale.width||720),height:Math.max(1,this.scale.height||600)};
    }
    cellAt(x,y) {
      const size=this.dimensions(), cellW=size.width/6, cellH=size.height/5;
      const column=Math.floor(x/cellW), row=Math.floor(y/cellH);
      return column>=0&&column<6&&row>=0&&row<5?{x:column,y:row}:null;
    }
    bindKeyboard() {
      const canvas=this.game.canvas;
      canvas.tabIndex=0;
      canvas.setAttribute('role','application');
      canvas.setAttribute('aria-label','Tablero 2D de 6 por 5. Usa las flechas para explorar casillas e Intro para inspeccionar.');
      canvas.addEventListener('pointerleave',()=>{if(!this.keyboardFocus){this.focusedCell=null;this.paintHighlights();}});
      canvas.addEventListener('blur',()=>{this.keyboardFocus=false;this.focusedCell=null;this.paintHighlights();});
      canvas.addEventListener('keydown',event=>{
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key)) return;
        event.preventDefault();
        this.keyboardFocus=true;
        if (!this.focusedCell) this.focusedCell={x:0,y:0};
        if (event.key==='ArrowLeft') this.focusedCell.x=Math.max(0,this.focusedCell.x-1);
        if (event.key==='ArrowRight') this.focusedCell.x=Math.min(5,this.focusedCell.x+1);
        if (event.key==='ArrowUp') this.focusedCell.y=Math.max(0,this.focusedCell.y-1);
        if (event.key==='ArrowDown') this.focusedCell.y=Math.min(4,this.focusedCell.y+1);
        this.paintHighlights();
        if (event.key==='Enter'||event.key===' ') this.inspect(this.focusedCell.x,this.focusedCell.y);
      });
    }
    setState(state,snap=false) {
      this.dataState=state;
      this.paint();
      this.syncActors(state,snap);
    }
    paint() {
      if(!this.board) return;
      const {width,height}=this.dimensions(), tileW=width/6, tileH=height/5;
      const accent=regionColor('--region-accent',0x6dbb91);
      this.board.clear();
      for(let y=0;y<5;y++) for(let x=0;x<6;x++) {
        const ground=regionColor((x+y)%2?'--terrain-1':'--terrain-0',0x233d2b);
        const left=Math.round(x*tileW), top=Math.round(y*tileH), right=Math.round((x+1)*tileW), bottom=Math.round((y+1)*tileH);
        this.board.fillStyle(ground.hex,Math.max(.25,ground.alpha*.53));
        this.board.fillRect(left+1,top+1,right-left-2,bottom-top-2);
        this.board.fillStyle(accent.hex,.1);
        for(let pixel=0;pixel<4;pixel++) {
          const hash=(x*37+y*19+pixel*53)%97;
          const px=left+5+(hash%(Math.max(6,right-left-10)));
          const py=top+5+((hash*7)%(Math.max(6,bottom-top-10)));
          this.board.fillRect(px,py,2,2);
        }
        this.board.lineStyle(1,accent.hex,.31);
        this.board.strokeRect(left+.5,top+.5,right-left-1,bottom-top-1);
      }
      const state=this.dataState, boxes=[];
      if(state) {
        for(const [x,y] of state.world.walls) this.drawWall(x,y,tileW,tileH);
        for(const [x,y] of state.world.targets) this.drawTarget(x,y,tileW,tileH);
        for(const [x,y] of state.world.chargers) this.drawCharger(x,y,tileW,tileH);
        for(const [x,y,count] of state.world.boxes) if(count>0){this.drawBox(x,y,tileW,tileH);boxes.push({x,y,count});}
      }
      this.syncBoxLabels(boxes,tileW,tileH);
      this.syncCoordinates(tileW,tileH);
      this.paintHighlights();
    }
    drawWall(x,y,w,h) {
      const g=this.board, px=Math.round(x*w), py=Math.round(y*h), unit=Math.max(3,Math.floor(Math.min(w,h)/8));
      g.fillStyle(0x0b1417,.78);g.fillRect(px+unit,py+unit*2,w-unit*2,h-unit*2);
      g.fillStyle(0x566b5e,.96);g.fillRect(px+unit,py+unit,w-unit*2,h-unit*3);
      g.fillStyle(0x344b41,1);g.fillRect(px+unit,py+unit*2,w-unit*2,unit);
      for(let block=0;block<3;block++) {
        const blockW=(w-unit*2)/3;
        g.fillStyle(block===1?0x718170:0x465d50,.95);
        g.fillRect(px+unit+block*blockW,py+unit*3+unit*(block%2),blockW-unit/2,unit);
      }
      g.fillStyle(0x98aa83,.62);g.fillRect(px+unit*1.5,py+unit*2,2,unit*1.5);
    }
    drawTarget(x,y,w,h) {
      const g=this.board,cx=(x+.5)*w,cy=(y+.5)*h,u=Math.max(3,Math.floor(Math.min(w,h)/9));
      g.fillStyle(0x091612,.48);g.fillRect(cx-w*.27,cy-h*.28,w*.54,h*.58);
      g.fillStyle(0x5aa674,.92);g.fillRect(cx-w*.2,cy-h*.2,w*.4,h*.41);
      g.fillStyle(0x1b3327,1);g.fillRect(cx-w*.14,cy-h*.13,w*.28,h*.28);
      g.fillStyle(0xd59b48,.95);g.fillRect(cx-u/2,cy-h*.24,u,u);
      g.fillRect(cx-u/2,cy+h*.16,u,u);
      g.fillStyle(0xa4dfa2,.9);g.fillRect(cx-w*.25,cy-h*.015,u,u);
      g.fillRect(cx+w*.25-u,cy-h*.015,u,u);
    }
    drawCharger(x,y,w,h) {
      const g=this.board,cx=(x+.5)*w,cy=(y+.5)*h,u=Math.max(3,Math.floor(Math.min(w,h)/9));
      g.fillStyle(0x0b1c22,.75);g.fillRect(cx-w*.23,cy-h*.21,w*.46,h*.42);
      g.fillStyle(0x2c7480,.95);g.fillRect(cx-w*.17,cy-h*.16,w*.34,h*.31);
      g.fillStyle(0xa7e3de,.95);g.fillRect(cx-u*.5,cy-h*.13,u,u*2.6);
      g.fillRect(cx-u*1.1,cy-h*.03,u*.7,u);g.fillRect(cx+u*.4,cy-h*.03,u*.7,u);
      g.fillStyle(0x87d6cd,.8);g.fillRect(cx-w*.29,cy+h*.22,w*.58,u);
    }
    drawBox(x,y,w,h) {
      const g=this.board,cx=(x+.5)*w,cy=(y+.5)*h,u=Math.max(4,Math.floor(Math.min(w,h)/7));
      g.fillStyle(0x17120e,.78);g.fillRect(cx-w*.25+2,cy-h*.19+3,w*.5,h*.4);
      g.fillStyle(0xb77936,1);g.fillRect(cx-w*.25,cy-h*.22,w*.5,h*.4);
      g.fillStyle(0xe0ad5e,1);g.fillRect(cx-w*.2,cy-h*.18,w*.4,u);
      g.fillStyle(0x754622,1);g.fillRect(cx-u/2,cy-h*.22,u,h*.4);
      g.fillStyle(0xf2cc7c,.95);g.fillRect(cx-u/2,cy-h*.02,u,u);
    }
    syncBoxLabels(boxes,w,h) {
      const live=new Set(boxes.map(box=>`${box.x},${box.y}`));
      for(const [key,label] of this.boxLabels)if(!live.has(key)){label.destroy();this.boxLabels.delete(key);}
      for(const box of boxes) {
        const key=`${box.x},${box.y}`,x=(box.x+.72)*w,y=(box.y+.28)*h;
        let label=this.boxLabels.get(key);
        if(!label){label=this.add.text(x,y,'',{fontFamily:'Pixelify Sans, monospace',fontSize:'12px',color:'#f4d48b',stroke:'#23170f',strokeThickness:3}).setOrigin(.5).setDepth(6);this.boxLabels.set(key,label);}
        label.setText(String(box.count));label.setPosition(x,y);label.setFontSize(`${Math.max(11,Math.floor(Math.min(w,h)/8))}px`);
      }
    }
    syncCoordinates(w=this.dimensions().width/6,h=this.dimensions().height/5) {
      const enabled=document.getElementById('show-coordinates').checked;
      if(!enabled){for(const label of this.coordinateLabels.values())label.destroy();this.coordinateLabels.clear();return;}
      for(let y=0;y<5;y++)for(let x=0;x<6;x++) {
        const key=`${x},${y}`,left=x*w+w*.08,top=y*h+h*.08;
        let label=this.coordinateLabels.get(key);
        if(!label){label=this.add.text(left,top,key,{fontFamily:'Cascadia Code, Consolas, monospace',fontSize:'10px',color:'#d3dfd3',backgroundColor:'#080d10c9',padding:{x:3,y:2}}).setDepth(6);this.coordinateLabels.set(key,label);}
        label.setPosition(left,top);label.setFontSize(`${Math.max(9,Math.floor(Math.min(w,h)*.13))}px`);
      }
    }
    paintHighlights() {
      if(!this.highlights) return;
      this.highlights.clear();
      if(!this.focusedCell) return;
      const {width,height}=this.dimensions(),w=width/6,h=height/5,x=this.focusedCell.x*w,y=this.focusedCell.y*h,corner=Math.max(7,Math.floor(Math.min(w,h)/5));
      this.highlights.fillStyle(0xd59b48,.11);this.highlights.fillRect(x+2,y+2,w-4,h-4);
      this.highlights.fillStyle(0xf2bf62,.95);
      this.highlights.fillRect(x+2,y+2,corner,3);this.highlights.fillRect(x+2,y+2,3,corner);
      this.highlights.fillRect(x+w-corner-2,y+2,corner,3);this.highlights.fillRect(x+w-5,y+2,3,corner);
      this.highlights.fillRect(x+2,y+h-5,corner,3);this.highlights.fillRect(x+2,y+h-corner-2,3,corner);
      this.highlights.fillRect(x+w-corner-2,y+h-5,corner,3);this.highlights.fillRect(x+w-5,y+h-corner-2,3,corner);
    }
    syncActors(state,snap) {
      const robots=state.objects.filter(object=>object.robot),live=new Set(robots.map(object=>object.id));
      for(const [id,actor] of this.actors) if(!live.has(id)) { this.tweens.killTweensOf([actor.sprite,actor.label]);actor.sprite.destroy();actor.label.destroy();this.actors.delete(id); }
      const {width,height}=this.dimensions(),tileW=width/6,tileH=height/5;
      robots.forEach((object,index)=>{
        const robot=object.robot,overlap=robots.filter(other=>other.robot.x===robot.x&&other.robot.y===robot.y),offset=(overlap.findIndex(other=>other.id===object.id)-(overlap.length-1)/2)*tileW*.18,x=(robot.x+.5)*tileW+offset,y=(robot.y+.54)*tileH;
        let actor=this.actors.get(object.id);
        if(!actor) {
          const sprite=this.add.sprite(x,y,'atlas',frames[robot.dir]??2).setOrigin(.5,.63).setDepth(4+index);
          const label=this.add.text(x,y+tileH*.27,'',{fontFamily:'Pixelify Sans, monospace',fontSize:`${Math.max(10,Math.floor(tileH*.15))}px`,color:'#e3eadc',backgroundColor:'#09110fe8',padding:{x:4,y:2},stroke:'#09110f',strokeThickness:2}).setOrigin(.5,0).setDepth(7+index);
          if(index) sprite.setTint(0x8eacd9);
          actor={sprite,label,x:robot.x,y:robot.y};this.actors.set(object.id,actor);
          sprite.setDisplaySize(tileW*.77,tileH*.77);
        } else {
          this.tweens.killTweensOf([actor.sprite,actor.label]);
          actor.sprite.setFrame(frames[robot.dir]??2);
          if(index) actor.sprite.setTint(0x8eacd9);else actor.sprite.clearTint();
          const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
          if(!snap&&!reducedMotion&&(actor.x!==robot.x||actor.y!==robot.y)) {
            this.tweens.add({targets:actor.sprite,x:x,y:y,duration:270,ease:'Sine.easeInOut'});
            this.tweens.add({targets:actor.label,x:x,y:y+tileH*.27,duration:270,ease:'Sine.easeInOut'});
            this.tweens.add({targets:actor.sprite,scaleY:actor.sprite.scaleY*.88,duration:90,yoyo:true,repeat:1,ease:'Quad.easeOut'});
          } else { actor.sprite.setPosition(x,y);actor.label.setPosition(x,y+tileH*.27); }
          actor.sprite.setDisplaySize(tileW*.77,tileH*.77);
          actor.label.setFontSize(`${Math.max(10,Math.floor(tileH*.15))}px`);
          actor.x=robot.x;actor.y=robot.y;
        }
        actor.label.setText(`${robot.name} ${arrows[robot.dir]??'→'}`);
      });
    }
    inspect(x,y) {
      if(!this.dataState)return;
      document.dispatchEvent(new CustomEvent('atlas:tile-inspect',{detail:{x,y,summary:summaryFor(this.dataState,x,y)}}));
    }
  }

  function mount() {
    if(game||!globalThis.Phaser)return;
    game=new Phaser.Game({type:Phaser.AUTO,parent:host,width:720,height:600,transparent:true,backgroundColor:'#00000000',render:{pixelArt:true,antialias:false,roundPixels:true},scale:{mode:Phaser.Scale.RESIZE,width:720,height:600,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[ExpeditionScene]});
    game.events.once('ready',()=>{if(latestState&&scene)scene.setState(latestState,true);});
  }
  function setState(state,snap=false) {
    if(!state)return;
    latestState=state;
    if(scene)scene.setState(state,snap);
    else if(!game&&document.body.dataset.view==='mission')mount();
  }
  function setActive(active) {
    if(active) { if(!game)mount();else if(scene)scene.scene.wake(); }
    else if(scene)scene.scene.sleep();
  }
  globalThis.AtlasPhaserWorld={setState,setActive};
})();
