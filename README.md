# Robótica Java · Lógica y POO

Aventura educativa en español con **90 misiones**, construida a partir de la primera versión Huerto Java. Se aprende a leer, predecir, ordenar, depurar y escribir código, con Miaubit en un entorno 2D pixel art y un inspector de variables, objetos, referencias y llamadas.

- **Repositorio:** [Jexxe0012/robotica-java](https://github.com/Jexxe0012/robotica-java).
- **Despliegue privado:** [Abrir Robótica Java](https://huerto-java-josue.sandobaljosue16.chatgpt.site).
- **Comprobaciones automáticas:** [GitHub Actions](https://github.com/Jexxe0012/robotica-java/actions).

El proyecto enseña Java, mientras que la aplicación web y el intérprete están implementados en JavaScript. Phaser 4 renderiza el tablero 2D; el intérprete Java sigue determinando los movimientos y el resultado de cada misión. Los ejercicios descargables se ejecutan con un JDK real. No requiere Minecraft ni un servidor de Minecraft.

## La expedición de Miaubit

La interfaz presenta un camino de diez misiones por capítulo, ilustraciones pixel art y Miaubit como personaje del escenario. El mapa incluye las 90 misiones originales, permite explorar cualquier capítulo y marca las finalizaciones reales del usuario. La aventura utiliza los estados del intérprete para animar a los robots.

Los **nueve capítulos** incorporan escenarios editables en formato Tiled, historias para sus diez misiones y luces que se restauran con las finalizaciones reales. Cada región tiene terreno, paleta y edificios propios: desde el archivo del Valle de Cristal hasta el observatorio de las Pléyades. La restauración completa requiere resolver las diez misiones de la región. La cámara permite ver el mapa, seguir a Miaubit o concentrarse en el área de programación. En móvil los controles de ejecución permanecen a mano; el cuaderno se abre desde **Entender el código**. El sonido es opcional y comienza apagado. Consulta la [arquitectura, edición de mapas y comprobaciones de la campaña](docs/campaign-adventure.md).
