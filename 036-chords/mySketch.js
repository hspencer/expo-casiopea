let chords = [];
let shapes = [];
let numX;
let side;

function preload() {
  for (let i = 1; i <= 6; i++) {
    shapes.push(loadImage(`../data/cohen/chord-0${i}.svg`));
  }
}

function setup() {
  // Cambio de proporción del lienzo a 16:3
  let canvasHeight = floor((4 / 16) * windowWidth);
  createCanvas(windowWidth, canvasHeight);
  
  // Aumento de la densidad: reducción del tamaño del acorde
  side = width / 30;  // Cambiado de 100 a 200 para más densidad
  numX = floor(width / side);

  buildChords();

  for (let chord of chords) {
    chord.draw();
  }
}

function draw() {
  // clear();

  // Dibujar acordes
  /*
  for (let chord of chords) {
    chord.draw();
  }
  */
  // Reemplazar aleatoriamente algunos acordes, ajustando a la grilla
  if (frameCount % 7 === 0) {
    
    let index = floor(random(chords.length));
    // print("f "+frameCount+"\tindex = "+index);
    let x = chords[index].x;
    let y = chords[index].y;
    chords[index] = new Chord(x, y, side, shapes[floor(random(6))]);
    chords[index].draw();
  }
}

class Chord {
  constructor(x, y, side, shape) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.shape = shape;
  }

  draw() {
    image(this.shape, this.x - this.side / 2, this.y - this.side / 2, this.side, this.side);
  }
}

function buildChords() {
  chords = [];
  for (let y = side / 2; y < height; y += side) {
    for (let x = side / 2; x < width; x += side) {
      chords.push(new Chord(x, y, side, shapes[floor(random(6))]));
    }
  }
}
