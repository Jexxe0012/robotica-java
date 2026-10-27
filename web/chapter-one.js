'use strict';
(() => {
 const beats=[
  ['La primera baliza','El guardián del Árbol del Alba perdió la luz del sendero. Localiza la primera baliza siguiendo tres instrucciones.','Una secuencia correcta ilumina el primer tramo.'],
  ['Un núcleo para el camino','Dentro de esta caja hay un núcleo de luz. Recógela y llévala al destino para encender el farol del sendero.','El farol del sendero recupera su luz.'],
  ['El sendero del sur','La brújula de Miaubit señala al este. Descubre qué ocurre al girar antes de avanzar.','Ahora sabes distinguir un giro de un movimiento.'],
  ['Calibrar la brújula','El sendero correcto está al norte. Encuentra la instrucción equivocada y corrige el trayecto.','La brújula vuelve a señalar el camino correcto.'],
  ['Mira antes de avanzar','Moverse hacia el este no cambia hacia dónde mira Miaubit. Usa esa diferencia para encontrar la siguiente señal.','Aprendiste a observar orientación y posición por separado.'],
  ['Rodear la roca','Una roca bloquea el sendero. Ordena una ruta que la rodee y regrese al destino.','Las marcas del desvío se encienden entre los árboles.'],
  ['Cargar la baliza cercana','La caja ya está a tus pies. Corrige el programa para recogerla antes de entregarla.','La baliza cercana recibe su núcleo.'],
  ['Tu propia ruta','El guardián confía en ti: escribe un trayecto hasta la señal marcada.','Ya puedes crear un camino con tus propias instrucciones.'],
  ['Un mensaje al guardián','Miaubit debe comunicar dónde está. Mueve el robot y usa la consola para informar su coordenada.','El guardián recibe tu primer mensaje Java.'],
  ['La entrega del Alba','Combina lo aprendido: recoge el núcleo, rodea la roca, entrega y comunica el resultado.','La entrega final está lista.']
 ];
 const ids=beats.map((_,i)=>'m'+String(i+1).padStart(2,'0'));
 function derive(completed){const done=new Set(completed),count=ids.filter(id=>done.has(id)).length;return {count,total:ids.length,beacon:done.has('m02'),trail:done.has('m06'),bridge:count===ids.length};}
 function mission(id){const index=ids.indexOf(id);if(index<0)return null;const [title,story,reward]=beats[index];return {title,story,reward};}
 function reward(id,completed){const beat=mission(id);if(!beat)return '';const s=derive(completed);return s.bridge?'¡Las diez balizas están listas! El puente del Alba se ilumina y el Valle de Cristal te espera.':beat.reward+(id==='m10'?' Resuelve las balizas pendientes para iluminar el puente.':'');}
 globalThis.AlbaChapter={ids,derive,mission,reward,map:'assets/maps/alba-village.json',tiles:'assets/tiles/alba.svg',playfield:{x:2,y:2,width:6,height:5}};
})();
