/*
 * 070 - Rostro claroscuro
 * Sketch cuadrado de 300x300, blanco y negro, alto contraste.
 * A partir de manchas organicas (curvas suaves moduladas por ruido) y
 * trazos tipo pincel se construye un retrato de estarcido distinto cada
 * vez. Un terminador ondulante divide luz y sombra. El fondo puede ser
 * blanco o negro: la figura emerge como luz (sobre negro) o como sombra
 * (sobre blanco). Las formas no son del todo humanas: a veces el rostro
 * se insinua, a veces se disuelve en mancha.
 *
 * noLoop: solo se dibuja al generar.
 * Click sobre el lienzo regenera el rostro.
 *
 * Condiciones MediaWiki:
 *  - el canvas se monta con parent("p5").
 *  - no se usa el operador OR logico (caracter de escape en la wiki):
 *    se emplean ternarios y banderas booleanas.
 */

const W = 300;
const H = 300;
const BLANCO = 248;
const NEGRO = 8;
let canvasEl = null;
let bgDark = false;

function setup() {
  const cont = document.getElementById("p5");
  const c = createCanvas(W, H);
  c.parent("p5");
  canvasEl = c.elt;
  pixelDensity(Math.min(displayDensity(), 2));
  noLoop();
  generar();
}

function generar() {
  noiseSeed(floor(random(100000)));
  const sd = random(1000);
  bgDark = random() < 0.5;
  background(bgDark ? NEGRO : BLANCO);
  noStroke();

  const cx = W / 2 + random(-18, 18);
  const cy = H / 2 + random(-14, 16);
  const fw = random(62, 96); // semiancho del rostro
  const fh = random(86, 122); // semialto del rostro
  const tilt = random(-0.28, 0.28);
  const dir = random() < 0.5 ? -1 : 1; // lado en sombra
  const lit = -dir; // lado iluminado
  const abstracto = random() < 0.1; // rara vez se disuelve la cara
  const sombraFuerte = random() < 0.55; // si no, luz casi frontal
  const peinado = floor(random(4)); // 0 ralo, 1 lateral, 2 raya, 3 mata

  push();
  translate(cx, cy);
  rotate(tilt);

  // 1. cuello / hombros en luz
  fill(BLANCO);
  mancha(lit * fw * 0.1, fh * 0.95, fw * 0.5, fh * 0.55, 0.7, sd + 40);

  // 2. masa iluminada del rostro (varias manchas fundidas)
  fill(BLANCO);
  for (let k = 0; k < 3; k++) {
    const ox = lit * fw * 0.1 + random(-fw * 0.2, fw * 0.2);
    const oy = random(-fh * 0.25, fh * 0.25);
    mancha(ox, oy, fw * random(0.62, 0.82), fh * random(0.6, 0.82), 0.85, sd + k * 13);
  }

  // 3. terminador: el lado en sombra se hunde en negro cruzando el rostro
  fill(NEGRO);
  terminador(dir, sd + 7, sombraFuerte);

  // 4. cabello: estilo variable para romper la silueta repetida
  fill(NEGRO);
  cabello(peinado, fw, fh, sd);

  // El triangulo ojos-boca es la estructura fundamental, pero sus
  // proporciones varian en cada rostro (y los ojos no son simetricos).
  const ojoX = fw * random(0.27, 0.37);
  const ojoY = -fh * random(0.0, 0.14);
  const sep = fh * random(0.42, 0.6); // distancia ojos -> boca
  const bocaY = ojoY + sep;
  const ojoRx = fw * random(0.13, 0.18);
  const ojoRy = ojoRx * random(0.65, 1.0);
  const asX = random(-fw * 0.05, fw * 0.05); // asimetria del segundo ojo
  const asY = random(-fh * 0.035, fh * 0.035);

  // 5. cejas: un arco corto sobre cada ojo
  fill(NEGRO);
  ceja(-1, ojoX, ojoY, fw, fh, sd + 80);
  ceja(1, ojoX + abs(asX), ojoY + asY, fw, fh, sd + 82);

  // 6. ojos: trazo en 'C' irregular y auto-intersectado.
  //    Oscuro sobre la luz; claro cuando cae en la sombra.
  ojoC(lit * ojoX, ojoY, ojoRx, ojoRy, false, sd + 90);
  ojoC(dir * ojoX + asX, ojoY + asY, ojoRx * random(0.85, 1.15), ojoRy * random(0.85, 1.15), true, sd + 95);

  // 7. nariz: tabique vertical mas un trazo horizontal corto en la base
  fill(NEGRO);
  const narizLargo = sep * random(0.5, 0.72);
  const narizY = ojoY + fh * 0.04;
  pincel(0, narizY, narizLargo, HALF_PI + dir * 0.3, random(2.5, 4.5), sd + 100);
  const baseY = narizY + narizLargo * 0.92;
  pincel(-dir * fw * 0.1, baseY, fw * random(0.14, 0.24), random(-0.14, 0.14), random(2, 3.5), sd + 105);

  // 8. boca: labio superior (y el inferior salvo en modo abstracto), centrada
  fill(NEGRO);
  const bw = fw * random(0.32, 0.46);
  const bx = random(-fw * 0.04, fw * 0.04);
  pincel(bx - bw / 2, bocaY, bw, random(-0.12, 0.12), random(4, 6), sd + 110);
  if (!abstracto) {
    pincel(bx - bw * 0.42, bocaY + fh * 0.07, bw * 0.85, random(-0.1, 0.1), random(3, 5), sd + 115);
  }

  // 9. luces de borde sobre la sombra (rim light)
  fill(BLANCO);
  const luces = floor(random(2, 5));
  for (let i = 0; i < luces; i++) {
    const y = random(-fh * 0.4, fh * 0.7);
    pincel(dir * fw * random(0.7, 1.0), y, random(fh * 0.15, fh * 0.4), HALF_PI + random(-0.4, 0.4), random(2, 5), sd + 130 + i);
  }

  // 10. motas organicas para textura
  const motas = floor(random(3, 7));
  for (let i = 0; i < motas; i++) {
    const claro = random() < 0.5;
    fill(claro ? BLANCO : NEGRO);
    mancha(random(-fw, fw), random(-fh * 0.7, fh), random(4, 12), random(4, 12), 1.2, sd + 200 + i);
  }

  pop();
}

// mancha cerrada y suave modulada por ruido
function mancha(cx, cy, rx, ry, irr, sd) {
  const n = 20;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (TWO_PI * i) / n;
    const nz = noise(sd + cos(a) * irr + 5, sd + sin(a) * irr + 5);
    const rr = 0.5 + nz;
    pts.push([cx + cos(a) * rx * rr, cy + sin(a) * ry * rr]);
  }
  curvaCerrada(pts);
}

function curvaCerrada(pts) {
  const n = pts.length;
  beginShape();
  curveVertex(pts[n - 1][0], pts[n - 1][1]);
  for (let i = 0; i < n; i++) curveVertex(pts[i][0], pts[i][1]);
  curveVertex(pts[0][0], pts[0][1]);
  curveVertex(pts[1][0], pts[1][1]);
  endShape(CLOSE);
}

// trazo tipo pincel: cinta que se afina en las puntas, con leve curvatura
function pincel(x, y, largo, ang, ancho, sd) {
  const seg = 12;
  const arriba = [];
  const abajo = [];
  const perp = ang + HALF_PI;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const px = x + cos(ang) * largo * t;
    const py = y + sin(ang) * largo * t;
    const flex = (noise(sd + t * 2.2, sd) - 0.5) * largo * 0.4;
    const bx = px + cos(perp) * flex;
    const by = py + sin(perp) * flex;
    const w = ancho * sin(PI * t);
    arriba.push([bx + cos(perp) * w, by + sin(perp) * w]);
    abajo.push([bx - cos(perp) * w, by - sin(perp) * w]);
  }
  beginShape();
  for (const p of arriba) vertex(p[0], p[1]);
  for (let i = abajo.length - 1; i >= 0; i--) vertex(abajo[i][0], abajo[i][1]);
  endShape(CLOSE);
}

// rellena el lado en sombra con un borde vertical ondulante.
// Con sombra suave la division se aleja al borde y la luz es casi frontal.
function terminador(dir, sd, fuerte) {
  const steps = 18;
  const borde = [];
  const sesgo = fuerte ? 0.16 : 0.34; // que tanto invade la sombra
  const amp = fuerte ? 0.34 : 0.2;
  for (let i = 0; i <= steps; i++) {
    const ty = map(i, 0, steps, -H, H);
    const base = dir * W * sesgo;
    const wob = (noise(sd, ty * 0.004 + 5) - 0.5) * W * amp;
    borde.push([base + wob, ty]);
  }
  beginShape();
  const lejos = dir < 0 ? -W : W;
  curveVertex(borde[0][0], borde[0][1]);
  for (const p of borde) curveVertex(p[0], p[1]);
  curveVertex(borde[borde.length - 1][0], borde[borde.length - 1][1]);
  vertex(lejos, H);
  vertex(lejos, -H);
  endShape(CLOSE);
}

// ceja: trazo corto y ligeramente inclinado sobre el ojo
function ceja(side, ojoX, ojoY, fw, fh, sd) {
  push();
  translate(side * ojoX, ojoY - fh * 0.07);
  rotate(side * random(0.05, 0.2));
  pincel(-fw * 0.15, 0, fw * 0.3, 0, random(2.5, 4), sd);
  pop();
}

// ojo en forma de 'C' irregular con auto-intersecciones.
// Es una cinta de ancho variable recorriendo un arco abierto (la abertura
// de la 'C'); el ruido en radio y grosor, mas un pequeno gancho final,
// producen los cruces. Oscuro sobre la luz; claro cuando cae en la sombra.
function ojoC(cx, cy, rx, ry, enSombra, sd) {
  fill(enSombra ? BLANCO : NEGRO);
  const seg = 18;
  const abertura = random(0.85, 1.8); // hueco de la C (no se cierra en O)
  const inicio = random(TWO_PI);
  const giro = random() < 0.5 ? 1 : -1;
  const barrido = (TWO_PI - abertura) * giro;
  const wBase = (enSombra ? 1.8 : 2.6) * (rx / 14);
  const arriba = [];
  const abajo = [];
  const total = seg + 3; // los 3 ultimos pasos hacen el gancho hacia dentro
  for (let i = 0; i <= total; i++) {
    const t = i / seg;
    const a = inicio + barrido * t;
    let rad = 1 + (noise(sd + cos(a) * 1.6, sd + sin(a) * 1.6) - 0.5) * 0.85;
    if (i > seg) rad *= 1 - (i - seg) * 0.22; // gancho: el radio cae y cruza la cinta
    const px = cx + cos(a) * rx * rad;
    const py = cy + sin(a) * ry * rad;
    let w = wBase * (0.5 + noise(sd + 11, t * 3.5));
    w *= 0.35 + sin(PI * min(t, 1)) * 0.85;
    arriba.push([px + cos(a) * w, py + sin(a) * w]);
    abajo.push([px - cos(a) * w, py - sin(a) * w]);
  }
  beginShape();
  for (const p of arriba) vertex(p[0], p[1]);
  for (let i = abajo.length - 1; i >= 0; i--) vertex(abajo[i][0], abajo[i][1]);
  endShape(CLOSE);
}

// cabello: cuatro estilos para que la silueta no se repita.
// Todas las masas se anclan sobre la frente (~-fh*0.6) para que el pelo
// quede pegado al craneo y nunca flote despegado encima de la cara.
function cabello(estilo, fw, fh, sd) {
  if (estilo === 0) {
    // ralo: o calvo, o un flequillo bajo que toca la frente
    if (random() < 0.55) {
      mancha(random(-fw * 0.25, fw * 0.25), -fh * 0.62, fw * random(0.7, 0.95), fh * 0.26, 0.8, sd + 21);
    }
    return;
  }
  if (estilo === 1) {
    // melena hacia un lado
    const s = random() < 0.5 ? -1 : 1;
    mancha(s * fw * 0.38, -fh * 0.45, fw * 0.78, fh * 0.7, 1.0, sd + 21);
    for (let i = 0; i < 5; i++) {
      pincel(s * fw * 0.48, -fh * 0.5 + i * fh * 0.2, random(fh * 0.3, fh * 0.6), HALF_PI + s * random(0.1, 0.7), random(4, 9), sd + 60 + i);
    }
    return;
  }
  if (estilo === 2) {
    // raya al medio: dos masas que se tocan en la coronilla
    mancha(-fw * 0.38, -fh * 0.58, fw * 0.62, fh * 0.5, 1.0, sd + 21);
    mancha(fw * 0.38, -fh * 0.58, fw * 0.62, fh * 0.5, 1.0, sd + 25);
    return;
  }
  // estilo 3: mata superior con mechones
  mancha(random(-fw * 0.15, fw * 0.15), -fh * 0.66, fw * 1.0, fh * random(0.42, 0.58), 1.0, sd + 21);
  const mechones = floor(random(3, 7));
  for (let i = 0; i < mechones; i++) {
    const t = map(i, 0, max(mechones - 1, 1), -1, 1);
    pincel(t * fw * 0.8, -fh * 0.6, random(fh * 0.3, fh * 0.6), -HALF_PI + random(-0.7, 0.7), random(4, 10), sd + 60 + i);
  }
}

// regenera al pulsar sobre el lienzo
function mousePressed() {
  const dentro = mouseX >= 0 && mouseX <= W && mouseY >= 0 && mouseY <= H;
  if (dentro) generar();
}
