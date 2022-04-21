const DRAG = 0.0028;
const NUM = 70;
const FRAMES = 1111;
let p; // P array
let N; // next point
let landscape;
let numPolis = 7;
let polis = [];
let side;
spirits = ["#CC334502", "#FF7B0002", "#E5ED0202", "#07D6FF02", "#0AB6F502", "#3471FF02", "#FFB13302"];

function setup() {
  p = [];
  createCanvas(windowWidth, windowHeight);
  if(width > height){
    side = height;
    landscape = true;
  }else{
    side = width;
    landscape = false;
  }
  createPoints();
  defineCircleArray();
  defineReticularArray();
  defineLinearArray();
  createShapes();
}

function createPoints(){
  let m = side / 7;
  for (let i = 0; i < NUM; i++) {
    p[i] = new P(random(m, width-m), random(m, height-m));
  }
}

function defineCircleArray(){
  let angInc = TWO_PI / (NUM - 2);
  let r = side * 0.333;
  for (let i = 0; i < NUM; i++) {
    let a = angInc * i;
    let newX = width/2 + cos(a) * r;
    let newY = height/2 + sin(a) * r;
    p[i].circularArray = createVector(newX, newY);
  }
}

function defineReticularArray(){
  let marginX, marginY, spacerX, spacerY;
  let i = 0;
  if(landscape){ // 10 * 7
    marginX = width/10;
    spacerX = (width - 2*marginX) / 9;
    marginY = height/6;
    spacerY = (height - 2*marginY) / 6;
  }else{ // portrait = 7 * 10
    marginX = width/6;
    spacerX = (width - 2*marginX) / 6;
    marginY = height/10;
    spacerY = (height - 2*marginY) / 9;
  }
  for(let y = marginY; y <= height - marginY; y+=spacerY){
    for(let x = marginX; x <= width - marginX; x+=spacerX){
      p[i].reticularArray = createVector(x, y);
      i++;
    }
  }
  print("reticular array has "+i+" points");
}

function defineLinearArray(){
  let i = 0;
  if(landscape){
    let marginX = width/10;
    let spacerX = (width - 2*marginX) / (NUM-1);
    for(let x = marginX; x <= (width - marginX)+1; x+=spacerX){
      p[i].linearArray = createVector(x, height/2 + random(-10, 10));
      i++;
    }
  }else{
    let marginY = height/10;
    let spacerY = (height - 2*marginY) / (NUM-1);
    for(let y = marginY; y <= height - marginY; y+=spacerY){
      p[i].linearArray = createVector(width/2 + random(-10, 10), y);
      i++;
    }
  }
  print("linear array has "+i+" points");
}

function createShapes(){
  for(let i = 0; i < numPolis; i++){
    polis[i] = new Poly(3, spirits[i]);
  }
}

function velum() {
  noStroke();
  fill(255, 10);
  rect(0, 0, width, height);
}

function draw() {
  if(frameCount % 10 === 0){
    velum();
  }
  for (let i = 0; i < NUM; i++) {
    p[i].draw();
  }
  if (frameCount % FRAMES === 0 || frameCount === 20) {
    T = round(random(-0.49, 7.49));
    if (T === 0) {
      for (let i = 0; i < NUM; i++) {
        p[i].target = p[i].circularArray;
      }
      print("circular array");
    } else if (T === 1) {
      for (let i = 0; i < NUM; i++) {
        p[i].target = p[i].reticularArray;
      }
      print("reticular array")
    } else if (T === 2){
      for (let i = 0; i < NUM; i++) {
        p[i].target = p[i].linearArray;
      }
      print("linear array")
    } else if (T === 3){
      for (let i = 0; i < NUM; i++) {
        p[i].target = p[i].origin;
      }
      print("random array")
    }else {
      let m = round(random(2, NUM));
      for (let i = 0; i < NUM; i++) {
        let next = (i + m) % p.length;
        p[i].target = p[next].position;
      }
      print("go to the next "+m);
    } 
  }
  
    for(let i = 0; i < numPolis; i++){
    polis[i].draw();
  }
}

class P {
  constructor(x, y) {
    this.origin = createVector(x, y);
    this.position = createVector(x, y);
    this.target = this.origin;
    this.circularArray = createVector();
    this.linearArray = createVector();
    this.reticularArray = createVector();
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
      curveVertex(this.v[i].position.x, this.v[i].position.y);
    }
    endShape(CLOSE);
  }
}