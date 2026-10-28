'use strict';
// Playable levels. Each task is checked against the workspace or, when needsRun is set, against the last run.
// Levels are cumulative: a level starts with the files the previous one left.
(() => {
 const W=MiaubitWorkshop,{projects}=MiaubitProjects;
 const task=(text,check,options={})=>Object.freeze({text,check,needsRun:false,...options});
 function classIn(ws,path,name){
  const text=ws.files[path];if(text===undefined)return null;
  try{return new RobotJava.Parser(text).parse().find(node=>node.kind==='class'&&node.name===name)??null;}catch{return null;}
 }
 const hasField=(c,name,type)=>!!c?.fields.some(f=>f.name===name&&f.type===type);
 const created=(run,cls)=>run?.compiled&&!run.error?run.result.final.objects.find(o=>o.cls===cls)??null:null;
 const BOTON='src/Boton.java';
 // A probe is one action the game performs at Probar; it passes when Miaubit moves exactly by `move`.
 const press=(name,dir,color,move)=>Object.freeze({label:`Boton("${dir}", "${color}")`,call:`Boton("${dir}", "${color}").pulsar(robot)`,dir,code:`Boton ${name} = new Boton("${dir}", "${color}");\n${name}.pulsar(robot);`,move});
 const arrow=(name,dir,move)=>Object.freeze({label:`presionar("${name}")`,call:`mando.presionar("${name}", robot)`,name,dir,code:`mando.presionar("${name}", robot);`,move});
 const tested=level=>({...level,harness:[level.setup,...level.probes.map(p=>p.code)].filter(Boolean).join('\n')});
 const at=([x,y])=>`(${x}, ${y})`,TOWARD={este:'al este',oeste:'al oeste',norte:'al norte',sur:'al sur'};
 const BOTON_PLANO='class Boton {\n  String direccion;\n  String color;\n\n  Boton(String direccion, String color) {\n    this.direccion = direccion;\n    this.color = color;\n  }\n';
 const BOTON_PULSAR=BOTON_PLANO+'\n  void pulsar(Robot r) {\n    if (direccion.equals("norte")) { r.norte(); }\n    if (direccion.equals("sur")) { r.sur(); }\n    if (direccion.equals("este")) { r.este(); }\n    if (direccion.equals("oeste")) { r.oeste(); }\n  }\n}\n';
 // The virtual control: the game's contract and the four arrows it calls presionar with.
 const MANDO=Object.freeze({path:'juego/Mando.java',text:'// Archivo del juego: el control virtual llama a presionar\n// con "arriba", "abajo", "derecha" o "izquierda".\ninterface Mando {\n  void presionar(String boton, Robot r);\n}\n'});
 const PAD=Object.freeze({arriba:'norte',abajo:'sur',derecha:'este',izquierda:'oeste'});
 const COLORS=Object.freeze({violeta:'#8f7fd6',dorado:'#ffd95a',rojo:'#e36a5a',verde:'#6dbb91',azul:'#5fa8d8',naranja:'#f0a35a',rosa:'#eaa7ca',celeste:'#8fd3f0',blanco:'#f1edff',gris:'#95ada2'});
 // A class by name, wherever the player saved its file.
 const classNamed=(ws,name)=>{const path=Object.keys(ws.files).find(p=>W.basename(p)===name+'.java');return path?classIn(ws,path,name):null;};
 const controlClass=ws=>classNamed(ws,'Control');
 const CONTROL_BASE='class Control implements Mando {\n  private Boton arriba = new Boton("norte", "violeta");\n  private Boton abajo = new Boton("sur", "violeta");\n  private Boton derecha = new Boton("este", "dorado");\n  private Boton izquierda = new Boton("oeste", "dorado");\n';
 const PRESIONAR='    if (boton.equals("arriba")) { arriba.pulsar(r); }\n    if (boton.equals("abajo")) { abajo.pulsar(r); }\n    if (boton.equals("derecha")) { derecha.pulsar(r); }\n    if (boton.equals("izquierda")) { izquierda.pulsar(r); }\n  }\n';
 const CONTROL=CONTROL_BASE+'\n  public void presionar(String boton, Robot r) {\n'+PRESIONAR+'}\n';
 // The harvest (project 2): rules in their own folder, and a game turn that moves and then checks the rules.
 const MARC='reglas/Marcador.java',JUEGO='reglas/Juego.java',stepCode=p=>`mando.presionar("${p}", robot);\njuego.revisar();`;
 const MARCADOR='class Marcador {\n  private int puntos = 0;\n\n  public void sumar(int n) {\n    if (n > 0) { puntos += n; }\n  }\n\n  public int getPuntos() {\n    return puntos;\n  }\n}\n';
 const JUEGO_CAMPOS='class Juego {\n  private Robot robot;\n  private Marcador marcador = new Marcador();\n';
 const JUEGO_RECOGER='  public void revisar() {\n    if (robot.hayCaja()) {\n      robot.recoger();\n      marcador.sumar(1);\n    }\n';
 const JUEGO_PUNTOS='  public int getPuntos() {\n    return marcador.getPuntos();\n  }\n';
 const JUEGO_REGLAS=JUEGO_CAMPOS+'\n  Juego(Robot robot) {\n    this.robot = robot;\n  }\n\n'+JUEGO_RECOGER+'  }\n\n'+JUEGO_PUNTOS+'}\n';
 const JUEGO_META=JUEGO_CAMPOS+'  private int meta;\n\n  Juego(Robot robot, int meta) {\n    this.robot = robot;\n    this.meta = meta;\n  }\n\n'+JUEGO_RECOGER+'    if (robot.getX() == 0 && robot.getY() == 4) {\n      robot.recargar();\n    }\n  }\n\n'+JUEGO_PUNTOS+'\n  public boolean termino() {\n    return marcador.getPuntos() >= meta;\n  }\n}\n';
 const CONTROL_FINAL=CONTROL_BASE.replace('"sur", "violeta"','"sur", "azul"').replace('"oeste", "dorado"','"oeste", "rosa"')+'  private int pulsaciones = 0;\n\n  public void presionar(String boton, Robot r) {\n    pulsaciones++;\n'+PRESIONAR+'\n  public int getPulsaciones() {\n    return pulsaciones;\n  }\n}\n';
 // The autopilot (project 3): a class plan first, then the Piloto contract, two pilots and a fleet.
 const PILOTO='interface Piloto {\n  void paso(Robot r);\n}\n';
 const PATRULLA='class Patrulla implements Piloto {\n  public void paso(Robot r) {\n    if (r.puedeAvanzar()) {\n      r.avanzar();\n    } else {\n      r.girarDerecha();\n    }\n  }\n}\n';
 const DIRECTO='class Directo implements Piloto {\n  public void paso(Robot r) {\n    while (r.puedeAvanzar()) {\n      r.avanzar();\n    }\n  }\n}\n';
 const FLOTA='class Flota {\n  private Robot[] robots;\n  private Piloto[] pilotos;\n\n  Flota(Robot[] robots, Piloto[] pilotos) {\n    this.robots = robots;\n    this.pilotos = pilotos;\n  }\n\n  public void turno() {\n    for (int i = 0; i < robots.length; i++) {\n      pilotos[i].paso(robots[i]);\n    }\n  }\n}\n';
 const SKELETON={Piloto:'interface Piloto {\n}\n',Patrulla:'class Patrulla implements Piloto {\n}\n',Directo:'class Directo implements Piloto {\n}\n',Flota:'class Flota {\n}\n'};
 // The diagram: what each class is and how it relates to the others. Robot is the game's own class.
 const PLAN=Object.freeze({
  classes:['Piloto','Patrulla','Directo','Flota'],
  kinds:{interfaz:'Interfaz (contrato)',clase:'Clase'},
  relations:{ninguna:'Ninguna',implementa:'Implementa Piloto',contiene:'Contiene robots y pilotos'},
  answer:{Piloto:['interfaz','ninguna'],Patrulla:['clase','implementa'],Directo:['clase','implementa'],Flota:['clase','contiene']},
  hints:{
   Piloto:['Piloto solo promete un método, sin decir cómo se cumple: es un contrato, como Tarea en la misión 65.','Un contrato no implementa ni contiene a nadie: las demás clases lo cumplen.'],
   Patrulla:['Patrulla tiene su propio código para cada paso: es una clase.','Patrulla cumple la promesa de Piloto con su propia forma de avanzar (misión 66).'],
   Directo:['Directo tiene su propio código para cada paso: es una clase.','Directo también cumple la promesa de Piloto, a su manera (misión 70).'],
   Flota:['Flota guarda datos y tiene un método turno(): es una clase.','Flota reúne robots y pilotos dentro de ella, como el Servicio de la misión 90 contiene un robot y una ruta.']
  }
 });
 const SOUTH=1,DIR_NAMES=['este','sur','oeste','norte'];
 const FLEET='Robot[] robots = new Robot[]{robot, ayudante};\nPiloto[] pilotos = new Piloto[]{new Directo(), new Patrulla()};\nFlota flota = new Flota(robots, pilotos);';
 const PATROL='Control control = new Control();\nMando mando = control;\nRobot[] robots = new Robot[]{ayudante};\nPiloto[] pilotos = new Piloto[]{new Patrulla()};\nFlota flota = new Flota(robots, pilotos);';
 const levels={
  control:[
   {intro:'Todo proyecto empieza igual: un nombre, una carpeta para el código y un archivo por cada clase.',
    hints:['Escribe el nombre en la parte de arriba del explorador. Luego pulsa + Carpeta y crea src.','Selecciona la carpeta src, pulsa + Archivo y escribe Boton.java. Dentro escribe la clase vacía: class Boton { }'],
    tasks:[
     task('Ponle nombre al proyecto',ws=>!W.projectNameError(ws.name)),
     task('Crea la carpeta src',ws=>ws.folders.includes('src')),
     task('Crea el archivo Boton.java dentro de src',ws=>BOTON in ws.files),
     task('Declara la clase Boton en su archivo',ws=>!!classIn(ws,BOTON,'Boton')&&!W.analyze(BOTON,ws.files[BOTON]).problems.some(p=>p.severity==='error'))
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:'class Boton {\n}\n'}}},
   {intro:'Un botón recuerda dos datos: hacia dónde mueve a Miaubit y de qué color se dibuja. El constructor los guarda al crearlo.',
    harness:'Boton prueba = new Boton("norte", "violeta");',
    hints:['Dentro de class Boton declara String direccion; y String color; Después escribe el constructor Boton(String direccion, String color) { }','En el constructor, this.direccion = direccion; guarda el parámetro en el atributo del objeto, como en la misión 53. Haz lo mismo con color y pulsa Probar.'],
    tasks:[
     task('Boton tiene los atributos String direccion y String color',ws=>{const c=classIn(ws,BOTON,'Boton');return hasField(c,'direccion','String')&&hasField(c,'color','String');}),
     task('Un constructor recibe la dirección y el color',ws=>!!classIn(ws,BOTON,'Boton')?.methods.some(m=>m.name==='Boton'&&m.params.length===2&&m.params.every(p=>p.type==='String'))),
     task('Usa this para guardar cada parámetro en su atributo',ws=>{const text=W.strip(ws.files[BOTON]??'');return /this\s*\.\s*direccion\s*=/.test(text)&&/this\s*\.\s*color\s*=/.test(text);}),
     task('Al probar, new Boton("norte", "violeta") guarda esos valores',(ws,run)=>{const boton=created(run,'Boton');return boton?.fields.direccion?.text==='norte'&&boton?.fields.color?.text==='violeta';},{needsRun:true,
      explain:(ws,run)=>{const boton=created(run,'Boton');return boton&&Object.values(boton.fields).some(f=>f.text==='null')?'El botón se creó, pero sus atributos quedaron en null. Sin this, direccion = direccion; copia el parámetro sobre sí mismo y el atributo no cambia (misión 53).':null;}})
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:BOTON_PLANO+'}\n'}}},
   tested({intro:'Ahora cada botón mueve a Miaubit. Al pulsar Probar, el juego crea cuatro botones y los pulsa uno tras otro en el escenario.',
    stage:true,initial:{chargers:[],targets:[[1,2],[1,1],[0,1]]},
    probes:[press('derecha','este','dorado',[1,0]),press('arriba','norte','violeta',[0,-1]),press('izquierda','oeste','dorado',[-1,0]),press('abajo','sur','violeta',[0,1])],
    hints:['Dentro de Boton escribe el método void pulsar(Robot r) { }. Recibe el robot como parámetro, igual que en la misión 48.','Dentro de pulsar, una condición por dirección: if (direccion.equals("este")) { r.este(); } Repite con norte, sur y oeste; compara el texto con equals(), como en la misión 26.'],
    tasks:[
     task('Boton tiene el método void pulsar(Robot r)',ws=>!!classIn(ws,BOTON,'Boton')?.methods.some(m=>m.name==='pulsar'&&m.type==='void'&&m.params.length===1&&m.params[0].type==='Robot')),
     task('pulsar compara la dirección con equals()',ws=>{const text=W.strip(ws.files[BOTON]??'');return /direccion\s*\.\s*equals\s*\(/.test(text)||/"[^"]*"\s*\.\s*equals\s*\(\s*direccion\s*\)/.test(text);}),
     task('Cada botón mueve a Miaubit una casilla en su dirección',(ws,run,level)=>!!run?.compiled&&probe(level,ws).every(p=>p.state==='ok'),{needsRun:true,
      explain:(ws,run,level)=>{
       const bad=probe(level,ws).find(p=>p.state!=='ok');if(!bad)return null;
       if(bad.state==='error')return `Al pulsar ${bad.label}, el programa se detuvo: ${bad.message}`;
       if(at(bad.from)===at(bad.to))return `${bad.label} no movió a Miaubit. Compara la dirección con equals(), como en la misión 26, y llama al movimiento de r.`;
       return `${bad.label} llevó a Miaubit de ${at(bad.from)} a ${at(bad.to)}. Revisa qué movimiento llama la condición de "${bad.dir}".`;
      }})
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:BOTON_PULSAR}}}),
   tested({intro:'Un control reúne los cuatro botones. El juego te entrega la interfaz Mando: si tu clase Control la cumple, las flechas del control funcionarán.',
    stage:true,pad:true,game:[MANDO],initial:{chargers:[]},setup:'Mando mando = new Control();',
    probes:[arrow('derecha','este',[1,0]),arrow('arriba','norte',[0,-1]),arrow('izquierda','oeste',[-1,0]),arrow('abajo','sur',[0,1])],
    hints:['Abre juego/Mando.java: es la promesa que tu control debe cumplir. Crea src/Control.java con class Control implements Mando { }, como en las misiones 65 y 66.','Declara cuatro atributos, por ejemplo private Boton arriba = new Boton("norte", "violeta"); Luego, en public void presionar(String boton, Robot r), escribe if (boton.equals("arriba")) { arriba.pulsar(r); } para cada flecha.'],
    tasks:[
     task('Crea el archivo Control.java con la clase Control',ws=>!!controlClass(ws)),
     task('Control implementa la interfaz Mando',ws=>!!controlClass(ws)?.interfaces.includes('Mando')),
     task('Control guarda cuatro botones en atributos private',ws=>(controlClass(ws)?.fields.filter(f=>f.type==='Boton'&&f.mods.includes('private')).length??0)>=4),
     task('Cada flecha del control mueve a Miaubit hacia su lado',(ws,run,level)=>!!run?.compiled&&probe(level,ws).every(p=>p.state==='ok'),{needsRun:true,
      explain:(ws,run,level)=>{
       const bad=probe(level,ws).find(p=>p.state!=='ok');if(!bad)return null;
       if(bad.state==='error')return /tipo Mando/.test(bad.message)?'Control todavía no cumple la interfaz: escribe class Control implements Mando.':`Al presionar "${bad.name}", el programa se detuvo: ${bad.message}`;
       if(at(bad.from)===at(bad.to))return `La flecha "${bad.name}" no movió a Miaubit. En presionar, compara boton con equals() y llama a pulsar(r) del botón que corresponde.`;
       return `La flecha "${bad.name}" llevó a Miaubit de ${at(bad.from)} a ${at(bad.to)}; debía ir una casilla ${TOWARD[bad.dir]}. Revisa qué botón pulsa la condición de "${bad.name}".`;
      }})
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:BOTON_PULSAR,'src/Control.java':CONTROL}}}),
   {intro:'Último nivel: tu control cuenta sus pulsaciones, cada botón luce su color y tú llevas a Miaubit hasta la estrella usando las flechas.',
    stage:true,pad:true,play:true,game:[MANDO],initial:{chargers:[],walls:[[2,1],[2,2],[2,3]],targets:[[5,0]]},setup:'Control control = new Control();\nMando mando = control;',
    hints:['Agrega a Control private int pulsaciones = 0; súmale 1 al empezar presionar y devuélvelo en public int getPulsaciones(), como el contador de la misión 68.',`Cambia los colores de los new Boton(...) de Control. El control sabe dibujar: ${Object.keys(COLORS).join(', ')}. Después pulsa Probar y usa las flechas para rodear las rocas.`],
    tasks:[
     task('Control cuenta las pulsaciones en un atributo private int',ws=>!!controlClass(ws)?.fields.some(f=>f.type==='int'&&f.mods.includes('private'))),
     task('getPulsaciones() devuelve cuántas veces se presionó el control',(ws,run,level)=>!!run?.compiled&&counted(level,ws).ok,{needsRun:true,explain:(ws,run,level)=>counted(level,ws).explain}),
     task('Diseña tu control con al menos tres colores distintos',(ws,run)=>{const buttons=Object.values(padLayout(run)??{});return buttons.length===4&&buttons.every(b=>b?.known)&&new Set(buttons.map(b=>b.color)).size>=3;},{needsRun:true,
      explain:(ws,run)=>{
       const buttons=Object.values(padLayout(run)??{}),odd=buttons.find(b=>b&&!b.known);
       if(odd)return `No sé dibujar el color "${odd.color}". Usa uno de estos: ${Object.keys(COLORS).join(', ')}.`;
       const colors=new Set(buttons.filter(Boolean).map(b=>b.color)).size;
       return buttons.length&&colors<3?`Tu control usa ${colors===1?'un color':`${colors} colores`}. Cambia los colores en los new Boton(...) de Control hasta tener al menos tres distintos.`:null;
      }}),
     task('Lleva a Miaubit a la estrella con tu control',(ws,run,level)=>!!run?.presses&&!run.error&&reached(run,level),{needsRun:true,explain:()=>'Usa las flechas del control para llevar a Miaubit hasta la estrella, rodeando las rocas.'})
    ],
    solution:{name:'Control de Miaubit',folders:['src'],files:{[BOTON]:BOTON_PULSAR,'src/Control.java':CONTROL_FINAL}},
    route:['derecha','arriba','arriba','derecha','derecha','derecha','derecha']}
  ],
  cosecha:[
   {intro:'Tu control del Proyecto 1 llegó a la carpeta control. Un juego necesita además sus reglas: prepara una carpeta para ellas.',
    game:[MANDO],
    hints:['Escribe el nombre del proyecto. Selecciona la raíz, pulsa + Carpeta y crea reglas.','Selecciona la carpeta reglas y crea Marcador.java y Juego.java; dentro de cada uno escribe su clase vacía, como class Marcador { }.'],
    tasks:[
     task('Ponle nombre al proyecto',ws=>!W.projectNameError(ws.name)),
     task('Crea la carpeta reglas',ws=>ws.folders.includes('reglas')),
     task('Crea reglas/Marcador.java con la clase Marcador',ws=>declared(ws,MARC,'Marcador')),
     task('Crea reglas/Juego.java con la clase Juego',ws=>declared(ws,JUEGO,'Juego'))
    ],
    solution:withRules('Cosecha de cristales','class Marcador {\n}\n','class Juego {\n}\n')},
   {intro:'El marcador guarda los puntos de la cosecha. Nadie debe poder restarle puntos: protege el atributo y valida lo que entra.',
    game:[MANDO],harness:'Marcador marcador = new Marcador();\nmarcador.sumar(3);\nSystem.out.println(marcador.getPuntos());\nmarcador.sumar(-5);\nmarcador.sumar(0);\nSystem.out.println(marcador.getPuntos());',
    hints:['En Marcador declara private int puntos = 0; y escribe public int getPuntos() { return puntos; }, como en la misión 62.','Escribe public void sumar(int n) { if (n > 0) { puntos += n; } }: así el marcador rechaza valores negativos o cero, como el contador de la misión 68.'],
    tasks:[
     task('Marcador guarda los puntos en un atributo private int',ws=>!!classNamed(ws,'Marcador')?.fields.some(f=>f.type==='int'&&f.mods.includes('private'))),
     task('sumar(int n) agrega puntos y getPuntos() los devuelve',(ws,run)=>outputOf(run)[0]==='3',{needsRun:true,explain:(ws,run)=>failure(run)??(outputOf(run)[0]!=='3'?`Después de sumar(3), getPuntos() devolvió ${outputOf(run)[0]}. Suma n a los puntos dentro de sumar.`:null)}),
     task('sumar rechaza los valores que no son positivos',(ws,run)=>outputOf(run).join()==='3,3',{needsRun:true,explain:(ws,run)=>failure(run)??(outputOf(run)[0]==='3'&&outputOf(run)[1]!=='3'?`sumar(-5) y sumar(0) cambiaron los puntos a ${outputOf(run)[1]}. Protege el atributo con if (n > 0), como en la misión 68.`:null)})
    ],
    solution:withRules('Cosecha de cristales',MARCADOR,'class Juego {\n}\n')},
   {intro:'Ahora las reglas: después de cada movimiento, el juego llama a revisar(). Si Miaubit está sobre un cristal, lo recoge y el marcador suma un punto.',
    game:[MANDO],stage:true,look:'cristales',hud:true,initial:{chargers:[],boxes:[[1,2,1],[3,2,1]]},setup:'Control control = new Control();\nMando mando = control;\nJuego juego = new Juego(robot);',
    harness:'Control control = new Control();\nMando mando = control;\nJuego juego = new Juego(robot);\n'+['derecha','derecha','derecha'].map(stepCode).join('\n')+'\nSystem.out.println(juego.getPuntos());',
    hints:['En Juego declara private Robot robot; y private Marcador marcador = new Marcador(); y un constructor Juego(Robot robot) que guarde el robot con this, como el Servicio de la misión 90.','Escribe public void revisar() { if (robot.hayCaja()) { robot.recoger(); marcador.sumar(1); } } y public int getPuntos() { return marcador.getPuntos(); }'],
    tasks:[
     task('Juego guarda el robot y un Marcador en atributos private',ws=>{const c=classNamed(ws,'Juego');return ['Robot','Marcador'].every(type=>c?.fields.some(f=>f.type===type&&f.mods.includes('private')));}),
     task('Un constructor de Juego recibe el robot',ws=>!!classNamed(ws,'Juego')?.methods.some(m=>m.name==='Juego'&&m.params[0]?.type==='Robot')),
     task('revisar() recoge cada cristal y suma un punto',(ws,run)=>!!run?.compiled&&!run.error&&outputOf(run).at(-1)==='2'&&crystalsLeft(run)===0,{needsRun:true,explain:(ws,run)=>failure(run)??`Miaubit pasó por 2 cristales, pero getPuntos() devolvió ${outputOf(run).at(-1)}. En revisar(), recoge el cristal y llama a marcador.sumar(1).`})
    ],
    solution:withRules('Cosecha de cristales',MARCADOR,JUEGO_REGLAS)},
   {intro:'Miaubit empieza con poca energía. Juego debe recargarla en la estación (0, 4) y saber cuándo se alcanzó la meta.',
    game:[MANDO],stage:true,look:'cristales',hud:true,initial:{chargers:[[0,4]],boxes:[[2,2,1],[4,2,1]],robot:{energy:3}},setup:'Control control = new Control();\nMando mando = control;\nJuego juego = new Juego(robot, 2);',
    harness:'Control control = new Control();\nMando mando = control;\nJuego juego = new Juego(robot, 2);\n'+['abajo','abajo','arriba','arriba','derecha','derecha'].map(stepCode).join('\n')+'\nSystem.out.println(juego.termino());\n'+['derecha','derecha'].map(stepCode).join('\n')+'\nSystem.out.println(juego.termino());',
    hints:['Agrega private int meta; y cambia el constructor a Juego(Robot robot, int meta). Después escribe public boolean termino() { return marcador.getPuntos() >= meta; }, como en la misión 49.','En revisar(), recarga solo en la estación: if (robot.getX() == 0 && robot.getY() == 4) { robot.recargar(); } (misiones 24 y 28).'],
    tasks:[
     task('El constructor de Juego recibe el robot y la meta',ws=>!!classNamed(ws,'Juego')?.methods.some(m=>m.name==='Juego'&&m.params.length===2&&m.params[0].type==='Robot'&&m.params[1].type==='int')),
     task('Juego guarda la meta en un atributo private int',ws=>!!classNamed(ws,'Juego')?.fields.some(f=>f.type==='int'&&f.mods.includes('private'))),
     task('revisar() recarga en la estación (0, 4)',(ws,run)=>!!run?.compiled&&!run.error,{needsRun:true,explain:(ws,run)=>failure(run)}),
     task('termino() devuelve true solo al alcanzar la meta',(ws,run)=>!!run?.compiled&&!run.error&&outputOf(run).join()==='false,true',{needsRun:true,
      explain:(ws,run)=>failure(run)??(outputOf(run)[0]!=='false'?'termino() dijo true con un solo punto: compara los puntos del marcador con la meta.':`Con 2 puntos y meta 2, termino() devolvió ${outputOf(run)[1]}. Devuelve marcador.getPuntos() >= meta.`)})
    ],
    solution:withRules('Cosecha de cristales',MARCADOR,JUEGO_META)},
   {intro:'¡La partida! Usa tu control para recoger los cuatro cristales. Miaubit empieza con 8 de energía: planea cuándo pasar por la estación.',
    game:[MANDO],stage:true,look:'cristales',hud:true,pad:true,play:true,goal:'fin',
    initial:{chargers:[[0,4]],boxes:[[2,0,1],[5,1,1],[3,4,1],[5,4,1]],walls:[[2,2],[3,2]],robot:{energy:8}},
    setup:'Control control = new Control();\nMando mando = control;\nJuego juego = new Juego(robot, 4);',tick:'juego.revisar();',after:'boolean fin = juego.termino();',
    hints:['Con 8 de energía no alcanzas todos los cristales: ve primero a la estación (0, 4) para recargar.','Una ruta posible: dos veces abajo, cinco a la derecha, cuatro arriba y tres a la izquierda.'],
    tasks:[
     task('Recoge los cuatro cristales jugando con tu control',(ws,run)=>!!run?.presses&&!run.error&&crystalsLeft(run)===0,{needsRun:true,explain:()=>'Juega con las flechas: pasa por la estación (0, 4) antes de quedarte sin energía y recoge los cuatro cristales.'}),
     task('termino() anuncia el final de la cosecha',(ws,run)=>!!run?.presses&&!run.error&&run.result.final.vars.fin?.text==='true',{needsRun:true,
      explain:(ws,run)=>run?.presses&&crystalsLeft(run)===0?'Recogiste todo, pero termino() devolvió false: compara los puntos con la meta.':null})
    ],
    solution:withRules('Cosecha de cristales',MARCADOR,JUEGO_META),
    route:['abajo','abajo','derecha','derecha','derecha','derecha','derecha','arriba','arriba','arriba','arriba','izquierda','izquierda','izquierda']}
  ],
  piloto:[
   {intro:'Antes de programar, un buen proyecto se diseña. Decide en el plano qué es cada pieza y cómo se relacionan; después genera sus archivos.',
    game:[MANDO],plan:true,
    hints:['Una interfaz es un contrato: promete métodos sin decir cómo se cumplen. ¿Cuál de las cuatro piezas es solo una promesa?','Patrulla y Directo cumplen el contrato de Piloto; Flota contiene robots y pilotos. Cuando el plano esté listo, pulsa Generar archivos del plano.'],
    tasks:[
     task('Ponle nombre al proyecto',ws=>!W.projectNameError(ws.name)),
     task('En el plano, Piloto es un contrato y las demás piezas son clases',ws=>planCheck(ws).every(c=>c.kindOk)),
     task('En el plano, Patrulla y Directo implementan Piloto y Flota contiene robots y pilotos',ws=>planCheck(ws).every(c=>c.relationOk)),
     task('Genera los archivos desde tu plano',ws=>{const piloto=classNamed(ws,'Piloto');return !!piloto?.isInterface&&['Patrulla','Directo'].every(n=>classNamed(ws,n)?.interfaces.includes('Piloto'))&&!!classNamed(ws,'Flota');})
    ],
    solution:pilotBase()},
   {intro:'El contrato dice qué debe saber hacer cualquier piloto: dar un paso con un robot. Escríbelo en la interfaz Piloto.',
    game:[MANDO],harness:'Piloto patrulla = new Patrulla();\nPiloto directo = new Directo();',
    hints:['Dentro de interface Piloto escribe la promesa sin cuerpo: void paso(Robot r); igual que Tarea en la misión 65.','Patrulla y Directo deben decir implements Piloto para que el juego pueda guardarlos en variables de tipo Piloto.'],
    tasks:[
     task('Piloto promete el método void paso(Robot r)',ws=>!!classNamed(ws,'Piloto')?.methods.some(m=>m.name==='paso'&&m.type==='void'&&m.params.length===1&&m.params[0].type==='Robot'&&!m.body)),
     task('Patrulla y Directo se pueden usar como Piloto',(ws,run)=>!!run?.compiled&&!run.error,{needsRun:true,explain:(ws,run)=>run?.error?/tipo Piloto/.test(run.error.message)?'Patrulla y Directo deben decir implements Piloto para guardarse en una variable Piloto.':failure(run):null})
    ],
    solution:withPilots({Piloto:PILOTO})},
   tested({intro:'Dos formas de pilotar. Patrulla da un paso si puede y, si no, gira. Directo avanza hasta que algo lo detiene. El juego probará ambas.',
    game:[MANDO],stage:true,initial:{chargers:[],walls:[[3,2]]},
    probes:[
     Object.freeze({label:'Directo',call:'directo.paso(robot)',code:'Piloto directo = new Directo();\ndirecto.paso(robot);',move:[2,0],expect:'Debe avanzar hasta la roca: de (0, 2) a (2, 2).'}),
     Object.freeze({label:'Patrulla',call:'patrulla.paso(robot)',code:'Piloto patrulla = new Patrulla();\npatrulla.paso(robot);',move:[0,0],face:SOUTH,expect:'La roca está delante: debe girar a la derecha sin moverse.'}),
     Object.freeze({label:'Patrulla',call:'patrulla.paso(robot)',code:'patrulla.paso(robot);',move:[0,1],face:SOUTH,expect:'Ahora el camino está libre: debe avanzar una casilla al sur.'})
    ],
    hints:['En Directo: public void paso(Robot r) { while (r.puedeAvanzar()) { r.avanzar(); } } avanza hasta el obstáculo, como en la misión 38.','En Patrulla: if (r.puedeAvanzar()) { r.avanzar(); } else { r.girarDerecha(); }, como el desvío de la misión 29.'],
    tasks:[
     task('Patrulla consulta el sensor puedeAvanzar()',ws=>/puedeAvanzar\s*\(/.test(W.strip(fileOf(ws,'Patrulla')))),
     task('Directo repite con while mientras pueda avanzar',ws=>/while\s*\(/.test(W.strip(fileOf(ws,'Directo')))),
     task('Cada piloto mueve a Miaubit a su manera',(ws,run,level)=>!!run?.compiled&&probe(level,ws).every(p=>p.state==='ok'),{needsRun:true,explain:(ws,run,level)=>pilotExplain(probe(level,ws))})
    ],
    solution:withPilots({Piloto:PILOTO,Patrulla:PATRULLA,Directo:DIRECTO})}),
   tested({intro:'Una flota reúne robots y pilotos. En cada turno, cada robot da un paso con su propio piloto: Miaubit con Directo y Luna con Patrulla.',
    game:[MANDO],stage:true,initial:{chargers:[],walls:[[4,2]],helper:{}},setup:FLEET,
    probes:[
     Object.freeze({label:'Turno 1',call:'flota.turno()',code:'flota.turno();',moves:{Miaubit:[3,0],Luna:[1,0]},expect:'Miaubit (Directo) avanza hasta la roca y Luna (Patrulla) da un paso.'}),
     Object.freeze({label:'Turno 2',call:'flota.turno()',code:'flota.turno();',moves:{Miaubit:[0,0],Luna:[1,0]},expect:'Miaubit ya no puede avanzar; Luna da otro paso.'})
    ],
    hints:['En Flota declara private Robot[] robots; y private Piloto[] pilotos; y un constructor Flota(Robot[] robots, Piloto[] pilotos) que los guarde con this.','En public void turno(), recorre la flota: for (int i = 0; i < robots.length; i++) { pilotos[i].paso(robots[i]); } (misiones 77 y 85).'],
    tasks:[
     task('Flota guarda los robots y los pilotos en arreglos private',ws=>{const c=classNamed(ws,'Flota');return ['Robot[]','Piloto[]'].every(type=>c?.fields.some(f=>f.type===type&&f.mods.includes('private')));}),
     task('El constructor de Flota recibe los dos arreglos',ws=>!!classNamed(ws,'Flota')?.methods.some(m=>m.name==='Flota'&&m.params.map(p=>p.type).join()==='Robot[],Piloto[]')),
     task('turno() da un paso a cada robot con su propio piloto',(ws,run,level)=>!!run?.compiled&&probe(level,ws).every(p=>p.state==='ok'),{needsRun:true,explain:(ws,run,level)=>fleetExplain(probe(level,ws))})
    ],
    solution:withPilots({Piloto:PILOTO,Patrulla:PATRULLA,Directo:DIRECTO,Flota:FLOTA})}),
   {intro:'¡La patrulla final! Luna recorre el tablero sola con su Patrulla y tú llevas a Miaubit a la estrella con tu control, sin chocar con ella.',
    game:[MANDO],stage:true,pad:true,play:true,
    initial:{chargers:[],walls:[[2,2],[3,2]],targets:[[5,2]],helper:{x:1,y:0,dir:0}},setup:PATROL,tick:'flota.turno();',
    harness:PATROL+'\n'+Array(4).fill('flota.turno();').join('\n'),
    hints:['Luna recorre la fila de arriba y después baja por la columna de la estrella. Si llegas muy rápido, te la encuentras.','Gana tiempo: muévete a un lado y regresa antes de subir. Una ruta posible es derecha, izquierda, derecha, arriba, cuatro veces derecha y abajo.'],
    tasks:[
     task('Tu Flota mueve a Luna en cada turno',(ws,run,level)=>!!run?.compiled&&patrolled(level,ws).ok,{needsRun:true,
      explain:(ws,run,level)=>{const check=patrolled(level,ws);return check.ok?null:failure(check.run)??'Después de 4 turnos, Luna debía llegar a (5, 0). Revisa que turno() dé un paso con pilotos[i] a robots[i].';}}),
     task('Lleva a Miaubit a la estrella sin chocar con Luna',(ws,run,level)=>!!run?.presses&&!run.error&&reached(run,level)&&!collided(run),{needsRun:true,
      explain:()=>'Usa las flechas del control. Luna se mueve después de cada flecha: si van a coincidir en la misma casilla, el juego te detiene.'})
    ],
    solution:withPilots({Piloto:PILOTO,Patrulla:PATRULLA,Directo:DIRECTO,Flota:FLOTA}),
    route:['derecha','izquierda','derecha','arriba','derecha','derecha','derecha','derecha','abajo']}
  ]
 };
 // The plan on the diagram, class by class: right kind, right relation, and a hint when it is not.
 function planCheck(ws){
  const plan=ws.plan??{};
  return PLAN.classes.map(name=>{
   const kind=plan[name+'Tipo']??'',relation=plan[name+'Relacion']??'',[wantKind,wantRelation]=PLAN.answer[name];
   const kindOk=kind===wantKind,relationOk=relation===wantRelation;
   return {name,kind,relation,kindOk,relationOk,hint:!kind?'Elige qué es esta pieza.':!kindOk?PLAN.hints[name][0]:!relation?'Elige cómo se relaciona.':!relationOk?PLAN.hints[name][1]:null};
  });
 }
 // Generating from the plan creates the missing skeleton files in pilotos/, never overwriting the player's files.
 function generatePlan(ws){
  if(!planCheck(ws).every(c=>c.kindOk&&c.relationOk))return null;
  const next=W.clone(ws);if(!next.folders.includes('pilotos')){next.folders.push('pilotos');next.folders.sort();}
  for(const [name,text] of Object.entries(SKELETON))if(!Object.keys(next.files).some(p=>W.basename(p)===name+'.java'))next.files[`pilotos/${name}.java`]=text;
  return next;
 }
 // Reference workspaces of the autopilot: the finished plan with its generated files, then each level's code.
 function pilotBase(){return generatePlan({...startWorkspace('piloto',null),name:'Piloto automático',plan:Object.fromEntries(Object.entries(PLAN.answer).flatMap(([name,[kind,relation]])=>[[name+'Tipo',kind],[name+'Relacion',relation]]))});}
 function withPilots(files){const base=pilotBase();return {...base,files:{...base.files,...Object.fromEntries(Object.entries(files).map(([name,text])=>[`pilotos/${name}.java`,text]))}};}
 // Luna alone, four turns: her Patrulla takes her along the top row to (5, 0).
 function patrolled(level,ws){const run=W.run(ws,{game:level.game??[],harness:PATROL+'\n'+Array(4).fill('flota.turno();').join('\n'),initial:level.initial??{}});const luna=robotsOf(run).Luna;return {run,ok:!!run.compiled&&!run.error&&luna?.x===5&&luna?.y===0};}
 function fileOf(ws,name){const path=Object.keys(ws.files).find(p=>W.basename(p)===name+'.java');return path?ws.files[path]:'';}
 function robotsOf(run){return Object.fromEntries((run?.result?.final?.objects??[]).filter(o=>o.robot).map(o=>[o.robot.name,o.robot]));}
 // Robots never share a cell: Luna's step comes after Miaubit's, so the check is done once the turn ends.
 function collided(run){const {Miaubit:m,Luna:l}=robotsOf(run);return !!m&&!!l&&m.x===l.x&&m.y===l.y;}
 function pilotExplain(results){
  const bad=results.find(p=>p.state!=='ok');if(!bad)return null;const index=results.indexOf(bad);
  if(bad.state==='error')return /no tiene el método paso|Falta implementar/.test(bad.message)?'Escribe public void paso(Robot r) { } en Patrulla y en Directo.'
   :/obstáculo|salir del mapa/.test(bad.message)?`${bad.label} chocó: avanza solo si r.puedeAvanzar() es true (misiones 29 y 38).`:`Al probar ${bad.label}, el programa se detuvo: ${bad.message}`;
  if(index===0)return at(bad.from)===at(bad.to)?'Directo no movió a Miaubit: avanza mientras r.puedeAvanzar() sea true (misión 38).':`Directo llegó a ${at(bad.to)} y debía llegar a (2, 2): repite con while (r.puedeAvanzar()) { r.avanzar(); } (misión 38).`;
  if(index===1)return `Con la roca delante, Patrulla debe girar a la derecha y quedar mirando al sur; quedó mirando al ${DIR_NAMES[bad.after?.Miaubit?.[2]]??'mismo lado'} en ${at(bad.to)}.`;
  return 'Después de girar, Patrulla debe avanzar una casilla: revisa la rama if (r.puedeAvanzar()) { r.avanzar(); }.';
 }
 function fleetExplain(results){
  const bad=results.find(p=>p.state!=='ok');if(!bad)return null;
  if(bad.state==='error')return /tipo|constructor|parámetros/.test(bad.message)?'El juego crea new Flota(robots, pilotos): escribe un constructor que reciba los dos arreglos.':`Al jugar ${bad.label}, el programa se detuvo: ${bad.message}`;
  const moved=name=>bad.after?.[name]&&bad.before?.[name]&&(bad.after[name][0]!==bad.before[name][0]||bad.after[name][1]!==bad.before[name][1]);
  if(!moved('Miaubit')&&!moved('Luna'))return 'turno() no movió a nadie: dentro del for, llama a pilotos[i].paso(robots[i]).';
  if(!moved('Luna'))return 'turno() solo movió al primer robot: recorre todo el arreglo con for (int i = 0; i < robots.length; i++) (misión 77).';
  return 'Un robot usó el piloto equivocado: en el for, cada robot usa el piloto de su misma posición, pilotos[i].paso(robots[i]) (misión 85).';
 }
 // A project can start with files from the previous one: the harvest reuses the player's own control.
 function startWorkspace(projectId,saved){
  if(!['cosecha','piloto'].includes(projectId))return W.empty();
  const source=saved?.projects?.control?.workspace,fallback={'Boton.java':BOTON_PULSAR,'Control.java':CONTROL_FINAL},files={};
  for(const name of ['Boton.java','Control.java']){const own=source&&Object.keys(source.files).find(p=>W.basename(p)===name);files['control/'+name]=own?source.files[own]:fallback[name];}
  return {name:'',folders:['control'],files};
 }
 function declared(ws,path,name){return !!classIn(ws,path,name)&&!W.analyze(path,ws.files[path]).problems.some(p=>p.severity==='error');}
 function withRules(name,marcador,juego){const start=startWorkspace('cosecha',null);return {name,folders:['control','reglas'],files:{...start.files,[MARC]:marcador,[JUEGO]:juego}};}
 function outputOf(run){return run?.compiled&&run.result?.final?run.result.final.output:[];}
 function crystalsLeft(run){return (run?.result?.final?.world.boxes??[]).reduce((sum,box)=>sum+box[2],0);}
 // Errors of the harvest rules, explained with the missions that taught the fix.
 function failure(run){
  const message=run?.compiled?run.error?.message:null;if(!message)return null;
  if(/caja para recoger/.test(message))return 'revisar() intentó recoger donde no hay cristal: comprueba robot.hayCaja() antes de recoger, como en la misión 22.';
  if(/sin energía/.test(message))return 'Miaubit se quedó sin energía: en revisar(), recarga cuando esté en la estación (0, 4), como en la misión 28.';
  if(/estación/.test(message))return 'recargar() solo funciona en la estación: compara robot.getX() y robot.getY() con (0, 4) usando &&, como en la misión 24.';
  const code=run.error.code?.replace(/;$/,'');
  if(run.error.harness&&/\bnew \w+\(/.test(code)&&/constructor|espera \d+ parámetros/.test(message))return `El juego ejecutó ${code}: escribe un constructor que reciba esos parámetros.`;
  return run.error.harness?`Al probar, el juego ejecutó ${code} y ocurrió esto: ${message}`:`${run.error.path}, línea ${run.error.line}: ${message}`;
 }
 // The scoreboard is read from the player's objects: the Marcador inside juego, its meta and Miaubit's energy.
 function hudOf(level,run){
  const final=run?.compiled?run.result?.final:null;if(!final)return null;
  const byId=new Map(final.objects.map(o=>[o.id,o])),juego=byId.get(final.vars.juego?.objectId),robot=final.objects.find(o=>o.robot?.name==='Miaubit')?.robot;
  const marcador=Object.values(juego?.fields??{}).map(f=>byId.get(f.objectId)).find(o=>o?.cls==='Marcador');
  const number=(object,name)=>{const field=object?.fields[name]??Object.values(object?.fields??{}).find(f=>f.type==='int');return field&&field.text!=='null'?Number(field.text):null;};
  return {puntos:number(marcador,'puntos'),meta:juego?.fields.meta?Number(juego.fields.meta.text):null,energia:robot?.energy??null,cristales:crystalsLeft(run),total:(level.initial?.boxes??[]).reduce((sum,box)=>sum+box[2],0)};
 }
 const won=(level,run)=>!!run&&!run.error&&(level.goal==='fin'?run.result.final.vars.fin?.text==='true':reached(run,level));
 // What Probar runs after the player's files: the probes, or only the setup in levels without them.
 const harnessFor=level=>level.harness??level.setup??'';
 // The harness of a play session: the level's setup, then one presionar call per arrow pressed.
 function playHarness(level,presses){return [level.setup,...presses.filter(p=>p in PAD).flatMap(p=>[`mando.presionar("${p}", robot);`,level.tick]),level.after].filter(Boolean).join('\n');}
 function reached(run,level){const robot=run.result.final?.objects.find(o=>o.robot?.name==='Miaubit')?.robot;return !!robot&&(level.initial?.targets??[]).some(([x,y])=>robot.x===x&&robot.y===y);}
 // The player's counter must match three presses made by the game.
 function counted(level,ws){
  const run=W.run(ws,{game:level.game??[],harness:playHarness(level,['derecha','arriba','izquierda'])+'\nSystem.out.println(control.getPulsaciones());',initial:level.initial??{}});
  if(!run.compiled)return {ok:false,explain:null};
  if(run.error)return {ok:false,explain:/getPulsaciones/.test(run.error.message)?'Escribe en Control public int getPulsaciones() { return pulsaciones; }':`Al contar las pulsaciones ocurrió esto: ${run.error.message}`};
  const value=run.result.final.output.at(-1);
  return value==='3'?{ok:true,explain:null}:{ok:false,explain:`Después de 3 pulsaciones, getPulsaciones() devolvió ${value}. Suma 1 a pulsaciones cada vez que se llama presionar.`};
 }
 // How the control looks: for each arrow, the Boton the player's Control holds for that direction, with its color.
 function padLayout(run){
  const final=run?.compiled&&!run.error?run.result.final:null,id=final?.vars.mando?.objectId;if(!id)return null;
  const byId=new Map(final.objects.map(o=>[o.id,o])),control=byId.get(id),buttons=Object.entries(control?.fields??{}).filter(([,f])=>f.type==='Boton'&&f.objectId).map(([field,f])=>({field,boton:byId.get(f.objectId)}));
  const layout={};
  for(const [key,dir] of Object.entries(PAD)){
   const found=buttons.find(b=>b.boton?.fields.direccion?.text===dir);if(!found){layout[key]=null;continue;}
   const color=found.boton.fields.color?.text??'';layout[key]={field:found.field,direccion:dir,color,hex:COLORS[color]??'#5d6b66',known:color in COLORS};
  }
  return layout;
 }
 // Runs the probes one by one, each from where the previous left the robots; stops at the first error.
 // A probe expects `move` for Miaubit or `moves` per robot name, and optionally the direction Miaubit must `face`.
 function probe(level,ws){
  if(!level.probes)return [];
  const places=final=>Object.fromEntries((final?.objects??[]).filter(o=>o.robot).map(o=>[o.robot.name,[o.robot.x,o.robot.y,o.robot.dir]]));
  let before=places(RobotJava.execute('',level.initial??{}).initial),stopped=false;
  return level.probes.map((p,i)=>{
   if(stopped)return {...p,state:'skipped'};
   const run=W.run(ws,{game:level.game??[],harness:[level.setup,...level.probes.slice(0,i+1).map(q=>q.code)].filter(Boolean).join('\n'),initial:level.initial??{}});
   const after=run.compiled?places(run.result.final):before,from=before.Miaubit.slice(0,2),to=(after.Miaubit??before.Miaubit).slice(0,2),base={...p,from,to,before,after};
   if(!run.compiled){stopped=true;return {...base,state:'error',message:'el proyecto tiene errores.'};}
   if(run.error){stopped=true;return {...base,state:'error',message:run.error.message};}
   const ok=Object.entries(p.moves??{Miaubit:p.move}).every(([name,[dx,dy]])=>after[name]&&after[name][0]-before[name][0]===dx&&after[name][1]-before[name][1]===dy)&&(p.face===undefined||after.Miaubit?.[2]===p.face);
   before=after;return {...base,state:ok?'ok':'wrong'};
  });
 }
 for(const list of Object.values(levels))list.forEach(Object.freeze);
 const get=(projectId,index)=>levels[projectId]?.[index]??null,count=projectId=>levels[projectId]?.length??0;
 // explain(ws, run) may describe why a task still fails, in the terms of the mission that taught it.
 function evaluate(level,ws,run=null){
  const tasks=level.tasks.map(t=>{const done=!!t.check(ws,run,level);return {text:t.text,needsRun:t.needsRun,done,explain:!done&&t.explain&&run?t.explain(ws,run,level)??null:null};});
  return {tasks,complete:tasks.every(t=>t.done)};
 }
 // Browser progress: one entry per project with its workspace, current level and finished levels.
 function restore(raw){
  const saved={};
  for(const project of projects){
   const entry=raw?.projects?.[project.id];if(!entry||typeof entry!=='object')continue;
   const workspace=W.restore(entry.workspace);if(!workspace)continue;
   const total=project.levels.length,done=[...new Set(Array.isArray(entry.done)?entry.done:[])].filter(i=>Number.isInteger(i)&&i>=0&&i<total).sort((a,b)=>a-b);
   const level=Number.isInteger(entry.level)?Math.max(0,Math.min(entry.level,total-1)):0;
   saved[project.id]={workspace,level,done};
  }
  return {version:1,projects:saved};
 }
 const finished=saved=>new Set(projects.filter(p=>saved.projects[p.id]?.done.length===p.levels.length).map(p=>p.id));
 globalThis.MiaubitLevels={get,count,evaluate,probe,harnessFor,playHarness,padLayout,reached,won,collided,hudOf,startWorkspace,planCheck,generatePlan,PLAN,DIR_NAMES,PAD,COLORS,restore,finished};
})();
