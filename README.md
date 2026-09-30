# Huerto Java

Minijuego educativo en español para aprender a leer fragmentos de Java y desarrollar lógica: predecir, observar el estado paso a paso y explicar el resultado.

## Jugar

Abre `dist/index.html` en tu navegador. No requiere instalar Java ni dependencias. Para servirlo localmente desde esta carpeta:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Abre `http://127.0.0.1:4173`. Las fuentes web son opcionales; hay fuentes locales de respaldo.

## Contenido

1. Secuencia: seguir la posición del personaje y el orden de las acciones.
2. Variables: distinguir asignación de igualdad y seguir cambios de valor.
3. `if` / `else`: elegir una rama de acuerdo con una comparación.
4. `for`: contar vueltas desde cero y reconocer el alcance del contador.
5. `while`: distinguir comprobaciones de acciones y evitar repeticiones sin progreso.
6. Métodos: distinguir definición de llamada y seguir el retorno a la tarea anterior.

Dos ejercicios adicionales permiten completar una instrucción y visualizar su efecto, sin escribir un programa entero. Cada misión comienza con un huerto independiente. El avance es de la sesión y se reinicia al recargar la página.

## Java y la simulación

Los fragmentos usan sintaxis Java. `Granja` y sus métodos son una API ficticia del juego. En las primeras cinco misiones se muestra el cuerpo de `jugar(Granja granja)`; la sexta muestra la clase `Juego` y dos métodos.

El navegador **no compila Java**: simula los fragmentos y las opciones predeterminadas mediante trazas educativas. No admite código libre. La granja tiene cinco casillas, el personaje empieza en la primera y puede plantar, regar, avanzar y quitar hierba.

El panel de estado incluye datos del juego, condiciones comprobadas y valores observados. `último i` es una observación del contador después de salir de su alcance, no una variable que permanezca accesible fuera del `for`.

## Archivos

- `dist/index.html`: estructura accesible y contenido inicial.
- `dist/styles.css`: diseño adaptable y estilos de la granja.
- `dist/lessons.js`: instrucciones, preguntas y explicaciones de las seis misiones.
- `dist/app.js`: estado, trazas, controles, ejercicios y herramientas WebMCP opcionales.

## Comprobaciones

Se verificaron en navegador los seis resultados finales, la retroalimentación de una predicción equivocada, los dos ejercicios adicionales, la ejecución automática, el reinicio durante una ejecución y el diseño en una vista móvil. Las herramientas WebMCP son opcionales y se registran solo en navegadores compatibles.
