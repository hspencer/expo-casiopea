const USER = 0;
const FOURIER = 1;

// Set up
let time = 0;
let path = [];
let state = -1;
let drawing = [];
let speedMod = 1.00;

//DFT
let signal = [];
let fourier = [];
let removedFourier = [];

let g;
let speedSlider, addEpicyclesBtn, remEpicyclesBtn;

let font;
function preload() {
  // font = loadFont("Lato-Black.ttf");
  font = loadFont("../data/Alegreya_Sans/AlegreyaSans-Bold.ttf");
}

function setup() {
  
  createCanvas(windowWidth, windowHeight - 30);
  g = createGraphics(width, height);
  speedSlider = createSlider(0, 2, 1, 0.1);
  addEpicyclesBtn = createButton(" / ");
  addEpicyclesBtn.mouseReleased(addEpi);
  remEpicyclesBtn = createButton(" % ");
  remEpicyclesBtn.mouseReleased(remEpi);
  textFont(font);
}

function mousePressed() {
  animation = false;
  frameRate(30);
  if(mouseX > 0 && mouseX < width
    && mouseY > 0 && mouseY < height){
      state = USER;
  drawing = [];
  signal = [];
  fourier = [];
  time = 0;
  path = [];
  
  }

}

function mouseReleased() {
  //frameRate(10);
  state = FOURIER;
  const skip = 1;
  for (let i = 0; i < drawing.length; i+=skip) {
    const c = new Complex(drawing[i].x, drawing[i].y);
    signal.push(c);
  }

  fourier = dft(signal);
  fourier.sort((a,b) => b.amp - a.amp);
}

function epicycles(x, y, rotation, fourier) {

  ellipse(x, y, 10, 10);

  for (let i = 0; i < fourier.length; i++) {
    let prevx = x;
    let prevy = y;
    
    let freq = fourier[i].freq;
    let radius = fourier[i].amp;
    let phase = fourier[i].phase + rotation;
    
    x += radius * cos(freq * time + phase);
    y += radius * sin(freq * time + phase);
  
    stroke(0, 50);
    noFill();
    ellipse(prevx, prevy, radius * 2);
  
    fill(200);
    stroke("orange");
    ellipse(x, y, 1);
    
    stroke(0, 182);
    line(prevx, prevy, x, y);
  }
  return createVector(x, y);
}

let alfa = 255;

let animation = true;


function draw() {
  clear();
  image(g, 0, 0);

  if(animation == true){
    textSize(24);
    textAlign(CENTER);
    fill(0, alfa);
    text("la mano automata que re-traza tu trazo", width*.5, height*.5);
    alfa *= 0.98;
    if(alfa < 1){
      animation = false;
    }
  }
  speedMod = speedSlider.value();
  if (state == USER) {
    let point = createVector(mouseX - width/2, mouseY - height/2);
    drawing.push(point);
    
    stroke(0);
    noFill();
    beginShape();
    for (let v of drawing) {
      vertex(v.x + width/2, v.y + height/2);
    }
    endShape();
    
  } else if (state == FOURIER) {
    //Draw the drawing in faint color
    stroke("#655d5d75");
    noFill();
    beginShape();
    for (let v of drawing) {
      vertex(v.x + width/2, v.y + height/2);
    }
    endShape();
    
    v = epicycles(width/2, height/2, 0, fourier);
  
    // Add final point to the array
    path.unshift(v);
    g.noFill();
    g.stroke("#fd5017f0");
    g.beginShape();
    for (let i = 0; i < path.length; i++) {
      g.vertex(path[i].x, path[i].y);
    }
    g.endShape();
   
    // Increment Time
    const dt = (TWO_PI / fourier.length) * speedMod;
    time += dt;
  
    if (time > TWO_PI) {
      time = 0;
      path = [];
    }
    
    fill(0, 126);
    noStroke();
    textSize(14);
    textAlign(RIGHT);
    text("Epiciclos: " + fourier.length, width*.5, height - 36, width*.5, height);
    text("Velocidad: " + speedMod, width*.5, height - 22, width*.5, height);
    
    // Remove any extra points 
    //if (path.length > 600) {
    //  path.pop();
    //}
    
    g.filter(BLUR, 1);
  }
  
    
}

function keyPressed() {
  path = [];
  time = 0;
  if (keyCode == 65) {
	if (fourier.length === 1) return;
    removedFourier.push(fourier.pop());
  }
  else if (keyCode == 68) {
	if (removedFourier.length == 0) return;
    fourier.push(removedFourier.pop());
  }
  else if (keyCode == 87) {
	speedMod += 0.05;
  }
  else if (keyCode == 83) {
	speedMod -= 0.05;
  }
}

function addEpi(){
    if (fourier.length === 0) return;
    removedFourier.push(fourier.pop());
}
function remEpi(){
  if (removedFourier.length == 1) return;
    drawing.slice(0, drawing.lenght-1);
}