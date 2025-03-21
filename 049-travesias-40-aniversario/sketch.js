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
  // Ladrillos medios terrosos
  "#A65D4F", "#9D5347", "#96493F", "#8F3F37", "#88352F",
  // Ladrillos con toque morado sutil
  "#833531", "#7C2E2D", "#752729", "#6E2025", "#671921",
  // Ladrillos profundos
  "#5E1D23", "#571726", "#501521", "#49131C", "#421117",
  // Ladrillos muy oscuros
  "#3D0F15", "#360D13", "#2F0B11", "#28090F", "#21070D"
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

      // Solo filtramos por año y que tenga coordenadas válidas
      if (year >= 1984 && !isNaN(lat) && !isNaN(lon)) {
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
    infoDiv.html(`${travesia.year}, ${travesia.name}`);
    
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

  latLonToPixel() {
    // Calculamos las dimensiones efectivas del área de dibujo
    const mapHeight = height - MARGIN_TOP;
    const proporcion = Math.abs(LIMITES_SUDAMERICA.maxLon - LIMITES_SUDAMERICA.minLon) / 
                      Math.abs(LIMITES_SUDAMERICA.maxLat - LIMITES_SUDAMERICA.minLat);
    const mapWidth = mapHeight * proporcion;

    // Transformación de coordenadas para América invertida
    // Invertimos minLat/maxLat para voltear el mapa
    let x = map(this.lon, LIMITES_SUDAMERICA.maxLon, LIMITES_SUDAMERICA.minLon,
                -mapWidth/2, mapWidth/2);
    let y = map(this.lat, LIMITES_SUDAMERICA.minLat, LIMITES_SUDAMERICA.maxLat, // <-- Aquí está el cambio clave
                -mapHeight/2 + MARGIN_TOP/2, mapHeight/2 + MARGIN_TOP/2);
    
    return createVector(x, y);
}

show() {
  let pos = this.latLonToPixel();
  
  console.log(`Pintando: ${this.name} (${this.year})
  Coordenadas originales: lat ${this.lat}, lon ${this.lon}
  Coordenadas en pantalla: x ${pos.x}, y ${pos.y}`);

  push();
  translate(pos.x, pos.y, 0);
  rotate(PI); // Rotación de 180 grados
  
  // Configuración de brush para efecto acuarela
  brush.stroke(this.color);
  brush.pick("marker2"); // marker2 da un efecto más suave y difuminado

  // Creamos varios trazos cortos en forma radial para simular una mancha
  let numTrazos = floor(random(4, 8));
  let radio = random(10, 20);

  for (let i = 0; i < numTrazos; i++) {
      let angulo = (TWO_PI / numTrazos) * i + random(-0.5, 0.5);
      
      brush.beginStroke("curve", sin(angulo) * radio * 0.2, cos(angulo) * radio * 0.2);
      
      // Hacemos un trazo curvo corto
      let numSegments = floor(random(3, 6));
      for (let j = 0; j < numSegments; j++) {
          let len = random(5, 15);
          let press = random(0.3, 0.8) * (1 - j/numSegments); // La presión disminuye hacia el final
          brush.segment(
              angulo * RAD_TO_DEG + random(-30, 30),
              len,
              press
          );
      }
      brush.endStroke(angulo * RAD_TO_DEG + random(-20, 20), 0.1);
  }
  
  pop();
}
}

// Manejo de redimensionamiento de ventana
function windowResized() {
  resizeCanvas(windowWidth, CANVAS_HEIGHT);
  infoDiv.position(20, CANVAS_HEIGHT - 40);
}