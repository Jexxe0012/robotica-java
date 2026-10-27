'use strict';
// One scene presents every chapter; JavaCourse and RobotJava own execution.
(() => {
 function setMission(mission){document.getElementById('camera-mode').textContent=ExpeditionWorld.setMission(mission);}
 globalThis.AtlasPhaserWorld={
  setMission,
  setState:(state,snap=false)=>{if(state)ExpeditionWorld.setState(state,snap);},
  setActive:value=>ExpeditionWorld.setActive(value),
  setProgress:state=>ExpeditionWorld.setProgress(state),
  cycleCamera:()=>ExpeditionWorld.cycleCamera(),
  celebrate:success=>ExpeditionWorld.celebrate(success)
 };
})();
