let puntos = [];
let achurados = [];
let cnv,
  numX,               /* Número de divisiones en X */
  numY,               /* Número de divisiones en Y */
  m,                  /* Margen */
  numPuntos,
  anchoTrazo,
  anchoTrama,
  tw, 
  fondo,
  lineas,
  distortionAmount,
  tiempo,
  velocidadAnimacion,
  zoomNoise,
  amplificacionNoise,
  grosorTrazo;        /* Grosor del trazo */

let colorFondo, colorLinea;  /* Variables para el color de fondo y de las líneas */

// Clase que representa un punto en la cuadrícula
class Punto {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// Clase que representa un cuadrante achurado
class Achurado {
  constructor(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.centro = new Punto(
      (a.x + b.x + c.x + d.x) / 4,
      (a.y + b.y + c.y + d.y) / 4
    );
    this.horizontal = random(1) < 0.5;
  }

  // Dibuja el cuadrante achurado
  draw() {
    strokeWeight(grosorTrazo * 0.5);  // Usa el 50% del grosor para los achurados
    stroke(lineas);
    if (this.horizontal) {
      hatch(this.a, this.b, this.c, this.d);
    } else {
      hatch(this.c, this.a, this.d, this.b);
    }
    noFill();
    strokeWeight(grosorTrazo);  // Usa el grosor completo para los bordes del cuadrante
    quad(
      this.a.x,
      this.a.y,
      this.b.x,
      this.b.y,
      this.d.x,
      this.d.y,
      this.c.x,
      this.c.y
    );
  }

  // Actualiza las coordenadas del cuadrante
  update(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.centro = new Punto(
      (a.x + b.x + c.x + d.x) / 4,
      (a.y + b.y + c.y + d.y) / 4
    );
  }
}

// Función de configuración inicial
function setup() {
  cnv = createCanvas(380, 380);
  cnv.style("border-radius", "50%");
  cnv.style("box-shadow", "inset 10px 10px 14px #0000001C, 10px 10px 14px #0000001C");
  cnv.style("border", "2px solid rgba(0,0,0,0.3)");
  cnv.parent("p5");
  initializeVariables();
  createElements();
  createControls();
}

// Inicializa las variables
function initializeVariables() {
  numX = int(random(12, 30)); // Número de puntos en la dirección x
  numY = int(random(12, 30)); // Número de puntos en la dirección y
  m = -200; // Margen
  grosorTrazo = random(0.2, 1); // Grosor del trazo
  anchoTrama = random(3, 10); // Ancho de la trama
  distortionAmount = random(3, 7); // Cantidad de distorsión
  tiempo = 0; // Variable de tiempo para la animación
  velocidadAnimacion = 0.001; // Velocidad de la animación
  zoomNoise = 0.1; // Zoom sobre la función noise
  amplificacionNoise = 1; // Amplificación del noise
  colorFondo = "#F0E8E3"; // Color de fondo por defecto
  colorLinea = "#EE3706"; // Color de las líneas por defecto
  fondo = color(colorFondo);
  lineas = color(colorLinea);
  cnv.style("background-color", fondo);
}

// Crea los elementos necesarios
function createElements() {
  puntos = [];
  achurados = [];
  numPuntos = numX * numY;
  tw = (width + height) / (numX + numY);
  creaPuntos();
  creaAchurados();
  strokeCap(SQUARE);
  strokeJoin(BEVEL);
}

// Crea los puntos en la cuadrícula
function creaPuntos() {
  let xSpacer = (width - 2 * m) / (numX - 1);
  let ySpacer = (height - 2 * m) / (numY - 1);
  for (let y = 0; y < numY; y++) {
    for (let x = 0; x < numX; x++) {
      let px =
        m +
        xSpacer * x +
        map(
          noise(x * zoomNoise, y * zoomNoise, tiempo),
          0,
          1,
          -distortionAmount * xSpacer * amplificacionNoise,
          distortionAmount * xSpacer * amplificacionNoise
        );
      let py =
        m +
        ySpacer * y +
        map(
          noise(x * zoomNoise + 100, y * zoomNoise + 100, tiempo),
          0,
          1,
          -distortionAmount * ySpacer * amplificacionNoise,
          distortionAmount * ySpacer * amplificacionNoise
        );
      puntos.push(new Punto(px, py));
    }
  }
}

// Crea los cuadrantes achurados
function creaAchurados() {
  for (let i = 0; i < puntos.length - numX - 1; i++) {
    if ((i - (numX - 1)) % numX != 0) {
      let a = new Achurado(
        puntos[i],
        puntos[i + 1],
        puntos[i + numX],
        puntos[i + numX + 1]
      );
      achurados.push(a);
    }
  }
}

// Actualiza los cuadrantes achurados
function updateAchurados() {
  for (let i = 0; i < puntos.length - numX - 1; i++) {
    if ((i - (numX - 1)) % numX != 0) {
      let idx = i - Math.floor(i / numX);
      if (idx < achurados.length) {
        achurados[idx].update(
          puntos[i],
          puntos[i + 1],
          puntos[i + numX],
          puntos[i + numX + 1]
        );
      }
    }
  }
}

// Dibuja el lienzo
function draw() {
  clear();
  tiempo += velocidadAnimacion;
  puntos = [];
  creaPuntos();
  updateAchurados();
  dibujaAchurados();
}

// Dibuja los cuadrantes achurados
function dibujaAchurados() {
  for (let a of achurados) {
    a.draw();
  }
}

// Función para dibujar las líneas achuradas
function hatch(a, b, c, d) {
  let num = round(
    (dist(a.x, a.y, b.x, b.y) + dist(c.x, c.y, d.x, d.y)) / 2 / anchoTrama
  );
  let incx1 = (b.x - a.x) / (num - 1);
  let incy1 = (b.y - a.y) / (num - 1);
  let incx2 = (d.x - c.x) / (num - 1);
  let incy2 = (d.y - c.y) / (num - 1);
  for (let i = 0; i < num; i++) {
    line(a.x + incx1 * i, a.y + incy1 * i, c.x + incx2 * i, c.y + incy2 * i);
  }
}

// Guarda una imagen del canvas al presionar espacio
function keyPressed() {
  if (key === ' ') {
    background(fondo);
    dibujaAchurados();
    saveCanvas(cnv, 'paperlager-' + Date.now(), 'png');
  }
}

// Crea los controles de la interfaz
function createControls() {
  let controls = select('#controls');
  controls.html('');

  function createControl(labelText, slider, parent) {
    let div = createDiv();
    div.class('dimension');
    createDiv(labelText).parent(div);
    slider.parent(div);
    div.parent(parent);
  }

  let numXSlider = createSlider(2, 100, numX);
  numXSlider.input(() => {
    numX = numXSlider.value();
    createElements();
  });
  createControl('N de X', numXSlider, controls);

  let numYSlider = createSlider(2, 100, numY);
  numYSlider.input(() => {
    numY = numYSlider.value();
    createElements();
  });
  createControl('N de Y', numYSlider, controls);

  let marginSlider = createSlider(-width / 2, width / 2, m);
  marginSlider.input(() => {
    m = marginSlider.value();
    createElements();
  });
  createControl('Margen', marginSlider, controls);

  let anchoTramaSlider = createSlider(1, tw, anchoTrama); // Invertido
  anchoTramaSlider.input(() => {
    anchoTrama = anchoTramaSlider.value();
    createElements();
  });
  createControl('Trama', anchoTramaSlider, controls);

  let velocidadAnimacionSlider = createSlider(-0.02, 0.02, velocidadAnimacion, 0.0001);
  velocidadAnimacionSlider.input(() => {
    velocidadAnimacion = velocidadAnimacionSlider.value();
  });
  createControl('Velocidad', velocidadAnimacionSlider, controls);

  let zoomNoiseSlider = createSlider(0.001, 1, zoomNoise, 0.01); // Invertido
  zoomNoiseSlider.input(() => {
    zoomNoise = zoomNoiseSlider.value();
    createElements();
  });
  createControl('Zoom', zoomNoiseSlider, controls);

  let amplificacionNoiseSlider = createSlider(0.1, 10, amplificacionNoise, 0.001);
  amplificacionNoiseSlider.input(() => {
    amplificacionNoise = amplificacionNoiseSlider.value();
    createElements();
  });
  createControl('Amplificación', amplificacionNoiseSlider, controls);

  let grosorTrazoSlider = createSlider(0.1, 5, grosorTrazo, 0.1);
  grosorTrazoSlider.input(() => {
    grosorTrazo = grosorTrazoSlider.value();
    createElements();
  });
  createControl('Trazo', grosorTrazoSlider, controls);

  let colorFondoInput = createColorPicker(colorFondo);
  colorFondoInput.input(() => {
    colorFondo = colorFondoInput.value();
    fondo = color(colorFondo);
    cnv.style("background-color", fondo);
  });
  createControl('Fondo', colorFondoInput, controls);

  let colorLineaInput = createColorPicker(colorLinea);
  colorLineaInput.input(() => {
    colorLinea = colorLineaInput.value();
    lineas = color(colorLinea);
  });
  createControl('Línea', colorLineaInput, controls);
}
