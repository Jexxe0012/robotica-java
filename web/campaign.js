'use strict';
(() => {
 const albaBeats=[
 [
  "La primera baliza",
  "El guardián del Árbol del Alba perdió la luz del sendero. Localiza la primera baliza siguiendo tres instrucciones.",
  "Una secuencia correcta ilumina el primer tramo."
 ],
 [
  "Un núcleo para el camino",
  "Dentro de esta caja hay un núcleo de luz. Recógela y llévala al destino para encender el farol del sendero.",
  "El farol del sendero recupera su luz."
 ],
 [
  "El sendero del sur",
  "La brújula de Miaubit señala al este. Descubre qué ocurre al girar antes de avanzar.",
  "Ahora sabes distinguir un giro de un movimiento."
 ],
 [
  "Calibrar la brújula",
  "El sendero correcto está al norte. Encuentra la instrucción equivocada y corrige el trayecto.",
  "La brújula vuelve a señalar el camino correcto."
 ],
 [
  "Mira antes de avanzar",
  "Moverse hacia el este no cambia hacia dónde mira Miaubit. Usa esa diferencia para encontrar la siguiente señal.",
  "Aprendiste a observar orientación y posición por separado."
 ],
 [
  "Rodear la roca",
  "Una roca bloquea el sendero. Ordena una ruta que la rodee y regrese al destino.",
  "Las marcas del desvío se encienden entre los árboles."
 ],
 [
  "Cargar la baliza cercana",
  "La caja ya está a tus pies. Corrige el programa para recogerla antes de entregarla.",
  "La baliza cercana recibe su núcleo."
 ],
 [
  "Tu propia ruta",
  "El guardián confía en ti: escribe un trayecto hasta la señal marcada.",
  "Ya puedes crear un camino con tus propias instrucciones."
 ],
 [
  "Un mensaje al guardián",
  "Miaubit debe comunicar dónde está. Mueve el robot y usa la consola para informar su coordenada.",
  "El guardián recibe tu primer mensaje Java."
 ],
 [
  "La entrega del Alba",
  "Combina lo aprendido: recoge el núcleo, rodea la roca, entrega y comunica el resultado.",
  "La entrega final está lista."
 ]
];
 const definitions=[
  {id:'alba',theme:'forest',quest:'Devuelve la luz al sendero',restored:'El puente del Alba vuelve a brillar',unit:'balizas',finish:'El puente del Alba se ilumina.',
   brief:'Ayuda al guardián a devolver la luz al sendero siguiendo instrucciones en orden.',
   palette:['#283f2d','#20362a','#52573d','#7c8060','#244b57','#1c3b48','#85683e','#87aa61','#41603a','#a5bf83'],
   landmarks:[['tree',175,30,2.1],['tree',21,45,.85],['tree',37,244,1],['tree',360,33,.9],['tree',361,255,.9]]},
  {id:'cristal',theme:'ice',quest:'Reconstruye el archivo de cristal',restored:'El archivo del valle recupera su luz',unit:'cristales',finish:'El archivo de cristal vuelve a funcionar.',
   brief:'Los cristales conservan los datos del valle. Aprende a nombrar valores y a calcular para restaurar el archivo.',
   palette:['#273e49','#20333f','#435b65','#738f98','#24536c','#1c3e56','#657581','#80c8de','#426275','#b3dde2'],
   landmarks:[['crystal',160,30,2],['pine',28,53,1.2],['pine',38,245,1.3],['crystal',298,73,1.2],['crystal',355,239,1.5]],
   stories:[
    'El archivista necesita una etiqueta que recuerde un número. Observa cómo una variable guarda y reemplaza su valor.',
    'Tres fragmentos del registro están desordenados. Declara el dato antes de modificarlo y consultarlo.',
    'Dos cristales almacenan números de tipos distintos. Sigue la división y observa qué conserva cada tipo.',
    'Un fragmento decimal no cabe en el recipiente elegido. Corrige el tipo del dato para poder guardarlo.',
    'El panel combina texto y números. Observa cómo los paréntesis cambian qué operación ocurre primero.',
    'Intercambia dos registros del archivo sin perder ninguno. Una variable temporal puede conservar un valor.',
    'La fórmula del cristal está mal agrupada. Ajusta los paréntesis para respetar el cálculo solicitado.',
    'Miaubit inspeccionará el valle. Guarda la energía inicial y compara el estado antes y después del viaje.',
    'Prepara un reparto para los exploradores. Distingue lo que recibe cada uno de lo que queda sin repartir.',
    'El archivo necesita un presupuesto de viaje. Combina datos, cálculos y una comprobación para terminar el informe.'
   ]},
  {id:'reino',theme:'city',quest:'Reabre las puertas del Reino',restored:'Las puertas del Reino están iluminadas',unit:'sellos',finish:'Los sellos devuelven la luz a las puertas del Reino.',
   brief:'El guardián comprueba permisos y energía antes de abrir las puertas. Aprende a decidir con condiciones.',
   palette:['#35392c','#292e27','#5c5948','#8d8265','#263f48','#1d303b','#826741','#d1ac6d','#726148','#b3a177'],
   landmarks:[['gate',176,39,1.6],['house',32,55,1.1],['house',34,248,1.3],['tower',350,62,1.1],['house',335,247,1.3]],
   stories:[
    'El puesto de entrada revisa la energía de Miaubit. Lee la condición y sigue únicamente la rama que se cumple.',
    'Hay una entrega pendiente en la entrada. Ordena las comprobaciones antes de recoger y dejar la caja.',
    'La puerta también debe aceptar el valor del límite. Corrige la comparación del permiso de paso.',
    'El almacén exige dos requisitos a la vez. Examina cada condición antes de decidir si se recoge la carga.',
    'Un mensajero puede pasar con cualquiera de dos permisos. Observa cómo funciona una alternativa lógica.',
    'La llave es una palabra. Usa la comparación de contenido adecuada para comprobar el texto.',
    'Un registro puede no tener robot asignado. Comprueba la referencia antes de consultar su energía.',
    'Prepara un control de energía que recargue solo cuando haga falta y después permita continuar.',
    'Una roca bloquea la calle. Usa el sensor y una condición para escoger el desvío.',
    'Coordina la entrega de la guardia: permiso, disponibilidad y carga deben comprobarse en el momento adecuado.'
   ]},
  {id:'santuario',theme:'ruins',quest:'Despierta las runas del Santuario',restored:'El arco del Santuario vuelve a brillar',unit:'runas',finish:'El arco del Santuario recupera su luz.',
   brief:'Las runas repiten patrones. Usa bucles y condiciones de salida para despertar el bosque antiguo.',
   palette:['#233c30','#182d26','#4a6150','#78937b','#264d4c','#1c393d','#6c7050','#7ac69d','#42624c','#a7c5a0'],
   landmarks:[['arch',173,35,1.8],['tree',25,62,1.1],['pillar',35,243,1.3],['pillar',345,55,1.4],['tree',349,252,1.1]],
   stories:[
    'El primer sello repite una misma acción. Cuenta las vueltas que permite la condición del for.',
    'El contador del sendero debe avanzar junto con Miaubit. Ordena el inicio, la repetición y la consulta final.',
    'Una runa repite la acción una vez de más. Revisa cómo el límite afecta al número de vueltas.',
    'Cada vuelta deja un valor en el altar. Sigue el acumulador sin reiniciarlo durante el recorrido.',
    'Una señal puede terminar el recorrido antes del límite. Descubre en qué momento actúa break.',
    'El ritual no tiene una salida útil. Actualiza el contador para que la condición pueda dejar de cumplirse.',
    'Algunas vueltas se omiten. Sigue continue y observa qué valores llegan al acumulador.',
    'Miaubit puede consultar el sendero antes de avanzar. Repite mientras el sensor permita continuar.',
    'El mosaico tiene filas y columnas. Combina dos bucles para recorrer sus posiciones.',
    'Vacía el almacén del Santuario y transporta su carga. Cada repetición necesita una condición de salida.'
   ]},
  {id:'jardines',theme:'garden',quest:'Reconecta las fuentes del jardín',restored:'Las fuentes del jardín vuelven a encenderse',unit:'fuentes',finish:'Las fuentes del Crepúsculo recuperan su luz.',
   brief:'El jardinero repite tareas en distintos senderos. Divide las acciones en métodos que puedas reutilizar.',
   palette:['#342b3d','#272132','#5b4a62','#92758e','#36455f','#29374e','#85615e','#cf94b9','#575063','#c2a0bb'],
   landmarks:[['manor',176,35,1.6],['hedge',29,69,1.5],['fountain',36,245,1.1],['hedge',344,57,1.4],['fountain',338,245,1.3]],
   stories:[
    'Una misma rutina cuida dos tramos del jardín. Sigue las llamadas al método sin copiar su cuerpo.',
    'La fuente de entrega usa una acción con nombre. Ordena su definición, la preparación y la llamada.',
    'El método ya sabe viajar, pero recibe una distancia equivocada. Revisa el argumento de la llamada.',
    'Un jardinero entrega una copia de un número a su ayudante. Observa el alcance del parámetro.',
    'La rutina puede devolver una respuesta antes de llegar al final. Sigue la primera devolución que se ejecute.',
    'El método promete entregar un dato. Ajusta el tipo anunciado para que corresponda con su resultado.',
    'El presupuesto del jardín utiliza el resultado de otra rutina. Ordena las dependencias del cálculo.',
    'Escribe un viaje que reciba tanto el robot como la distancia. Después úsalo desde el programa.',
    'La fuente necesita una comprobación reutilizable. Devuelve una respuesta booleana para cada consulta.',
    'Organiza la entrega del jardín en recoger, viajar y descargar. Combina tres métodos con responsabilidades claras.'
   ]},
  {id:'canales',theme:'canals',quest:'Organiza a los mensajeros del canal',restored:'Los muelles de los mensajeros están listos',unit:'muelles',finish:'Los muelles de la ciudad recuperan su luz.',
   brief:'La ciudad necesita mensajeros con estado propio. Aprende a crear objetos y a distinguir sus referencias.',
   palette:['#294440','#1d3333','#536662','#899e8e','#245b64','#19434e','#8b6d4c','#75c7bf','#557466','#b4d7c5'],
   landmarks:[['house',170,37,1.6],['house',31,63,1.2],['dock',34,248,1.2],['house',341,56,1.4],['dock',339,247,1.3]],
   stories:[
    'El taller de mensajeros parte de un plano. Sigue cómo new crea un objeto y cómo cambia su estado.',
    'Un paquete debe nacer con sus datos preparados. Ordena la clase, el constructor y su uso.',
    'El constructor confunde un parámetro con un atributo. Usa this para señalar el estado del objeto.',
    'Dos registros nacen del mismo plano. Comprueba si modificar uno afecta al otro.',
    'Dos etiquetas pueden señalar el mismo registro. Sigue la identidad del objeto, además de sus valores.',
    'El muelle necesita registros independientes. Cambia la creación del objeto para que no compartan estado.',
    'Un equipo contiene un robot. Sigue cómo la composición permite delegar una acción en Miaubit.',
    'Completa una clase que conserve y modifique su propio estado. Consulta el resultado mediante su método.',
    'Un método recibe una copia de una referencia. Distingue modificar el objeto de reasignar el parámetro.',
    'Coordina a Miaubit y Luna como mensajeros distintos. Cada servicio conserva su robot y realiza su entrega.'
   ]},
  {id:'bastion',theme:'clouds',quest:'Restaura la guardia del Bastión',restored:'El Bastión recupera sus escudos de luz',unit:'escudos',finish:'Los escudos del Bastión vuelven a brillar.',
   brief:'La guardia protege sus datos y comparte contratos. Practica encapsulación, herencia y polimorfismo.',
   palette:['#303a50','#232d43','#59647b','#8b9ab2','#23344e','#1c2942','#75839a','#a9bde7','#5d708e','#c1cee4'],
   landmarks:[['gate',175,38,1.6],['tower',29,65,1.3],['tower',34,246,1.2],['tower',345,55,1.4],['tower',343,247,1.3]],
   stories:[
    'La batería de la guardia tiene una regla de protección. Sigue la validación antes de cambiar su estado.',
    'El estado privado se consulta por una acción pública. Corrige la lectura sin romper esa protección.',
    'Un explorador hereda los movimientos de Robot. Ordena la clase y observa su comportamiento adicional.',
    'La misma referencia puede representar rutas distintas. Identifica qué objeto aporta la implementación.',
    'La guardia comparte un contrato de tarea. Sigue la llamada a través de la interfaz.',
    'Una tarea necesita cumplir exactamente su contrato. Completa el comportamiento de la implementación.',
    'El mismo método recibe dos rutas diferentes. Observa cómo cambia la respuesta según el objeto.',
    'Un contador debe mantener su regla ante entradas válidas e inválidas. Encapsula y valida sus cambios.',
    'Especializa una ruta sin cambiar cómo se utiliza. Sobrescribe el método que determina el trayecto.',
    'Elige una estrategia de viaje para rodear el obstáculo. El servicio debe depender del contrato compartido.'
   ]},
  {id:'dunas',theme:'desert',quest:'Prepara la caravana del desierto',restored:'Las señales de la caravana están listas',unit:'señales',finish:'Las señales de la caravana iluminan las dunas.',
   brief:'La caravana reúne datos y robots. Aprende a recorrer arreglos y listas sin salir de sus límites.',
   palette:['#4a382c','#382a24','#74604a','#a18a66','#31575c','#24404c','#8d7253','#d8ad6c','#866248','#c7a276'],
   landmarks:[['obelisk',176,32,1.9],['palm',27,62,1.2],['arch',32,246,1.1],['palm',347,66,1.3],['obelisk',344,246,1.2]],
   stories:[
    'El inventario de la caravana usa posiciones numeradas. Distingue el índice de un elemento del tamaño del arreglo.',
    'Reúne los suministros recorriendo el arreglo. Ordena los datos, el acumulador y el bucle.',
    'El registro intenta consultar una posición que no existe. Revisa el último índice permitido.',
    'Dos nombres pueden compartir el mismo arreglo. Observa qué ocurre al modificar uno de sus elementos.',
    'La lista de viajes puede crecer. Sigue las inserciones antes de consultar su tamaño y sus posiciones.',
    'La primera posición de una lista también tiene un índice concreto. Corrige la consulta del registro.',
    'Una flota guarda referencias a robots. Recorre la colección y observa a cada integrante.',
    'Busca la mayor reserva de energía. Conserva el mejor valor visto mientras recorres los datos.',
    'Selecciona solo los suministros que cumplen el criterio. Agrégalos a una nueva lista.',
    'Prepara entregas en lote con Miaubit y Luna. Relaciona cada robot con la distancia guardada en su arreglo.'
   ]},
  {id:'pleyades',theme:'stars',quest:'Enciende el observatorio de las Pléyades',restored:'El observatorio ilumina toda la expedición',unit:'estrellas',finish:'El observatorio de las Pléyades recupera su luz.',
   brief:'La última región combina lo aprendido. Diseña servicios, valida datos y lleva tu lógica más allá del mapa.',
   palette:['#352b4b','#251f39','#5a4a6b','#927d9f','#293153','#1e2545','#79647f','#c0a0e7','#62527e','#d6bde9'],
   landmarks:[['observatory',175,38,1.8],['obelisk',28,66,1.2],['crystal',35,245,1.3],['obelisk',345,57,1.2],['crystal',340,248,1.2]],
   stories:[
    'El observatorio recibe una expedición completa. Sigue cómo los métodos, los datos y los bucles se conectan.',
    'La entrega final depende de una preparación correcta. Ordena recarga, carga, viaje y descarga.',
    'El informe pierde un dato al salir de un bloque. Corrige el alcance de la variable que lo conserva.',
    'La flota puede contener dos referencias al mismo robot. Sigue la identidad durante todo el recorrido.',
    'Una colección reúne rutas con un contrato compartido. Suma lo que devuelve cada implementación.',
    'La cuenta del observatorio debe conservar un saldo válido. Comprueba las reglas antes de aceptar un pago.',
    'Lleva la lógica a una tarea de consola: recorre datos y cuenta los que cumplen la condición.',
    'Diseña un producto que controle sus existencias. La venta debe validar, modificar y devolver un resultado.',
    'El inventario necesita un informe. Recorre objetos y combina acumuladores con responsabilidades distintas.',
    'Coordina la central de reparto: servicios que contienen robots, rutas intercambiables y una colección de entregas.'
   ]}
 ];
 const idFor=n=>'m'+String(n).padStart(2,'0');
 const regions=definitions.map((d,index)=>({...d,index,title:AtlasWorlds[index].title,ids:Array.from({length:10},(_,i)=>idFor(index*10+i+1)),map:index===0?'assets/maps/alba-village.json':`assets/maps/${d.id}-adventure.json`,tiles:`assets/tiles/${d.id}.svg`,playfield:{x:2,y:2,width:6,height:5}}));
 function chapter(index){return regions[index]??null;}
 function forMission(id){return regions.find(r=>r.ids.includes(id))??null;}
 function derive(index,completed){const r=chapter(index);if(!r)return null;const done=new Set(completed),count=r.ids.filter(id=>done.has(id)).length;return {chapter:index,count,total:r.ids.length,beacon:done.has(r.ids[1]),trail:done.has(r.ids[5]),complete:count===r.ids.length};}
 function mission(id){const r=forMission(id);if(!r)return null;if(r.index===0){const [title,story,reward]=albaBeats[r.ids.indexOf(id)];return {title,story,reward};}const i=r.ids.indexOf(id);return {title:`${r.unit[0].toUpperCase()+r.unit.slice(1)} · ${i+1} de 10`,story:r.stories[i],reward:`Una ${r.unit==='cristales'?'pieza del archivo':r.unit==='sellos'?'marca de la puerta':r.unit==='muelles'?'señal del muelle':'nueva luz'} queda restaurada en ${r.title}.`};}
 function reward(id,completed){const r=forMission(id);if(!r)return '';const state=derive(r.index,completed);if(state.complete)return r.finish+(r.index===8?' ¡Completaste esta región! Revisa las misiones pendientes de tu expedición.':` Te espera ${regions[r.index+1].title}.`);return mission(id).reward+(id===r.ids.at(-1)?' Resuelve las misiones pendientes para restaurar toda la región.':'');}
 globalThis.ExpeditionCampaign={regions,chapter,forMission,derive,mission,reward};
})();
