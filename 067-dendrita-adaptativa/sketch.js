// Dendrita adaptativa II (grafo dirigido por fuerzas, 5000 nodos)
// Versión corregida: los nodos reubicados al centro se desconectan antes de
// moverse (evita los "rayos" de aristas largas) y se reconectan sólo con
// vecinos cercanos tras asentarse. El scatter es aleatorio, no en anillos.
//
// Controles:
//   ESPACIO — reinicia desde cero
//   P       — pausa / reanuda la física (congela el dibujo en cualquier momento)
//
// Al completarse los 5000 nodos la imagen queda congelada y recorrible.
// Fondo negro, nodos blancos, aristas gris claro muy transparentes.
// Cuadrado y responsive (ocupa el ancho del contenedor #p5, alto igual).
// El código evita el caracter barra vertical porque rompe el parseo del wiki.

// --- Paleta -------------------------------------------------------------
const FONDO = 0;
const NODO_COLOR = 255;
const EDGE_COLOR = 210;
const EDGE_ALFA = 55;

// --- Crecimiento --------------------------------------------------------
const N_NODOS = 5000;
const DURACION = 90;
const MAX_HIJOS = 4;
const PROB_EXTRA = 0.55;
const PROB_CONEXION = 0.18;
const DIST_CONEXION = 2.4;

// --- Física (en unidades de radio, disco de radio 1) --------------------
const REST = 0.022;
const K_RESORTE = 0.2;
const K_REPULSION = 0.000008;
const D_MIN = 0.015;
const AMORTIGUA = 0.82;
const SUBPASOS = 2;
const R_BORDE = 1.0;
const K_BORDE = 0.5;
const A_MAX = 0.02;
const V_MAX = 0.02;

// --- Reubicación al centro ----------------------------------------------
const UMBRAL_BORDE = 0.85;
const UMBRAL_APRETADO = REST * 1.5;
const MIN_RELOCAR = 5;
const MAX_RELOCAR = 60;              // menos nodos por ciclo → cambio más sutil
const N_VECINOS_RECONECTAR = 2;
const MAX_DIST_RECONECTAR = REST * 5; // solo conecta si están cerca
const FRAMES_ASENTANDO = 60;
const COOLDOWN_RELOCAR = 120;

// --- Estado -------------------------------------------------------------
let lado, cx, cy, R;
let nodos = [];
let aristas = [];
let claves = null;
let t0 = 0;
let totalPausa = 0;
let tPausaInicio = 0;

let fase = 'creciendo';    // 'creciendo', 'asentando', 'congelado'
let frameAsentando = 0;
let nodosReubicados = [];
let frameUltimaRelocacion = -9999;
let esFinalAsentando = false;

let pausado = false;       // P pausa/reanuda la física

// anchoContenedor
function anchoContenedor() {
  const cont = document.getElementById("p5");
  const w = cont ? cont.offsetWidth : 0;
  if (w > 0) return w;
  return Math.min(windowWidth, windowHeight);
}

// setup
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
function observarTamano(cont) {
  if (!cont) return;
  if (typeof ResizeObserver !== "function") return;
  const ro = new ResizeObserver(function () {
    const w = anchoContenedor();
    if (Math.abs(w - lado) < 1) return;
    lado = w;
    resizeCanvas(lado, lado);
    calcularGeometria();
    if (fase === 'congelado') redraw();
  });
  ro.observe(cont);
}

// calcularGeometria
function calcularGeometria() {
  cx = lado / 2;
  cy = lado / 2;
  R = (lado / 2) * 0.94;
}

// observarVisibilidad
function observarVisibilidad(cont) {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      noLoop();
    } else if (fase !== 'congelado') {
      loop();
    }
  });
  if (typeof IntersectionObserver !== "function") return;
  const io = new IntersectionObserver(function (entradas) {
    for (const e of entradas) {
      if (e.isIntersecting) {
        if (fase !== 'congelado') loop();
      } else {
        noLoop();
      }
    }
  });
  if (cont) io.observe(cont);
}

// windowResized
function windowResized() {
  lado = anchoContenedor();
  resizeCanvas(lado, lado);
  calcularGeometria();
  if (fase === 'congelado') redraw();
}

// reiniciar
function reiniciar() {
  nodos = [{ x: 0, y: 0, vx: 0, vy: 0, hijos: 0 }];
  aristas = [];
  claves = new Set();
  t0 = millis();
  totalPausa = 0;
  tPausaInicio = 0;
  fase = 'creciendo';
  frameAsentando = 0;
  nodosReubicados = [];
  frameUltimaRelocacion = -9999;
  esFinalAsentando = false;
  pausado = false;
}

// keyPressed
// ESPACIO reinicia. P pausa/reanuda la física sin resetear el dibujo.
function keyPressed() {
  if (key === ' ') {
    reiniciar();
    loop();
    return false;
  }
  if (key.toLowerCase() === 'p') {
    if (fase === 'congelado') return false;
    pausado = !pausado;
    return false;
  }
}

// claveArista
function claveArista(a, b) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo + "-" + hi;
}

// unir
function unir(a, b) {
  if (a === b) return false;
  const k = claveArista(a, b);
  if (claves.has(k)) return false;
  claves.add(k);
  aristas.push({ a: a, b: b });
  return true;
}

// conectarExistentes
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
function objetivoNodos() {
  const elapsed = (millis() - t0 - totalPausa) / 1000;
  const frac = constrain(elapsed / DURACION, 0, 1);
  return 1 + Math.floor((N_NODOS - 1) * frac);
}

// encontrarApretadosBorde
function encontrarApretadosBorde() {
  const bordesIdx = [];
  for (let i = 1; i < nodos.length; i++) {
    if (Math.hypot(nodos[i].x, nodos[i].y) > UMBRAL_BORDE) bordesIdx.push(i);
  }
  const apretados = new Set();
  for (let a = 0; a < bordesIdx.length; a++) {
    for (let b = a + 1; b < bordesIdx.length; b++) {
      const ia = bordesIdx[a], ib = bordesIdx[b];
      const na = nodos[ia], nb = nodos[ib];
      if (Math.hypot(na.x - nb.x, na.y - nb.y) < UMBRAL_APRETADO) {
        apretados.add(ia);
        apretados.add(ib);
      }
    }
  }
  const lista = [...apretados];
  if (lista.length > MAX_RELOCAR) {
    for (let i = 0; i < MAX_RELOCAR; i++) {
      const j = i + floor(random(lista.length - i));
      const tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp;
    }
    return lista.slice(0, MAX_RELOCAR);
  }
  return lista;
}

// desconectarNodos
// Elimina TODAS las aristas de los nodos indicados antes de moverlos.
// Esto evita que las conexiones viejas queden como rayos largos desde el
// borde hasta el centro. Los nodos quedan "libres" para integrarse de nuevo
// localmente tras asentarse. Se reconstruye el Set de claves desde cero.
function desconectarNodos(indices) {
  const set = new Set(indices);
  aristas = aristas.filter(function (e) {
    return !set.has(e.a) && !set.has(e.b);
  });
  claves = new Set();
  for (const e of aristas) claves.add(claveArista(e.a, e.b));
  for (const i of indices) nodos[i].hijos = 0;
}

// reubicarAlCentro
// Scatter aleatorio en el interior (no en anillos, para no crear patrones
// radiales visibles). Velocidad inicial nula.
function reubicarAlCentro(indices) {
  for (const i of indices) {
    const ang = random(TWO_PI);
    const r = random(REST * 2, REST * 8);
    nodos[i].x = Math.cos(ang) * r;
    nodos[i].y = Math.sin(ang) * r;
    nodos[i].vx = 0;
    nodos[i].vy = 0;
  }
}

// conectarReubicados
// Conecta cada nodo reubicado sólo con sus vecinos más cercanos que estén
// dentro de MAX_DIST_RECONECTAR. Si no hay ninguno cerca, se omite: el
// crecimiento orgánico posterior los integrará vía conectarExistentes.
function conectarReubicados(indices) {
  for (const i of indices) {
    const a = nodos[i];
    const cerca = [];
    for (let j = 0; j < nodos.length; j++) {
      if (j === i) continue;
      if (claves.has(claveArista(i, j))) continue;
      const d = Math.hypot(a.x - nodos[j].x, a.y - nodos[j].y);
      if (d < MAX_DIST_RECONECTAR) cerca.push([d, j]);
    }
    cerca.sort(function (x, y) { return x[0] - y[0]; });
    const lim = Math.min(N_VECINOS_RECONECTAR, cerca.length);
    for (let k = 0; k < lim; k++) unir(i, cerca[k][1]);
  }
}

// fisica
// Repulsión con grilla espacial (O(n)), resortes y confinamiento.
function fisica() {
  const n = nodos.length;
  for (let i = 0; i < n; i++) {
    nodos[i].ax = 0;
    nodos[i].ay = 0;
  }

  const RADIO_G = REST * 3;
  const INV_C = 1 / RADIO_G;
  const ANCHO_G = Math.ceil(2 * INV_C) + 2;
  const grid = {};
  for (let i = 0; i < n; i++) {
    const gx = Math.floor((nodos[i].x + 1) * INV_C);
    const gy = Math.floor((nodos[i].y + 1) * INV_C);
    const k = gx * ANCHO_G + gy;
    if (grid[k]) grid[k].push(i);
    else grid[k] = [i];
  }
  for (let i = 0; i < n; i++) {
    const a = nodos[i];
    const gx = Math.floor((a.x + 1) * INV_C);
    const gy = Math.floor((a.y + 1) * INV_C);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const vecinos = grid[(gx + dx) * ANCHO_G + (gy + dy)];
        if (!vecinos) continue;
        for (const j of vecinos) {
          if (j <= i) continue;
          const b = nodos[j];
          let ddx = a.x - b.x;
          let ddy = a.y - b.y;
          let d = Math.hypot(ddx, ddy);
          if (d < D_MIN) d = D_MIN;
          const f = K_REPULSION / (d * d);
          const ux = ddx / d;
          const uy = ddy / d;
          a.ax += ux * f;
          a.ay += uy * f;
          b.ax -= ux * f;
          b.ay -= uy * f;
        }
      }
    }
  }

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

  for (let i = 1; i < n; i++) {
    const p = nodos[i];
    const am = Math.hypot(p.ax, p.ay);
    if (am > A_MAX) {
      p.ax = (p.ax / am) * A_MAX;
      p.ay = (p.ay / am) * A_MAX;
    }
    p.vx = (p.vx + p.ax) * AMORTIGUA;
    p.vy = (p.vy + p.ay) * AMORTIGUA;
    const vm = Math.hypot(p.vx, p.vy);
    if (vm > V_MAX) {
      p.vx = (p.vx / vm) * V_MAX;
      p.vy = (p.vy / vm) * V_MAX;
    }
    p.x += p.vx;
    p.y += p.vy;
    const r = Math.hypot(p.x, p.y);
    if (r > R_BORDE) {
      const ux = p.x / r;
      const uy = p.y / r;
      p.x = ux * R_BORDE;
      p.y = uy * R_BORDE;
      p.vx -= ux * K_BORDE * (r - R_BORDE);
      p.vy -= uy * K_BORDE * (r - R_BORDE);
    }
  }

  nodos[0].x = 0;
  nodos[0].y = 0;
  nodos[0].vx = 0;
  nodos[0].vy = 0;
}

// draw
function draw() {
  if (fase === 'creciendo') {
    const objetivo = objetivoNodos();
    let guardia = 0;
    while (nodos.length < objetivo && guardia < 50) {
      agregarNodo();
      conectarExistentes();
      guardia++;
    }

    if (nodos.length >= N_NODOS) {
      esFinalAsentando = true;
      tPausaInicio = millis();
      fase = 'asentando';
      frameAsentando = 0;
    } else if (frameCount - frameUltimaRelocacion > COOLDOWN_RELOCAR) {
      const apretados = encontrarApretadosBorde();
      if (apretados.length >= MIN_RELOCAR) {
        desconectarNodos(apretados);     // primero desconectar
        reubicarAlCentro(apretados);     // luego mover
        nodosReubicados = apretados;
        tPausaInicio = millis();
        frameUltimaRelocacion = frameCount;
        fase = 'asentando';
        frameAsentando = 0;
      }
    }

  } else if (fase === 'asentando') {
    frameAsentando++;
    if (frameAsentando >= FRAMES_ASENTANDO) {
      if (esFinalAsentando) {
        fase = 'congelado';
      } else {
        conectarReubicados(nodosReubicados);
        nodosReubicados = [];
        totalPausa += millis() - tPausaInicio;
        frameUltimaRelocacion = frameCount;
        fase = 'creciendo';
      }
    }
  }

  // Física sólo si no está pausado ni congelado
  if (fase !== 'congelado' && !pausado) {
    for (let s = 0; s < SUBPASOS; s++) fisica();
  }

  dibujar();

  if (fase === 'congelado') noLoop();
}

// dibujar
function dibujar() {
  background(FONDO);

  const rNodo = Math.max(0.6, lado * 0.0012);
  const diamNodo = rNodo * 2;

  stroke(EDGE_COLOR, EDGE_ALFA);
  strokeWeight(2);
  for (const e of aristas) {
    const a = nodos[e.a];
    const b = nodos[e.b];
    line(cx + a.x * R, cy + a.y * R, cx + b.x * R, cy + b.y * R);
  }

  noStroke();
  fill(NODO_COLOR);
  for (const nd of nodos) {
    circle(cx + nd.x * R, cy + nd.y * R, diamNodo);
  }

  circle(cx + nodos[0].x * R, cy + nodos[0].y * R, rNodo * 3.4);
}
