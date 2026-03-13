/**
 * sketch.js — News Haiku: de la catástrofe a la poesía
 *
 * Ciclo:
 * 1. CARGANDO:  Se obtiene un titular apocalíptico vía RSS + se genera el haiku
 * 2. TITULAR:   Texto grande, multi-línea, left-aligned. Se lee.
 * 3. CAYENDO:   Las letras NO-haiku pivotan en un vértice inferior y caen
 *               (escalonadas). Las letras del haiku se quedan y se tiñen rojas.
 * 4. VIAJANDO:  Las letras rojas viajan con easing a su posición en el haiku.
 * 5. HAIKU:     El haiku queda visible, estático.
 * 6. Pausa → nuevo ciclo.
 *
 * Usa Matter.js (0.12.0) para la caída física.
 * Las letras del haiku NO usan física: se mueven con interpolación ease-in-out.
 */

// ── Alias Matter.js ──
const Engine = Matter.Engine,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Body = Matter.Body,
  Constraint = Matter.Constraint;

// ── Configuración ──
const CANVAS_H = 680;
const FONT_SIZE = 80;        // tamaño base del titular (y del haiku)
const FECHA_SIZE = 22;
const MARGEN = 40;            // margen izquierdo / derecho
const SANGRIA_HAIKU = 150;    // sangría izquierda del haiku
const GRAVITY = 0.8;

// Tiempos de cada estado en ms (ajustar a gusto)
const TIEMPOS = {
  TITULAR: 3000,       // tiempo que se muestra el titular estático
  CAYENDO: 4000,       // ventana en que las letras van pivotando y cayendo
  VIAJANDO: 3000,      // duración del viaje easing de las letras rojas
  HAIKU: 8000          // tiempo que se muestra el haiku antes de reiniciar
};

const COLORS = {
  bg: "#FFFFFF",
  texto: "#000000",
  fecha: "#999999",
  haikuLetra: "#CC0000",  // rojo para las letras que se quedan
  haiku: "#CC0000"
};

// ── Estados ──
const ESTADO = { CARGANDO: 0, TITULAR: 1, CAYENDO: 2, VIAJANDO: 3, HAIKU: 4 };

// ── Variables globales ──
let engine, world;
let suelo, paredIzq, paredDer;
let estadoActual = ESTADO.CARGANDO;
let tiempoEstado = 0;
let titularActual = "";
let haikuActual = null;
let fechaHoy = "";

/**
 * letras[] — array principal. Cada elemento describe una letra del titular.
 *   .letra        char
 *   .x, .y        posición original (layout del titular)
 *   .w, .h        ancho y alto del glyph
 *   .tamano       font size actual
 *   .esHaiku      boolean: si participa en el haiku
 *   .body         Matter.js body (solo para las que caen)
 *   .pivotConstraint  constraint de pivot (solo durante pivoteo)
 *   .pivotDelay   ms antes de empezar a pivotear
 *   .unpinDelay   ms después del pivot para soltar
 *   .pivotIniciado, .soltada  flags de estado
 *   .objetivo     {x, y} posición final en el haiku
 *   .viajeT       progreso del viaje [0..1]
 *   .origenViaje  {x, y} posición al iniciar el viaje
 *   .opacidad     para desvanecer las que caen
 */
let letras = [];

// ── Setup ──

function setup() {
  let cnv = createCanvas(windowWidth, CANVAS_H);
  cnv.parent("p5");
  textFont("Newsreader");

  let hoy = new Date();
  fechaHoy = hoy.toLocaleDateString("es-CL", {
    year: "numeric", month: "long", day: "numeric"
  });

  engine = Engine.create();
  world = engine.world;
  world.gravity.y = GRAVITY;

  crearLimites();
  iniciarCiclo();
}

// ── Límites físicos ──

/**
 * crearLimites — suelo y paredes invisibles para que las letras
 * que caen no se pierdan fuera del canvas.
 */
function crearLimites() {
  let opts = { isStatic: true, restitution: 0.3, friction: 0.5 };
  suelo = Bodies.rectangle(windowWidth / 2, CANVAS_H + 30, windowWidth + 200, 60, opts);
  paredIzq = Bodies.rectangle(-30, CANVAS_H / 2, 60, CANVAS_H * 2, opts);
  paredDer = Bodies.rectangle(windowWidth + 30, CANVAS_H / 2, 60, CANVAS_H * 2, opts);
  World.add(world, [suelo, paredIzq, paredDer]);
}

// ── Ciclo principal ──

/**
 * iniciarCiclo — obtiene titular, genera haiku, crea letras, marca cuáles
 * son del haiku, y arranca la secuencia visual.
 */
async function iniciarCiclo() {
  world.gravity.y = GRAVITY;
  estadoActual = ESTADO.CARGANDO;
  tiempoEstado = millis();
  limpiarLetras();
  haikuActual = null;

  // Obtener titular
  try {
    titularActual = await Noticias.obtenerPeorTitular();
  } catch (e) {
    titularActual = Noticias.obtenerTitularAleatorio();
  }
  if (!titularActual || titularActual.trim().length === 0) {
    titularActual = Noticias.obtenerTitularAleatorio();
  }

  // Generar haiku
  haikuActual = await Haiku.componerHaiku(titularActual);

  // Crear letras y marcar las del haiku
  crearLetras(titularActual);
  marcarLetrasHaiku();

  estadoActual = ESTADO.TITULAR;
  tiempoEstado = millis();
}

/**
 * limpiarLetras — elimina cuerpos y constraints del mundo
 */
function limpiarLetras() {
  for (let l of letras) {
    if (l.pivotConstraint) World.remove(world, l.pivotConstraint);
    if (l.body) World.remove(world, l.body);
  }
  letras = [];
}

// ── Creación de letras (layout multi-línea, left-aligned) ──

/**
 * crearLetras — posiciona cada carácter del titular como texto
 * multi-línea con word-wrap, alineado a la izquierda.
 * No crea cuerpos de física todavía; eso ocurre al entrar en CAYENDO.
 */
function crearLetras(texto) {
  let tam = FONT_SIZE;
  textSize(tam);
  let anchoDisponible = windowWidth - MARGEN * 2;

  // Word wrap manual
  let palabras = texto.split(/\s+/);
  let lineas = [];
  let lineaActual = "";

  for (let p of palabras) {
    let prueba = lineaActual.length === 0 ? p : lineaActual + " " + p;
    if (textWidth(prueba) > anchoDisponible && lineaActual.length > 0) {
      lineas.push(lineaActual);
      lineaActual = p;
    } else {
      lineaActual = prueba;
    }
  }
  if (lineaActual.length > 0) lineas.push(lineaActual);

  // Posicionar cada letra
  let lineHeight = tam * 1.1;
  let startY = MARGEN + tam; // baseline de la primera línea

  for (let li = 0; li < lineas.length; li++) {
    let linea = lineas[li];
    let x = MARGEN;
    let y = startY + li * lineHeight;

    for (let ci = 0; ci < linea.length; ci++) {
      let ch = linea[ci];
      let w = textWidth(ch);

      letras.push({
        letra: ch,
        x: x,
        y: y,
        w: w,
        h: tam,
        tamano: tam,
        esHaiku: false,
        // Física (se inicializan en CAYENDO, solo para no-haiku)
        body: null,
        pivotConstraint: null,
        pivotDelay: 0,
        unpinDelay: 0,
        pivotIniciado: false,
        soltada: false,
        // Viaje (solo haiku)
        objetivo: null,
        viajeT: 0,
        origenViaje: null,
        opacidad: 255
      });

      x += w;
    }
  }

  // Calcular posición de la fecha: debajo de la última línea
  // (se usa en dibujarFecha)
  letras._fechaY = startY + lineas.length * lineHeight + 10;
}

// ── Marcar letras del haiku ──

/**
 * marcarLetrasHaiku — determina qué letras del titular serán usadas
 * en el haiku. Empareja letra por letra (case-insensitive).
 * Las marcadas como esHaiku=true no caerán y se teñirán de rojo.
 */
function marcarLetrasHaiku() {
  if (!haikuActual) return;

  // Construir lista de letras necesarias para el haiku (sin espacios)
  let necesarias = [];
  for (let v = 0; v < haikuActual.versos.length; v++) {
    let verso = haikuActual.versos[v];
    for (let c = 0; c < verso.length; c++) {
      if (verso[c] !== " ") {
        necesarias.push({ letra: verso[c], verso: v, posEnVerso: c, asignada: false });
      }
    }
  }

  // Recorrer las letras del titular e intentar emparejar
  // (solo letras, no espacios)
  for (let n of necesarias) {
    for (let l of letras) {
      if (l.esHaiku) continue;
      if (l.letra === " ") continue;
      if (l.letra.toLowerCase() === n.letra.toLowerCase() && !n.asignada) {
        l.esHaiku = true;
        l.haikuVerse = n.verso;
        l.haikuPos = n.posEnVerso;
        n.asignada = true;
        break;
      }
    }
  }
}

// ── Iniciar caída: crear cuerpos con pivot para las NO-haiku ──

/**
 * iniciarCaida — crea un cuerpo Matter.js para cada letra no-haiku.
 * Cada cuerpo empieza estático. Tras pivotDelay se le pone un constraint
 * en el vértice inferior (pivot). Tras unpinDelay se suelta del todo.
 */
function iniciarCaida() {
  let idx = 0;
  for (let l of letras) {
    if (l.esHaiku || l.letra === " ") continue;

    // Crear cuerpo en la posición actual de la letra
    let cx = l.x + l.w / 2;
    let cy = l.y - l.h * 0.3; // centrar aprox en el glyph
    let cuerpo = Bodies.rectangle(cx, cy, Math.max(l.w, 4), l.h * 0.7, {
      restitution: 0.3,
      friction: 0.4,
      density: 0.003,
      isStatic: true // empieza estático
    });
    World.add(world, cuerpo);
    l.body = cuerpo;

    // Tiempos escalonados: las letras se van soltando gradualmente
    l.pivotDelay = random(200, TIEMPOS.CAYENDO * 0.6);
    l.unpinDelay = l.pivotDelay + random(400, 1200);
    l.pivotIniciado = false;
    l.soltada = false;

    idx++;
  }
}

/**
 * actualizarCaida — llamada cada frame durante CAYENDO.
 * Gestiona el ciclo: estático → pivot → caída libre.
 */
function actualizarCaida(t) {
  for (let l of letras) {
    if (l.esHaiku || l.letra === " " || !l.body) continue;

    // Fase 1: iniciar pivot (clavar vértice inferior)
    if (!l.pivotIniciado && t > l.pivotDelay) {
      l.pivotIniciado = true;
      // Hacer dinámico
      Body.setStatic(l.body, false);

      // Punto de pivot: vértice inferior (derecho o izquierdo, aleatorio)
      let lado = random() > 0.5 ? 1 : -1;
      let pivotX = l.body.position.x + (l.w / 2) * lado * 0.8;
      let pivotY = l.body.position.y + l.h * 0.3;

      let constraint = Constraint.create({
        pointA: { x: pivotX, y: pivotY },
        bodyB: l.body,
        pointB: { x: (l.w / 2) * lado * 0.8, y: l.h * 0.3 },
        stiffness: 0.9,
        length: 0
      });
      World.add(world, constraint);
      l.pivotConstraint = constraint;
    }

    // Fase 2: soltar el pivot (caída libre)
    if (l.pivotIniciado && !l.soltada && t > l.unpinDelay) {
      l.soltada = true;
      if (l.pivotConstraint) {
        World.remove(world, l.pivotConstraint);
        l.pivotConstraint = null;
      }
      // Pequeño empujón
      Body.applyForce(l.body, l.body.position, {
        x: random(-0.003, 0.003),
        y: random(0.001, 0.005)
      });
    }
  }
}

// ── Calcular destinos del haiku ──

/**
 * calcularDestinosHaiku — para cada letra marcada como esHaiku,
 * calcula su posición final en el layout del haiku.
 * Mismo tamaño que el titular, left-aligned con sangría SANGRIA_HAIKU.
 *
 * Estrategia: recorre cada verso carácter a carácter. Para los espacios
 * avanza usando el ancho de un espacio. Para las letras, busca la letra
 * del titular asignada a esa posición y usa SU ancho real (que puede ser
 * mayúscula) para calcular el avance en X. Así el kerning queda coherente
 * con lo que realmente se renderiza.
 */
function calcularDestinosHaiku() {
  if (!haikuActual) return;

  let tam = FONT_SIZE;
  textSize(tam);
  let lineHeight = tam * 1.1;
  let startY = MARGEN + tam;

  // Por cada verso, recopilar las letras del titular asignadas, en orden
  for (let v = 0; v < haikuActual.versos.length; v++) {
    let verso = haikuActual.versos[v];

    // Letras titulares asignadas a este verso, ordenadas por posición
    let letrasDelVerso = letras
      .filter(l => l.esHaiku && l.haikuVerse === v)
      .sort((a, b) => a.haikuPos - b.haikuPos);

    let x = SANGRIA_HAIKU;
    let y = startY + v * lineHeight;
    let idx = 0; // índice dentro de letrasDelVerso

    for (let c = 0; c < verso.length; c++) {
      if (verso[c] === " ") {
        // Espacio: avanzar por el ancho de un espacio
        x += textWidth(" ");
      } else {
        // Letra: asignar destino usando el ancho real del glyph del titular
        if (idx < letrasDelVerso.length) {
          let l = letrasDelVerso[idx];
          l.objetivo = { x: x, y: y };
          l.origenViaje = { x: l.x, y: l.y };
          x += textWidth(l.letra); // ancho REAL (mayúscula o minúscula)
          idx++;
        }
      }
    }
  }
}

// ── Easing ──

/**
 * easeInOutCubic — función de easing cúbica
 * Suave al inicio y al final, rápida en el medio.
 * Se usa para el viaje de las letras rojas.
 */
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Draw loop ──

function draw() {
  background(COLORS.bg);
  Engine.update(engine, 1000 / 60);

  let t = millis() - tiempoEstado;

  switch (estadoActual) {
    case ESTADO.CARGANDO:
      dibujarCargando();
      break;

    case ESTADO.TITULAR:
      dibujarLetrasEstaticas(COLORS.texto);
      dibujarFecha();
      if (t > TIEMPOS.TITULAR) {
        iniciarCaida();
        estadoActual = ESTADO.CAYENDO;
        tiempoEstado = millis();
      }
      break;

    case ESTADO.CAYENDO:
      actualizarCaida(t);
      dibujarLetrasCayendo();
      dibujarFecha();
      // Cuando pasó el tiempo de caída, pasar a viaje
      if (t > TIEMPOS.CAYENDO) {
        calcularDestinosHaiku();
        estadoActual = ESTADO.VIAJANDO;
        tiempoEstado = millis();
      }
      break;

    case ESTADO.VIAJANDO:
      // Seguir actualizando física para las que caen
      dibujarLetrasCayendo();
      animarViaje(t);
      dibujarFecha(t);  // con fade-out progresivo
      if (t > TIEMPOS.VIAJANDO) {
        estadoActual = ESTADO.HAIKU;
        tiempoEstado = millis();
      }
      break;

    case ESTADO.HAIKU:
      // Las mismas letras rojas quedan en su posición final (sin reemplazo)
      dibujarLetrasCayendo();
      break;
  }
}

// ── Dibujo ──

/**
 * dibujarCargando — texto sutil mientras se cargan noticias
 */
function dibujarCargando() {
  fill(COLORS.fecha);
  noStroke();
  textSize(FECHA_SIZE);
  textAlign(LEFT, BASELINE);
  text("buscando titulares en las noticias...", MARGEN, CANVAS_H / 2);
}

/**
 * dibujarLetrasEstaticas — dibuja todas las letras en su posición original
 * (estado TITULAR). Color uniforme.
 */
function dibujarLetrasEstaticas(color) {
  fill(color);
  noStroke();
  textAlign(LEFT, BASELINE);
  for (let l of letras) {
    textSize(l.tamano);
    text(l.letra, l.x, l.y);
  }
}

/**
 * dibujarLetrasCayendo — durante CAYENDO y VIAJANDO:
 * - Letras no-haiku: se dibujan desde su cuerpo Matter.js (o desvanecen)
 * - Letras haiku: se dibujan en rojo, en su posición estática o de viaje
 */
function dibujarLetrasCayendo() {
  noStroke();
  for (let l of letras) {
    if (l.letra === " ") continue;

    if (l.esHaiku) {
      // Transición de color negro → rojo en 100 frames
      if (l.colorT === undefined) l.colorT = 0;
      l.colorT = min(l.colorT + 1 / 100, 1);
      let c = lerpColor(color(COLORS.texto), color(COLORS.haikuLetra), l.colorT);
      fill(c);
      textSize(l.tamano);
      textAlign(LEFT, BASELINE);
      text(l.letra, l.x, l.y);
    } else if (l.body) {
      // Letras físicas: posición del cuerpo
      let pos = l.body.position;
      let ang = l.body.angle;

      // Desvanecer si cayeron muy abajo
      if (pos.y > CANVAS_H - 50) {
        l.opacidad = max(0, l.opacidad - 5);
      }
      if (l.opacidad <= 0) continue;

      fill(0, 0, 0, l.opacidad);
      push();
      translate(pos.x, pos.y);
      rotate(ang);
      textSize(l.tamano);
      textAlign(CENTER, CENTER);
      text(l.letra, 0, 0);
      pop();
    }
  }
}

/**
 * animarViaje — mueve las letras del haiku desde su posición original
 * hasta su destino en el haiku, con easing cúbico.
 */
function animarViaje(t) {
  let progreso = constrain(t / TIEMPOS.VIAJANDO, 0, 1);
  let eased = easeInOutCubic(progreso);

  for (let l of letras) {
    if (!l.esHaiku || !l.objetivo || !l.origenViaje) continue;
    l.x = lerp(l.origenViaje.x, l.objetivo.x, eased);
    l.y = lerp(l.origenViaje.y, l.objetivo.y, eased);
  }
}

/**
 * dibujarFecha — fecha en gris, alineada left, debajo del titular.
 * Recibe opcionalmente el tiempo transcurrido en el estado actual;
 * durante VIAJANDO el parámetro t controla un fade-out progresivo.
 */
function dibujarFecha(t) {
  let alfa = 255;
  // Durante VIAJANDO, la fecha se desvanece proporcionalmente al progreso
  if (estadoActual === ESTADO.VIAJANDO && t !== undefined) {
    let progreso = constrain(t / TIEMPOS.VIAJANDO, 0, 1);
    alfa = 255 * (1 - progreso);
  }
  if (alfa <= 0) return;

  let c = color(COLORS.fecha);
  c.setAlpha(alfa);
  fill(c);
  noStroke();
  textSize(FECHA_SIZE);
  textAlign(LEFT, BASELINE);
  let fy = letras._fechaY || CANVAS_H - 30;
  text(fechaHoy, MARGEN, fy);
}

// ── Eventos ──

function windowResized() {
  resizeCanvas(windowWidth, CANVAS_H);
  World.remove(world, [suelo, paredIzq, paredDer]);
  crearLimites();
}

function mousePressed() {
  if (estadoActual === ESTADO.HAIKU) {
    iniciarCiclo();
  }
}
