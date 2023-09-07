let chords = [];
let shapes = [];
let numX;
let side;

function preload() {
  for (let i = 1; i <= 6; i++) {
    shapes.push(loadImage(`../data/cohen/chord-0${i}.svg`));
  }
}

let prev;

function setup() {
  // Cambio de proporción del lienzo a 16:3
  let canvasHeight = floor((3 / 16) * windowWidth);
  createCanvas(windowWidth, canvasHeight);

  // Aumento de la densidad: reducción del tamaño del acorde
  side = width / 28; // Cambiado de 100 a 200 para más densidad
  numX = floor(width / side);

  buildChords();
  prev = createImage(width, height);
  print(height);
}

function draw() {
  /*
  if (frameCount > 1){
    background(prev);
  }else{
    clear();
  }
  */
  clear();

  // Dibujar acordes
  for (let chord of chords) {
    chord.draw();
  }

  for (let i = 0; i < 1; i++) {
    let index = floor(random(chords.length));
    chords[index].rotate();
  }
  /*
 if (frameCount % 17 === 0) {
    blendMode(LIGHTEST);
  } else if (frameCount % 23 === 0) {
    blendMode(BLEND);
  } else if (frameCount % 13 === 0) {
    blendMode(LIGHTEST);
  } else if (frameCount % 29 === 0) {
    blendMode(SOFT_LIGHT);
  } else if (frameCount % 49 === 0) {
    blendMode(DIFFERENCE);
  }

  prev = get();
  prev.filter(BLUR, 0.1);
  if(frameCount % 49 === 0){
    prev.filter(INVERT);
    blendMode(BLEND);
    for (let chord of chords) {
      chord.draw();
    }
  }
 // print(frameCount);
 */
}

class Chord {
  constructor(x, y, side, shape) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.shape = shape;
    this.rotation = floor(random(4));
    this.img = createGraphics(side, side);
  }

  make() {
    //this.img.background(255);
    this.img.push();
    this.img.rotate(this.rotation * HALF_PI);
    //this.img.translate(this.side/2, this.side/2);

    switch (this.rotation) {
      case 1:
        this.img.translate(0, -this.side);
        break;
      case 2:
        this.img.translate(-this.side, -this.side);
        break;
      case 3:
        this.img.translate(-this.side, 0);
        break;
    }

    this.img.image(this.shape, 0, 0, this.side, this.side);
    this.img.pop();
  }

  draw() {
    image(this.img, this.x, this.y, this.side, this.side);
  }

  rotate() {
    this.img = createGraphics(side, side);
    this.rotation = floor(random(4));
    this.make();
  }
}

function buildChords() {
  chords = [];
  for (let y = 0; y < height - side / 2; y += side) {
    for (let x = 0; x < width - side / 2; x += side) {
      let c = new Chord(x, y, side, shapes[floor(random(6))]);
      c.make();
      chords.push(c);
    }
  }
}

function mousePressed() {
  clear();
  prev = createImage(width, height);
  buildChords();
}
