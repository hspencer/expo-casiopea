// Dendrita 3D (grafo dirigido por fuerzas, esfera)
// Variacion tridimensional del sketch 064. Nace un nodo en el centro y de el
// brotan aristas hacia nuevos nodos que se ramifican en el espacio. El grafo es
// fisico: los nodos se repelen (como cargas) y las aristas son resortes
// (springy), de modo que el conjunto se acomoda llenando una esfera cuyo centro
// es el primer nodo. Se arrastra con el mouse para rotar la esfera desde el
// centro. La animacion dura 1 minuto.
//
// Embed en la wiki Casiopea: p5 WEBGL, canvas cuadrado dentro de #p5 y
// responsive. El codigo evita el caracter barra vertical porque rompe el
// parseo del wiki.

// --- Paleta -------------------------------------------------------------
// Tokens inspirados en la Plantilla:StellaNova de la wiki: la triada aditiva
// RGB (rojo, verde, azul) mas el azul-blanco de sus estrellas. Suavizados y con
// alfa para que las aristas se vean translucidas y mezclen sus colores donde se
// cruzan, como el tornasol RGB de StellaNova.
// Solo la gama rojiza de StellaNova: rojo, carmin, coral y rojo oscuro.
const STELLA = [
  [235, 64, 76], // rojo
  [180, 0, 24], // carmin
  [216, 85, 58], // coral
  [140, 24, 38], // rojo oscuro
];
const EDGE_ALFA = 30; // opacidad de las aristas (muy translucidas)
const CARMIN = [180, 0, 24]; // nodos carmin
const NODE_ALFA = 200; // opacidad de los nodos (mas opacos)

// --- Tiempo -------------------------------------------------------------
const DURACION = 60; // segundos que tarda en completarse la dendrita
const PAUSA = 7; // segundos de reposo antes de reiniciar

// --- Crecimiento --------------------------------------------------------
const N_NODOS = 500; // nodos totales al final
const MAX_HIJOS = 4; // hijos maximos por nodo (mas = mas ramificacion)
const PROB_EXTRA = 0.55; // prob. de preferir un nodo poco ramificado como padre
const PROB_CONEXION = 0.16; // prob. de cerrar un lazo entre nodos existentes
const DIST_CONEXION = 2.2; // alcance de esas conexiones, en multiplos de REST

// --- Fisica (en unidades de radio, esfera de radio 1) -------------------
const REST = 0.17; // largo natural del resorte
const K_RESORTE = 0.2; // rigidez de las aristas (resortes)
const K_REPULSION = 0.00006; // repulsion entre nodos (debil: separa y llena)
const D_MIN = 0.05; // distancia minima para acotar la repulsion
const AMORTIGUA = 0.82; // amortiguacion de la velocidad
const SUBPASOS = 2; // integraciones de fisica por cuadro
const R_BORDE = 1.0; // radio de la esfera que confina la dendrita
const K_BORDE = 0.5; // empuje hacia adentro al tocar el borde
const A_MAX = 0.025; // tope de aceleracion por sub-paso (estabilidad)
const V_MAX = 0.025; // tope de velocidad por sub-paso (estabilidad)

// --- Rotacion / interaccion --------------------------------------------
const AUTO_ROT = 0.0024; // giro automatico cuando no se arrastra
const SENS_DRAG = 0.01; // sensibilidad del arrastre

// --- Estado -------------------------------------------------------------
let lado, R; // lado del canvas y radio de la esfera en pixeles
let nodos = []; // {x, y, z, vx, vy, vz, hijos}
let aristas = []; // {a, b} indices dentro de nodos
let claves = null; // Set de aristas existentes (evita duplicados)
let t0 = 0; // marca de tiempo de inicio del ciclo (ms)
let angX = -0.35; // rotacion acumulada en X (inclinacion)
let angY = 0.0; // rotacion acumulada en Y (giro)
let arrastrando = false; // si el usuario esta arrastrando

// anchoContenedor
// Devuelve el ancho actual del div #p5, que manda el tamano. Respaldo por si el
// div aun no tiene ancho medible al cargar.
function anchoContenedor() {
  const cont = document.getElementById("p5");
  const w = cont ? cont.offsetWidth : 0;
  if (w > 0) return w;
  return Math.min(windowWidth, windowHeight);
}

// setup
// Crea el canvas CUADRADO WEBGL (lado = ancho de #p5) y lo cuelga de #p5 con
// c.parent("p5"). Observa el contenedor para seguir siendo responsive.
function setup() {
  const cont = document.getElementById("p5");
  lado = anchoContenedor();
  const c = createCanvas(lado, lado, WEBGL);
  c.parent("p5");
  pixelDensity(Math.min(displayDensity(), 2));
  calcularGeometria();
  observarVisibilidad(cont);
  observarTamano(cont);
  reiniciar();
}

// calcularGeometria
// El radio de la esfera en pixeles depende del lado. Los nodos se guardan
// normalizados (esfera de radio 1), asi redimensionar no pierde la animacion.
function calcularGeometria() {
  R = (lado / 2) * 0.82;
}

// observarVisibilidad
// Pausa el bucle cuando el widget no esta a la vista, para ahorrar CPU.
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

// observarTamano
// Vigila cambios de ancho del div #p5 (no solo de la ventana) y reajusta el
// canvas cuadrado en consecuencia.
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

// windowResized
// Reajuste ante cambios de ventana (complementa al ResizeObserver).
function windowResized() {
  lado = anchoContenedor();
  resizeCanvas(lado, lado);
  calcularGeometria();
}

// reiniciar
// Vacia la estructura y siembra solo el nodo central (anclado). Reinicia reloj.
function reiniciar() {
  nodos = [{ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hijos: 0 }];
  aristas = [];
  claves = new Set();
  t0 = millis();
}

// claveArista
// Identificador unico del par (a, b) sin importar el orden. Evita la barra.
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
  // a cada arista se le asigna un token de color StellaNova al azar
  aristas.push({ a: a, b: b, c: floor(random(STELLA.length)) });
  return true;
}

// dirAleatoria
// Devuelve un vector unitario al azar uniformemente repartido sobre la esfera,
// usado para lanzar nuevas ramas en cualquier direccion del espacio.
function dirAleatoria() {
  const u = random(-1, 1);
  const th = random(TWO_PI);
  const s = Math.sqrt(1 - u * u);
  return { x: s * Math.cos(th), y: s * Math.sin(th), z: u };
}

// conectarExistentes
// De vez en cuando cierra un lazo: conecta un nodo con otro existente cercano
// (dentro de DIST_CONEXION * REST) no unido aun. Da ciclos al grafo.
function conectarExistentes() {
  if (random() >= PROB_CONEXION) return;
  if (nodos.length < 3) return;
  const i = floor(random(nodos.length));
  const a = nodos[i];
  let mejor = -1;
  let mejorD = DIST_CONEXION * REST;
  for (let j = 0; j < nodos.length; j++) {
    if (j === i) continue;
    if (claves.has(claveArista(i, j))) continue;
    const b = nodos[j];
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (d < mejorD) {
      mejorD = d;
      mejor = j;
    }
  }
  if (mejor >= 0) unir(i, mejor);
}

// elegirPadre
// Escoge desde que nodo brota el proximo. Suele preferir uno con pocos hijos
// (compara dos al azar) para ramificar mas. Nunca supera MAX_HIJOS.
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
// Brota un nodo nuevo desde un padre: lo coloca a distancia REST en una
// direccion preferentemente hacia afuera del centro (mezclada con una
// direccion aleatoria) y crea la arista-resorte. La fisica lo acomoda luego.
function agregarNodo() {
  const pi = elegirPadre();
  const p = nodos[pi];
  const r = Math.hypot(p.x, p.y, p.z);
  const rnd = dirAleatoria();
  let dx = rnd.x;
  let dy = rnd.y;
  let dz = rnd.z;
  if (r > 0.001) {
    // sesgo hacia afuera: 60% radial + 40% aleatorio
    dx = 0.6 * (p.x / r) + 0.4 * rnd.x;
    dy = 0.6 * (p.y / r) + 0.4 * rnd.y;
    dz = 0.6 * (p.z / r) + 0.4 * rnd.z;
    const m = Math.hypot(dx, dy, dz);
    dx /= m;
    dy /= m;
    dz /= m;
  }
  const paso = REST * random(0.8, 1.1);
  nodos.push({
    x: p.x + dx * paso,
    y: p.y + dy * paso,
    z: p.z + dz * paso,
    vx: 0,
    vy: 0,
    vz: 0,
    hijos: 0,
  });
  unir(pi, nodos.length - 1);
  p.hijos++;
}

// objetivoNodos
// Cuantos nodos deberian existir segun el tiempo, para repartir el crecimiento
// de forma pareja a lo largo de DURACION sin importar los fps.
function objetivoNodos() {
  const elapsed = (millis() - t0) / 1000;
  const frac = constrain(elapsed / DURACION, 0, 1);
  return 1 + Math.floor((N_NODOS - 1) * frac);
}

// fisica
// Un sub-paso de simulacion en 3D. Acumula repulsion entre todos los nodos,
// resortes en las aristas y empuje hacia adentro en el borde de la esfera.
// Integra con topes de aceleracion y velocidad (para no explotar) y
// amortiguacion. El nodo 0 queda anclado en el centro.
function fisica() {
  const n = nodos.length;
  for (let i = 0; i < n; i++) {
    nodos[i].ax = 0;
    nodos[i].ay = 0;
    nodos[i].az = 0;
  }

  // repulsion entre todos los pares (debil pero global: llena la esfera)
  for (let i = 0; i < n; i++) {
    const a = nodos[i];
    for (let j = i + 1; j < n; j++) {
      const b = nodos[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dz = a.z - b.z;
      let d = Math.hypot(dx, dy, dz);
      if (d < D_MIN) d = D_MIN;
      const f = K_REPULSION / (d * d);
      const ux = dx / d;
      const uy = dy / d;
      const uz = dz / d;
      a.ax += ux * f;
      a.ay += uy * f;
      a.az += uz * f;
      b.ax -= ux * f;
      b.ay -= uy * f;
      b.az -= uz * f;
    }
  }

  // resortes en las aristas (Hooke hacia el largo natural REST)
  for (const e of aristas) {
    const a = nodos[e.a];
    const b = nodos[e.b];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dz = b.z - a.z;
    let d = Math.hypot(dx, dy, dz);
    if (d < 1e-6) d = 1e-6;
    const f = K_RESORTE * (d - REST);
    const ux = dx / d;
    const uy = dy / d;
    const uz = dz / d;
    a.ax += ux * f;
    a.ay += uy * f;
    a.az += uz * f;
    b.ax -= ux * f;
    b.ay -= uy * f;
    b.az -= uz * f;
  }

  // integracion con topes, amortiguacion y confinamiento a la esfera
  for (let i = 1; i < n; i++) {
    const p = nodos[i];
    const am = Math.hypot(p.ax, p.ay, p.az);
    if (am > A_MAX) {
      const s = A_MAX / am;
      p.ax *= s;
      p.ay *= s;
      p.az *= s;
    }
    p.vx = (p.vx + p.ax) * AMORTIGUA;
    p.vy = (p.vy + p.ay) * AMORTIGUA;
    p.vz = (p.vz + p.az) * AMORTIGUA;
    const vm = Math.hypot(p.vx, p.vy, p.vz);
    if (vm > V_MAX) {
      const s = V_MAX / vm;
      p.vx *= s;
      p.vy *= s;
      p.vz *= s;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;
    const r = Math.hypot(p.x, p.y, p.z);
    if (r > R_BORDE) {
      const ux = p.x / r;
      const uy = p.y / r;
      const uz = p.z / r;
      p.x = ux * R_BORDE;
      p.y = uy * R_BORDE;
      p.z = uz * R_BORDE;
      p.vx -= ux * K_BORDE * (r - R_BORDE);
      p.vy -= uy * K_BORDE * (r - R_BORDE);
      p.vz -= uz * K_BORDE * (r - R_BORDE);
    }
  }

  // nodo central anclado
  const c = nodos[0];
  c.x = 0;
  c.y = 0;
  c.z = 0;
  c.vx = 0;
  c.vy = 0;
  c.vz = 0;
}

// draw
// Bucle principal: agrega nodos al ritmo del reloj, corre la fisica, aplica la
// rotacion (arrastre del usuario mas giro automatico) y dibuja la esfera.
function draw() {
  const elapsed = (millis() - t0) / 1000;

  const objetivo = objetivoNodos();
  let guardia = 0;
  while (nodos.length < objetivo && guardia < 50) {
    agregarNodo();
    conectarExistentes();
    guardia++;
  }

  for (let s = 0; s < SUBPASOS; s++) fisica();

  if (!arrastrando) angY += AUTO_ROT;

  dibujar();

  if (elapsed >= DURACION + PAUSA) reiniciar();
}

// dibujar
// Fondo transparente, rota la escena desde el centro segun angX/angY y pinta
// las aristas-resorte grises y los nodos carmin como pequenas esferas.
function dibujar() {
  clear();
  rotateX(angX);
  rotateY(angY);

  // diametro del nodo; la arista se dibuja 2 px mas gruesa que ese diametro,
  // gruesa y translucida como en la version 2D (064)
  const rNodo = Math.max(2, lado * 0.006);
  const diamNodo = rNodo * 2;

  // aristas (resortes) gruesas y muy translucidas, cada una con su token RGB
  strokeWeight(diamNodo + 2);
  for (const e of aristas) {
    const col = STELLA[e.c];
    stroke(col[0], col[1], col[2], EDGE_ALFA);
    const a = nodos[e.a];
    const b = nodos[e.b];
    line(a.x * R, a.y * R, a.z * R, b.x * R, b.y * R, b.z * R);
  }

  // nodos carmin translucidos como esferas pequenas (color plano)
  noStroke();
  fill(CARMIN[0], CARMIN[1], CARMIN[2], NODE_ALFA);
  for (const nd of nodos) {
    push();
    translate(nd.x * R, nd.y * R, nd.z * R);
    sphere(rNodo, 6, 4);
    pop();
  }

  // nodo central un poco mayor
  push();
  translate(0, 0, 0);
  sphere(rNodo * 1.7, 8, 6);
  pop();
}

// sobreCanvas
// Indica si el puntero esta dentro del area del canvas, para no capturar
// arrastres que ocurren fuera (util cuando el widget vive en una pagina larga).
function sobreCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

// mousePressed
// Inicia el arrastre solo si el clic cae sobre el canvas.
function mousePressed() {
  if (sobreCanvas()) arrastrando = true;
}

// mouseReleased
// Termina el arrastre.
function mouseReleased() {
  arrastrando = false;
}

// mouseDragged
// Rota la esfera desde el centro segun el desplazamiento del puntero: el
// movimiento horizontal gira en Y y el vertical inclina en X (acotado para no
// dar vueltas completas incomodas). Devuelve false para no arrastrar la pagina.
function mouseDragged() {
  if (!arrastrando) return;
  angY += (mouseX - pmouseX) * SENS_DRAG;
  angX += (mouseY - pmouseY) * SENS_DRAG;
  angX = constrain(angX, -Math.PI / 2, Math.PI / 2);
  return false;
}
