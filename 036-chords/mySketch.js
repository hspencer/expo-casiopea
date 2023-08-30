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
}

function draw() {
   clear();

  // Dibujar acordes
  for (let chord of chords) {
    chord.draw();
  }

  let index = floor(random(chords.length));
  chords[index].rotate();
  // print(chords[index].rotation);

}

class Chord {
  constructor(x, y, side, shape) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.shape = shape;
    this.rotation = floor(random(4));
  }

  draw() {
    push();
    rotate(this.rotation * HALF_PI);
    switch(this.rotation){
      case 0:
        break;
      case 1:
        translate(-this.side, -this.side);
        break;
      case 2:
        translate(this.side, -this.side);
        break;
      case 3:
        translate(-this.side, this.side);
        break;
    }
    image(this.shape, this.x - this.side, this.y - this.side, this.side, this.side);
    pop();
  }

  rotate(){
    this.rotation = floor(random(4));
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
