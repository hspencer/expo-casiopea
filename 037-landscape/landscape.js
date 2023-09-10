let y, amplitude, steps, timeSteps, versatz, sw, strokeAlpha;
let bgColor;
let margin = 30;
let doReDraw = true;

function setup() {
  // Ajusta el tamaño del lienzo según las dimensiones de la ventana
  if (windowHeight > windowWidth) {
    createCanvas(windowWidth, windowWidth);
  } else {
    createCanvas(windowWidth, windowWidth / 3);
  }
  
  bgColor = color(238, 232, 220); // Inicialización del color de fondo
}

function draw() {
  if (doReDraw) {
    background(bgColor);
    y = random(80, 150);
    
    while (y < height + 70) {
      setRandomValues();
      drawFilles();
      drawLines();
      y += random(5, 70);
    }

    drawMargin();
    doReDraw = false;
  }
}

function setRandomValues() {
  noiseSeed(int(random(100000)));
  sw = random(0.5, 2);
  steps = random(sw * 2, 6);
  amplitude = random(40, 250);
  timeSteps = random(0.01, 0.05);
  versatz = random(-200, 200);
  strokeAlpha = random(50, 200);
}

function mousePressed() {
  doReDraw = true;
}

function drawFilles() {
  fill(bgColor);
  noStroke();
  let noiseValue;
  let x = -abs(versatz);
  let time = 0.0;

  beginShape();
  vertex(-10, height + 1);

  while (x < width) {
    noiseValue = y - noise(time) * amplitude;
    vertex(x, noiseValue);

    x += steps;
    time += timeSteps;
  }
  vertex(width + 10, height + 1);
  endShape(CLOSE); // Añadido CLOSE para cerrar la forma
}

function drawLines() {
  noFill();
  strokeWeight(sw);
  let noiseValue;
  let x = -abs(versatz);
  let time = 0.0;

  while (x < width + abs(versatz)) {
    noiseValue = y - noise(time) * amplitude;
    strokeWeight(random(sw * 0.5, sw * 1.2));
    stroke(random(strokeAlpha * 0.8, strokeAlpha));

    line(x, noiseValue + 3, x + random(versatz * 0.9, versatz), noiseValue + 3 + height);

    x += steps;
    time += timeSteps;
  }
}

function drawMargin() {
  noStroke();
  fill(bgColor);
  rect(0, 0, width, margin);
  rect(0, height, width, -margin);
  rect(0, 0, margin, height);
  rect(width, 0, -margin, height);
}
