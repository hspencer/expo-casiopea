let colors = ["#F73B12", "#F88E13", "#E3C725", "#1DB499", "#06568B"];

let SIDE;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
  noStroke();

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
  placeSurface(random(100, SIDE), random(30, SIDE / 2));
  fill(color[2]);
  placePoint(random(10, 150));
  blendMode(BURN);
  fill(color[3]);
  placeSurface(random(5, 100), random(30, SIDE / 2));
  fill(color[4]);
  placeSurface(random(5, 100), random(30, SIDE / 2));
}

function placePoint(size) {
  let x = random(size, width - size);
  let y = random(size, height - size);
  circle(x, y, size / 2);
}

function placeSurface(w, h) {
  let diag = dist(0, 0, w, h);
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
