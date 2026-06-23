// Dendrita 3D adaptativa (grafo dirigido por fuerzas, 5000 nodos, esfera)
// Fusión de 065 (dendrita 3D, WEBGL, drag para rotar) y 067 (algoritmo
// adaptativo: los nodos que se aprietan en la superficie se desconectan,
// se reubican al interior, se asientan 1 seg y se reconectan sólo con
// sus vecinos más cercanos).
//
// Controles:
//   Arrastrar — rota la esfera desde el centro
//   ESPACIO   — reinicia desde cero
//   P         — pausa / reanuda la física
//   E         — alterna modo aristas (apaga nodos, enciende aristas luminosas)
//
// Al completarse los 5000 nodos la imagen queda congelada y recorrible.
// Fondo negro, nodos blancos como estrellas, aristas gris claro translúcidas.
// Embed en la wiki Casiopea: p5 WEBGL, canvas cuadrado dentro de #p5,
// responsive. El código evita el caracter barra vertical porque rompe el
// parseo del wiki.

// --- Paleta -------------------------------------------------------------
const FONDO = 0;
const NODO_COLOR = 255;
const EDGE_COLOR = 255;
const EDGE_ALFA = 60;

// --- Crecimiento --------------------------------------------------------
const N_NODOS = 5000;
const DURACION = 90;           // seg de crecimiento activo (sin contar pausas)
const MAX_HIJOS = 4;
const PROB_EXTRA = 0.55;
const PROB_CONEXION = 0.16;
const DIST_CONEXION = 2.2;

// --- Física (unidades de radio, esfera de radio 1) ----------------------
// REST calibrado para 5000 nodos en esfera unitaria:
// espaciado esperado = (vol_esfera / N)^(1/3) = (4.19/5000)^(1/3) ≈ 0.094
const REST = 0.08;
const K_RESORTE = 0.2;
const K_REPULSION = 0.000008;
const D_MIN = 0.05;
const AMORTIGUA = 0.82;
const SUBPASOS = 2;
const R_BORDE = 1.0;
const K_BORDE = 0.5;
const A_MAX = 0.02;
const V_MAX = 0.02;

// --- Reubicación al centro ----------------------------------------------
const UMBRAL_BORDE = 0.85;
const UMBRAL_APRETADO = REST;    // distancia borde-borde que activa reubicación
const MIN_RELOCAR = 5;
const MAX_RELOCAR = 60;
const N_VECINOS_RECONECTAR = 2;
const MAX_DIST_RECONECTAR = REST * 5;
const FRAMES_ASENTANDO = 60;    // ~1 s a 60 fps
const COOLDOWN_RELOCAR = 120;

// --- Rotación / interacción --------------------------------------------
const AUTO_ROT = 0.0024;
const SENS_DRAG = 0.01;

// --- Estado -------------------------------------------------------------
let lado, R;
let nodos = [];    // {x, y, z, vx, vy, vz, hijos}
let aristas = [];  // {a, b, rest}
let claves = null;
let t0 = 0;
let totalPausa = 0;
let tPausaInicio = 0;

let fase = 'creciendo';   // 'creciendo', 'asentando', 'congelado'
let frameAsentando = 0;
let nodosReubicados = [];
let frameUltimaRelocacion = -9999;
let esFinalAsentando = false;

let pausado = false;
let soloAristas = false;   // E alterna: apaga nodos y enciende aristas
let angX = -0.35;
let angY = 0.0;
let arrastrando = false;

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
  const c = createCanvas(lado, lado, WEBGL);
  c.parent("p5");
  c.style('border-radius', '50%');
  pixelDensity(Math.min(displayDensity(), 2));
  calcularGeometria();
  observarVisibilidad(cont);
  observarTamano(cont);
  reiniciar();
}

// calcularGeometria
function calcularGeometria() {
  R = (lado / 2) * 0.83;
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
  nodos = [{ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hijos: 0 }];
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
  soloAristas = false;
}

// keyPressed — ESPACIO reinicia, P pausa/reanuda, E alterna modo aristas
function keyPressed() {
  if (key === ' ') {
    reiniciar();
    loop();
    return false;
  }
  if (key.toLowerCase() === 'p') {
    if (fase === 'congelado') return false;
    if (pausado) {
      totalPausa += millis() - tPausaInicio; // descuenta el tiempo pausado
      pausado = false;
    } else {
      tPausaInicio = millis();
      pausado = true;
    }
    return false;
  }
  if (key.toLowerCase() === 'e') {
    soloAristas = !soloAristas;
    if (fase === 'congelado') redraw();
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
  aristas.push({ a: a, b: b, rest: REST * random(0.7, 1.3) });
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
    if (claves.has(claveArista(i, j))) continue;
    const b = nodos[j];
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (d < mejorD) { mejorD = d; mejor = j; }
  }
  if (mejor >= 0) unir(i, mejor);
}

// dirAleatoria
// Vector unitario uniformemente distribuido sobre la esfera.
function dirAleatoria() {
  const u = random(-1, 1);
  const th = random(TWO_PI);
  const s = Math.sqrt(1 - u * u);
  return { x: s * Math.cos(th), y: s * Math.sin(th), z: u };
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

// agregarNodo — brota en 3D: 60% radial hacia afuera + 40% aleatorio
function agregarNodo() {
  const pi = elegirPadre();
  const p = nodos[pi];
  const r = Math.hypot(p.x, p.y, p.z);
  const rnd = dirAleatoria();
  let dx = rnd.x, dy = rnd.y, dz = rnd.z;
  if (r > 0.001) {
    dx = 0.6 * (p.x / r) + 0.4 * rnd.x;
    dy = 0.6 * (p.y / r) + 0.4 * rnd.y;
    dz = 0.6 * (p.z / r) + 0.4 * rnd.z;
    const m = Math.hypot(dx, dy, dz);
    dx /= m; dy /= m; dz /= m;
  }
  const paso = REST * random(0.8, 1.1);
  nodos.push({ x: p.x + dx * paso, y: p.y + dy * paso, z: p.z + dz * paso,
               vx: 0, vy: 0, vz: 0, hijos: 0 });
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
// Nodos en la superficie (r > UMBRAL_BORDE) que tienen un vecino superficial
// a distancia < UMBRAL_APRETADO: señal de saturación en la esfera.
function encontrarApretadosBorde() {
  const bordesIdx = [];
  for (let i = 1; i < nodos.length; i++) {
    if (Math.hypot(nodos[i].x, nodos[i].y, nodos[i].z) > UMBRAL_BORDE) {
      bordesIdx.push(i);
    }
  }
  const apretados = new Set();
  for (let a = 0; a < bordesIdx.length; a++) {
    for (let b = a + 1; b < bordesIdx.length; b++) {
      const ia = bordesIdx[a], ib = bordesIdx[b];
      const na = nodos[ia], nb = nodos[ib];
      const d = Math.hypot(na.x - nb.x, na.y - nb.y, na.z - nb.z);
      if (d < UMBRAL_APRETADO) { apretados.add(ia); apretados.add(ib); }
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
// Elimina todas las aristas de los nodos indicados antes de moverlos,
// evitando que las conexiones viejas queden como rayos largos desde la
// superficie al interior. Reconstruye el Set de claves desde cero.
function desconectarNodos(indices) {
  const set = new Set(indices);
  aristas = aristas.filter(function (e) {
    return !set.has(e.a) && !set.has(e.b);
  });
  claves = new Set();
  for (const e of aristas) claves.add(claveArista(e.a, e.b));
  for (const i of indices) nodos[i].hijos = 0;
}

// reubicarAlCentro — scatter aleatorio 3D en radio REST*1.5 a REST*5
function reubicarAlCentro(indices) {
  for (const i of indices) {
    const dir = dirAleatoria();
    const r = random(REST * 1.5, REST * 5);
    nodos[i].x = dir.x * r;
    nodos[i].y = dir.y * r;
    nodos[i].z = dir.z * r;
    nodos[i].vx = 0;
    nodos[i].vy = 0;
    nodos[i].vz = 0;
  }
}

// conectarReubicados — sólo con vecinos dentro de MAX_DIST_RECONECTAR
function conectarReubicados(indices) {
  for (const i of indices) {
    const a = nodos[i];
    const cerca = [];
    for (let j = 0; j < nodos.length; j++) {
      if (j === i) continue;
      if (claves.has(claveArista(i, j))) continue;
      const d = Math.hypot(a.x - nodos[j].x, a.y - nodos[j].y, a.z - nodos[j].z);
      if (d < MAX_DIST_RECONECTAR) cerca.push([d, j]);
    }
    cerca.sort(function (x, y) { return x[0] - y[0]; });
    const lim = Math.min(N_VECINOS_RECONECTAR, cerca.length);
    for (let k = 0; k < lim; k++) unir(i, cerca[k][1]);
  }
}

// fisica
// Sub-paso 3D. Repulsión con grilla espacial 3D (O(n)), resortes en aristas
// y confinamiento a la esfera. El nodo 0 permanece anclado en el centro.
function fisica() {
  const n = nodos.length;
  for (let i = 0; i < n; i++) {
    nodos[i].ax = 0; nodos[i].ay = 0; nodos[i].az = 0;
  }

  // Grilla espacial 3D: celdas de lado RADIO_G, vecindad 3x3x3
  const RADIO_G = REST * 3;
  const INV_C = 1 / RADIO_G;
  const ANCHO_G = Math.ceil(2 * INV_C) + 2;
  const AG2 = ANCHO_G * ANCHO_G;
  const grid = {};
  for (let i = 0; i < n; i++) {
    const nd = nodos[i];
    const gx = Math.floor((nd.x + 1) * INV_C);
    const gy = Math.floor((nd.y + 1) * INV_C);
    const gz = Math.floor((nd.z + 1) * INV_C);
    const k = gx * AG2 + gy * ANCHO_G + gz;
    if (grid[k]) grid[k].push(i);
    else grid[k] = [i];
  }
  for (let i = 0; i < n; i++) {
    const a = nodos[i];
    const gx = Math.floor((a.x + 1) * INV_C);
    const gy = Math.floor((a.y + 1) * INV_C);
    const gz = Math.floor((a.z + 1) * INV_C);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const vecinos = grid[(gx + dx) * AG2 + (gy + dy) * ANCHO_G + (gz + dz)];
          if (!vecinos) continue;
          for (const j of vecinos) {
            if (j <= i) continue;
            const b = nodos[j];
            let ddx = a.x - b.x;
            let ddy = a.y - b.y;
            let ddz = a.z - b.z;
            let d = Math.hypot(ddx, ddy, ddz);
            if (d < D_MIN) d = D_MIN;
            const f = K_REPULSION / (d * d);
            const ux = ddx / d, uy = ddy / d, uz = ddz / d;
            a.ax += ux * f; a.ay += uy * f; a.az += uz * f;
            b.ax -= ux * f; b.ay -= uy * f; b.az -= uz * f;
          }
        }
      }
    }
  }

  // Resortes (Hooke)
  for (const e of aristas) {
    const a = nodos[e.a], b = nodos[e.b];
    let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    let d = Math.hypot(dx, dy, dz);
    if (d < 1e-6) d = 1e-6;
    const f = K_RESORTE * (d - e.rest);
    const ux = dx / d, uy = dy / d, uz = dz / d;
    a.ax += ux * f; a.ay += uy * f; a.az += uz * f;
    b.ax -= ux * f; b.ay -= uy * f; b.az -= uz * f;
  }

  // Integración con topes, amortiguación y confinamiento a la esfera
  for (let i = 1; i < n; i++) {
    const p = nodos[i];
    const am = Math.hypot(p.ax, p.ay, p.az);
    if (am > A_MAX) { const s = A_MAX / am; p.ax *= s; p.ay *= s; p.az *= s; }
    p.vx = (p.vx + p.ax) * AMORTIGUA;
    p.vy = (p.vy + p.ay) * AMORTIGUA;
    p.vz = (p.vz + p.az) * AMORTIGUA;
    const vm = Math.hypot(p.vx, p.vy, p.vz);
    if (vm > V_MAX) { const s = V_MAX / vm; p.vx *= s; p.vy *= s; p.vz *= s; }
    p.x += p.vx; p.y += p.vy; p.z += p.vz;
    const r = Math.hypot(p.x, p.y, p.z);
    if (r > R_BORDE) {
      const ux = p.x / r, uy = p.y / r, uz = p.z / r;
      p.x = ux * R_BORDE; p.y = uy * R_BORDE; p.z = uz * R_BORDE;
      p.vx -= ux * K_BORDE * (r - R_BORDE);
      p.vy -= uy * K_BORDE * (r - R_BORDE);
      p.vz -= uz * K_BORDE * (r - R_BORDE);
    }
  }
  const c = nodos[0];
  c.x = 0; c.y = 0; c.z = 0;
  c.vx = 0; c.vy = 0; c.vz = 0;
}

// draw — máquina de fases + rotación automática
function draw() {
  if (pausado) {
    dibujar();
    return;
  }

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
        desconectarNodos(apretados);
        reubicarAlCentro(apretados);
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

  if (fase !== 'congelado' && !pausado) {
    for (let s = 0; s < SUBPASOS; s++) fisica();
    if (!arrastrando) angY += AUTO_ROT;
  }

  dibujar();

  if (fase === 'congelado') noLoop();
}

// dibujar
// En WEBGL, beginShape(LINES) tiene un bug con el color de stroke; se usan
// llamadas line() individuales con stroke() de 4 canales explícitos.
function dibujar() {
  background(FONDO);
  rotateX(angX);
  rotateY(angY);

  const rNodo = Math.max(1.5, lado * 0.003);
  const ea = soloAristas ? 255 : EDGE_ALFA;
  const ew = soloAristas ? 1.5 : 1;

  // Aristas — stroke RGBA explícito para forzar el color correcto en WEBGL
  stroke(255, 255, 255, ea);
  strokeWeight(ew);
  noFill();
  for (const e of aristas) {
    const a = nodos[e.a], b = nodos[e.b];
    line(a.x * R, a.y * R, a.z * R, b.x * R, b.y * R, b.z * R);
  }

  // Nodos: ocultos en modo soloAristas
  if (!soloAristas) {
    stroke(255, 255, 255, 255);
    strokeWeight(rNodo * 2);
    beginShape(POINTS);
    for (const nd of nodos) {
      vertex(nd.x * R, nd.y * R, nd.z * R);
    }
    endShape();
    point(0, 0, 0);
  }
}

// sobreCanvas
function sobreCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

// mousePressed
function mousePressed() {
  if (sobreCanvas()) arrastrando = true;
}

// mouseReleased
function mouseReleased() {
  arrastrando = false;
}

// mouseDragged — rota la esfera; devuelve false para no arrastrar la página
function mouseDragged() {
  if (!arrastrando) return;
  angY += (mouseX - pmouseX) * SENS_DRAG;
  angX -= (mouseY - pmouseY) * SENS_DRAG;
  angX = constrain(angX, -Math.PI / 2, Math.PI / 2);
  return false;
}
