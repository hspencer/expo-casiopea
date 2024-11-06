let font;

// Límites fijos para América del Sur
const LIMITES_SUDAMERICA = {
  minLat: -56, // Cabo de Hornos
  maxLat: 13, // Caribe
  minLon: -81, // Costa Pacífico
  maxLon: -34, // Costa Atlántico
};

// Paleta de naranjos/cafés cálidos
let palette = [
  "#7b4800",
  "#d2691e",
  "#cd853f",
  "#e86100",
  "#ff8c00",
  "#ff7f50",
  "#d35400",
  "#ff6700",
  "#cc5500",
];

// Variables globales
let travesias = [];
let currentYearIndex = 0;
let currentYear;

const CANVAS_HEIGHT = 700;
const MARGIN_TOP = 50; // margen superior

function setup() {
  // Calculamos el ancho proporcional basado en el alto fijo de 600
  const proporcion = (LIMITES_SUDAMERICA.maxLon - LIMITES_SUDAMERICA.minLon) / (LIMITES_SUDAMERICA.maxLat - LIMITES_SUDAMERICA.minLat);
  const anchoCalculado = (CANVAS_HEIGHT - MARGIN_TOP) * proporcion;

  createCanvas(windowWidth, CANVAS_HEIGHT, WEBGL);

  //blendMode(MULTIPLY);
  frameRate(2);
  font = loadFont("Alegreya-Regular.ttf");
  textFont(font, 20);
  textAlign(LEFT, BOTTOM);
  brush.scaleBrushes(1.5);
  background(255);
  fill(0);
  text("hola hola cucharola", 0, 0);
}

function preload() {
  loadJSON(
    "https://wiki.ead.pucv.cl/api.php?action=ask&format=json&query=%5B%5BCategor%C3%ADa%3ATraves%C3%ADa%5D%5D%20%7C%3F%20A%C3%B1o%20%7C%3F%20Posici%C3%B3n%20%7C%3F%20Destino%7Climit%3D9999&utf8=1&formatversion=latest",
    gotData,
    "jsonp"
  );
}

function gotData(response) {
  console.log("Datos obtenidos de Casiopea");
  createObjects(response);
  if (travesias.length > 0) {
    ordenarTravesias();
    currentYear = travesias[0].year;
  }
}

function createObjects(response) {
  if (!response.query || !response.query.results) {
    console.error("Datos inválidos recibidos");
    return;
  }

  for (let key in response.query.results) {
    let t = response.query.results[key];
    if (t.printouts["Posición"] && t.printouts["Posición"][0]) {
      let lat = t.printouts["Posición"][0].lat;
      let lon = t.printouts["Posición"][0].lon;
      let year =
        t.printouts["Año"] && t.printouts["Año"][0] ?
        t.printouts["Año"][0] :
        1984;
      let name = t.fulltext;
      let url = t.fullurl;

      // Solo agregamos travesías desde 1984 y dentro de los límites de Sudamérica
      if (
        year >= 1984 &&
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= LIMITES_SUDAMERICA.minLat &&
        lat <= LIMITES_SUDAMERICA.maxLat &&
        lon >= LIMITES_SUDAMERICA.minLon &&
        lon <= LIMITES_SUDAMERICA.maxLon
      ) {
        travesias.push(new Travesia(name, lat, lon, year, url));
      }
    }
  }
}

function ordenarTravesias() {
  travesias.sort((a, b) => {
    if (a.year === b.year) {
      return a.name.localeCompare(b.name);
    }
    return a.year - b.year;
  });
}

function draw() {
  if (currentYearIndex < travesias.length) {
    let travesia = travesias[currentYearIndex];

    // Restauramos el origen para el texto 2D
    push();
    translate(-width / 2, -height / 2);

    // Dibujamos la travesía
    pop();
    travesia.show();

    // Restauramos el origen para el texto del nombre
    push();
    translate(-width / 2, -height / 2);

    // Mostramos el nombre de la travesía y año
    fill(255);
    noStroke();
    rect(10, height - 40, width * .4, 30);
    fill(0);
    text(travesia.name + ", " + travesia.year, 20, height - 15);
    pop();

    currentYearIndex++;
  } else {
    noLoop();
  }
}

class Travesia {
  constructor(name, lat, lon, year, url) {
    this.name = name;
    this.lat = lat;
    this.lon = lon;
    this.year = year;
    this.url = url;
    this.color = random(palette);
    this.size = random(15, 30);
  }

  latLonToPixel() {
    const proporcion = (LIMITES_SUDAMERICA.maxLon - LIMITES_SUDAMERICA.minLon) / (LIMITES_SUDAMERICA.maxLat - LIMITES_SUDAMERICA.minLat);
    const anchoEfectivo = (height - MARGIN_TOP) * proporcion;
    const margen = (width - anchoEfectivo) / 2;

    let x = map(this.lon, LIMITES_SUDAMERICA.maxLon, LIMITES_SUDAMERICA.minLon, -anchoEfectivo / 2, anchoEfectivo / 2);
    let y = map(this.lat, LIMITES_SUDAMERICA.minLat, LIMITES_SUDAMERICA.maxLat, (height - MARGIN_TOP) / 2, -(height - MARGIN_TOP) / 2);
    return createVector(x, y);
  }

  show() {
    let pos = this.latLonToPixel();

    console.log(`Pintando: ${this.name} (${this.year})
    Coordenadas originales: lat ${this.lat}, lon ${this.lon}
    Coordenadas en pantalla: x ${pos.x}, y ${pos.y}`);

    push();

    push();
    translate(pos.x, pos.y, 0);
    blendMode(MULTIPLY);

    // Configuración de p5.brush
    brush.stroke(this.color);
    brush.pick("rotring");
    brush.beginStroke("curve", 0, 0);

    
    // Trazos aleatorios para crear una mancha
    for (let i = 0; i < random(5, 15); i++) {
      let angle = random(30, 60);
      let length = random(10, 30);
      let pressure = random(.5, 1.2);
      brush.segment(angle, length, pressure);
    }
    brush.endStroke(0, 1);
    blendMode(BLEND);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, 600);
}