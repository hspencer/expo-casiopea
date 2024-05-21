let puntos = [];
let achurados = [];
let cnv,
  numX,               /* # de divisiones en X */
  numY,               /* # de divisiones en X */
  m,                  /* margen */
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
  grosorTrazo;  // Nueva variable para el grosor del trazo

const paletaFondos = [
  "#F0E8E3",
  "#FCFAE3",
  "#F4F4E8",
  "#E4F1E3",
  "#EDFE84",
  "#F2F2F2",
  "#F5F5F5",
  "#FEF9EF",
  "#F8F8F8",
  "#FAFAFA",
  "#EBEBEB",
  "#E8E8E8",
  "#E6E6E6",
  "#e0f4fc",
  "#FEFEDD",
  "#e7fdfe",
  "#EFE4E4",
  "#E6EFF2",
  "#F2F6E7",
  "#fafbd8",
];

const paletaLineas = [
  "#EE3706",
  "#9C5E05",
  "#FD6601",
  "#D95A00",
  "#C25200",
  "#AA4A00",
  "#933F00",
  "#7B3400",
  "#642800",
  "#4C1D00",
  "#EE5426",
  "#CD4B20",
  "#AD431A",
  "#8C3A13",
  "#6B310D",
  "#4A2806",
  "#02253d",
  "#36028e",
  "#F0653F",
  "#D15437",
];

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
    strokeWeight(grosorTrazo * 0.5);  // Usa el 80% del grosor para los achurados
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
      (a.y + b.y + c.y) / 4
    );
  }
}

// Función de configuración inicial
function setup() {
  cnv = createCanvas(380, 380);
  cnv.style("border-radius", "50%");
  cnv.style(
    "box-shadow",
    "inset 10px 10px 14px #0000001C, 10px 10px 14px #0000001C"
  );
  cnv.style("border", "2px solid rgba(0,0,0,0.3)");
  cnv.parent("p5");
  initializeVariables();
  createElements();
  createControls();
}

// Inicializa las variables
function initializeVariables() {
  if (numX === undefined) numX = int(random(12, 30)); // Número de puntos en la dirección x
  if (numY === undefined) numY = int(random(12, 30)); // Número de puntos en la dirección y
  if (m === undefined) m = -200; // Margen
  if (grosorTrazo === undefined) grosorTrazo = random(0.2, 1); // Grosor del trazo
  if (anchoTrama === undefined) anchoTrama = random(3, 10); // Ancho de la trama
  fondo = selectRandomColor(paletaFondos); // Color de fondo
  lineas = color(selectRandomColor(paletaLineas)); // Color de las líneas
  if (distortionAmount === undefined) distortionAmount = random(3, 7); // Cantidad de distorsión
  if (tiempo === undefined) tiempo = 0; // Variable de tiempo para la animación
  if (velocidadAnimacion === undefined) velocidadAnimacion = 0.001; // Velocidad de la animación
  if (zoomNoise === undefined) zoomNoise = 0.1; // Zoom sobre la función noise
  if (amplificacionNoise === undefined) amplificacionNoise = 1; // Amplificación del noise
  cnv.style("background-color", fondo);
}

// Crea los elementos necesarios
function createElements() {
  puntos = [];
  achurados = [];
  numPuntos = numX * numY;
  tw = (width+height)/(numX+numY);
  creaPuntos();
  creaAchurados();
  strokeCap(SQUARE);
  strokeJoin(BEVEL);
}

// Selecciona un color aleatorio de la paleta
function selectRandomColor(paleta) {
  return paleta[int(random(paleta.length))];
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

// Reinicia el lienzo al presionar el mouse
function mousePressed() {
  initializeVariables();
  createElements();
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

  let numXSlider = createSlider(1, 100, numX);
  numXSlider.input(() => {
    numX = numXSlider.value();
    createElements();
  });
  createControl('N de X', numXSlider, controls);

  let numYSlider = createSlider(1, 100, numY);
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

  let anchoTramaSlider = createSlider(1, tw, anchoTrama);
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

  let zoomNoiseSlider = createSlider(0.01, 1, zoomNoise, 0.01);
  zoomNoiseSlider.input(() => {
    zoomNoise = zoomNoiseSlider.value();
    createElements();
  });
  createControl('Zoom', zoomNoiseSlider, controls);

  let amplificacionNoiseSlider = createSlider(0.1, 10, amplificacionNoise, 0.1);
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
  createControl('Grosor del Trazo', grosorTrazoSlider, controls);
}
