# Aventura de nueve regiones

Las 90 misiones tienen contexto narrativo, escenario de mosaicos editable y progreso visual por capítulo. El programa Java determina los movimientos, los objetos y el resultado; Phaser representa sus instantáneas. No se añadieron reglas nuevas al intérprete ni migraciones de progreso.

| Capítulo | Región | Restauración | Aprendizaje |
| --- | --- | --- | --- |
| 1 | Árbol del Alba | Balizas y puente | Secuencias y lectura de estado |
| 2 | Valle de Cristal | Archivo de cristales | Variables, tipos y operaciones |
| 3 | Puertas del Reino | Sellos de las puertas | Condiciones y lógica booleana |
| 4 | Bosque del Santuario | Runas y arco | Bucles y condiciones de salida |
| 5 | Jardines del Crepúsculo | Luces de las fuentes | Métodos, parámetros y retorno |
| 6 | Ciudad de los Canales | Señales de los muelles | Objetos, identidad y composición |
| 7 | Bastión de las Nubes | Luces de los escudos | Encapsulación, herencia e interfaces |
| 8 | Dunas del Silencio | Señales de la caravana | Arreglos y listas |
| 9 | Torre de las Pléyades | Observatorio | Integración de lógica y POO |

## Código y estado

- `web/campaign.js` define regiones, recursos, paletas, historias y condiciones de restauración. Incluye también las diez narraciones del Alba, con una única función de progreso para toda la campaña.
- `derive(chapter, completed)` cuenta solo los identificadores reales del capítulo, elimina duplicados y devuelve `count`, `beacon`, `trail` y `complete`. Las misiones segunda y sexta iluminan marcas parciales; la restauración completa exige las diez misiones. Resolver solo el proyecto final no basta.
- `web/adventure-scene.js` usa un único juego y una única escena Phaser para toda la campaña. Precarga los nueve mapas y cambia las capas al viajar, reutilizando los recursos cargados. No mantiene nueve renderizadores simultáneos. En el selector de capítulos detiene el bucle y aplaza la reconstrucción del escenario hasta entrar a una misión.
- `ExpeditionWorld`, en `web/adventure-scene.js`, expone directamente el contrato que usa la interfaz: `setMission`, `setState`, `setActive`, `setProgress`, `cycleCamera` y `celebrate`.
- `web/adventure-ui.js` conecta narración, contador, cuaderno, estado observado, cámara y navegación. Continuar aventura elige la primera misión pendiente de la región actual. Los capítulos se pueden explorar libremente: el progreso añade luces, sin bloquear el contenido educativo.

La restauración representa luces, señales y el portal final; no introduce una simulación de ciudad, agua o economía. Las variables y la última salida de consola proceden de la traza real y se muestran después de ejecutar cada instrucción.

## Mapas y Tiled

Los nueve escenarios miden 12 × 9 mosaicos de 32 píxeles. Cada uno tiene una distribución diferente, una paleta oscura y un atlas SVG original con geometría pixel art. Las capas son `Suelo`, `Senderos`, `Vegetación` e `Historia`; esta última contiene objetos decorativos del entorno. Los SVG de 160 × 128 contienen 20 mosaicos, distribuidos en cinco columnas.

El área programable conserva **6 × 5 casillas**, desplazada a (2, 2) dentro del escenario. Phaser dibuja los mosaicos al doble de tamaño, con un origen visual de (128, 128). El Java del alumno mantiene su origen lógico (0, 0). El agua, los precipicios y las decoraciones no se colocan dentro del área lógica; las cajas, destinos, estaciones y obstáculos de cada misión vienen exclusivamente del intérprete.

Para modificar una región:

1. Abrir su JSON en `web/assets/maps/` con Tiled; el Alba usa `alba-village.json` y las demás regiones `<id>-adventure.json`.
2. Mantener el área lógica y las dimensiones actuales. Editar las capas de terreno y los objetos de `Historia`. La escena reconoce árboles, pinos, cristales, casas, mansión, torres, puertas, arcos, pilares, setos, fuentes, muelles, palmeras, obeliscos y observatorio.
3. Mantener la referencia al tileset `../tiles/<id>.svg`. Los objetos nuevos usan posición en píxeles del mapa y una propiedad `scale` opcional.
4. Ejecutar las pruebas de aventura y revisar la escena en el navegador.

`node scripts/create-campaign-maps.mjs` reconstruye las ocho regiones posteriores al Alba desde las definiciones iniciales. `node scripts/create-alba-map.mjs` reconstruye el Alba. **El build no ejecuta estos generadores**: publica los JSON y SVG guardados. Ejecutarlos expresamente reemplaza las ediciones manuales de esos recursos. Cambiar el tamaño u origen lógico requiere adaptar también la escena y verificar el contrato Java.

## POO y accesibilidad

Cada robot del estado tiene un sprite asociado a su identificador de objeto. La escena muestra nombres y, desde el capítulo de POO, identificadores; separa visualmente robots que coinciden en una casilla. Copiar una referencia no crea un sprite extra. Nuevos robots, como un `Explorador`, aparecen según los objetos creados por el programa. Los objetos que no son robots se consultan en el inspector, con sus atributos y referencias.

Las cámaras permiten ver el mapa, seguir a Miaubit o encuadrar la misión. En móvil se comienza cerca del área lógica; los controles permanecen accesibles y Ver resultado lleva a la explicación. El cuaderno de conceptos y símbolos continúa disponible en todas las misiones. Las flechas inspeccionan casillas sin mover robots.

El audio sigue apagado inicialmente, se activa por elección del usuario y se silencia al abandonar la misión o esconder la pestaña. El movimiento reducido desactiva partículas y animaciones. La lista accesible de casillas y las etiquetas no dependen de los efectos visuales.

Los paisajes de selección se gestionan aparte con `web/landscapes.js`; su carga no bloquea los textos, el progreso ni la escena de una misión. La [revisión de rendimiento](performance.md) documenta la caché y los archivos retirados.

## Verificación

```sh
npm test
npm run test:adventure
npm run build
node tests/assets.mjs
npm run test:java -- /ruta/al/jdk
```

Las pruebas de aventura comprueban nueve distribuciones y atlases distintos, índices de mosaicos, límites, 90 historias y progreso aislado por región. Las de recursos comprueban todos los mapas y SVG empaquetados, sus bytes y tipos MIME, además de las respuestas HEAD y el acceso a la API.

La verificación visual local usa un navegador aislado con respuestas de progreso simuladas; no modifica cuentas reales. Se verificaron cambios de capítulo sin recarga, una misión de cada región, respuestas incorrectas, finalizaciones parciales y completas, proyectos con dos robots, un robot heredado, cámaras, sonido, cuaderno, móvil y movimiento reducido.
