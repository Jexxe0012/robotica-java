'use strict';
// Region art and routes are presentation data; mission coordinates remain 6 × 5.
globalThis.AtlasWorlds = [
  {
    id:'alba', title:'El Árbol del Alba', image:'assets/maps/01-alba.webp',
    alt:'Un árbol colosal se eleva sobre praderas verdes, flores y montañas al amanecer.',
    description:'La expedición comienza bajo las ramas de un árbol milenario.',
    accent:'#b6e58b', ground:['#658452b8','#456442bd','#b3d48b55'],
    points:[[12,81],[26,71],[17,53],[32,37],[43,53],[46,76],[63,82],[78,67],[69,46],[86,32]]
  },
  {
    id:'cristal', title:'Valle de Cristal', image:'assets/maps/02-cristal.webp',
    alt:'Un valle de árboles nevados y cristales azulados rodea un arroyo helado.',
    description:'Los senderos del valle cruzan un bosque detenido en el invierno.',
    accent:'#bceafa', ground:['#bed4e0b8','#789babbd','#dbf4ff66'],
    points:[[13,76],[24,54],[15,34],[36,39],[44,61],[39,82],[61,76],[77,84],[85,60],[73,37]]
  },
  {
    id:'reino', title:'Puertas del Reino', image:'assets/maps/03-reino.webp',
    alt:'Una ciudad medieval de tejados cálidos y un castillo blanco dominan una colina verde.',
    description:'Puentes y callejuelas ascienden hacia las puertas de la capital.',
    accent:'#f1d696', ground:['#a8a089b8','#747666bd','#e4dcc166'],
    points:[[12,82],[28,82],[30,61],[17,45],[33,32],[48,46],[55,67],[72,80],[85,59],[77,35]]
  },
  {
    id:'santuario', title:'Bosque del Santuario', image:'assets/maps/04-santuario.webp',
    alt:'Arcos de piedra cubiertos de musgo entre árboles antiguos y haces de luz verde.',
    description:'Las ruinas del santuario guardan caminos entre raíces y piedra antigua.',
    accent:'#91ddb5', ground:['#577c59c4','#335b48cc','#b1d4a355'],
    points:[[14,37],[29,49],[16,70],[30,85],[47,72],[45,49],[60,33],[76,45],[65,66],[86,80]]
  },
  {
    id:'jardines', title:'Jardines del Crepúsculo', image:'assets/maps/05-jardines.webp',
    alt:'Jardines de rosas y senderos geométricos ante una mansión con tejados azules al atardecer.',
    description:'Al caer la tarde, los jardines conducen hasta una mansión entre colinas.',
    accent:'#f0b9d2', ground:['#907b91bd','#615569c9','#e8c5dc66'],
    points:[[12,80],[12,57],[30,42],[44,56],[32,75],[52,84],[68,70],[64,49],[80,34],[88,57]]
  },
  {
    id:'canales', title:'Ciudad de los Canales', image:'assets/maps/06-canales.webp',
    alt:'Canales turquesa, puentes de piedra y casas de tejados naranjas en una ciudad de fantasía.',
    description:'Cada puente une una nueva parte de la ciudad sobre el agua.',
    accent:'#8be0de', ground:['#8faaa6c4','#537d82cc','#c3e9e266'],
    points:[[13,82],[27,66],[15,45],[35,33],[46,51],[39,77],[59,85],[71,64],[85,45],[71,31]]
  },
  {
    id:'bastion', title:'Bastión de las Nubes', image:'assets/maps/07-bastion.webp',
    alt:'Una fortaleza de piedra blanca se alza en acantilados de montaña por encima de las nubes.',
    description:'La senda de montaña asciende hacia una fortaleza sobre las nubes.',
    accent:'#c4d9fb', ground:['#9baabdba','#667890c9','#d6e8ff66'],
    points:[[12,85],[29,77],[18,58],[30,36],[46,47],[53,69],[69,82],[85,68],[75,48],[87,29]]
  },
  {
    id:'dunas', title:'Dunas del Silencio', image:'assets/maps/08-dunas.webp',
    alt:'Dunas doradas y rosadas, arcos enterrados y un oasis entre ruinas del desierto.',
    description:'Más allá del oasis, antiguas ruinas señalan la travesía del desierto.',
    accent:'#f6d19c', ground:['#c5a26fbd','#9e7951c9','#f2d8aa66'],
    points:[[13,38],[27,52],[15,75],[34,84],[46,65],[45,40],[61,32],[74,49],[64,72],[85,82]]
  },
  {
    id:'pleyades', title:'Torre de las Pléyades', image:'assets/maps/09-pleyades.webp',
    alt:'Una torre pálida y altísima domina un desierto violeta bajo un cielo lleno de estrellas.',
    description:'La última etapa sigue las estrellas hasta la torre del horizonte.',
    accent:'#d2c0ff', ground:['#756891c4','#473f6bcc','#d5c7ff66'],
    points:[[12,83],[28,73],[16,54],[31,35],[46,48],[44,76],[63,84],[79,70],[68,49],[85,31]]
  }
];
