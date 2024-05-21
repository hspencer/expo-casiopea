let imgs = [];

function preload() {
  for (let i = 1; i <= 13; i++) {
    imgs[i] = loadImage('frag/' + nf(i, 2) + '.JPG');
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
  drawGrid();
}

function drawGrid() {
  background("PINK");
  // Define el número de celdas en la grilla
  let cols = floor(random(4, 10));
  let rows = cols; // Para mantener la grilla cuadrada
  let cellSize = width / cols;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Seleccione una imagen aleatoria
      let img = random(imgs);

      // Calcula la ubicación de la celda
      let x = j * cellSize;
      let y = i * cellSize;

      // Aplica pequeñas variaciones en la ubicación y tamaño
      let offsetX = random(-cellSize * 0.05, cellSize * 0.05);
      let offsetY = random(-cellSize * 0.05, cellSize * 0.05);
      let variationSize = random(-cellSize * 0.05, cellSize * 0.05);

      // Guarda el estado actual del canvas y aplica la rotación
      push();
      translate(x + cellSize / 2, y + cellSize / 2);
      rotate(random([0, PI/2, PI, 3*PI/2])); // Rotar aleatoriamente en incrementos de 90º
      imageMode(CENTER);
      image(img, offsetX, offsetY, cellSize + variationSize, cellSize + variationSize);
      pop();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawGrid();
}
