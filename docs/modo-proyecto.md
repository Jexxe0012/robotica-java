# Modo Proyecto

El Modo Proyecto es una segunda forma de jugar, separada de la aventura. La aventura enseña con 90 misiones cortas; el Modo Proyecto pide **integrar** lo aprendido construyendo algo completo con Miaubit, como se haría en un IDE, pero gamificado: crear el proyecto, sus carpetas y archivos, programar las clases, probar y ver el resultado en el escenario.

Se desbloquea al completar las 90 misiones. La primera versión incluye **tres proyectos**, cada uno más exigente que el anterior y formado por niveles que se acumulan: el código de un nivel sigue presente en el siguiente, de modo que el proyecto crece como uno real.

## Reglas

| Regla | Consecuencia |
| --- | --- |
| **Solo lo visto en las 90 misiones** | Cada nivel indica las misiones donde se aprendió lo que usa. Combinar conceptos vistos está permitido (por ejemplo, un atributo de tipo `String`); la sintaxis o las ideas de Java que no aparecen en las misiones no se usan. |
| **El modo aventura no se modifica** | El Modo Proyecto vive en su propia página y carpeta. Los archivos compartidos solo reciben las líneas listadas en [Archivos compartidos](#archivos-compartidos). |
| **Desbloqueo con las 90 misiones** | La página lee `GET /api/progress` sin escribir en él. Mientras falten misiones, muestra cuántas quedan. Solo el servidor local (`127.0.0.1`) permite desbloquearlo para desarrollar. |
| **Guardado en el navegador** | El avance y el código de los proyectos se guardan en el navegador. Guardarlos por usuario en D1 es una etapa futura, fuera de este plan. |

Construcciones que **no** se usan porque ninguna misión las enseña: `else if` (se escriben condiciones `if` independientes), `switch`, `package`, `import`, excepciones, expresiones lambda, eventos y frameworks como Swing o JavaFX. El intérprete tampoco admite la mayoría de ellas.

Las únicas ideas nuevas pertenecen al taller y no son sintaxis Java: un proyecto tiene un nombre, carpetas y archivos, y cada archivo contiene una clase con su mismo nombre. Las carpetas organizan el proyecto visualmente; no se convierten en paquetes.

## Arquitectura

| Pieza | Ubicación | Responsabilidad |
| --- | --- | --- |
| Página | `web/proyectos.html` | Entrada independiente; no forma parte de `journey.js` ni de sus rutas |
| Datos y reglas | `web/proyectos/catalogo.js`, `espacio.js`, `niveles.js` | Sin DOM y probados en Node: catálogo y desbloqueo; carpetas, archivos, reglas de Java, unión y ejecución; niveles jugables, evaluación y progreso guardado |
| Pantallas | `web/proyectos/pagina.js`, `taller.js`, `escena.js` | Entrada, candado y tarjetas; el taller con explorador, editor, resultado y objetivos; el escenario Phaser |
| Estilos | `web/proyectos/proyectos.css`, `taller.css` | Portada del modo y taller |
| Imágenes | `web/proyectos/assets/` | `miaubit-camina.png`, la hoja de caminata de Miaubit |
| Generador de arte | `tools/miaubit-arte/` | Scripts que dibujan a Miaubit; reproducen exactamente los sprites de la aventura y la hoja del modo |
| Pruebas | `tests/projects.mjs` | Desbloqueo, ejecución, niveles y regla de conceptos |

El build y el servidor local ya publican cualquier archivo dentro de `web/`, incluidas sus subcarpetas, así que no requieren cambios. El servidor local detecta los archivos al iniciar: después de crear uno nuevo hay que reiniciar `npm run dev`.

### Ejecución sin modificar el intérprete

El Modo Proyecto usa `RobotJava.execute(source, initial)` tal como existe. El taller une los archivos del jugador en un único programa, recuerda la línea donde empieza cada archivo y agrega al final las instrucciones del juego. Un error del intérprete se traduce de vuelta a su archivo y línea; por ejemplo, la línea 7 del programa unido se informa como `Boton.java`, línea 7.

Antes de ejecutar, cada archivo se analiza por separado con `RobotJava.Parser`, como si se compilara: debe contener una sola clase o interfaz con el nombre del archivo y ninguna instrucción suelta. Si hay errores, el programa no se ejecuta. Las construcciones excluidas (`else if`, `switch`, `import`, `package`) se señalan como avisos con la alternativa que enseñan las misiones. Un error dentro de la prueba del juego se explica mostrando la instrucción que el juego ejecutó.

El juego entrega archivos de solo lectura, igual que la aventura entrega `Robot`. El primero es un contrato que el jugador implementa, con la misma forma que `Tarea` en m65 y m66:

```java
interface Mando { void presionar(String boton, Robot r); }
```

Al pulsar un botón del control virtual, el juego vuelve a ejecutar el programa con **todas** las pulsaciones anteriores más la nueva:

```java
Mando mando = new Control();
mando.presionar("derecha", robot);
mando.presionar("arriba", robot);
```

El intérprete es determinista, así que la repetición reproduce exactamente el estado anterior y solo se anima el último tramo. Un prototipo con el intérprete actual midió unos 16 eventos por pulsación; con el límite de 1 200 pasos caben unas 70. Antes de alcanzarlo, el juego toma el estado del tablero como nuevo punto de partida. Un choque contra el borde o una roca se muestra como retroalimentación visual y la pulsación se descarta.

Las instantáneas del intérprete incluyen los atributos de cada objeto. La escena dibuja el control con el color y la etiqueta que el jugador escribió en sus objetos `Boton`, y el marcador lee los objetos del jugador. Los límites del intérprete se mantienen: tablero de 6 × 5, energía 20, 80 objetos, 160 vueltas por bucle y 24 llamadas anidadas.

### Escena y arte

El modo tiene su propia escena Phaser en `web/proyectos/escena.js`; `web/adventure-scene.js` no se toca. Phaser se descarga la primera vez que un nivel necesita el escenario, así que la entrada y los niveles sin tablero no lo cargan. La escena dibuja el tablero de 6 × 5 casillas de 48 píxeles con las cajas, rocas, destinos y estaciones del estado inicial del nivel, sin escalar a fracciones: se amplía al doble solo cuando cabe.

Miaubit camina con `web/proyectos/assets/miaubit-camina.png`, una hoja de 192 × 192 píxeles: cuatro filas (sur, norte, este y oeste) de cuatro cuadros de 48 píxeles. Mira hacia donde camina y, al detenerse, vuelve a la orientación que indica el intérprete; las direcciones absolutas no la cambian. La aventura conserva su hoja actual.

Después de **Probar**, `MiaubitWorkshop.frames()` reduce la traza a los momentos en que cambian los robots o el tablero, y la escena los anima casilla por casilla. Si la ejecución termina contra un borde o una roca, `blocked()` deduce la dirección desde la línea del error y Miaubit choca en esa dirección. Con movimiento reducido, la escena salta al estado final.

El generador se versiona en `tools/miaubit-arte/` sin cambios respecto de los originales; `exportar-proyectos.mjs` escribe la hoja del modo. Las pruebas comprueban que la hoja publicada es idéntica a la que dibuja el generador.

## Archivos compartidos

| Archivo | Cambio | Motivo |
| --- | --- | --- |
| `web/index.html` | Un enlace **Modo proyecto** en el menú de inicio | Única puerta de entrada desde la aventura |
| `package.json` | Script `test:projects` | Ejecutar las pruebas del modo |
| `.github/workflows/ci.yml` | Un paso con `npm run test:projects` | Validar el modo en cada pull request |
| `.gitignore` | Excepción para `web/proyectos/assets/*.png` | Hoy se ignoran los PNG fuera de `web/assets/` |
| `README.md` | Un párrafo con enlace a este documento | Documentar el modo |

No se modifican `engine.js`, `lessons.js`, `campaign.js`, `adventure-*.js`, `journey.js`, `app.js`, `game-hub.js`, `achievements.js`, `worlds.js`, `export.js`, `server/`, `db/`, `drizzle/` ni los estilos de la aventura. El modo depende, solo para leer, de `RobotJava.execute`, `SiteAssets.url`, `AtlasWorlds` (nombres y colores de las regiones), Phaser, la fuente Pixelify Sans, el retrato `assets/atlas-crt.png` y `GET /api/progress`. Si alguno de esos contratos cambia, `tests/projects.mjs` falla y avisa antes de integrar.

Las imágenes del modo no van en `web/assets/`, porque `tests/assets.mjs` exige que cada archivo de esa carpeta se use desde la página de la aventura.

## Los tres proyectos

Cada proyecto se abre al terminar el anterior. Sus niveles se juegan en orden y conservan el código ya escrito.

### Proyecto 1 · El control de Miaubit

Construir desde cero un control virtual con el que el jugador mueve a Miaubit.

| Nivel | Actividad | Misiones |
| --- | --- | --- |
| 1 · Crea el proyecto | Nombrar el proyecto, crear la carpeta `src` y el archivo `Boton.java` | Taller; clases en m51 |
| 2 · El plano del botón | `class Boton` con los atributos `direccion` y `color` y un constructor que usa `this` | m51, m52, m53, m26 |
| 3 · Cada botón sabe moverse | `pulsar(Robot r)` con una condición `if` y `equals()` por dirección | m26, m41, m48 |
| 4 · Arma el control | `Control implements Mando`, con cuatro botones privados y `presionar(String boton, Robot r)` | m57, m62, m65, m66, m90 |
| 5 · Diseña y juega | Cambiar colores y etiquetas, contar pulsaciones y llevar a Miaubit a la meta con el control propio | m58, m68 |

### Proyecto 2 · La cosecha de cristales

Convertir el control en un juego con reglas: recoger cristales y ganar antes de quedarse sin energía.

| Nivel | Actividad | Misiones |
| --- | --- | --- |
| 1 · Infraestructura | Crear las carpetas `juego` y `control` y los archivos `Marcador.java` y `Juego.java`; el control del Proyecto 1 llega terminado | m50, m90 |
| 2 · Marcador protegido | `private int puntos`, `sumar(int n)` que rechaza valores no positivos y `getPuntos()` | m61, m62, m68 |
| 3 · Reglas del juego | `Juego` contiene el robot y el marcador; `revisar()` recoge con `hayCaja()` y suma puntos | m22, m24, m90 |
| 4 · Energía y meta | Un botón de acción recarga en la estación; `termino()` devuelve si se alcanzó la meta | m28, m49, m88 |
| 5 · Partida | El marcador de puntos y energía se dibuja leyendo los objetos del jugador | m81, m82 |

### Proyecto 3 · Piloto automático

Diseñar una arquitectura con polimorfismo: Luna patrulla sola mientras Miaubit obedece el control.

| Nivel | Actividad | Misiones |
| --- | --- | --- |
| 1 · Arquitectura | Diagrama de clases interactivo: decidir clases, contrato y composición antes de programar | m70, m90 |
| 2 · El contrato | `interface Piloto { void paso(Robot r); }` | m65, m66 |
| 3 · Dos pilotos | `Patrulla` avanza si `puedeAvanzar()` y gira si no; `Directo` avanza con `while` hasta el obstáculo | m29, m38, m67 |
| 4 · La flota | Un arreglo `Robot[]` con `robot` y `ayudante` y un arreglo `Piloto[]` con un piloto para cada uno | m60, m77, m85 |
| 5 · Patrulla final | En cada turno, Miaubit sigue el control y Luna da un paso con su piloto | m64, m85, m90 |

Las actividades de cada nivel combinan tipos de reto: crear en el taller, escribir o completar una clase, corregir un error y probar en el escenario. La retroalimentación es inmediata: mensajes del intérprete con su archivo y línea, el objeto afectado resaltado y el resultado visible en el tablero.

## El taller

`proyectos.html#taller-control` abre el taller de un proyecto disponible; sin las 90 misiones, el enlace vuelve a la lista. La pantalla tiene tres zonas, y una cuarta en los niveles con tablero:

| Zona | Qué ofrece |
| --- | --- |
| Explorador | Nombre del proyecto, botones para crear carpetas y archivos dentro de la carpeta seleccionada y borrado con confirmación. Los nombres se validan mientras se escriben: carpetas en minúscula, archivos `Clase.java` con mayúscula, sin acentos, espacios ni repetidos, y sin usar `Robot` ni los archivos del juego. |
| Editor | Pestañas de archivos abiertos, colores de sintaxis, números de línea con los errores y avisos marcados, sangría automática y Tab para insertar espacios (Esc y después Tab sale del editor). **Probar** analiza y ejecuta; el resultado aparece en Problemas, Consola y Objetos, con los atributos de cada objeto creado. |
| Objetivos | Miaubit comenta cada paso, los objetivos se marcan en vivo y las pistas se piden de una en una. Los objetivos que dependen de la ejecución esperan a **Probar**, y cualquier cambio en el código invalida la ejecución anterior. Cada nivel enlaza las misiones donde se aprendió lo que usa. |
| Escenario | Sobre el editor: el tablero con Miaubit y la lista **Prueba del juego**. Cada prueba es una acción que el juego ejecuta al pulsar **Probar** (en el nivel 3, crear un botón y pulsarlo) y comprueba que Miaubit se mueva exactamente lo esperado desde donde lo dejó la anterior, así un error no oculta los demás. La lista indica de dónde a dónde se movió Miaubit, y **Repetir animación** vuelve a mostrarla. Los objetivos se revelan cuando termina la animación. |

Al cumplir todos los objetivos se celebra el nivel y el código pasa al siguiente. Cada nivel define sus objetivos como funciones sobre los archivos y, si hace falta, sobre la última ejecución; un objetivo puede explicar por qué falla con los términos de su misión, por ejemplo los atributos en `null` sin `this` (m53).

El avance se guarda en `localStorage`, con la clave `miaubit-proyectos-v1`: nombre, carpetas y archivos de cada proyecto, nivel actual y niveles terminados. Al leerlo se descarta cualquier ruta, nombre o tamaño inesperado. Si el navegador no permite guardar, el taller sigue funcionando y lo avisa.

## Etapas de desarrollo

Cada etapa termina en un pull request de `diego` hacia `main`, con todas las pruebas en verde.

| Etapa | Contenido |
| --- | --- |
| 0 · Diseño | Este documento |
| 1 · Entrada y candado | Página, enlace en el inicio, pantalla de bloqueo, tarjetas de los tres proyectos y pruebas en CI |
| 2 · Taller | Explorador, editor, unión de archivos, errores por archivo y línea, avance en el navegador y los niveles 1 y 2 del Proyecto 1, que no necesitan escenario |
| 3 · Escena y arte | Escena Phaser propia, caminata de Miaubit, generador en `tools/miaubit-arte/` y el nivel 3 del Proyecto 1, el primero con escenario |
| 4 · Proyecto 1 | Control virtual dibujado desde los objetos del jugador, repetición de pulsaciones y niveles 4 y 5 |
| 5 · Proyecto 2 | Sus cinco niveles completos |
| 6 · Proyecto 3 | Sus cinco niveles completos |

Quedan para después: el guardado por usuario y una historia que conecte los tres proyectos con la expedición.

## Verificación

`tests/projects.mjs` comprueba, sin navegador:

- El desbloqueo exige las 90 misiones reales e ignora identificadores desconocidos o repetidos.
- La unión de archivos y la ubicación de errores por archivo y línea, dentro de los archivos o en la prueba del juego.
- Los nombres de carpetas y archivos, la regla de una clase por archivo y los avisos de construcciones excluidas.
- Cada nivel jugable empieza sin completar con los archivos del nivel anterior, y su solución de referencia cumple todos los objetivos sin avisos.
- El avance guardado en el navegador se sanea antes de usarse, y el resaltado de sintaxis escapa el código.
- Las pruebas del nivel 3 distinguen movimientos correctos, cruzados, ausentes y choques, y explican cada caso; los fotogramas de la escena y la dirección de un choque se calculan sin navegador.
- La hoja de caminata publicada es idéntica a la que dibuja `tools/miaubit-arte/`, mide 192 × 192 y se empaqueta como `image/png`.
- Cada nivel cita misiones existentes y su código no contiene construcciones excluidas (`else if`, `switch`, `package`, `import`).
- La repetición de pulsaciones reproduce el mismo estado.
- Los proyectos, niveles y misiones citadas coinciden con las tablas de este documento.
- La página se empaqueta con URLs versionadas, carga todos los archivos del modo y el inicio tiene un único enlace a ella.
- Solo `127.0.0.1`, `localhost` y `[::1]` permiten abrir el taller antes de tiempo, y la pantalla lo indica.

Comandos de verificación; las pruebas de la aventura se ejecutan sin cambios:

```sh
npm run test:projects
npm test
npm run test:adventure
npm run test:achievements
npm run build
node tests/assets.mjs
```
