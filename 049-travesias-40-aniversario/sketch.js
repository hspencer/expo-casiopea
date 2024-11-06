// Variables globales para elementos UI y fuente
let infoDiv;
let font;

// Límites geográficos de América del Sur que determinan el área de visualización
const LIMITES_SUDAMERICA = {
  minLat: -56, // Cabo de Hornos
  maxLat: 13,  // Caribe
  minLon: -81, // Costa Pacífico
  maxLon: -34, // Costa Atlántico
};

// Paleta de colores que mezcla tonos tierra con acentos
let palette = [
  "#3D5300",  // Verde oliva oscuro
  "#ABBA7C",  // Verde sage
  "#FFE31A",  // Amarillo brillante
  "#7b4800",  // Marrón oscuro
  "#d2691e",  // Chocolate
  "#cd853f",  // Perú
  "#e86100",  // Naranja quemado
  "#ff8c00",  // Naranja oscuro
  "#ff7f50",  // Coral
  "#ff6700",  // Naranja
  "#cc5500",  // Marrón
  "#B9E5E8",  // Azul claro
  "#7AB2D3"   // Azul medio
];

// Variables para el manejo de datos y animación
let travesias = [];         // Almacena todas las travesías
let currentYearIndex = 0;   // Índice para la animación
let currentYear;            // Año actual en la animación

// Configuración del canvas
const CANVAS_HEIGHT = 700;  // Altura fija del canvas
const MARGIN_TOP = 50;      // Margen superior para evitar recortes

// Carga inicial de datos
function preload() {
  // Carga los datos de la wiki usando JSONP
  loadJSON(
    "https://wiki.ead.pucv.cl/api.php?action=ask&format=json&query=%5B%5BCategor%C3%ADa%3ATraves%C3%ADa%5D%5D%20%7C%3F%20A%C3%B1o%20%7C%3F%20Posici%C3%B3n%20%7C%3F%20Destino%7Climit%3D9999&utf8=1&formatversion=latest",
    gotData,
    "jsonp"
  );
}

// Configuración inicial del sketch
function setup() {
  // Calculamos la proporción correcta para mantener la forma de América del Sur
  const proporcion = Math.abs(LIMITES_SUDAMERICA.maxLon - LIMITES_SUDAMERICA.minLon) / 
                    Math.abs(LIMITES_SUDAMERICA.maxLat - LIMITES_SUDAMERICA.minLat);
  const anchoEfectivo = (CANVAS_HEIGHT - MARGIN_TOP) * proporcion;

  // Creación y configuración del canvas
  createCanvas(windowWidth, CANVAS_HEIGHT, WEBGL);
  //blendMode(MULTIPLY);
  frameRate(1);
  
  // Configuración de tipografía
  font = loadFont("Alegreya-Regular.ttf");
  textFont(font);
  
  // Configuración del pincel
  brush.scaleBrushes(1.5);
  
  // Fondo inicial
  background(255);
  
  // Creación y estilo del div de información
  infoDiv = createDiv('');
  infoDiv.position(20, CANVAS_HEIGHT - 40);
  infoDiv.style('font-family', 'Alegreya');
  infoDiv.style('font-size', '16px');
  infoDiv.style('color', '#000000');
}

// Procesamiento de datos recibidos
function gotData(response) {
  console.log("Datos obtenidos de Casiopea");
  createObjects(response);
  if (travesias.length > 0) {
    ordenarTravesias();
    currentYear = travesias[0].year;
  }
}

// Creación de objetos Travesia desde los datos
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
      let year = t.printouts["Año"] && t.printouts["Año"][0] ? t.printouts["Año"][0] : 1984;
      let name = t.fulltext;
      let url = t.fullurl;

      // Filtrado de travesías por año y ubicación
      if (year >= 1984 && !isNaN(lat) && !isNaN(lon) &&
          lat >= LIMITES_SUDAMERICA.minLat && lat <= LIMITES_SUDAMERICA.maxLat &&
          lon >= LIMITES_SUDAMERICA.minLon && lon <= LIMITES_SUDAMERICA.maxLon) {
        travesias.push(new Travesia(name, lat, lon, year, url));
      }
    }
  }
}

// Ordenamiento cronológico de travesías
function ordenarTravesias() {
  travesias.sort((a, b) => {
    if (a.year === b.year) {
      return a.name.localeCompare(b.name);
    }
    return a.year - b.year;
  });
}

// Bucle principal de dibujo
function draw() {
  if (currentYearIndex < travesias.length) {
    let travesia = travesias[currentYearIndex];
    
    // Actualización del div de información
    infoDiv.html(`${travesia.name}, ${travesia.year}`);
    
    // Dibujo de la travesía
    travesia.show();
    currentYearIndex++;
  } else {
    noLoop();
  }
}

// Clase para manejar cada travesía
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

  // Conversión de coordenadas geográficas a coordenadas de pantalla
  latLonToPixel() {
    // Calculamos las dimensiones efectivas del área de dibujo
    const mapHeight = height - MARGIN_TOP;
    const proporcion = Math.abs(LIMITES_SUDAMERICA.maxLon - LIMITES_SUDAMERICA.minLon) / 
                      Math.abs(LIMITES_SUDAMERICA.maxLat - LIMITES_SUDAMERICA.minLat);
    const mapWidth = mapHeight * proporcion;

    // Transformación de coordenadas con rotación 180°
    let x = map(this.lon, LIMITES_SUDAMERICA.maxLon, LIMITES_SUDAMERICA.minLon, 
                -mapWidth/2, mapWidth/2);
    let y = map(this.lat, LIMITES_SUDAMERICA.maxLat, LIMITES_SUDAMERICA.minLat, 
                -mapHeight/2 + MARGIN_TOP/2, mapHeight/2 + MARGIN_TOP/2);
    
    return createVector(x, y);
  }

  // Visualización de la travesía
  show() {
    let pos = this.latLonToPixel();

    // Debug en consola
    console.log(`Pintando: ${this.name} (${this.year})
      Coordenadas originales: lat ${this.lat}, lon ${this.lon}
      Coordenadas en pantalla: x ${pos.x}, y ${pos.y}`);

    push();
    translate(pos.x, pos.y, 0);

    // Dibujo con p5.brush
    brush.stroke(this.color);
    brush.pick("rotring");
    brush.beginStroke("segments", 0, 0);
    
    // Trazos aleatorios para la mancha
    for (let i = 0; i < random(5, 15); i++) {
      let angle = random(30, 60);
      let length = random(10, 30);
      let pressure = random(0.5, 1.2);
      brush.segment(angle, length, pressure);
    }
    brush.endStroke(0, 1);
    pop();
  }
}

// Manejo de redimensionamiento de ventana
function windowResized() {
  resizeCanvas(windowWidth, CANVAS_HEIGHT);
  infoDiv.position(20, CANVAS_HEIGHT - 40); // Reposicionamos el div
}