# Regiones de fantasía

La aventura usa nueve paisajes diferentes, uno por capítulo. La dirección visual toma de Re:Zero los grandes hitos del paisaje, la arquitectura medieval y el contraste entre regiones luminosas, bosques antiguos y el desierto nocturno. Las imágenes son composiciones nuevas generadas con la herramienta integrada ImageGen en estilo pixel art; las referencias de Pinterest sirven para investigar la atmósfera.

| Capítulo | Región del juego | Referencia visual | Archivo |
| --- | --- | --- | --- |
| 1 · Secuencias | El Árbol del Alba | Árbol de Flügel: escala monumental y pradera abierta | `01-alba.webp` |
| 2 · Variables y tipos | Valle de Cristal | Bosque de Elior: hielo, nieve y tonos azulados | `02-cristal.webp` |
| 3 · Decisiones | Puertas del Reino | Lugunica: castillo blanco, ciudad medieval y puente | `03-reino.webp` |
| 4 · Bucles | Bosque del Santuario | Santuario: ruinas entre vegetación y luz filtrada | `04-santuario.webp` |
| 5 · Métodos | Jardines del Crepúsculo | Mansión de Roswaal: tejados azules, rosales y senderos | `05-jardines.webp` |
| 6 · POO · Objetos | Ciudad de los Canales | Priestella: canales turquesa, puentes y tejados cálidos | `06-canales.webp` |
| 7 · POO · Diseño | Bastión de las Nubes | Fortaleza fantástica de montaña | `07-bastion.webp` |
| 8 · Arreglos y listas | Dunas del Silencio | Desierto de Augria: dunas, ruinas y oasis | `08-dunas.webp` |
| 9 · Expediciones | Torre de las Pléyades | Torre monumental y desierto bajo las estrellas | `09-pleyades.webp` |

## Fuentes de referencia

Se buscaron e inspeccionaron resultados de Pinterest y vistas de búsqueda de imágenes. Algunas páginas de Pinterest solo pudieron consultarse mediante sus resultados indexados; no se descargaron sus imágenes para distribuirlas en el juego.

- [Paisajes exteriores de Re:Zero](https://in.pinterest.com/pin/re-zero-outdoor-landscape-scenes--534450680772833743/): referencia general localizada en el índice; página directa no disponible.
- [Bosque invernal](https://www.pinterest.com/pin/beast-of-the-end--567031409338603091/): referencia de nieve y atmósfera fría.
- [Santuario](https://in.pinterest.com/pin/1013239616168063761/): resultado de búsqueda de referencia.
- [Mansión fantástica](https://in.pinterest.com/pin/fantasy--40602834133184763/): resultado de búsqueda de arquitectura y jardines.
- [Priestella](https://pl.pinterest.com/pin/815433076269319463/): resultado de búsqueda de la ciudad de canales.
- [Fortaleza sobre una montaña](https://kr.pinterest.com/pin/784541197619348064/): referencia de composición del bastión.
- [Pleiades Watchtower](https://br.pinterest.com/pin/709879960048117027/): referencia de la torre.

## Integración

Los paisajes de `web/assets/maps/` conservan una resolución de 1536 × 1024 y se codifican en WebP con calidad 82. La conversión solo cambia el formato; no cambia la composición. Los PNG originales se conservan fuera del código de la aplicación. Los [prompts completos](art-prompts.json) documentan la generación de las nueve imágenes.

`web/worlds.js` mantiene los recursos y las rutas como datos. Cada ruta tiene diez puntos diferentes expresados en porcentajes. `web/journey.js` dibuja los enlaces SVG y los botones de misión encima del paisaje y mantiene la selección y el progreso. Las ilustraciones no contienen texto ni controles.

Los colores de terreno y la imagen de la región se aplican también a la vista de misión. Las posiciones, obstáculos, cajas y robots proceden del estado del intérprete; el cambio de región solo afecta su presentación. El tamaño de 6 × 5 del tablero y las reglas de Java y POO se mantienen.

`tests/assets.mjs` comprueba que las nueve imágenes tienen contenido diferente, que todas las rutas son distintas y contienen diez puntos, y que el Worker devuelve los bytes originales con `image/webp`, incluidos los recursos anidados. El índice de capítulos permite desplazamiento horizontal en pantallas pequeñas y mantiene controles accesibles por teclado.
