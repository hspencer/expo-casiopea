const WIKI = "https://wiki.ead.pucv.cl/api.php";
const ANIO = new Date().getFullYear();
const BARRA = String.fromCharCode(124);
const ANG_UP = -Math.PI / 2;
const VIS_HALF = (25 * Math.PI) / 180;
const MARGEN = (28 * Math.PI) / 180;

const TIZA = [239, 233, 221];
const BG = [4, 5, 10];

const ORDEN = [
  "talleres-arquitectura",
  "talleres-diseno",
  "cursos-arquitectura",
  "cursos-diseno",
  "otros",
];
const PICO = [0.58, 0.49, 0.41, 0.32, 0.22];
const VEL = [0.0015, 0.0012, 0.0009, 0.0007, 0.0005];
let ANCHO = 1.7;
const TEXTO = 14;

let W, H, cx, cy;
let canvasEl = null;
let orbitas = [];
let cursos = [];
let estrellas = [];
let cargando = true;
let huboError = false;
let hovered = null;
let dim = 0;

function altoDesdeAncho(w) {
  return Math.floor(constrain(map(w, 380, 1000, 760, 500, true), 500, 760));
}

function setup() {
  const cont = document.getElementById("p5");
  W = cont ? cont.offsetWidth : windowWidth;
  H = altoDesdeAncho(W);
  const c = createCanvas(W, H);
  c.parent("p5");
  canvasEl = c.elt;
  pixelDensity(Math.min(displayDensity(), 2));
  textFont("IBM Plex Sans");
  cx = W / 2;
  cy = 1.3 * H;
  frameRate(30);
  crearEstrellas();
  cargarDatos();
  observarVisibilidad(cont);
}

function observarVisibilidad(cont) {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) noLoop();
    else loop();
  });
  if (typeof IntersectionObserver !== "function") return;
  const io = new IntersectionObserver(function (entradas) {
    for (const e of entradas) {
      if (e.isIntersecting) loop();
      else noLoop();
    }
  });
  if (cont) io.observe(cont);
}

function windowResized() {
  const cont = document.getElementById("p5");
  W = cont ? cont.offsetWidth : windowWidth;
  H = altoDesdeAncho(W);
  resizeCanvas(W, H);
  cx = W / 2;
  cy = 1.3 * H;
  crearEstrellas();
  if (!cargando && !huboError) definirGeometria();
}

function urlConsulta() {
  const partes = [
    "[[Category:Curso]][[Año::" + ANIO + "]]",
    "?Año",
    "?Tipo de Curso",
    "?Alumnos",
    "?Carreras Relacionadas",
    "limit=9999",
  ];
  const query = partes.join(BARRA);
  const params = new URLSearchParams({
    action: "ask",
    format: "json",
    query: query,
    utf8: "1",
    formatversion: "latest",
    origin: "*",
  });
  return WIKI + "?" + params.toString();
}

function cargarDatos() {
  fetch(urlConsulta())
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      procesar(data);
      definirGeometria();
      cargando = false;
    })
    .catch(function () {
      huboError = true;
      cargando = false;
    });
}

function esDis(carreras) {
  return carreras.some(function (c) {
    return ("" + c).toLowerCase().indexOf("dise") >= 0;
  });
}

function esArq(carreras) {
  return carreras.some(function (c) {
    return ("" + c).toLowerCase().indexOf("arquitectura") >= 0;
  });
}

function clasificar(tipo, carreras) {
  const taller = ("" + tipo).toLowerCase().indexOf("taller") >= 0;
  const d = esDis(carreras);
  const a = esArq(carreras);
  if (d && a) return "otros";
  if (taller && a) return "talleres-arquitectura";
  if (taller && d) return "talleres-diseno";
  if (a) return "cursos-arquitectura";
  if (d) return "cursos-diseno";
  return "otros";
}

function procesar(data) {
  const res = data && data.query && data.query.results ? data.query.results : {};
  const lista = [];
  for (const titulo in res) {
    const item = res[titulo];
    const p = item.printouts ? item.printouts : {};
    const aniosRaw = p["Año"] ? p["Año"] : [];
    const anios = aniosRaw.map(function (x) {
      return parseInt(x, 10);
    });
    if (anios.length && anios.indexOf(ANIO) < 0) continue;
    const nAl = (p["Alumnos"] ? p["Alumnos"] : []).length;
    if (nAl === 0) continue;
    const carrerasRaw = p["Carreras Relacionadas"] ? p["Carreras Relacionadas"] : [];
    const carreras = carrerasRaw
      .map(function (o) {
        return o && o.fulltext ? o.fulltext : o;
      })
      .filter(Boolean);
    const tipo =
      p["Tipo de Curso"] && p["Tipo de Curso"][0] ? "" + p["Tipo de Curso"][0] : "Otro";
    const limpio = ("" + titulo).replace(/\s*\d{4}.*$/, "").trim();
    lista.push({
      titulo: limpio ? limpio : titulo,
      alumnos: nAl,
      tipo: tipo,
      carreras: carreras,
      url: item.fullurl ? item.fullurl : "",
      orbita: clasificar(tipo, carreras),
    });
  }
  cursos = lista;
}

function definirGeometria() {
  ANCHO = (W / H) * 0.85;
  orbitas = [];
  for (let i = 0; i < ORDEN.length; i++) {
    const R = cy - PICO[i] * H;
    const drawHalf = Math.max(VIS_HALF, Math.asin(constrain(W / 2 / (R * ANCHO), -1, 1)));
    orbitas.push({
      clave: ORDEN[i],
      R: R,
      drawHalf: drawHalf,
      wrapHalf: drawHalf + 0.05,
      amp: 0.05 * H,
      freq: 1.9,
      seed: i * 37.7 + 11,
      vel: VEL[i],
      depth: map(i, 0, ORDEN.length - 1, 1.0, 0.28),
      drift: 0,
    });
  }

  const maxA = Math.max.apply(null, cursos.map(function (c) {
    return c.alumnos;
  }).concat([1]));
  const minA = Math.min.apply(null, cursos.map(function (c) {
    return c.alumnos;
  }).concat([maxA]));

  for (const o of orbitas) {
    const enOrbita = cursos.filter(function (c) {
      return c.orbita === o.clave;
    });
    const span = o.wrapHalf * 2;
    enOrbita.forEach(function (c, k) {
      const frac = enOrbita.length === 1 ? 0.5 : k / enOrbita.length;
      c.u = ANG_UP - span / 2 + frac * span;
      c.orbitaRef = o;
      const t = (c.alumnos - minA) / Math.max(maxA - minA, 1);
      c.sizeR = lerp(22, 70, Math.sqrt(t));
      c.poly = generarPoligono(c.sizeR * 1.6 + 55, c.alumnos + k);
      c.x = 0;
      c.y = 0;
      c.zoom = 1;
      c.hov = 0;
      c.visible = true;
    });
  }
}

function generarPoligono(rad, semilla) {
  const n = floor(random(7, 11));
  const verts = [];
  for (let i = 0; i < n; i++) {
    const ang = (TWO_PI / n) * i + random(-0.16, 0.16);
    const rr = rad * (0.82 + 0.24 * noise(semilla + cos(ang) * 1.6, semilla + sin(ang) * 1.6));
    verts.push([cos(ang) * rr, sin(ang) * rr]);
  }
  return verts;
}

function envolver(ang, centro, semi) {
  const base = centro - semi;
  const rango = semi * 2;
  return base + mod(ang - base, rango);
}

function mod(a, n) {
  return ((a % n) + n) % n;
}

function horizonteR(o, ang) {
  return o.R;
}

function crearEstrellas() {
  estrellas = [];
  const n = floor((W * H) / 2400);
  for (let i = 0; i < n; i++) {
    estrellas.push({
      x: random(W),
      y: random(H),
      s: random(0.5, 2.1),
      base: random(60, 220),
      sp: random(0.005, 0.02),
      ph: random(TWO_PI),
    });
  }
}

function draw() {
  blendMode(BLEND);
  background(BG[0], BG[1], BG[2]);
  dibujarEstrellas();

  if (cargando) {
    dibujarMascaraTornasol();
    return;
  }
  if (huboError) {
    fill(TIZA[0], TIZA[1], TIZA[2], 180);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(13);
    text("No se pudo cargar la consulta de cursos.", W / 2, H / 2);
    return;
  }

  const mx = map(mouseX, 0, W, 1, -1, true) * 26;
  const my = map(mouseY, 0, H, 1, -1, true) * 14;

  for (let i = orbitas.length - 1; i >= 0; i--) {
    const o = orbitas[i];
    o.drift += o.vel;
    dibujarHorizonte(o, mx * o.depth, my * o.depth);
  }

  hovered = null;
  for (const c of cursos) {
    const o = c.orbitaRef;
    if (!o) continue;
    const ox = mx * o.depth;
    const oy = my * o.depth;
    const aw = envolver(c.u + o.drift, ANG_UP, o.wrapHalf);
    const r = horizonteR(o, aw);
    c.x = cx + r * ANCHO * cos(aw) + ox;
    c.y = cy + r * sin(aw) + oy;
    const dentroX = c.x >= -90 && c.x <= W + 90;
    const dentroY = c.y >= -60 && c.y <= H + 60;
    c.visible = dentroX && dentroY;
    if (c.visible && dist(mouseX, mouseY, c.x, c.y) < c.sizeR) hovered = c;
  }

  dim = lerp(dim, hovered ? 1 : 0, 0.18);

  noFill();
  strokeWeight(1.5);
  stroke(TIZA[0], TIZA[1], TIZA[2], 180);
  for (const c of cursos) {
    if (!c.visible) continue;
    c.hov = lerp(c.hov, c === hovered ? 1 : 0, 0.18);
    const s = c.hov * 0.75;
    if (s < 0.02) continue;
    beginShape();
    for (const v of c.poly) vertex(c.x + v[0] * s, c.y + v[1] * s);
    endShape(CLOSE);
  }
  cursor(hovered ? "pointer" : "default");

  textAlign(CENTER, CENTER);
  textSize(TEXTO);
  textLeading(TEXTO * 1.1);
  noStroke();
  for (const c of cursos) {
    if (!c.visible) continue;
    const grande = c === hovered;
    c.zoom = lerp(c.zoom, grande ? 1.18 : 1, 0.2);
    const boxW = 124;
    const boxH = 92;
    drawingContext.shadowColor = "rgba(0,0,0,0.9)";
    drawingContext.shadowBlur = 6;
    const alpha = grande ? 255 : lerp(225, 128, dim);
    fill(255, 255, 255, alpha);
    push();
    translate(c.x, c.y);
    scale(c.zoom);
    text(c.titulo, -boxW / 2, -boxH / 2, boxW, boxH);
    pop();
    drawingContext.shadowBlur = 0;
  }

  dibujarMascaraTornasol();
  blendMode(BLEND);
}

function bordeInferiorY(x, t) {
  const base = H * 0.8;
  const amp = H * 0.2;
  const u = x / W;
  const n =
    0.6 * noise(u * 2.2 + 3, t) + 0.4 * noise(u * 6.0 + 20, t * 1.4);
  return base + (n - 0.5) * 2 * amp;
}

function dibujarMascaraTornasol() {
  const t = frameCount * 0.004;

  drawingContext.globalCompositeOperation = "destination-in";
  noStroke();
  fill(255);
  trazarMascaraInferior(t);
  drawingContext.globalCompositeOperation = "source-over";

  blendMode(SCREEN);
  noFill();
  rimInferior(t - 0.12, 255, 45, 80);
  rimInferior(t, 60, 255, 130);
  rimInferior(t + 0.12, 80, 140, 255);
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetX = 0;
  blendMode(BLEND);
}

function trazarMascaraInferior(t) {
  const m = 14;
  const N = 150;
  beginShape();
  vertex(-m, -m);
  vertex(W + m, -m);
  for (let i = 0; i <= N; i++) {
    const x = W + m - (i / N) * (W + 2 * m);
    vertex(x, bordeInferiorY(x, t));
  }
  endShape(CLOSE);
}

function rimInferior(t, r, g, b) {
  const off = 100000;
  const blur = 16;
  drawingContext.shadowOffsetX = off;
  drawingContext.shadowColor = `rgba(${r},${g},${b},0.85)`;
  stroke(0);
  push();
  translate(-off, 0);
  drawingContext.shadowBlur = blur * 1.6;
  strokeWeight(16);
  trazarLineaInferior(t);
  drawingContext.shadowBlur = blur;
  strokeWeight(8);
  trazarLineaInferior(t);
  pop();
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowBlur = 0;
}

function trazarLineaInferior(t) {
  const N = 130;
  beginShape();
  curveVertex(-30, bordeInferiorY(0, t));
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * W;
    curveVertex(x, bordeInferiorY(x, t));
  }
  curveVertex(W + 30, bordeInferiorY(W, t));
  endShape();
}

function dibujarHorizonte(o, ox, oy) {
  const N = 120;
  const a0 = ANG_UP - o.drawHalf - MARGEN;
  const a1 = ANG_UP + o.drawHalf + MARGEN;
  noFill();
  stroke(TIZA[0], TIZA[1], TIZA[2], 178);
  strokeWeight(1.1);
  beginShape();
  for (let i = 0; i <= N; i++) {
    const ang = lerp(a0, a1, i / N);
    const r = horizonteR(o, ang);
    vertex(cx + r * ANCHO * cos(ang) + ox, cy + r * sin(ang) + oy);
  }
  endShape();
}

function dibujarEstrellas() {
  noStroke();
  for (const s of estrellas) {
    const tw = map(sin(frameCount * s.sp * 60 + s.ph), -1, 1, 0.45, 1.15);
    fill(255, 255, 255, s.base * tw);
    ellipse(s.x, s.y, s.s, s.s);
  }
}

function mousePressed() {
  if (!hovered) return;
  if (!hovered.url) return;
  const arriba = document.elementFromPoint(winMouseX, winMouseY);
  if (arriba !== canvasEl) return;
  window.open(hovered.url, "_blank");
}
