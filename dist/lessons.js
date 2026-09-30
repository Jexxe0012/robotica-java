'use strict';
window.HUERTO_LESSONS = [{
  id: 'sequence', name: 'Secuencia', title: 'Tu primera semilla', concept: 'El orden importa',
  intro: 'El personaje trabaja en la casilla donde está. Lee de arriba hacia abajo e imagina dónde estará al regar.',
  initial: 'Cinco casillas vacías. Empiezas en la 1.',
  code: ['granja.plantar();', 'granja.avanzar(1);', 'granja.plantar();', 'granja.regar();'],
  question: '¿Qué cultivo queda regado?',
  answers: ['El de la casilla 1.', 'El de la casilla 2.', 'Los dos cultivos.'], correct: 1,
  explanation: 'Cuando llegas a regar(), el personaje ya está en la casilla 2. Plantar y regar no lo mueven. Cada instrucción usa el estado que dejó la anterior.',
  errors: ['El personaje sale de la casilla 1 antes de regar. Sigue su posición después de avanzar(1).', 'Solo hay una llamada a regar(), y afecta a la casilla actual: la 2.'],
  hint: 'Sigue el personaje: plantar no lo mueve; avanzar sí.',
  reference: [['plantar()', 'Coloca un cultivo en la casilla actual.'], ['avanzar(int pasos)', 'Mueve el personaje esa cantidad de casillas a la derecha.'], ['regar()', 'Riega el cultivo de la casilla actual.'], [';', 'Marca el final de una instrucción Java.']],
  bonus: 'sequence'
}, {
  id: 'variables', name: 'Variables', title: 'Un nombre, un valor', concept: 'Sigue los cambios',
  intro: 'Una variable guarda un dato. Si le asignas un nuevo valor, el anterior se reemplaza.',
  initial: 'Cinco casillas vacías. Empiezas en la 1.',
  code: ['int pasos = 1;', 'pasos = pasos + 1;', 'granja.avanzar(pasos);'],
  question: '¿En qué casilla termina el personaje?',
  answers: ['En la casilla 2.', 'En la casilla 4.', 'En la casilla 3.'], correct: 2,
  explanation: 'pasos empieza en 1. Después calculas 1 + 1 y guardas 2 en esa misma variable. Avanzar 2 casillas desde la 1 te lleva a la 3. El signo = asigna un valor.',
  errors: ['El programa cambia pasos antes de avanzar. En la segunda línea, pasos deja de valer 1 y pasa a valer 2.', 'La primera asignación no mueve al personaje. Solo avanzas una vez, usando el último valor de pasos: 2.'],
  hint: 'Lleva la cuenta del valor actual de pasos, no de la suma de todas las líneas.',
  reference: [['int pasos = 1;', 'Declara una variable llamada pasos que guarda un número entero. Su valor inicial es 1.'], ['pasos = pasos + 1;', 'Lee el valor anterior, le suma 1 y guarda el resultado. = significa asignar.'], ['avanzar(pasos)', 'Usa el valor actual de la variable como cantidad de casillas.']]
}, {
  id: 'condition', name: 'Decisiones', title: '¿Hace falta agua?', concept: 'if / else',
  intro: 'El programa toma una decisión según la humedad. Se ejecuta una de las dos ramas.',
  initial: 'Un cultivo sin regar en la casilla 1.',
  code: ['int humedad = 30;', '', 'if (humedad < 40) {', '    granja.regar();', '} else {', '    granja.avanzar(1);', '}'],
  question: '¿Qué hace el personaje con una humedad de 30?',
  answers: ['Riega la casilla 1 y se queda allí.', 'Avanza a la casilla 2.', 'Riega y después avanza.'], correct: 0,
  explanation: '30 < 40 es verdadero. Entras en el bloque del if y riegas. El else se omite: sus instrucciones solo se ejecutarían si la condición fuera falsa.',
  errors: ['30 sí es menor que 40. Por eso se elige la rama de regar, no la de avanzar.', 'if y else son alternativas. Cuando una condición es verdadera, el programa omite la rama else.'],
  hint: 'Lee humedad < 40 como: ¿30 es menor que 40?',
  reference: [['if (condición)', 'Ejecuta su bloque cuando la condición da true (verdadero).'], ['else', 'Ejecuta su bloque cuando la condición del if da false (falso).'], ['<', 'Compara si el valor de la izquierda es menor que el de la derecha.'], ['{ }', 'Agrupan las instrucciones de un bloque.']]
}, {
  id: 'for', name: 'Repeticiones', title: 'Una fila de cultivos', concept: 'Bucle for',
  intro: 'En vez de copiar instrucciones, repítelas. Sigue el contador i para saber cuándo termina.',
  initial: 'Cinco casillas vacías. Empiezas en la 1.',
  code: ['for (int i = 0; i < 3; i = i + 1) {', '    granja.plantar();', '    granja.avanzar(1);', '}'],
  question: '¿Cómo queda el huerto al terminar?',
  answers: ['Dos cultivos; personaje en la casilla 3.', 'Tres cultivos; personaje en la casilla 4.', 'Cuatro cultivos; personaje en la casilla 5.'], correct: 1,
  explanation: 'El cuerpo se ejecuta con i = 0, 1 y 2: son tres vueltas. En cada una plantas y avanzas. Cuando i llega a 3, i < 3 da falso y termina. La última vuelta también mueve al personaje.',
  errors: ['Aunque el contador empieza en 0, esa primera vuelta también cuenta: 0, 1 y 2 son tres valores.', 'i < 3 no incluye el valor 3. El cuerpo deja de ejecutarse justo cuando el contador llega a 3.'],
  hint: 'Enumera los valores que cumplen i < 3: 0, 1, 2. Cuenta esas vueltas.',
  reference: [['int i = 0', 'Inicializa el contador una sola vez, antes de las repeticiones.'], ['i < 3', 'Se comprueba antes de cada vuelta. Si es falso, termina el bucle.'], ['i = i + 1', 'Aumenta el contador después de cada ejecución del cuerpo.'], ['El cuerpo del for', 'Son las instrucciones entre llaves: plantar y avanzar.']]
}, {
  id: 'while', name: 'Condiciones', title: 'Que no quede hierba', concept: 'Bucle while',
  intro: 'No siempre sabes cuántas veces repetir. Puedes seguir mientras una condición sea verdadera.',
  initial: 'Hay 3 hierbas en la casilla 1.',
  code: ['while (granja.hayHierba()) {', '    granja.quitarHierba();', '}'],
  question: '¿Cuántas veces se ejecuta quitarHierba()?',
  answers: ['Una vez.', 'Cuatro veces.', 'Tres veces.'], correct: 2,
  explanation: 'Antes de cada vuelta se comprueba si queda hierba. Quitas una por vuelta: 3, 2, 1, 0. La cuarta comprobación da falso, así que no hay una cuarta llamada a quitarHierba().',
  errors: ['while vuelve a comprobar la condición después de quitar una hierba. Todavía quedan dos: hay que seguir.', 'Hay cuatro comprobaciones, pero solo tres llamadas a quitarHierba(). La comprobación final da falso y no entra al cuerpo.'],
  hint: 'Distingue comprobar la condición de ejecutar la acción.',
  reference: [['while (condición)', 'Comprueba la condición antes de cada vuelta. Repite su cuerpo mientras sea true.'], ['hayHierba()', 'Devuelve true si queda alguna hierba en la casilla actual, y false si no queda ninguna.'], ['quitarHierba()', 'Retira exactamente una hierba de la casilla actual.']],
  bonus: 'while'
}, {
  id: 'method', name: 'Métodos', title: 'Una tarea con nombre', concept: 'Reutiliza tu lógica',
  intro: 'preparar() agrupa dos acciones. Definir un método no lo ejecuta: tienes que llamarlo.',
  initial: 'Cinco casillas vacías. Empiezas en la 1.',
  code: ['class Juego {', '    static void preparar(Granja granja) {', '        granja.plantar();', '        granja.regar();', '    }', '', '    static void jugar(Granja granja) {', '        preparar(granja);', '        granja.avanzar(1);', '        preparar(granja);', '    }', '}'],
  question: '¿Qué queda cuando termina jugar()?',
  answers: ['Dos cultivos regados, en las casillas 1 y 2.', 'Un cultivo regado en la casilla 1.', 'Dos cultivos, solo el segundo regado.'], correct: 0,
  explanation: 'La primera llamada a preparar(granja) planta y riega en la casilla 1. Después avanzas. La segunda llamada hace lo mismo en la 2. Las dos reciben la misma instancia de Granja y cambian su estado.',
  errors: ['preparar(granja) se llama dos veces. Después de avanzar se ejecuta otra vez, ahora en la casilla 2.', 'Cada llamada a preparar() ejecuta sus dos instrucciones: plantar y regar. Eso ocurre en las dos casillas.'],
  hint: 'Empieza en jugar(), y cada vez que veas preparar(granja), sigue las instrucciones de ese método.',
  reference: [['void preparar(Granja granja)', 'Define un método que recibe una instancia de Granja. void indica que no devuelve un valor.'], ['preparar(granja)', 'Llama al método usando la misma granja. Al terminar, continúa en la instrucción que sigue a la llamada.'], ['static', 'Permite llamar al método de esta clase sin crear una instancia de Juego.'], ['class Juego', 'Agrupa las definiciones de los métodos. El juego proporciona la clase ficticia Granja.']]
}];
