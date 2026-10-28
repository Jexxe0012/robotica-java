# Generador de Miaubit

Scripts de Node sin dependencias que dibujan a Miaubit píxel a píxel y escriben PNG con un codificador propio (`pix.mjs`). El build no los ejecuta: el juego publica las imágenes guardadas. Requieren Node 22.2 o posterior por `zlib.crc32`.

| Script | Uso | Resultado |
| --- | --- | --- |
| `pix.mjs` | Lienzo de píxeles y codificador PNG | Biblioteca |
| `cat48.mjs` | Cuadros de 48 × 48 en cuatro direcciones y caminata | Biblioteca; con una carpeta como argumento, también escribe hojas de revisión |
| `concepts2.mjs` | Retrato sentado y variantes de concepto | Biblioteca; con una carpeta como argumento, también escribe las variantes |
| `export-game.mjs` | `node tools/miaubit-arte/export-game.mjs <carpeta>` | `atlas-directions.png` y `atlas-crt.png` de la aventura, idénticos a los de `web/assets/` |
| `present.mjs` | `node tools/miaubit-arte/present.mjs <carpeta>` | Lámina de presentación con retrato, vistas y caminatas |
| `exportar-proyectos.mjs` | `node tools/miaubit-arte/exportar-proyectos.mjs` | `web/proyectos/assets/miaubit-camina.png` del Modo Proyecto |

La hoja del Modo Proyecto mide 192 × 192 píxeles: cuatro filas (sur, norte, este y oeste) de cuatro cuadros de 48 píxeles. La fila oeste no muestra la llave, porque solo existe en el costado derecho del gato.

Para cambiar el arte, edita `cat48.mjs` o `concepts2.mjs`, vuelve a exportar y revisa el resultado en el juego. `export-game.mjs` sobrescribe los sprites de la aventura solo si se ejecuta con `web/assets` como carpeta; los identificadores `atlas-*` se conservan.
