const USER = 0;
const FOURIER = 1;
let epicyclemargin, t, alfa;

// Set up
let time = 0;
let path = [];
let state = -1;
let drawing = [];


//DFT
let signalX = [];
let signalY = [];
let fourierX;
let fourierY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  epicyclemargin = width/5;
  t = "";
  alfa = 255;
}

function mousePressed() {
  state = USER;
  drawing = [];
  signalX = [];
  signalY = [];
  fourierX = [];
  fourierY = [];
  time = 0;
  path = [];
  frameRate(36);
}

function mouseReleased() {
  state = FOURIER;
  const skip = 1;
    for (let i = 0; i < drawing.length; i+=skip) {
    signalX.push(drawing[i].x);
    signalY.push(drawing[i].y);
  }

  fourierX = dft(signalX);
  fourierY = dft(signalY);
  
  fourierX.sort((a,b) => b.amp - a.amp);
  fourierY.sort((a,b) => b.amp - a.amp);
  
  frameRate(12);
  
  t = "El trazo tiene "+drawing.length+" vértices y se define por "+fourierX.length+" epiciclos en X e Y.";
  alfa = 255;
}

function epicycles(x, y, rotation, fourier) {
  strokeWeight(0.75);
  for (let i = 0; i < fourier.length; i++) {
    let prevx = x;
    let prevy = y;
    
    let freq = fourier[i].freq;
    let radius = fourier[i].amp;
    let phase = fourier[i].phase + rotation;
    x += radius * cos(freq * time + phase);
    y += radius * sin(freq * time + phase);

    stroke('#CA490E66');
    noFill();
    ellipse(prevx, prevy, radius * 2);

    stroke('#42424284');
    ellipse(x, y, 1);
    line(prevx, prevy, x, y);
  }
  return createVector(x, y);
}


function draw() {
  //velum(100);
  clear();
  
  if (state == USER) {
    let point = createVector(mouseX - width/2, mouseY - height/2);
    drawing.push(point);
    
    strokeWeight(1.5);
    stroke(0, 90);
    noFill();
    
    beginShape();
    for (let v of drawing) {
      vertex(v.x + width/2, v.y + height/2);
    }
    endShape();
    
  } else if (state == FOURIER) {
    vx = epicycles(width/2, epicyclemargin, 0, fourierX);
    vy = epicycles(epicyclemargin, height/2, HALF_PI, fourierY);
  
    let v = createVector(vx.x, vy.y);
  
    // Add final point to the array
    path.unshift(v);
  
    // Draw the result
    line(vx.x, vx.y, path[0].x, path[0].y); 
    line(vy.x, vy.y, path[0].x, path[0].y); 
  
    strokeWeight(1.5);
    stroke(0, 90);
    noFill();

    beginShape();
    for (let i = 0; i < path.length; i++) {
      vertex(path[i].x, path[i].y);
    }
    endShape();
  
    // Increment Time
    const dt = TWO_PI / fourierY.length;
    time += dt;
  
    if (time > TWO_PI) {
      time = 0;
      path = [];
    }
    // Remove any extra points 
    //if (path.length > fourierX.length*0.9) {
    //  path.pop();
    //}
  }
  
  if(alfa > 3){
    alfa *= 0.9;
    fill(0, alfa);
    text(t, width * 0.75, height *0.9, width/4, height/10);
    
  }
  
}

function velum(alfa){
  noStroke();
  fill(255, alfa);
  rect(0,0,width, height);
}