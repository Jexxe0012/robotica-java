# Primera aventura: el sendero del Alba

El primer capítulo convierte sus diez misiones existentes en una historia: Miaubit ayuda al guardián del Árbol del Alba a devolver la luz al sendero. La baliza se enciende con la misión 02, las señales del desvío con la 06 y el puente con las diez misiones resueltas. Completar únicamente la misión 10 no enciende el puente si quedan retos pendientes.

## Escenario editable

`web/assets/maps/alba-village.json` usa el formato JSON de Tiled, con un escenario de 12 × 9 mosaicos de 32 píxeles. Contiene las capas Suelo, Senderos, Vegetación e Historia. El tileset original es `web/assets/tiles/alba.svg`, dibujado con geometría pixel art y sin recursos externos. Ambos archivos pueden editarse junto con el proyecto.

El escenario rodea un área de programación de 6 × 5 casillas, situada en (2, 2) dentro del mapa. Las coordenadas Java siguen empezando en (0, 0) en esa área. La escena mayor añade entorno y efectos de historia; no amplía los límites del intérprete ni del programa Java exportado. Se preservan así las reglas de las 90 misiones.

`scripts/create-alba-map.mjs` reconstruye los recursos iniciales. El build no ejecuta este generador: publica los archivos guardados, incluidas las modificaciones hechas en Tiled. Ejecutar el generador de nuevo reemplaza esas modificaciones.

## Presentación e interacción

- `web/alba-scene.js` renderiza las capas con Phaser y representa las instantáneas del intérprete. Las animaciones de movimiento, balanceo, carga y celebración usan los sprites existentes de Miaubit y transformaciones de Phaser.
- La cámara permite ver el escenario completo, seguir a Miaubit o concentrarse en la misión. En escritorio empieza mostrando el mapa; en móvil empieza cerca del área de ejecución.
- `web/phaser-world.js` dirige el primer capítulo a la nueva escena y conserva la escena clásica para los capítulos restantes, incluyendo POO y varios robots.
- `web/chapter-one.js` contiene los diez textos y calcula los efectos de historia exclusivamente a partir de los identificadores de misiones completadas.
- `web/adventure-ui.js` conecta esa historia con los paneles, el cuaderno y el acceso al Valle de Cristal. Los capítulos siguen pudiendo explorarse libremente desde el mapa.
- En móvil, los controles de ejecución permanecen accesibles y al ejecutar se vuelve al escenario. Ver resultado lleva a la explicación y a Siguiente misión.

El cuaderno conserva las definiciones, los ejemplos del nivel y el glosario de símbolos. Puede abrirse desde Entender el código. Las flechas del teclado inspeccionan casillas; no mueven al robot ni resuelven ejercicios. El movimiento sigue dependiendo del programa Java.

## Audio y accesibilidad

`web/adventure-audio.js` sintetiza música suave y efectos originales con Web Audio. El sonido comienza apagado y requiere pulsar Activar sonido; no descarga música ni usa servicios externos. La música se silencia al salir de la misión o cuando la página queda oculta. Activarlo no modifica el progreso ni los permisos de la cuenta.

Las preferencias de movimiento reducido desactivan el balanceo, los saltos y las partículas. Se conserva la representación accesible de las casillas, el inspector, los controles por teclado y los textos de estado. Los cambios del bosque no son necesarios para comprender si una misión se resolvió.

## Verificación

```sh
npm test
npm run test:adventure
npm run test:java -- /ruta/al/jdk
npm run build
node tests/assets.mjs
```

Las pruebas de aventura verifican el formato y los límites del mapa, los diez textos y las condiciones de las balizas. Las pruebas de recursos verifican los tipos MIME y los archivos publicados. El progreso sigue usando la API y la base de datos existentes; no se añadieron migraciones ni permisos nuevos.
