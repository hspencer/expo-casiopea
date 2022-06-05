// Coding Challenge 130.3: Drawing with Fourier Transform and Epicycles
// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/130.1-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.2-fourier-transform-drawing.html
// https://thecodingtrain.com/CodingChallenges/130.3-fourier-transform-drawing.html
// https://youtu.be/7_vKzcgpfvU


let x = [];
let fourierX;
let time = 0;
let path = [];


// let horizonte;

function setup() {
  createCanvas(windowWidth, windowHeight);
  const skip = 1;
  for (let i = 0; i < drawing.length; i += skip) {
    const c = new Complex(drawing[i].x, drawing[i].y);
    x.push(c);
  }
  fourierX = dft(x);
  fourierX.sort((a, b) => b.amp - a.amp);

 // horizonte = createGraphics(width, height,);
}

function epicycles(x, y, rotation, fourier) {
  for (let i = 0; i < fourier.length; i++) {
    let prevx = x;
    let prevy = y;
    let freq = fourier[i].freq;
    let radius = fourier[i].amp;
    let phase = fourier[i].phase;
    x += radius * cos(freq * time + phase + rotation);
    y += radius * sin(freq * time + phase + rotation);

    stroke(0, 90);
    strokeWeight(.75);
    fill(255, 150);
    ellipse(prevx, prevy, radius * 2);
		strokeWeight(2);
    line(prevx, prevy, x, y);
  }
  return createVector(x, y);
}

function draw() {
	//translate(-200, -150);
	scale(1.1)//.3);
  clear();
  //image(horizonte, 0, 0);

  let v = epicycles(width / 2, height / 2, 0, fourierX);
  path.unshift(v);
  stroke('#f04657');
  strokeWeight(0.75);
  beginShape();
  noFill();
  for (let i = 0; i < path.length; i++) {
    vertex(path[i].x, path[i].y);
  }
  endShape();

  const dt = TWO_PI / fourierX.length;
  time += dt;

  if (time > TWO_PI) {
    time = 0;
    path = [];
  }

 
  //print(fourierX);
  
  let pl = path.length;
  let prl = pl-1;
  let paso = (pl * 2) % width;

  // print(mag(path[0].x, path[0].y));
/*
  horizonte.stroke('#f9010136');
  horizonte.line(paso, height - (mag(path[0].x, path[0].y) - 150 ), paso, height);

  */
}

function keyTyped(){
  if(key === 's') save('amereida-fourier.jpg');
}