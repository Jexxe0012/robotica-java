# Fantasía retro oscura

La interfaz acompaña a Atlas con superficies de bosque y tinta, perfiles de píxel y acentos de cristal y metal envejecido. Los paneles, botones, etiquetas seleccionadas, avisos y objetivos evitan rellenos crema o amarillos claros.

| Uso | Color |
| --- | --- |
| Fondo / cabecera | `#0a1012` / `#080d10` |
| Panel / control elevado | `#13221f` / `#1b3029` |
| Editor | `#0b1417` |
| Texto / texto secundario | `#d3dfd3` / `#95ada2` |
| Jade: avance y éxito | `#6dbb91` |
| Ámbar: selección y foco | `#d59b48` |
| Fondo ámbar | `#32261a` |
| Error: borde / fondo | `#e38d79` / `#321f22` |
| Palabras clave Java | `#b7a0d3` |

El texto principal y secundario alcanza aproximadamente 11.96:1 y 6.88:1 sobre el panel. Los acentos de jade y ámbar superan 5.7:1 sobre el control elevado. La selección conserva borde, estado semántico y marcador; el avance incluye el símbolo de completado y no depende solo del color.

## Presentación

- `styles.css` conserva la estructura adaptable y los colores base.
- `worlds.js` define nueve conjuntos de terreno oscuro y acentos regionales. `worlds.css` atenúa los paisajes existentes con brillo 0.63 y saturación 0.78, sin reescribir sus archivos.
- `retro.css` añade la familia de títulos, biseles cuadrados, sombras duras, esquinas escalonadas en el retrato y progreso segmentado. La trama de pantalla es estática y solo aparece sobre imágenes; no hay parpadeo.
- El código mantiene una fuente monoespaciada de lectura; la fuente pixel se reserva para marca, títulos, números de misión y botones. Los focos de teclado y los estados de respuesta, ayuda y error conservan contraste sobre fondos oscuros.
- Las reglas existentes de movimiento reducido siguen desactivando animaciones. Las texturas no interceptan clics.

## Tipografía distribuida

[Pixelify Sans, del repositorio oficial Google Fonts](https://github.com/google/fonts/tree/main/ofl/pixelifysans), se incluye como TTF variable de 79 160 bytes, pesos 400–700. La [licencia SIL OFL 1.1](../web/assets/fonts/OFL.txt) acompaña al archivo en el sitio y en el repositorio. No se modificó la fuente.

El servidor local entrega la fuente con `font/ttf`; el Worker la incorpora como base64 y la decodifica a bytes, igual que los recursos de imagen. `tests/assets.mjs` verifica GET/HEAD, el tipo MIME y la igualdad de los bytes del TTF, la licencia y la hoja de estilos. Los cambios de estilo no añaden dependencias JavaScript.
