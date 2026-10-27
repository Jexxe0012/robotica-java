# Rendimiento y limpieza de la campaña

La demora observada al cambiar de capítulo estaba en la primera descarga y decodificación del paisaje ilustrado. El cambio de texto y controles tomaba pocos milisegundos. La escena de mosaicos de Phaser usa otros recursos y no necesita descargar esos paisajes.

## Cambios

- Los nueve WebP se redujeron de 1536 × 1024 a 1024 × 683, con vecino más cercano y calidad WebP 85. Se conservan sus composiciones; el conjunto pasó de **3 651 212 a 2 238 736 bytes**, un 38,7 % menos. Los recursos anteriores siguen en el historial Git.
- `web/landscapes.js` prepara y decodifica la imagen antes de insertarla. Anticipa únicamente la región siguiente, con prioridad baja, y prepara un destino al pasar el puntero o enfocar su capítulo. La descarga anticipada se omite cuando el navegador comunica ahorro de datos o conexión 2G.
- Se conservan hasta tres imágenes decodificadas. Los enlaces directos a misiones no cargan paisajes ocultos; un enlace a un mapa avanzado descarga su paisaje, sin comenzar por el Alba.
- Al elegir otro capítulo, el color de la región y los controles cambian enseguida. Durante una primera descarga se muestra Preparando paisaje. Una respuesta tardía nunca reemplaza un capítulo elegido después. Si falla la carga, se puede reintentar.
- `scripts/static-assets.mjs` genera una versión a partir de los archivos publicados. El HTML y CSS incluyen URLs `?v=...`; `web/assets.js` aplica esa versión a las solicitudes dinámicas.
- `server/static.js` permite caché **privada** e inmutable solo para la versión vigente. El HTML y las URLs antiguas revalidan; la API de progreso conserva `no-store`. Los ETag permiten responder 304 y cada imagen se decodifica desde base64 una sola vez por instancia del Worker.
- Phaser detiene su bucle en el selector. Al volver a una misión se reactiva y aplica el estado pendiente. No reconstruye mapas ocultos al recorrer los capítulos.
- Los botones de capítulos, los nodos de una región, las casillas accesibles y las líneas del programa se reutilizan. Durante una traza se actualiza la línea activa sin regenerar todo el código. Los objetos estáticos del tablero se redibujan cuando cambia su estado.

## Código retirado

| Archivo o bloque | Motivo |
| --- | --- |
| `web/chapter-one.js` | Narraciones migradas a `campaign.js`; el progreso duplicaba la función común |
| `web/phaser-world.js` | Adaptador sin lógica propia; la interfaz usa `ExpeditionWorld` directamente |
| `web/robot.css` | Renderizador DOM sustituido por Phaser; el estilo vigente del retrato se conserva en `worlds.css` |
| `docs/alba-adventure.md` | Sustituido por la documentación de los nueve capítulos |
| `docs/atlas-design.md`, `docs/atlas-prompts.json` | Documentación del personaje sustituido, recuperable en Git |
| Selectores `.cell*`, `.robot-actor`, `.robot-sprite`, `.robot-label`, `.world-item`, `.robot-layer`, `.phaser-tag` y animación `walk` | Ningún elemento del renderizador actual los utiliza |
| Paletas `ground` de `worlds.js` y variables `--terrain-*` | La escena utiliza las paletas activas de `campaign.js` |

Se conservan los recursos que sí se usan, las licencias, las migraciones y metadatos de Drizzle, las herramientas para editar mapas y las pruebas del intérprete y de exportación. No se eliminaron datos de usuarios ni se añadieron dependencias.

## Medición

Prueba local con Edge, latencia de 100 ms y descarga de 256 KiB/s. Se midió desde el clic hasta completar la decodificación del paisaje y dos fotogramas; la página inicial ya estaba cargada. El recorrido saltó entre los nueve capítulos y volvió a los primeros.

| Medida | Antes | Después |
| --- | --- | --- |
| Actualización síncrona de controles | 7–17 ms | 3–7 ms |
| Paisaje ya preparado o reutilizado | 31–32 ms al volver a los primeros | 48–50 ms |
| Primera carga sin preparar durante saltos rápidos | 1,03–2,27 s | 0,75–1,40 s |
| Tamaño de los nueve paisajes | 3,65 MB | 2,24 MB |

La mejora principal es evitar esperar la descarga del siguiente capítulo durante la navegación normal y reducir las primeras descargas. Una región sin preparar todavía depende de la conexión; estos tiempos locales no garantizan el rendimiento de todos los teléfonos o redes.

## Verificación

`npm test`, `npm run test:adventure`, `npm run build` y `node tests/assets.mjs` verifican las 90 misiones, el progreso, los mapas, las respuestas HTTP, ETag, 304 y la invalidación por versión. La prueba de recursos exige que cada JS y CSS de `web/` tenga una referencia en la página y que cada recurso binario o JSON se use en la campaña o sea una atribución requerida.

Las comprobaciones de navegador usan progreso simulado: nueve escenas y misiones, POO con dos robots y herencia, cambios rápidos de región, recuperación de una imagen fallida, ahorro de datos, ausencia de descargas de paisajes ocultos, caché real del navegador, suspensión/reactivación del motor, móvil y movimiento reducido. No alteran cuentas reales.
