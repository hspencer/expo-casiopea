/* =========================================================================
   062 · ACTUALIDAD DE LA ESCUELA — SUPERNOVA DE TIZA (version sobria)
   Portada generativa para la wiki Casiopea (e[ad] PUCV).

   Variante depurada del 061: se quitan los rellenos de color de las orbitas,
   el efecto tornasol y las figuras horneadas de cada curso. Queda:
   - paisaje polar de HORIZONTES de tiza (solo la linea), en parallax lento;
   - fondo negro estelar con titileo (referente: supernova de Tycho, SN 1572);
   - cada curso es su NOMBRE sobre la orbita; al pasar el mouse aparece un
     circulo de tiza (rollover) y el click abre su pagina;
   - pantalla de carga: una espiral de tiza (solo la linea) que se completa con
     el progreso real del horneado.

   Stack: p5.js 1.8 (WEBGL) + p5.brush 1.0.4c.
   Rendimiento: la tiza (cara) se hornea una vez a imagen y se compone con blend
   ADD; el rollover se dibuja en vivo. Al ser solo lineas, es mucho mas liviano.
   ========================================================================= */

// ---- Geometria polar -------------------------------------------------------
// cx, cy: centro del circulo guia (cy a 2.5x el alto, FUERA del sketch).
// ANG_UP: el cenit del arco visible (hacia arriba) es -90 grados.
let cx, cy, H, W;
const ANG_UP = -Math.PI / 2;
const VIS_HALF = (25 * Math.PI) / 180; // mitad de la ventana visible (~50 grados)
const BAKE_MARGIN = (28 * Math.PI) / 180; // margen extra horneado (drift + sin cortes)

const TIZA = [239, 233, 221]; // blanco calido de tiza
const ETIQUETA_ORBITA = {
  "talleres-arquitectura": "Talleres de Arquitectura",
  "talleres-diseno": "Talleres de Diseño",
  "cursos-arquitectura": "Cursos de Arquitectura",
  "cursos-diseno": "Cursos de Diseño",
  otros: "Otros",
};

// ---- Estado global ---------------------------------------------------------
let datos; // contenido de cursos.json
let orbitas = []; // configuracion + imagen horneada (linea) por orbita
let botones = []; // cursos: nombre (HTML) + rollover en vivo
let estrellas = [];
let labelsEl;
const BG = [4, 5, 10];

// Construccion incremental: el horneado se reparte en frames para mostrar la
// espiral de carga avanzando con el progreso real.
let fase = "construyendo"; // "construyendo" | "corriendo"
let cola = [];
let horneados = 0;
let totalHornear = 0;
let framesCarga = 0;
const MIN_CARGA = 75; // frames minimos de carga (para que la espiral se aprecie)

// preload(): carga el dataset estatico local (rapido, sin tocar la API).
function preload() {
  datos = loadJSON("./cursos.json");
}

function setup() {
  dimensionar(); // proporcion 2 cuadrados (2:1), mandada por el ancho disponible
  createCanvas(W, H, WEBGL);
  pixelDensity(1);
  imageMode(CORNER);
  noiseDetail(3, 0.55);
  labelsEl = document.getElementById("labels");
  ajustarContenedorEtiquetas();
  iniciarConstruccion();
}

// dimensionar(): el sketch mide "2 cuadrados a lo ancho" (relacion 2:1). El
// ancho lo manda el contenedor disponible; el alto es la mitad.
function dimensionar() {
  W = Math.floor(document.body.clientWidth);
  H = Math.floor(W / 2);
}

// ajustarContenedorEtiquetas(): la capa HTML de nombres se alinea al lienzo.
function ajustarContenedorEtiquetas() {
  if (!labelsEl) return;
  labelsEl.style.width = W + "px";
  labelsEl.style.height = H + "px";
}

// prepararEscena(): geometria + etiquetas (NO hornea).
function prepararEscena() {
  cx = W / 2;
  cy = 2.5 * H; // centro del circulo guia, muy por debajo del sketch
  crearEstrellas();
  definirOrbitas();
  repartirCursos();
  crearEtiquetas();
}

// iniciarConstruccion(): arma la cola (solo las 5 orbitas) y entra en fase de
// construccion mostrando la espiral. Se usa en setup y resize.
function iniciarConstruccion() {
  prepararEscena();
  cola = orbitas.map((o) => o);
  totalHornear = cola.length;
  horneados = 0;
  framesCarga = 0;
  fase = "construyendo";
  if (labelsEl) labelsEl.style.opacity = 0;
}

// dibujarEspiralCarga(p): espiral de tiza (solo la linea) que se traza del
// centro hacia afuera segun el progreso real (p en [0,1]) y gira lento.
function dibujarEspiralCarga(p) {
  blendMode(BLEND);
  background(BG[0], BG[1], BG[2]);
  push();
  translate(-W / 2, -H / 2);

  const ecx = W / 2,
    ecy = H / 2;
  const maxR = Math.min(W, H) * 0.14;
  const vueltas = 3.2;
  const giro = frameCount * 0.012;
  const pasos = Math.max(2, Math.floor(p * 200));

  const pts = [];
  for (let i = 0; i <= pasos; i++) {
    const u = p * (i / pasos);
    const th = u * vueltas * TWO_PI + giro;
    const r = maxR * u;
    pts.push([ecx + r * cos(th), ecy + r * sin(th)]);
  }

  brush.set("2B", color(TIZA[0], TIZA[1], TIZA[2]), 1.0);
  if (pts.length > 1) brush.spline(pts, 0.5);
  brush.noStroke();
  pop();
}

// definirOrbitas(): cinco orbitas concentricas. La de adentro (indice 0) es la
// mas cercana: pico bajo, arco ancho y parallax mas rapido.
function definirOrbitas() {
  orbitas = [];
  const orden = datos.orbitas; // de adentro hacia afuera
  const picoFrac = [0.82, 0.66, 0.52, 0.38, 0.22];
  const velocidades = [0.000045, 0.000037, 0.00003, 0.000023, 0.000017];
  for (let i = 0; i < orden.length; i++) {
    const R = cy - picoFrac[i] * H;
    const drawHalf = Math.max(VIS_HALF, Math.asin(constrain(W / 2 / R, -1, 1)));
    orbitas.push({
      clave: orden[i],
      R,
      drawHalf,
      amp: 0.05 * H,
      freq: 1.9,
      seed: i * 37.7 + 11,
      vel: velocidades[i],
      depth: map(i, 0, orden.length - 1, 1.0, 0.28),
      drift: 0,
      bakedDrift: 0,
      img: null,
    });
  }
}

// horizonteR(orbita, angulo, driftRef): radio del horizonte de tiza. El relieve
// es noise centrado en cero. driftRef = drift vigente u horneado.
function horizonteR(o, ang, driftRef) {
  const u = (ang - driftRef) * o.freq + o.seed;
  return o.R + o.amp * (noise(u, 100.0) * 2 - 1);
}

// repartirCursos(): cada curso recibe una coordenada angular fija (u) en su
// orbita; su posicion en pantalla = u + drift, de modo que cabalga el relieve.
function repartirCursos() {
  botones = [];
  const todos = datos.cursos;
  const maxA = Math.max(...todos.map((c) => c.alumnos), 1);
  const minA = Math.min(...todos.map((c) => c.alumnos), 1);

  for (const o of orbitas) {
    const cursos = todos.filter((c) => c.orbita === o.clave);
    const span = o.drawHalf * 1.5;
    cursos.forEach((c, k) => {
      const frac = cursos.length === 1 ? 0.5 : k / (cursos.length - 1);
      const u = ANG_UP - span / 2 + frac * span + random(-0.02, 0.02);
      const t = (c.alumnos - minA) / Math.max(maxA - minA, 1);
      const sizeR = lerp(24, 74, Math.sqrt(t)); // radio del circulo de rollover
      botones.push({ curso: c, orbita: o, u, sizeR, el: null, hover: false, x: 0, y: 0, visible: true });
    });
  }
}

// ---- Horneado de las lineas de horizonte (repartido en frames) ------------
// hornearUnaOrbita(): dibuja SOLO la linea de tiza del horizonte sobre negro y
// la guarda como imagen. Se compone luego con blend ADD (el negro no suma),
// girando levemente para el parallax. Sin rellenos: no hay cortes que tapar y
// es muy liviano.
function hornearUnaOrbita(o) {
  push();
  blendMode(BLEND);
  background(0);
  translate(-W / 2, -H / 2);

  const N = 140;
  const a0 = ANG_UP - o.drawHalf - BAKE_MARGIN;
  const a1 = ANG_UP + o.drawHalf + BAKE_MARGIN;
  const linea = [];
  for (let i = 0; i <= N; i++) {
    const ang = lerp(a0, a1, i / N);
    const r = horizonteR(o, ang, o.bakedDrift);
    linea.push([cx + r * cos(ang), cy + r * sin(ang)]);
  }
  brush.set("2B", color(TIZA[0], TIZA[1], TIZA[2]), 1.0);
  brush.spline(linea, 0.6);
  brush.noStroke();

  pop();
  // p5.brush bufferiza y vuelca en el hook "post" (fin de frame). Como aqui
  // capturamos a media construccion, forzamos el volcado antes del get().
  brush.reBlend();
  brush.reDraw();
  o.img = get();
  o.bakedDrift = o.drift;
}

// ---- Etiquetas HTML (nombre del curso sobre su orbita) ---------------------
function crearEtiquetas() {
  labelsEl.innerHTML = "";
  for (const b of botones) {
    const a = document.createElement("a");
    a.className = "curso";
    a.textContent = b.curso.titulo;
    a.href = b.curso.url || "#";
    a.target = "_blank";
    a.rel = "noopener";
    a.title = ETIQUETA_ORBITA[b.orbita.clave] + " · " + b.curso.alumnos + " estudiantes";
    const fs = constrain(b.sizeR * 0.32, 9, 15);
    a.style.fontSize = fs + "px";
    a.style.width = b.sizeR * 1.95 + "px";
    a.addEventListener("mouseenter", () => (b.hover = true));
    a.addEventListener("mouseleave", () => (b.hover = false));
    labelsEl.appendChild(a);
    b.el = a;
  }
}

// crearEstrellas(): campo estelar del cielo negro (titilan).
function crearEstrellas() {
  estrellas = [];
  const n = floor((W * H) / 5200);
  for (let i = 0; i < n; i++) {
    estrellas.push({
      x: random(W),
      y: random(H),
      size: random(0.5, 2.0),
      base: random(70, 210),
      speed: random(0.005, 0.02),
      phase: random(TWO_PI),
    });
  }
}

// ---- Render por frame ------------------------------------------------------
function draw() {
  // Fase de construccion: una orbita por frame; la espiral avanza con el
  // progreso. El lienzo se limpia y se traza la espiral despues de hornear.
  if (fase === "construyendo") {
    framesCarga++;
    // el horneado se reparte a lo largo de MIN_CARGA frames para que la espiral
    // avance suave y se aprecie (con solo 5 lineas seria instantaneo).
    const objetivo = Math.floor((framesCarga / MIN_CARGA) * totalHornear);
    while (cola.length && horneados < objetivo) {
      hornearUnaOrbita(cola.shift());
      horneados++;
    }
    const p = constrain(framesCarga / MIN_CARGA, 0, 1);
    dibujarEspiralCarga(p);
    if (framesCarga >= MIN_CARGA && !cola.length) {
      fase = "corriendo";
      if (labelsEl) labelsEl.style.opacity = 1;
    }
    return;
  }

  // Re-hornear como mucho una orbita por frame si el drift supero el margen.
  rehornearSiHaceFalta();

  blendMode(BLEND);
  background(BG[0], BG[1], BG[2]);

  // parallax con el mouse (las capas cercanas se mueven mas)
  const mx = map(mouseX, 0, W, 1, -1, true) * 26;
  const my = map(mouseY, 0, H, 1, -1, true) * 14;

  // estrellas (additivas)
  blendMode(ADD);
  dibujarEstrellas();

  // lineas de horizonte: de lejos (arriba) a cerca; imagen girada por el drift
  for (let i = orbitas.length - 1; i >= 0; i--) {
    const o = orbitas[i];
    o.drift += o.vel;
    const beta = o.drift - o.bakedDrift;
    const ox = mx * o.depth,
      oy = my * o.depth;
    blendMode(ADD);
    push();
    translate(-W / 2, -H / 2);
    translate(ox, oy);
    translate(cx, cy);
    rotate(beta);
    translate(-cx, -cy);
    image(o.img, 0, 0, W, H);
    pop();
  }

  // cursos: ubicar el nombre y, si esta bajo el mouse, su circulo de rollover
  for (let i = orbitas.length - 1; i >= 0; i--) {
    const o = orbitas[i];
    const ox = mx * o.depth,
      oy = my * o.depth;
    for (const b of botones) {
      if (b.orbita !== o) continue;
      colocarBoton(b, ox, oy);
    }
  }

  blendMode(BLEND); // deja el estado listo para el volcado de p5.brush (post)
}

// rehornearSiHaceFalta(): re-hornea la orbita cuyo drift excedio el margen.
function rehornearSiHaceFalta() {
  let cand = null,
    peor = 0;
  for (const o of orbitas) {
    const exceso = Math.abs(o.drift - o.bakedDrift) - (BAKE_MARGIN - 0.02);
    if (exceso > peor) {
      peor = exceso;
      cand = o;
    }
  }
  if (cand) hornearUnaOrbita(cand);
}

// dibujarEstrellas(): puntos blancos con titileo senoidal.
function dibujarEstrellas() {
  push();
  translate(-W / 2, -H / 2);
  noStroke();
  for (const s of estrellas) {
    const tw = map(sin(frameCount * s.speed * 60 + s.phase), -1, 1, 0.45, 1.15);
    fill(255, 255, 255, s.base * tw);
    ellipse(s.x, s.y, s.size, s.size);
  }
  pop();
}

// colocarBoton(): posicion del curso sobre su orbita; sincroniza la etiqueta y,
// si esta bajo el cursor, traza un circulo de tiza en vivo (rollover). El
// circulo se dibuja con p5.brush y se vuelca en el hook "post" del frame.
function colocarBoton(b, ox, oy) {
  const o = b.orbita;
  const ang = b.u + o.drift;
  const r = o.R + o.amp * (noise(b.u * o.freq + o.seed, 100.0) * 2 - 1);
  const x = cx + r * cos(ang) + ox;
  const y = cy + r * sin(ang) + oy;
  b.x = x;
  b.y = y;

  const fuera = x < -80 || x > W + 80 || y < -80 || y > H + 80;
  b.visible = !fuera;
  if (b.el) {
    if (fuera) {
      b.el.style.display = "none";
    } else {
      b.el.style.display = "block";
      b.el.style.left = x + "px";
      b.el.style.top = y + "px";
    }
  }
  if (fuera) return;

  // rollover: circulo de tiza alrededor del nombre seleccionado
  if (b.hover) {
    push();
    translate(-W / 2, -H / 2);
    brush.set("2B", color(TIZA[0], TIZA[1], TIZA[2]), 1.0);
    brush.noFill();
    brush.circle(x, y, b.sizeR * 1.15, 0.35); // ultimo arg: irregularidad a mano
    brush.noStroke();
    pop();
  }
}

// windowResized(): rehace la escena (con espiral) al cambiar el tamano.
function windowResized() {
  dimensionar();
  resizeCanvas(W, H, WEBGL);
  ajustarContenedorEtiquetas();
  iniciarConstruccion();
}
