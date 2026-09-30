# Robótica Java · Lógica y POO

Laboratorio educativo en español con **90 misiones**, construido a partir de la primera versión Huerto Java. Se aprende a leer, predecir, ordenar, depurar y escribir código, con un mapa de robots y un inspector de variables, objetos, referencias y llamadas.

## Recorrido

| Misiones | Capítulo | Conceptos |
| --- | --- | --- |
| 1–10 | Secuencias | Estado, orden de instrucciones, movimientos y consola |
| 11–20 | Variables y tipos | Asignación, int, double, boolean, String, operaciones |
| 21–30 | Decisiones | if/else, comparaciones, &&, \|\|, !, cortocircuito y null |
| 31–40 | Bucles | for, while, acumuladores, límites, break, continue, anidación |
| 41–50 | Métodos | Parámetros, argumentos, paso por valor, return y descomposición |
| 51–60 | POO: objetos | Clases, constructores, this, identidad, referencias y composición |
| 61–70 | POO: diseño | private, validación de estado, herencia, polimorfismo e interfaces |
| 71–80 | Arreglos y listas | Índices, length, ArrayList, búsqueda, filtrado y flotas |
| 81–90 | Expediciones | Integración, proyectos de consola, inventario y central de reparto |

Cada capítulo combina predicción, ejercicios de Parsons con controles accesibles, corrección de errores, escritura y un proyecto. Hay 27 misiones de predicción y 63 de ordenar, corregir o escribir. Las misiones pueden explorarse sin bloqueos. Resolver una misión guarda su finalización; un resultado incorrecto no avanza el contador.

## Ejecutar localmente

Se requiere Node.js 24 para la vista previa SQLite. Instalar las dependencias con `npm install` y ejecutar:

```sh
node scripts/dev.mjs
```

Abrir `http://127.0.0.1:4173`. La base local vive en `.sites-runtime/progress.sqlite`, con una identidad de desarrollo que solo existe en el servidor de vista previa. Las fuentes externas son opcionales y tienen alternativas locales.

```sh
node tests/check.mjs
node scripts/build.mjs
```

El build produce `dist/server/index.js`, un Worker autónomo con recursos estáticos y API. El manifiesto declara la base D1 `DB`; las migraciones Drizzle en `drizzle/` se aplican por la plataforma durante la publicación. El código de producción no crea tablas en las solicitudes.

## Intérprete educativo y Java completo

`web/engine.js` tokeniza y analiza el programa del alumno y ejecuta su árbol de instrucciones; la animación usa los estados resultantes. No es una JVM ni un compilador Java completo. El subconjunto cubre las construcciones utilizadas en el recorrido, incluyendo objetos, atributos, constructores, herencia y despacho de métodos. No admite sobrecarga, casts, lambdas, paquetes, bibliotecas externas, excepciones Java, todas las conversiones de tipos ni todas las reglas de compilación. Las variables locales se inicializan al declararlas. Las cadenas se comparan mediante `equals()`; el laboratorio bloquea `==` con String para evitar confusión entre contenido e identidad. Los límites de 160 vueltas por bucle, 1200 pasos y 24 llamadas protegen la interfaz de programas que no terminan.

La vista didáctica reúne definiciones e instrucciones en un panel. `export.js` coloca las clases fuera de `Mision`, los métodos auxiliares dentro y las instrucciones dentro de `jugar()`. `Robot robot` y, cuando corresponda, `Robot ayudante` son parámetros proporcionados por el laboratorio. La descarga **Mision.java** incluye `main`, el programa actual y la API Java de los robots. Los borradores incorrectos también pueden descargarse para estudiar los errores del compilador. Ejecutar con un JDK:

```sh
javac -encoding UTF-8 Mision.java
java Mision
```

El robot empieza en (0, 2), mirando al este, con energía 20 salvo que la misión indique otro estado. Los giros no consumen energía ni mueven; cada movimiento consume 1. Las direcciones absolutas no cambian la orientación. Recoger requiere una caja en la casilla, dejar requiere carga, recargar requiere una estación. La entrega se registra al dejar una caja; el evaluador también comprueba la ubicación de destino cuando la misión lo exige.

## Avance y privacidad

El Site conserva su acceso privado. `server/api.js` usa la identidad estable del usuario que proporciona la plataforma; las consultas preparadas se limitan a ese usuario. Las finalizaciones son monotónicas e idempotentes, se guardan con una transacción D1, y no se reemplazan con listas antiguas de otra pestaña. La API valida misiones, tipos de solicitud y origen de escrituras.

El navegador muestra el estado real de sincronización y permite reintentar los fallos sin perder los cambios de la sesión. Al resolver se envía el guardado inmediatamente; las solicitudes pendientes usan keepalive al cerrar. Si no hay conexión, hay que reintentar antes de abandonar la sesión. Los borradores y predicciones son temporales; no se utiliza localStorage como autoridad del progreso.

## Validación de esta versión

- 90 soluciones verificadas con el intérprete y el evaluador; 63 estados iniciales sin resolver.
- Casos de errores de tipos, null, acceso private, índices, alcance, recursión y bucles; identidad compartida y paso por valor.
- API ejecutada contra SQLite real: aislamiento entre usuarios, progreso monotónico, entradas inválidas, origen y fallo de almacenamiento.
- Las 90 exportaciones compiladas y ejecutadas con Eclipse Temurin JDK 21; consola y estado final de Atlas comparados con la simulación.
- Pruebas de navegador: predicción equivocada y correcta, paso a paso, ordenar, corregir, private, referencias, proyecto final, persistencia tras recarga y recuperación tras fallo de conexión. Vista móvil a 390 × 844, navegación y ausencia de desbordamiento de la página.

Para repetir la integración Java después de `node tests/check.mjs`, proporcionar el directorio de un JDK a `node tests/java.mjs /ruta/al/jdk`. El JDK portátil utilizado para verificación queda en `.sites-runtime/`, fuera del repositorio y del despliegue.
