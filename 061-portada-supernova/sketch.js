/* =========================================================================
   061 · ACTUALIDAD DE LA ESCUELA — SUPERNOVA DE TIZA
   Portada generativa para la wiki Casiopea (e[ad] PUCV).

   Idea (ver PDF de referencia):
   - Paisaje generativo polar: "horizontes de tiza" anclados a un centro
     circular MUY por debajo del sketch (a 2.5x el alto). Solo se ve un arco
     de ~50 grados alrededor del cenit (-90 grados).
   - Varias "orbitas de noise" en parallax (movimiento lento, profundidad).
   - La superficie evoca la supernova de Tycho (SN 1572): fondo negro estelar,
     paleta difusa, bordes tornasoles animados (tecnica RGB de Plantilla:StellaNova).
   - Los datos son los cursos y talleres vigentes (cursos.json, generado desde
     la API semantica de Casiopea, misma consulta que el sketch 060).
   - Cada curso es una figura de tiza con su NOMBRE COMPLETO dentro; vive en la
     orbita de su categoria; rollover lo aviva y el click abre su pagina.

   Stack: p5.js 1.8 (WEBGL) + p5.brush 1.0.4c (mismo patron que 057/058).
   Rendimiento: la grafica de tiza (cara) se "hornea" una vez a imagenes; en
   cada frame solo se componen imagenes + trazos nativos baratos (parallax,
   estrellas, bordes tornasoles). Asi el movimiento lento corre fluido.
   ========================================================================= */

// ---- Geometria polar -------------------------------------------------------
// cx, cy: centro del circulo guia (cy esta a 2.5x el alto, FUERA del sketch).
// ANG_UP: el cenit del arco visible (hacia arriba) es -90 grados = -HALF_PI.
let cx, cy, H, W;
const ANG_UP = -Math.PI / 2;
const VIS_HALF = (25 * Math.PI) / 180; // mitad de la ventana visible (~50 grados)
const BAKE_MARGIN = (28 * Math.PI) / 180; // margen extra horneado para el drift

// ---- Paleta supernova de Tycho (calida=diseno, fria=arquitectura) ----------
// Cada orbita toma un color dominante; el trazo de tiza va casi blanco.
const PALETA = {
  "talleres-arquitectura": [85, 102, 204], // violeta-azul
  "talleres-diseno": [216, 85, 58], // coral
  "cursos-arquitectura": [86, 168, 200], // cian
  "cursos-diseno": [224, 146, 47], // ambar
  otros: [182, 194, 58], // verde-amarillo
};
const ETIQUETA_ORBITA = {
  "talleres-arquitectura": "Talleres de Arquitectura",
  "talleres-diseno": "Talleres de Diseño",
  "cursos-arquitectura": "Cursos de Arquitectura",
  "cursos-diseno": "Cursos de Diseño",
  otros: "Otros",
};
const TIZA = [239, 233, 221]; // blanco calido de tiza

// ---- Estado global ---------------------------------------------------------
let datos; // contenido de cursos.json
let orbitas = []; // configuracion + imagen horneada por orbita
let botones = []; // figuras-curso (sprite + etiqueta HTML)
let estrellas = []; // campo de estrellas
let labelsEl; // contenedor HTML de etiquetas
const BG = [4, 5, 10];

// Construccion incremental: el horneado de la grafica de tiza (caro) se reparte
// en varios frames para poder mostrar una espiral de carga que avanza con el
// progreso real, en vez de congelar la pantalla.
let fase = "construyendo"; // "construyendo" | "corriendo"
let cola = []; // tareas de horneado pendientes
let horneados = 0;
let totalHornear = 0;

// preload(): carga el dataset estatico antes de setup (patron loadJSON clasico).
function preload() {
  datos = loadJSON("./cursos.json");
}

// setup(): crea el lienzo WEBGL y construye toda la escena una sola vez.
function setup() {
  dimensionar(); // proporcion 2 cuadrados (2:1), mandada por el ancho disponible
  createCanvas(W, H, WEBGL);
  pixelDensity(1); // get()/image() en escala 1:1 (necesario para hornear)
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

// ajustarContenedorEtiquetas(): la capa HTML de nombres se alinea exactamente
// con el lienzo (mismo origen y tamano), para que cada etiqueta caiga sobre su
// figura.
function ajustarContenedorEtiquetas() {
  if (!labelsEl) return;
  labelsEl.style.width = W + "px";
  labelsEl.style.height = H + "px";
}

// prepararEscena(): recalcula geometria, distribuye cursos en orbitas y crea
// las etiquetas HTML. NO hornea (eso se reparte luego en frames).
function prepararEscena() {
  cx = W / 2;
  cy = 2.5 * H; // centro del circulo guia, muy por debajo del sketch
  crearEstrellas();
  definirOrbitas();
  repartirCursos();
  crearEtiquetas();
}

// iniciarConstruccion(): arma la cola de horneado (5 orbitas + las figuras) y
// entra en fase de construccion mostrando la espiral. Se usa en setup y resize.
function iniciarConstruccion() {
  prepararEscena();
  cola = [];
  for (const o of orbitas) cola.push({ tipo: "orbita", ref: o });
  for (const b of botones) cola.push({ tipo: "boton", ref: b });
  totalHornear = cola.length;
  horneados = 0;
  fase = "construyendo";
  if (labelsEl) labelsEl.style.opacity = 0; // nombres ocultos hasta terminar
}

// dibujarEspiralCarga(p): pantalla de carga dibujada con p5.brush. Una espiral
// de tiza que se traza del centro hacia afuera segun el progreso real del
// horneado (p en [0,1]) y gira lentamente. Se redibuja cada frame, asi que el
// trazo "respira" como tiza recien hecha.
function dibujarEspiralCarga(p) {
  blendMode(BLEND);
  background(BG[0], BG[1], BG[2]);
  push();
  translate(-W / 2, -H / 2);

  const ecx = W / 2,
    ecy = H / 2;
  const maxR = Math.min(W, H) * 0.14;
  const vueltas = 3.2;
  const giro = frameCount * 0.012; // rotacion lenta del conjunto
  const pasos = Math.max(2, Math.floor(p * 200));

  const pts = [];
  for (let i = 0; i <= pasos; i++) {
    const u = p * (i / pasos); // recorre la espiral solo hasta el progreso
    const th = u * vueltas * TWO_PI + giro;
    const r = maxR * u;
    pts.push([ecx + r * cos(th), ecy + r * sin(th)]);
  }

  // halo tornasol del cabezal (donde se esta "dibujando")
  if (pts.length > 1) {
    const cabeza = pts[pts.length - 1];
    blendMode(ADD);
    noFill();
    const tt = frameCount * 0.06;
    strokeWeight(1.2);
    stroke(255, 40, 70, 150);
    ellipse(cabeza[0] + 1.5, cabeza[1], 9 + sin(tt) * 2);
    stroke(60, 255, 130, 150);
    ellipse(cabeza[0], cabeza[1], 9 + sin(tt) * 2);
    stroke(70, 130, 255, 150);
    ellipse(cabeza[0] - 1.5, cabeza[1], 9 + sin(tt) * 2);
    blendMode(BLEND);
  }

  // la espiral de tiza
  brush.set("2B", color(TIZA[0], TIZA[1], TIZA[2]), 1.0);
  if (pts.length > 1) brush.spline(pts, 0.5);
  brush.noStroke();

  pop();
}

// definirOrbitas(): cinco orbitas concentricas. La de adentro (indice 0) es la
// mas cercana: pico bajo, arco ancho, figuras grandes y parallax mas rapido.
function definirOrbitas() {
  orbitas = [];
  const orden = datos.orbitas; // ya viene de adentro hacia afuera en el JSON
  // fraccion de alto donde "asoma" el pico de cada orbita (foreground abajo)
  const picoFrac = [0.82, 0.66, 0.52, 0.38, 0.22];
  const velocidades = [0.000045, 0.000037, 0.00003, 0.000023, 0.000017];
  for (let i = 0; i < orden.length; i++) {
    const R = cy - picoFrac[i] * H; // radio: pico = cy - R
    // ventana angular para que el arco cruce todo el ancho del lienzo
    const drawHalf = Math.max(
      VIS_HALF,
      Math.asin(constrain(W / 2 / R, -1, 1))
    );
    orbitas.push({
      clave: orden[i],
      R,
      drawHalf,
      amp: 0.05 * H, // amplitud del relieve de noise
      freq: 1.9, // bumps a lo largo del arco
      seed: i * 37.7 + 11,
      color: PALETA[orden[i]],
      vel: velocidades[i],
      depth: map(i, 0, orden.length - 1, 1.0, 0.28), // parallax con el mouse
      drift: 0, // desplazamiento angular acumulado (animacion)
      bakedDrift: 0, // drift con el que se horneo la imagen
      img: null,
    });
  }
}

// horizonteR(orbita, anguloPantalla, driftRef): radio del horizonte de tiza
// para un angulo dado. El relieve es noise centrado en cero. driftRef permite
// muestrear la curva "actual" (drift vigente) o la horneada (bakedDrift).
function horizonteR(o, ang, driftRef) {
  const u = (ang - driftRef) * o.freq + o.seed;
  return o.R + o.amp * (noise(u, 100.0) * 2 - 1);
}

// repartirCursos(): asigna a cada curso una coordenada angular fija (u) dentro
// de la ventana de su orbita; su posicion en pantalla = u + drift de la orbita,
// de modo que "cabalga" sobre su relieve mientras la orbita deriva.
function repartirCursos() {
  botones = [];
  // tamano de figura proporcional al numero de estudiantes (sqrt como en 060)
  const todos = datos.cursos;
  const maxA = Math.max(...todos.map((c) => c.alumnos), 1);
  const minA = Math.min(...todos.map((c) => c.alumnos), 1);

  for (const o of orbitas) {
    const cursos = todos.filter((c) => c.orbita === o.clave);
    const span = o.drawHalf * 1.5; // se reparten un poco mas alla de lo visible
    cursos.forEach((c, k) => {
      const frac = cursos.length === 1 ? 0.5 : k / (cursos.length - 1);
      const u = ANG_UP - span / 2 + frac * span + random(-0.02, 0.02);
      const t = (c.alumnos - minA) / Math.max(maxA - minA, 1);
      const sizeR = lerp(24, 74, Math.sqrt(t)); // radio de la figura en px
      botones.push({
        curso: c,
        orbita: o,
        u,
        sizeR,
        seedForma: random(1000),
        img: null,
        el: null,
        hover: false,
        x: 0,
        y: 0,
        visible: true,
      });
    });
  }
}

// ---- Horneado (repartido en frames durante la construccion) ---------------
// hornearUnaOrbita(): dibuja un horizonte de tiza + su superficie difusa sobre
// negro, y guarda el resultado como imagen. Luego se compone con blend ADD
// (el negro no suma), girando levemente para el parallax.
function hornearUnaOrbita(o) {
  push();
  blendMode(BLEND);
  background(0); // negro: base neutra para el blend ADD posterior
  translate(-W / 2, -H / 2);

  const N = 140;
  const a0 = ANG_UP - o.drawHalf - BAKE_MARGIN;
  const a1 = ANG_UP + o.drawHalf + BAKE_MARGIN;

  // puntos del horizonte para el trazo de tiza (muestreados al drift horneado)
  const linea = [];
  for (let i = 0; i <= N; i++) {
    const ang = lerp(a0, a1, i / N);
    const r = horizonteR(o, ang, o.bakedDrift);
    linea.push([cx + r * cos(ang), cy + r * sin(ang)]);
  }

  // superficie difusa: banda de color hacia el centro (acuarela p5.brush). El
  // arco se hornea sobre un rango angular mas ancho que lo visible (drawHalf +
  // BAKE_MARGIN). Ese margen (28 grados) basta para que el borde interior de la
  // banda cruce todo el ancho y su union caiga FUERA del lienzo por los
  // costados, evitando los cortes rectos sin agrandar el area de relleno (lo que
  // diluia la acuarela hasta hacerla invisible).
  const banda = 0.18 * H;
  const poly = [];
  for (let i = 0; i <= N; i++) poly.push(linea[i]);
  for (let i = N; i >= 0; i--) {
    const ang = lerp(a0, a1, i / N);
    const r = horizonteR(o, ang, o.bakedDrift) - banda;
    poly.push([cx + r * cos(ang), cy + r * sin(ang)]);
  }
  const [cr, cg, cb] = o.color;
  brush.noStroke();
  brush.fill(color(cr, cg, cb), 72);
  brush.bleed(0.12);
  brush.fillTexture(0.55, 0.5);
  brush.beginShape(0);
  for (const p of poly) brush.vertex(p[0], p[1], 1);
  brush.endShape(CLOSE);
  brush.noFill();

  // el trazo de tiza del horizonte, encima de la superficie
  brush.set("2B", color(TIZA[0], TIZA[1], TIZA[2]), 1.1);
  brush.spline(linea, 0.6);
  brush.noStroke();

  pop();
  // p5.brush bufferiza trazos y acuarelas y los vuelca en el hook "post" (fin
  // de frame). Como aqui capturamos a media construccion con get(), hay que
  // forzar el volcado antes: reBlend() vuelca las acuarelas, reDraw() los
  // trazos (y limpia su buffer). Sin esto, get() tomaria el lienzo en negro.
  brush.reBlend();
  brush.reDraw();
  o.img = get(); // imagen de todo el lienzo (negro + esta orbita)
  o.bakedDrift = o.drift;
}

// hornearUnBoton(): cada figura-curso es un trazo de tiza irregular con un leve
// relleno difuso del color de su orbita. Se hornea centrada y se recorta.
function hornearUnBoton(b) {
  const s = b.sizeR;
  const pad = 14;
  const box = Math.ceil((s + pad) * 2);
  const ccx = W / 2,
    ccy = H / 2; // se hornea en el centro del lienzo

  push();
  blendMode(BLEND);
  background(0);
  translate(-W / 2, -H / 2);

  // vertices de piedra irregular (idea tomada de 060: "piedras que no calzan")
  const n = floor(random(7, 11));
  const verts = [];
  for (let i = 0; i < n; i++) {
    const ang = (TWO_PI / n) * i + random(-0.16, 0.16);
    const rr =
      s * (0.7 + 0.3 * noise(b.seedForma + cos(ang) * 1.6, b.seedForma + sin(ang) * 1.6));
    verts.push([ccx + cos(ang) * rr, ccy + sin(ang) * rr]);
  }

  // Relleno suave SIN textura: el scatter de fillTexture esparce marcas por
  // toda la caja del sprite y, con el blend ADD, se veria como un halo
  // cuadrado. Con fill + bleed la figura queda como un blob redondo limpio.
  const [cr, cg, cb] = b.orbita.color;
  brush.noStroke();
  brush.fill(color(cr, cg, cb), 42);
  brush.bleed(0.09);
  brush.beginShape(0);
  for (const v of verts) brush.vertex(v[0], v[1], 1);
  brush.endShape(CLOSE);
  brush.noFill();

  brush.set("cpencil", color(TIZA[0], TIZA[1], TIZA[2]), 0.9);
  brush.beginShape(0);
  for (const v of verts) brush.vertex(v[0], v[1], 1);
  brush.endShape(CLOSE);
  brush.noStroke();

  pop();
  brush.reBlend(); // vuelca acuarelas antes de capturar (ver hornearUnaOrbita)
  brush.reDraw(); // vuelca trazos y limpia el buffer
  b.img = get(ccx - box / 2, ccy - box / 2, box, box);
  b.boxHalf = box / 2;
}

// ---- Etiquetas HTML (nombre completo dentro de cada figura) -----------------
// crearEtiquetas(): el nombre del curso va como <a> centrado en la figura. Es
// el elemento interactivo: rollover lo aviva (CSS) y el click abre la pagina.
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

// crearEstrellas(): campo estelar (referente 3: fondo negro del cielo).
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
  // Fase de construccion: se hornea UNA tarea por frame y la espiral avanza con
  // el progreso real. El lienzo queda oculto tras el overlay opaco, asi que no
  // importa que muestre los horneados intermedios.
  if (fase === "construyendo") {
    if (cola.length) {
      const tarea = cola.shift();
      if (tarea.tipo === "orbita") hornearUnaOrbita(tarea.ref);
      else hornearUnBoton(tarea.ref);
      horneados++;
    }
    // tras hornear (que ensucia el lienzo), se limpia y se traza la espiral
    dibujarEspiralCarga(horneados / totalHornear);
    if (!cola.length) {
      fase = "corriendo";
      if (labelsEl) labelsEl.style.opacity = 1; // aparecen los nombres
    }
    return;
  }

  // 1) re-hornear como mucho UNA orbita por frame si el drift supero el margen
  //    (ocurre cada varios minutos; se hace antes de componer, sin parpadeo).
  rehornearSiHaceFalta();

  blendMode(BLEND);
  background(BG[0], BG[1], BG[2]);

  // parallax con el mouse: desplazamiento base que cada capa escala por su
  // profundidad (las cercanas se mueven mas).
  const mx = map(mouseX, 0, W, 1, -1, true) * 26;
  const my = map(mouseY, 0, H, 1, -1, true) * 14;

  // 2) estrellas (titilan), additivas
  blendMode(ADD);
  dibujarEstrellas();

  // 3) orbitas de lejos (indice alto, arriba) a cerca (indice 0): imagen
  //    horneada girada por el drift + parallax, mas el borde tornasol vivo.
  for (let i = orbitas.length - 1; i >= 0; i--) {
    const o = orbitas[i];
    o.drift += o.vel; // movimiento muy lento
    const beta = o.drift - o.bakedDrift; // giro respecto del horneado
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

    dibujarBordeTornasol(o, ox, oy);
  }

  // 4) botones-curso: sprite horneado + posicion analitica; etiqueta HTML.
  for (let i = orbitas.length - 1; i >= 0; i--) {
    const o = orbitas[i];
    const ox = mx * o.depth,
      oy = my * o.depth;
    for (const b of botones) {
      if (b.orbita !== o) continue;
      colocarBoton(b, ox, oy);
    }
  }

  blendMode(BLEND);
}

// rehornearSiHaceFalta(): si una orbita derivo mas que el margen horneado, se
// vuelve a hornear con el drift actual (la curva es continua porque el noise se
// muestrea en angulo absoluto). Solo una por frame para repartir el costo.
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

// dibujarEstrellas(): puntos blancos con un leve titileo senoidal.
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

// dibujarBordeTornasol(): el borde animado iridiscente sobre el horizonte. Se
// dibuja la misma polilinea tres veces (R, G, B) con leve desfase angular; con
// blend ADD aparece blanco al centro y flecos de color en los bordes
// (misma tecnica que la Plantilla:StellaNova de la wiki).
function dibujarBordeTornasol(o, ox, oy) {
  const N = 90;
  const ext = 0.06; // extiende los extremos fuera de cuadro
  const a0 = ANG_UP - o.drawHalf - ext;
  const a1 = ANG_UP + o.drawHalf + ext;
  const t = frameCount * 0.02;
  const sep = 0.006 * (1 + 0.6 * sin(t)); // desfase tornasol pulsante

  push();
  translate(-W / 2, -H / 2);
  translate(ox, oy);
  noFill();

  // halo del color de la orbita (cuerpo del borde)
  const [cr, cg, cb] = o.color;
  stroke(cr, cg, cb, 40);
  strokeWeight(5);
  trazarHorizonte(o, a0, a1, N, 0, t);

  // tres canales desfasados = tornasol
  strokeWeight(1.3);
  stroke(255, 40, 70);
  trazarHorizonte(o, a0, a1, N, +sep, t);
  stroke(60, 255, 130);
  trazarHorizonte(o, a0, a1, N, 0, t);
  stroke(70, 130, 255);
  trazarHorizonte(o, a0, a1, N, -sep, t);
  pop();
}

// trazarHorizonte(): polilinea del horizonte vigente, con un leve temblor
// temporal para que el borde "respire". dAng desplaza el canal (tornasol).
function trazarHorizonte(o, a0, a1, N, dAng, t) {
  beginShape();
  for (let i = 0; i <= N; i++) {
    const ang = lerp(a0, a1, i / N) + dAng;
    const u = (ang - o.drift) * o.freq + o.seed;
    const r = o.R + o.amp * (noise(u, 100.0 + sin(t + i * 0.1) * 0.15) * 2 - 1);
    vertex(cx + r * cos(ang), cy + r * sin(ang));
  }
  endShape();
}

// colocarBoton(): calcula la posicion en pantalla del curso sobre su orbita,
// pinta su sprite (additivo), sincroniza la etiqueta HTML y, si esta bajo el
// cursor, dibuja un realce tornasol.
function colocarBoton(b, ox, oy) {
  const o = b.orbita;
  const ang = b.u + o.drift; // cabalga el relieve mientras la orbita deriva
  const r = o.R + o.amp * (noise(b.u * o.freq + o.seed, 100.0) * 2 - 1);
  const x = cx + r * cos(ang) + ox;
  const y = cy + r * sin(ang) + oy;
  b.x = x;
  b.y = y;

  // cull: ocultar si sale del lienzo
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

  // sprite de tiza
  blendMode(ADD);
  push();
  translate(-W / 2, -H / 2);
  imageMode(CENTER);
  image(b.img, x, y);
  imageMode(CORNER);
  pop();

  // realce al pasar el mouse (anillo tornasol pulsante)
  if (b.hover) {
    const t = frameCount * 0.05;
    const d = b.sizeR * 2.25 + sin(t) * 3;
    push();
    translate(-W / 2, -H / 2);
    noFill();
    strokeWeight(1.4);
    stroke(255, 40, 70, 180);
    ellipse(x + 1.5, y, d, d);
    stroke(60, 255, 130, 180);
    ellipse(x, y, d, d);
    stroke(70, 130, 255, 180);
    ellipse(x - 1.5, y, d, d);
    pop();
  }
}

// windowResized(): rehace toda la escena al cambiar el tamano de ventana.
function windowResized() {
  dimensionar();
  resizeCanvas(W, H, WEBGL);
  ajustarContenedorEtiquetas();
  iniciarConstruccion(); // vuelve a hornear mostrando la espiral
}
