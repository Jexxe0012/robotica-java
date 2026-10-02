# Atlas: explorador de monitor CRT

Atlas toma como punto de partida [la referencia de Pinterest del usuario](https://pin.it/7fNrIiZSa), que resuelve a [The robot, Cristian Campos](https://www.pinterest.com/pin/211174971843635/). Se inspeccionó la imagen en el navegador: cabeza de monitor, pantalla verde, ojos amarillos, sonrisa de píxeles y carcasa crema y oliva. La imagen original no se distribuye con el juego.

La nueva interpretación añade brazos articulados, manos y botas pequeñas, un núcleo de cristal turquesa y vistas de frente, espalda y perfil. La silueta conserva una cabeza grande y un cuerpo compacto para seguir siendo legible dentro de una casilla. Los materiales cálidos lo conectan con los paisajes de fantasía.

## Recursos

Ambos PNG se generaron con la herramienta integrada ImageGen, con transparencia real. Los [prompts completos](atlas-prompts.json) conservan las dos solicitudes exactas. El retrato generado sirvió como referencia visual para la hoja de orientaciones.

| Archivo | Uso |
| --- | --- |
| `web/assets/atlas-crt.png` | Retrato del personaje junto a la misión seleccionada |
| `web/assets/atlas-directions.png` | Hoja cuadrada de cuatro orientaciones, distribuida en dos filas y dos columnas |

La hoja contiene **sur / norte** en la primera fila y **este / oeste** en la segunda. Se conserva completa, sin recortar ni volver a pintar el arte generado. CSS selecciona una celda con `background-size: 200% 200%` y muestra los píxeles con `image-rendering: pixelated`.

Los PNG miden 1254 × 1254; cada celda direccional mide 627 × 627. Los límites visibles, medidos con alfa ≥128, son sur `(105,93)–(546,612)`, norte `(82,93)–(522,612)`, este `(187,58)–(483,567)` y oeste `(144,58)–(441,567)`. Pequeñas traslaciones CSS y una escala de 1.02 para los perfiles alinean el centro del cuerpo, la altura y los pies al girar. El arte conserva sombreado discreto y bordes parcialmente transparentes; no es una imagen de paleta indexada estricta.

## Movimiento y lectura del código

`web/journey.js` mantiene un elemento por ID de objeto. `web/robot.css` relaciona la orientación del intérprete con la celda correspondiente: `0` este, `1` sur, `2` oeste y `3` norte. Girar cambia la vista del robot sin desplazarlo. `avanzar()` sigue esa orientación; `este()`, `oeste()`, `norte()` y `sur()` conservan su semántica de desplazamiento absoluto sin giro implícito.

Las transiciones de posición y el pequeño salto de caminar acompañan los estados reales de la traza. El reinicio coloca el personaje directamente en su estado inicial. Los robots ayudantes mantienen un tono distinto y su nombre visible; compartir casilla no mezcla sus identidades. La preferencia de movimiento reducido desactiva las animaciones.
