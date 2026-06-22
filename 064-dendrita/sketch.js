// Dendrita (grafo dirigido por fuerzas)
// Nace un nodo en el centro y de el brotan aristas hacia nuevos nodos que se
// ramifican formando una dendrita. A diferencia de una version estatica, aqui
// el grafo es fisico: los nodos se repelen entre si (como cargas) y las aristas
// son resortes (springy), de modo que la dendrita se abre, vibra y se acomoda
// para llenar un circulo cuyo centro es el primer nodo. La animacion dura 1
// minuto.
//
// Pensado para incrustarse como widget en la wiki Casiopea: p5 2D sin brush,
// cuadrado y responsive (ocupa el ancho del contenedor #p5 y el alto igual).
// El codigo evita el caracter barra vertical porque rompe el parseo del wiki.

// --- Paleta -------------------------------------------------------------
const EDGE_GRIS = 180; // gris de las aristas
const EDGE_ALFA = 150; // opacidad de las aristas
const CARMIN = [180, 0, 24, 180]; // nodos carmin

// --- Tiempo -------------------------------------------------------------
const DURACION = 60; // segundos que tarda en completarse la dendrita
const PAUSA = 7; // segundos de reposo (sigue acomodandose) antes de reiniciar

// --- Crecimiento --------------------------------------------------------
const N_NODOS = 340; // nodos totales que tendra la dendrita al final
const MAX_HIJOS = 4; // hijos maximos por nodo (a mayor valor, mas ramificacion)
const PROB_EXTRA = 0.55; // prob. de preferir un nodo poco ramificado al elegir padre
const PROB_CONEXION = 0.18; // prob. de cerrar un lazo conectando dos nodos existentes
const DIST_CONEXION = 2.4; // alcance de esas conexiones, en multiplos de REST

// --- Fisica (en unidades de radio, disco de radio 1) --------------------
const REST = 0.038; // largo natural del resorte (aristas cortas)
const K_RESORTE = 0.2; // rigidez de las aristas (resortes)
const K_REPULSION = 0.00002; // repulsion entre nodos (debil: solo separa, no infla)
const D_MIN = 0.03; // distancia minima para acotar la repulsion (evita explosiones)
const AMORTIGUA = 0.82; // amortiguacion de la velocidad (1 = sin perdida)
const SUBPASOS = 2; // integraciones de fisica por cuadro (mas = mas estable)
const R_BORDE = 1.0; // radio del circulo que confina la dendrita
const K_BORDE = 0.5; // fuerza que empuja hacia adentro al tocar el borde
const A_MAX = 0.02; // tope de aceleracion por sub-paso (garantiza estabilidad)
const V_MAX = 0.02; // tope de velocidad por sub-paso (garantiza estabilidad)

// --- Estado -------------------------------------------------------------
let lado, cx, cy, R; // lado del canvas, centro y radio del disco en pixeles
let nodos = []; // {x, y, vx, vy, hijos} en coordenadas normalizadas
let aristas = []; // {a, b} indices dentro de nodos
let claves = null; // Set con las aristas ya existentes (evita duplicados)
let t0 = 0; // marca de tiempo de inicio del ciclo (ms)

// anchoContenedor
// Devuelve el ancho actual del div #p5, que es quien manda el tamano. Usa un
// minimo de respaldo por si el div aun no tiene ancho medible al cargar.
function anchoContenedor() {
  const cont = document.getElementById("p5");
  const w = cont ? cont.offsetWidth : 0;
  if (w > 0) return w;
  return Math.min(windowWidth, windowHeight);
}

// setup
// Crea el canvas CUADRADO (lado = ancho de #p5) y lo cuelga como hijo de #p5
// con c.parent("p5"). Observa el contenedor para mantenerse responsive aunque
// solo cambie el ancho del div y no el de la ventana.
function setup() {
  const cont = document.getElementById("p5");
  lado = anchoContenedor();
  const c = createCanvas(lado, lado);
  c.parent("p5");
  pixelDensity(Math.min(displayDensity(), 2));
  calcularGeometria();
  observarVisibilidad(cont);
  observarTamano(cont);
  reiniciar();
}

// observarTamano
// Vigila cambios de ancho del div #p5 (no solo de la ventana) y reajusta el
// canvas cuadrado en consecuencia. Los nodos estan en coordenadas normalizadas,
// asi que redimensionar no pierde ni deforma la animacion.
function observarTamano(cont) {
  if (!cont) return;
  if (typeof ResizeObserver !== "function") return;
  const ro = new ResizeObserver(function () {
    const w = anchoContenedor();
    if (Math.abs(w - lado) < 1) return;
    lado = w;
    resizeCanvas(lado, lado);
    calcularGeometria();
  });
  ro.observe(cont);
}

// calcularGeometria
// Deriva centro y radio en pixeles a partir del lado actual del canvas. Como
// los nodos se guardan normalizados (disco de radio 1), basta recalcular esto
// al redimensionar para que la animacion no se pierda ni se deforme.
function calcularGeometria() {
  cx = lado / 2;
  cy = lado / 2;
  R = (lado / 2) * 0.94;
}

// observarVisibilidad
// Pausa el bucle cuando la pestana o el widget no estan a la vista, para no
// gastar CPU mientras nadie lo mira.
function observarVisibilidad(cont) {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      noLoop();
    } else {
      loop();
    }
  });
  if (typeof IntersectionObserver !== "function") return;
  const io = new IntersectionObserver(function (entradas) {
    for (const e of entradas) {
      if (e.isIntersecting) {
        loop();
      } else {
        noLoop();
      }
    }
  });
  if (cont) io.observe(cont);
}

// windowResized
// Reajusta el canvas al nuevo ancho del contenedor manteniendo el cuadrado.
// No toca los datos: solo recalcula la geometria en pixeles.
function windowResized() {
  lado = anchoContenedor();
  resizeCanvas(lado, lado);
  calcularGeometria();
}

// reiniciar
// Vacia la estructura y siembra solo el nodo central (anclado). Los demas
// nodos iran apareciendo a lo largo del minuto. Reinicia el reloj del ciclo.
function reiniciar() {
  nodos = [{ x: 0, y: 0, vx: 0, vy: 0, hijos: 0 }];
  aristas = [];
  claves = new Set();
  t0 = millis();
}

// claveArista
// Construye un identificador unico para el par (a, b) sin importar el orden,
// usado para no repetir aristas. Evita el caracter barra vertical.
function claveArista(a, b) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo + "-" + hi;
}

// unir
// Crea una arista entre dos nodos si no existe ya. Devuelve si la creo.
function unir(a, b) {
  if (a === b) return false;
  const k = claveArista(a, b);
  if (claves.has(k)) return false;
  claves.add(k);
  aristas.push({ a: a, b: b });
  return true;
}

// conectarExistentes
// De vez en cuando cierra un lazo: toma un nodo al azar y lo conecta con otro
// nodo ya existente que tenga cerca (dentro de DIST_CONEXION * REST) y con el
// que aun no este unido. Asi el grafo deja de ser un arbol y gana ciclos.
function conectarExistentes() {
  if (random() >= PROB_CONEXION) return;
  if (nodos.length < 3) return;
  const i = floor(random(nodos.length));
  const a = nodos[i];
  const alcance = DIST_CONEXION * REST;
  let mejor = -1;
  let mejorD = alcance;
  for (let j = 0; j < nodos.length; j++) {
    if (j === i) continue;
    const k = claveArista(i, j);
    if (claves.has(k)) continue;
    const b = nodos[j];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < mejorD) {
      mejorD = d;
      mejor = j;
    }
  }
  if (mejor >= 0) unir(i, mejor);
}

// elegirPadre
// Escoge desde que nodo brotara el proximo. Para ramificar mucho, suele
// preferir un nodo con pocos hijos (elige el de menos hijos entre dos al azar);
// otras veces toma uno cualquiera. Nunca supera MAX_HIJOS por nodo.
function elegirPadre() {
  for (let intento = 0; intento < 20; intento++) {
    const i = floor(random(nodos.length));
    let cand = i;
    if (random() < PROB_EXTRA) {
      const j = floor(random(nodos.length));
      if (nodos[j].hijos < nodos[i].hijos) cand = j;
    }
    if (nodos[cand].hijos < MAX_HIJOS) return cand;
  }
  return 0;
}

// agregarNodo
// Hace brotar un nodo nuevo desde un padre elegido: lo coloca a una distancia
// REST en una direccion preferentemente hacia afuera (con dispersion) y crea la
// arista-resorte que los une. La fisica se encarga luego de acomodarlo.
function agregarNodo() {
  const pi = elegirPadre();
  const p = nodos[pi];
  const r = Math.hypot(p.x, p.y);
  const haciaAfuera = r > 0.001 ? Math.atan2(p.y, p.x) : random(TWO_PI);
  const ang = haciaAfuera + random(-1.2, 1.2);
  const nx = p.x + Math.cos(ang) * REST * random(0.8, 1.1);
  const ny = p.y + Math.sin(ang) * REST * random(0.8, 1.1);
  nodos.push({ x: nx, y: ny, vx: 0, vy: 0, hijos: 0 });
  unir(pi, nodos.length - 1);
  p.hijos++;
}

// objetivoNodos
// Cuantos nodos deberian existir segun el tiempo transcurrido, para repartir el
// crecimiento de forma pareja a lo largo de DURACION sin importar los fps.
function objetivoNodos() {
  const elapsed = (millis() - t0) / 1000;
  const frac = constrain(elapsed / DURACION, 0, 1);
  return 1 + Math.floor((N_NODOS - 1) * frac);
}

// fisica
// Un sub-paso de simulacion. Acumula fuerzas en cada nodo: repulsion entre
// pares cercanos (los separa), resortes en las aristas (los acercan o alejan
// hasta su largo natural) y un empuje hacia adentro si tocan el borde. Luego
// integra velocidad con amortiguacion. El nodo 0 queda anclado en el centro.
function fisica() {
  const n = nodos.length;
  // reset de aceleraciones reutilizando campos temporales
  for (let i = 0; i < n; i++) {
    nodos[i].ax = 0;
    nodos[i].ay = 0;
  }

  // repulsion entre todos los nodos (cargas que se repelen). Es debil pero
  // global: separa las ramas y empuja el conjunto a llenar el disco.
  for (let i = 0; i < n; i++) {
    const a = nodos[i];
    for (let j = i + 1; j < n; j++) {
      const b = nodos[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let d = Math.hypot(dx, dy);
      if (d < D_MIN) d = D_MIN;
      const f = K_REPULSION / (d * d);
      const ux = dx / d;
      const uy = dy / d;
      a.ax += ux * f;
      a.ay += uy * f;
      b.ax -= ux * f;
      b.ay -= uy * f;
    }
  }

  // resortes en las aristas (ley de Hooke hacia el largo natural REST)
  for (const e of aristas) {
    const a = nodos[e.a];
    const b = nodos[e.b];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let d = Math.hypot(dx, dy);
    if (d < 1e-6) d = 1e-6;
    const f = K_RESORTE * (d - REST);
    const ux = dx / d;
    const uy = dy / d;
    a.ax += ux * f;
    a.ay += uy * f;
    b.ax -= ux * f;
    b.ay -= uy * f;
  }

  // integracion con topes de aceleracion y velocidad (clave para que NO
  // explote), amortiguacion y confinamiento al circulo
  for (let i = 1; i < n; i++) {
    const p = nodos[i];
    // tope de aceleracion
    const am = Math.hypot(p.ax, p.ay);
    if (am > A_MAX) {
      p.ax = (p.ax / am) * A_MAX;
      p.ay = (p.ay / am) * A_MAX;
    }
    p.vx = (p.vx + p.ax) * AMORTIGUA;
    p.vy = (p.vy + p.ay) * AMORTIGUA;
    // tope de velocidad
    const vm = Math.hypot(p.vx, p.vy);
    if (vm > V_MAX) {
      p.vx = (p.vx / vm) * V_MAX;
      p.vy = (p.vy / vm) * V_MAX;
    }
    p.x += p.vx;
    p.y += p.vy;
    const r = Math.hypot(p.x, p.y);
    if (r > R_BORDE) {
      // empuje hacia adentro y recorte al borde del disco
      const ux = p.x / r;
      const uy = p.y / r;
      p.x = ux * R_BORDE;
      p.y = uy * R_BORDE;
      p.vx -= ux * K_BORDE * (r - R_BORDE);
      p.vy -= uy * K_BORDE * (r - R_BORDE);
    }
  }

  // el nodo central permanece anclado
  nodos[0].x = 0;
  nodos[0].y = 0;
  nodos[0].vx = 0;
  nodos[0].vy = 0;
}

// draw
// Bucle principal: agrega nodos al ritmo del reloj, corre varios sub-pasos de
// fisica (para que el grafo se relaje y vibre como resortes) y dibuja. Tras la
// pausa de reposo reinicia el ciclo.
function draw() {
  const elapsed = (millis() - t0) / 1000;

  // crecimiento pausado por tiempo
  const objetivo = objetivoNodos();
  let guardia = 0;
  while (nodos.length < objetivo && guardia < 50) {
    agregarNodo();
    conectarExistentes();
    guardia++;
  }

  // simulacion fisica (sigue corriendo en la pausa para que se asiente)
  for (let s = 0; s < SUBPASOS; s++) fisica();

  dibujar();

  if (elapsed >= DURACION + PAUSA) reiniciar();
}

// dibujar
// Limpia con fondo transparente y pinta las aristas-resorte negras y los nodos
// carmin. El circulo de confinamiento existe pero no se dibuja. El nodo central
// se dibuja un poco mayor.
function dibujar() {
  clear();

  // diametro del nodo; la arista se dibuja 2 px mas gruesa que ese diametro
  const rNodo = Math.max(1.6, lado * 0.0046);
  const diamNodo = rNodo * 2;

  // aristas (resortes) en gris translucido, mas gruesas que los nodos
  stroke(EDGE_GRIS, EDGE_ALFA);
  strokeWeight(diamNodo + 2);
  for (const e of aristas) {
    const a = nodos[e.a];
    const b = nodos[e.b];
    line(cx + a.x * R, cy + a.y * R, cx + b.x * R, cy + b.y * R);
  }

  // nodos carmin
  noStroke();
  fill(CARMIN[0], CARMIN[1], CARMIN[2]);
  for (const nd of nodos) {
    circle(cx + nd.x * R, cy + nd.y * R, rNodo * 2);
  }

  // nodo central un poco mayor
  circle(cx + nodos[0].x * R, cy + nodos[0].y * R, rNodo * 3.4);
}
