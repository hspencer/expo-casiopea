let sliderT, turns;
let sliderS, step;
let sliderR, radius;
let img, imgX, imgY, imgSCL;
let p;
let n;

const EPSILON = 1.0e-4;
let sliderA, sliderB, sliderAMP;

function preload() {
  img = loadImage("../data/gerard-de-nerval.jpg");
  // offset coordinates
  imgX = -250;
  imgY = 0;
  imgSCL = 0.44;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  turns = 50;
  step = 0.04;
  radius = 200;
  createPoints(width / 2, height / 2, radius, turns, step);
  print(p.length);
  n = 0;
}

function draw() {
  // image(img, -imgX * imgSCL, -imgY * imgSCL, img.width * imgSCL, img.height * imgSCL);
  if (n < p.length / 2) {
    background(255, 10);
    drawPoints(p.length / 2 - n, p.length / 2 + n);
    n++;
  } else {
    fill(255);
    textFont("Georgia Bold", 18);
    textAlign(CENTER);
    text("Gérard de Nerval", width / 2, height / 2 + radius * 0.82);
    noLoop();
  }
}

function createPoints(xpos, ypos, radius, turns, step) {
  let totalPoints = round((turns * TWO_PI) / step);
  let radiusStep = radius / totalPoints;
  let angle = 0;
  let currentRadius = 0;

  p = [];

  for (let i = 0; i < totalPoints; i++) {
    let x = xpos + cos(angle) * currentRadius;
    let y = ypos + sin(angle) * currentRadius;

    let b = 255 - brightness(img.get(x / imgSCL + imgX, y / imgSCL + imgY));
    //let r = map(b, 0, 255, 0, (radius/turns)*.5);
    let r = ((QuadraticBezier(b / 255, 1, 0) * radius) / turns) * 0.94; //amp

    let x1 = x + cos(angle) * r;
    let y1 = y + sin(angle) * r;

    let x2 = x + cos(angle) * -r;
    let y2 = y + sin(angle) * -r;

    p[i] = createVector(x1, y1);
    p[totalPoints * 2 - 1 - i] = createVector(x2, y2);

    angle += step;
    currentRadius += radiusStep;
  }
}

function drawSpiralPoints() {
  noStroke();
  fill(0);
  beginShape();
  for (let e of p) {
    vertex(e.x, e.y);
  }
  endShape();
}

function drawPoints(from, to) {
  noStroke();
  fill(0);
  beginShape();
  for (let i = from; i < to; i++) {
    vertex(p[i].x, p[i].y);
  }
  endShape();
}

function QuadraticBezier(x, a, b) {
  let functionName = "Quadratic Bezier";
  let min_param_a = 0.0;
  let max_param_a = 1.0;
  let min_param_b = 0.0;
  let max_param_b = 1.0;
  a = constrain(a, min_param_a, max_param_a);
  b = constrain(b, min_param_b, max_param_b);

  if (a == 0.5) {
    a += EPSILON;
  }
  // solve t from x (an inverse operation)
  let om2a = 1.0 - 2.0 * a;
  let t = (sqrt(a * a + om2a * x) - a) / om2a;
  let y = (1.0 - 2.0 * b) * (t * t) + 2 * b * t;
  return y;
}
