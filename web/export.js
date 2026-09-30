'use strict';
(() => {
const api=`
// API del laboratorio. Las coordenadas empiezan arriba a la izquierda.
class Mundo {
  static Mundo actual;
  int[][] cajas, muros, estaciones;
  int robots = 0;
  Mundo(int[][] cajas, int[][] muros, int[][] estaciones) {
    this.cajas = cajas; this.muros = muros; this.estaciones = estaciones;
  }
  boolean libre(int x, int y) {
    if (x < 0 || x >= 6 || y < 0 || y >= 5) return false;
    for (int[] muro : muros) if (muro[0] == x && muro[1] == y) return false;
    return true;
  }
  boolean estacion(int x, int y) {
    for (int[] e : estaciones) if (e[0] == x && e[1] == y) return true;
    return false;
  }
  int[] caja(int x, int y) {
    for (int[] c : cajas) if (c[0] == x && c[1] == y && c[2] > 0) return c;
    return null;
  }
}
class Robot {
  private String nombre;
  private int x = 0, y, direccion = 0, energia = 20, carga = 0, entregas = 0;
  private final Mundo mundo;
  Robot(String nombre) {
    this.nombre = nombre;
    mundo = Mundo.actual;
    y = Math.min(2 + mundo.robots++, 4);
  }
  void iniciar(int x, int y, int direccion, int energia, int carga, int entregas) {
    this.x = x; this.y = y; this.direccion = direccion; this.energia = energia;
    this.carga = carga; this.entregas = entregas;
  }
  public String getNombre() { return nombre; }
  public int getX() { return x; }
  public int getY() { return y; }
  public int getEnergia() { return energia; }
  public int getCarga() { return carga; }
  public int getEntregas() { return entregas; }
  private int dx() { return direccion == 0 ? 1 : direccion == 2 ? -1 : 0; }
  private int dy() { return direccion == 1 ? 1 : direccion == 3 ? -1 : 0; }
  public boolean puedeAvanzar() { return energia > 0 && mundo.libre(x + dx(), y + dy()); }
  public boolean hayCaja() { return mundo.caja(x, y) != null; }
  private void mover(int dx, int dy) {
    if (!mundo.libre(x + dx, y + dy)) throw new IllegalStateException("Camino bloqueado");
    if (energia < 1) throw new IllegalStateException("Sin energia");
    x += dx; y += dy; energia--;
  }
  public void avanzar() { mover(dx(), dy()); }
  public void este() { mover(1, 0); }
  public void oeste() { mover(-1, 0); }
  public void norte() { mover(0, -1); }
  public void sur() { mover(0, 1); }
  public void girarDerecha() { direccion = (direccion + 1) % 4; }
  public void girarIzquierda() { direccion = (direccion + 3) % 4; }
  public void recoger() {
    int[] caja = mundo.caja(x, y);
    if (caja == null) throw new IllegalStateException("No hay caja");
    caja[2]--; carga++;
  }
  public void dejar() {
    if (carga < 1) throw new IllegalStateException("Sin carga");
    carga--; entregas++;
  }
  public void recargar() {
    if (!mundo.estacion(x, y)) throw new IllegalStateException("No hay estacion");
    energia = 20;
  }
  public void gastar(int cantidad) {
    if (cantidad < 0 || cantidad > energia) throw new IllegalArgumentException("Gasto invalido");
    energia -= cantidad;
  }
}
`;
const matrix=rows=>'new int[][] {'+rows.map(row=>'{'+row.join(', ')+'}').join(', ')+'}';
function exportJava(m,source){
 const nodes=new RobotJava.Parser(source).parse(),classes=[],methods=[],body=[];
 for(const node of nodes){const text=source.slice(node.start,node.end);(node.kind==='class'?classes:node.kind==='method'?methods:body).push(text);}
 const r={x:0,y:2,dir:0,energy:20,cargo:0,delivered:0,...m.initial.robot};
 const setup=(name,props)=>`${name}.iniciar(${[props.x,props.y,props.dir,props.energy,props.cargo,props.delivered].join(', ')});`;
 const h={x:0,y:3,dir:0,energy:20,cargo:0,delivered:0,...m.initial.helper};
 return `// Robótica Java · Misión ${m.number}: ${m.title}\n// Guardar como Mision.java. Ejecutar: javac Mision.java && java Mision\nimport java.util.ArrayList;\n\npublic class Mision {\n  public static void main(String[] args) {\n    Mundo.actual = new Mundo(${matrix(m.initial.boxes??[])}, ${matrix(m.initial.walls??[])}, ${matrix(m.initial.chargers??[[0,2]])});\n    Robot robot = new Robot("Atlas");\n    ${setup('robot',r)}\n    ${m.initial.helper?`Robot ayudante = new Robot("Luna");\n    ${setup('ayudante',h)}`:''}\n    jugar(robot${m.initial.helper?', ayudante':''});\n    System.err.println("Atlas: (" + robot.getX() + ", " + robot.getY() + "), energia=" + robot.getEnergia() + ", carga=" + robot.getCarga() + ", entregas=" + robot.getEntregas());\n  }\n\n  static void jugar(Robot robot${m.initial.helper?', Robot ayudante':''}) {\n${body.join('\n').split('\n').map(line=>'    '+line).join('\n')}\n  }\n\n${methods.join('\n\n').split('\n').map(line=>'  '+line).join('\n')}\n}\n\n${classes.join('\n\n')}\n${api}`;
}
globalThis.JavaExport={exportJava};
})();
