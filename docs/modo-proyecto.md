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
| Código y estilos | `web/proyectos/` | `catalogo.js` (proyectos, niveles y reglas de desbloqueo, sin DOM), `pagina.js` (pantalla del taller) y `proyectos.css`; después, taller, ejecución y escena |
| Imágenes | `web/proyectos/assets/` | Hoja de caminata de Miaubit y recursos del modo |
| Generador de arte | `tools/miaubit-arte/` | Script que produce las imágenes de Miaubit, versionado con el juego |
| Pruebas | `tests/projects.mjs` | Desbloqueo, ejecución, niveles y regla de conceptos |

El build y el servidor local ya publican cualquier archivo dentro de `web/`, incluidas sus subcarpetas, así que no requieren cambios. El servidor local detecta los archivos al iniciar: después de crear uno nuevo hay que reiniciar `npm run dev`.

### Ejecución sin modificar el intérprete

El Modo Proyecto usa `RobotJava.execute(source, initial)` tal como existe. El taller une los archivos del jugador en un único programa, recuerda la línea donde empieza cada archivo y agrega al final las instrucciones del juego. Un error del intérprete se traduce de vuelta a su archivo y línea; por ejemplo, la línea 7 del programa unido se informa como `Boton.java`, línea 7.

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

El modo tiene su propia escena Phaser; `web/adventure-scene.js` no se toca. Miaubit camina con la hoja de 192 × 192 píxeles generada en `miaubit-arte`: cuatro filas (sur, norte, este y oeste) de cuatro cuadros de 48 píxeles, escalados con `pixelArt`. La aventura conserva su hoja actual.

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

## Etapas de desarrollo

Cada etapa termina en un pull request de `diego` hacia `main`, con todas las pruebas en verde.

| Etapa | Contenido |
| --- | --- |
| 0 · Diseño | Este documento |
| 1 · Entrada y candado | Página, enlace en el inicio, pantalla de bloqueo, tarjetas de los tres proyectos y pruebas en CI |
| 2 · Taller | Árbol de archivos, editor, unión de archivos, errores por archivo y línea, avance en el navegador |
| 3 · Escena y arte | Escena Phaser propia, caminata de Miaubit, control dibujado desde los objetos y generador en `tools/miaubit-arte/` |
| 4 · Proyecto 1 | Sus cinco niveles completos |
| 5 · Proyecto 2 | Sus cinco niveles completos |
| 6 · Proyecto 3 | Sus cinco niveles completos |

Quedan para después: el guardado por usuario y una historia que conecte los tres proyectos con la expedición.

## Verificación

`tests/projects.mjs` comprobará, sin navegador:

- El desbloqueo exige las 90 misiones reales e ignora identificadores desconocidos o repetidos.
- La unión de archivos y la ubicación de errores por archivo y línea.
- La solución de referencia de cada nivel cumple su objetivo, y el código inicial no lo cumple.
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
