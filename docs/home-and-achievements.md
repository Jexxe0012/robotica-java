# Inicio y logros de Miaubit

La ruta inicial muestra **Las aventuras de Miaubit**, una pantalla de título inspirada en la portada del video del proyecto: paisaje del Alba oscurecido, tipografía de píxel, Miaubit y acciones para comenzar, continuar, explorar mundos y consultar logros. Reutiliza el personaje y el paisaje existentes.

## Navegación

| Ruta | Pantalla |
| --- | --- |
| Sin fragmento o `#home` | Inicio y diario de viaje |
| `#map-1` a `#map-9` | Selección de misiones de cada región |
| `#m01` a `#m90` | Misión y ejecución del programa |
| `#logros` | Colección de logros |

`web/journey.js` mantiene las cuatro vistas y pausa la reproducción antes de navegar. El enlace de la marca vuelve al inicio; Mapa de capítulos conserva el acceso al selector. Al abrir los logros desde una misión y volver, se mantiene el programa, la predicción, el paso de ejecución y la explicación del resultado. La reproducción continúa únicamente cuando el jugador la solicita. Los enlaces directos a mapas y misiones siguen funcionando.

Comenzar aventura abre el primer mapa. Continuar aventura utiliza la última misión válida si sigue pendiente; si ya se resolvió, elige la primera misión sin completar. Con las 90 resueltas, ofrece volver a explorar. El botón espera la consulta inicial de progreso; un error o una espera de seis segundos permite continuar y muestra el estado de sincronización existente.

## Reglas de los 22 logros

`web/achievements.js` contiene el catálogo y funciones puras. `evaluate(completed)` ignora identificadores desconocidos, cuenta cada misión una sola vez y calcula progreso, requisitos y desbloqueos.

| Grupo | Requisitos |
| --- | --- |
| Recorrido, 5 logros | Resolver 1, 5, 25, 45 y 90 misiones diferentes |
| Habilidades, 4 logros | Resolver 5 retos de predecir, ordenar, corregir o programar, respectivamente |
| Variedad, 1 logro | Resolver un reto de cada uno de los cinco tipos, incluyendo proyecto |
| Proyectos, 1 logro | Completar tres misiones de proyecto |
| POO, 1 logro | Completar las 20 misiones de Objetos y Diseño |
| Regiones, 9 logros | Completar las diez misiones de cada región |
| Entrega final, 1 logro | Resolver la misión 90; esto por sí solo no concede el logro de las 90 misiones |

Los logros dependen de las misiones completadas. No hay premios por tiempo, intentos fallidos, rachas ni pulsaciones de botones. Una predicción incorrecta o un programa que no cumple su objetivo no añade una finalización.

## Interfaz y persistencia

- `web/game-hub.js` conecta inicio, colección, filtros y notificaciones con el progreso del curso. Los emblemas son SVG de píxel definidos en código; no requieren nuevas descargas de imágenes.
- `web/game-hub.css` conserva la paleta oscura y adapta la portada y la colección a escritorio y teléfono. El movimiento reducido desactiva animaciones.
- `web/app.js` anuncia nuevos desbloqueos únicamente después de una misión resuelta. Repetir una finalización no vuelve a emitir el aviso.
- Al sincronizar una cuenta se reconocen retroactivamente sus logros, sin mostrar una ráfaga de notificaciones. La colección distingue Conseguidos y Por descubrir y muestra el requisito y el progreso de cada uno.
- Los avisos no toman el foco. Se anuncian con un estado accesible, pueden cerrarse o abrir la colección, y no desaparecen mientras el puntero o el foco están dentro.

No se creó una tabla ni un almacén paralelo de logros. Se derivan de los identificadores que ya guarda `/api/progress` para cada cuenta. Esto evita divergencias entre medallas y misiones. Si falla el guardado, ambos permanecen en la sesión y el estado existente permite reintentar; su recuperación tras recargar depende de haber sincronizado las finalizaciones.

## Carga y comprobación

La portada carga un único paisaje cuando se muestra. La colección y los enlaces directos a misiones no descargan el paisaje del inicio. La escena Phaser se crea únicamente al entrar a una misión y se detiene en las otras vistas. Se conserva la caché versionada y la preparación de paisajes de capítulos.

```sh
npm test
npm run test:adventure
npm run test:achievements
npm run build
node tests/assets.mjs
```

`tests/achievements.mjs` verifica umbrales, duplicados, identificadores inválidos, tipos de reto, regiones independientes, POO, proyecto final y continuación. GitHub Actions incluye esta prueba y mantiene las 90 compilaciones/exportaciones Java.

La comprobación local en navegador usa cuentas simuladas: inicio nuevo y con avance, filtros, fallo de predicción, desbloqueo, repetición sin duplicados, restauración después de recargar, logro de capítulo, campaña completa, retorno a una misión pausada, errores de red, escritorio y móvil. No modifica cuentas reales.
