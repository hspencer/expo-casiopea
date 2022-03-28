let colors = ["#F73B12", "#F88E13", "#E3C725", "#1DB499", "#06568B"];

let SIDE;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
  noStroke();
  rectMode(CENTER);
  ellipseMode(CENTER);
  if (width < height) {
    SIDE = width; 
  } else {
    SIDE = height;
  }
}

function draw() {
  let color = shuffle(colors);
  blendMode(MULTIPLY);
  fill(color[0]);
  placePoint(random(SIDE));
  fill(color[1]);
  placeSurface(random(SIDE/10, SIDE), random(SIDE/5, SIDE / 2));
  fill(color[2]);
  placePoint(random(SIDE/20, SIDE));
  blendMode(BURN);
  fill(color[3]);
  placeSurface(random(SIDE/10, SIDE), random(SIDE/5, SIDE / 2));
  fill(color[4]);
  placeSurface(random(SIDE/10, SIDE), random(SIDE/5, SIDE / 2));
}

function placePoint(size) {
  let x = random(size, width - size);
  let y = random(size, height - size);
  ellipse(x, y, size / 2, size / 2);
}

function placeSurface(w, h) {
  let diag = dist(0, 0, w/1.5, h/1.5);
  let x = random(diag, width - diag);
  let y = random(diag, height - diag);
  push();
  {
    translate(x, y);
    rotate(random(PI));
    rect(0, 0, w, h);
  }
  pop();
}

function keyTyped() {
  if(key === ' '){
    clear(); 
  }
  redraw();
}

function mouseClicked(){
  if (mouseButton === RIGHT) {
    clear(); 
  }
  redraw();
}