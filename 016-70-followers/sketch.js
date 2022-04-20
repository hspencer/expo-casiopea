const DRAG = 0.01;
const NUM = 70;
let p; // P array
let N; // next point

let numPolis = 7;
let polis = [];

function setup() {
  p = [];
  createCanvas(windowWidth, windowHeight);
  createCircle(width / 2, height / 2, height / 2.4);
  
  for(let i = 0; i < numPolis; i++){
    polis[i] = new Poly(7, "#CC334501");
  }
}

function createCircle(x, y, r) {
  let angInc = TWO_PI / (NUM - 1);
  for (let i = 0; i < NUM; i++) {
    let a = angInc * i;
    let newX = x + cos(a) * r;
    let newY = y + sin(a) * r;
    p[i] = new P(newX, newY, i);
  }
}

function velum() {
  noStroke();
  fill(255, 15);
  rect(0, 0, width, height);
}

function draw() {
  velum();
  for (let i = 0; i < NUM; i++) {
    p[i].draw();
  }
  if (frameCount % 300 === 0) {
    T = round(random(4));
    if (T === 0) {
      for (let i = 0; i < NUM; i++) {
        p[i].target = p[i].origin;
      }
      print("go to origin");
    } else if (T === 1) {
      for (let i = 0; i < NUM; i++) {
        p[i].target = p[i].random;
      }
      print("go to random place");
    } else {
      for (let i = 0; i < NUM; i++) {
        let next = (i + T) % p.length;
        p[i].target = p[next].position;
      }
      print("go to " + T + " position");
    }
  }
  
    for(let i = 0; i < numPolis; i++){
    polis[i].draw();
  }
}

class P {
  constructor(x, y, i) {
    this.origin = createVector(x, y);
    this.position = createVector(x, y);
    this.random = createVector(random(width), random(height));
    this.distToTarget = width;
    this.following = false;
    this.index = i;
    this.target = this.origin;
  }
  move() {
    //this.distToTarget = dist(target.x, target.y, this.position.x, this.position.y);
    let diffX = this.target.x - this.position.x;
    let diffY = this.target.y - this.position.y;
    this.position.x += diffX * DRAG;
    this.position.y += diffY * DRAG;
  }
  draw() {
    strokeWeight(2);
    stroke(0, 150);
    point(this.position.x, this.position.y);
    this.move();
  }
}

class Poly {
  constructor(num, col) {
    this.v = shuffle(p);
    this.v = this.v.slice(0, num);
    this.col = col;
  }

  draw() {
    noStroke();
    fill(this.col);
    beginShape();
    for (let i = 0; i < this.v.length; i++) {
      vertex(this.v[i].position.x, this.v[i].position.y);
    }
    endShape(CLOSE);
  }
}
