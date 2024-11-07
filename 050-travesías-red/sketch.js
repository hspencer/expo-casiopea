// Variables globales para elementos UI y fuente
let infoDiv;
let font;
let drawnTravesias = []; // Almacena las travesías ya dibujadas

// Nueva paleta de colores
const palette = [
  // Tonos de cielo vibrante
  "#1AA7EC", // celeste brillante
  "#59C1F2", // celeste claro
  "#087BCE", // azul medio
  "#4B97D2", // azul cielo profundo
  "#2B4F7C", // azul oscuro atmosférico
  
  // Tonos de vegetación selvática
  "#1E4D2B", // verde selva profundo
  "#2D7A3D", // verde amazónico
  "#1B8B4C", // verde tropical
  "#66A96B", // verde follaje
  "#98C379", // verde claro natural
  
  // Tonos rojizos de ladrillo
  "#A64B3C", // terracota medio
  "#CB5C45", // ladrillo claro
  "#8B3E38", // rojo tostado
  "#702F2A", // rojo oscuro
  "#591D1A", // rojo profundo
  
  // Tonos ocre y dorado
  "#D6A856", // dorado claro
  "#C69349", // ocre medio
  "#B67C32", // dorado profundo
  "#8B5E2B", // ocre oscuro
  "#634321"  // marrón dorado
];

// Límites geográficos de América del Sur que determinan la escala base
const LIMITES_SUDAMERICA = {
  minLat: -56, // Cabo de Hornos
  maxLat: 13,  // Caribe
  minLon: -81, // Costa Pacífico
  maxLon: -34, // Costa Atlántico
};

// Calculamos un factor de expansión para permitir puntos fuera de Sudamérica
const EXPANSION_FACTOR = 1.1; // Aumenta el área visible en un 10%

// Variables para el manejo de datos y animación
let travesias = [];         // Almacena todas las travesías
let currentYearIndex = 0;   // Índice para la animación
let currentYear;            // Año actual en la animación

// Configuración del canvas
const CANVAS_HEIGHT = 600;  // Altura fija del canvas
const MARGIN_TOP = 0;      // Margen superior para evitar recortes

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
  // Calculamos la proporción correcta considerando el factor de expansión
  const rangoLon = Math.abs(LIMITES_SUDAMERICA.maxLon - LIMITES_SUDAMERICA.minLon) * EXPANSION_FACTOR;
  const rangoLat = Math.abs(LIMITES_SUDAMERICA.maxLat - LIMITES_SUDAMERICA.minLat) * EXPANSION_FACTOR;
  const proporcion = rangoLon / rangoLat;
  const anchoEfectivo = (CANVAS_HEIGHT - MARGIN_TOP) * proporcion;

  // Creación y configuración del canvas
  createCanvas(windowWidth, CANVAS_HEIGHT, WEBGL);
  frameRate(100);
  
  // Configuración de tipografía
  font = loadFont("Alegreya-Regular.ttf");
  textFont(font);
  
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

      // Aceptamos cualquier coordenada válida, sin filtrar por límites
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
    
    // Añadimos la travesía a las ya dibujadas
    drawnTravesias.push(travesia);
    
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
    this.color = random(palette); // Color aleatorio de la nueva paleta
  }

  latLonToPixel() {
    // Calculamos las dimensiones efectivas del área de dibujo
    const mapHeight = height - MARGIN_TOP;
    const rangoLon = Math.abs(LIMITES_SUDAMERICA.maxLon - LIMITES_SUDAMERICA.minLon) * EXPANSION_FACTOR;
    const rangoLat = Math.abs(LIMITES_SUDAMERICA.maxLat - LIMITES_SUDAMERICA.minLat) * EXPANSION_FACTOR;
    const proporcion = rangoLon / rangoLat;
    const mapWidth = mapHeight * proporcion;

    // Calculamos el centro de Sudamérica
    const centerLon = (LIMITES_SUDAMERICA.maxLon + LIMITES_SUDAMERICA.minLon) / 2;
    const centerLat = (LIMITES_SUDAMERICA.maxLat + LIMITES_SUDAMERICA.minLat) / 2;

    // Transformación de coordenadas expandidas con rotación 180 grados
    let x = map(this.lon, 
                centerLon - (rangoLon/2), 
                centerLon + (rangoLon/2),
                mapWidth/2,    // Invertidos para rotación 180°
                -mapWidth/2);
    let y = map(this.lat, 
                centerLat - (rangoLat/2), 
                centerLat + (rangoLat/2),
                -mapHeight/2 + MARGIN_TOP/2,  // Invertidos para rotación 180°
                mapHeight/2 + MARGIN_TOP/2);
    
    return createVector(x, y);
  }

  findNearestDrawn() {
    if (drawnTravesias.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;
    let thisPos = this.latLonToPixel();
    
    for (let drawn of drawnTravesias) {
      let drawnPos = drawn.latLonToPixel();
      let d = dist(thisPos.x, thisPos.y, drawnPos.x, drawnPos.y);
      if (d < minDist) {
        minDist = d;
        nearest = drawn;
      }
    }
    
    return nearest;
  }

  show() {
    let pos = this.latLonToPixel();
    
    push();
    
    // Dibujamos la conexión con la travesía más cercana
    let nearest = this.findNearestDrawn();
    if (nearest) {
      let nearestPos = nearest.latLonToPixel();
      stroke(0, 50);
      strokeWeight(0.5);
      line(pos.x, pos.y, nearestPos.x, nearestPos.y);
    }
    
    // Dibujamos el punto de la travesía con el color de la paleta
    stroke(this.color);
    strokeWeight(3);
    point(pos.x, pos.y);
    
    pop();
  }
}

// Manejo de redimensionamiento de ventana
function windowResized() {
  resizeCanvas(windowWidth, CANVAS_HEIGHT);
  infoDiv.position(20, CANVAS_HEIGHT - 40);
}