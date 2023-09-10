
let lines; // líneas
let currentPoints; // línea actual - arreglo de vectores
let dark;  // modo oscuro
let buttonClicked; // Añadir la variable de estado para los botones

let btnNew, btnMode, btnUndo, btnSave; // botones

let slider;

function setup() {
  let margin = 0;
  createCanvas(windowWidth - margin, windowHeight - margin);
  noFill();
  dark = true;
  
  btnNew = createButton('nuevo');
  btnNew.mousePressed(newDrawing);
  btnNew.parent('controls');
  
  btnMode = createButton('invertir');
  btnMode.mousePressed(invertDrawing);
  btnMode.parent('controls');
  
  btnUndo = createButton('deshacer');
  btnUndo.mousePressed(undo);
  btnUndo.parent('controls');
  
  btnSave = createButton('guardar');
  btnSave.mousePressed(saveDrawing);
  btnSave.parent('controls');
  
  newDrawing();
  cursor(CROSS);

  slider = createSlider(0, 250, 50);
  slider.parent('controls');
  slider.input(() => { buttonClicked = true; });  // Añadir evento de entrada para el slider

  buttonClicked = false;
}

function newDrawing() {
  buttonClicked = true;  // Actualizar estado del botón
  currentPoints = [];
  lines = [];
}

function invertDrawing() {
  buttonClicked = true;  // Actualizar estado del botón
  dark = !dark;
}

function undo() {
  buttonClicked = true;  // Actualizar estado del botón
  lines.pop();
}

function saveDrawing() {
  buttonClicked = true;  // Actualizar estado del botón
  saveCanvas("pizarra.png");
}

function draw() {
  if(dark){
    background(0);
    stroke(255, 200);
  } else {
    background(255);
    stroke(0, 200);
  }
  
  if(mouseIsPressed && !buttonClicked) {  // Añadir comprobación para buttonClicked
    currentPoints.push(createVector(mouseX, mouseY));
  }

  // draw current line
  strokeWeight(2.5);
  beginShape();
  for(p of currentPoints){
    vertex(p.x, p.y);
  }
  endShape();

  for (let i = 0; i < lines.length; i++) {
    strokeWeight(2.5);
    lines[i].draw();
  
    for (let j = i + 1; j < lines.length; j++) { // Comienza desde i + 1
      // No es necesario verificar si i !== j porque j siempre será mayor que i
      for (let pt1 of lines[i].points) {
        let closestDist = slider.value(); // Obtener el valor del slider
        let closestPt = null;
  
        for (let pt2 of lines[j].points) {
          let d = dist(pt1.x, pt1.y, pt2.x, pt2.y);
          if (d < closestDist) {
            closestDist = d;
            closestPt = pt2;
          }
        }
  
        if (closestPt !== null) {
          let weight = map(closestDist, 0, slider.value(), 2.5, 0.25); // Mapear la distancia a un grosor de línea
          strokeWeight(weight);
          line(pt1.x, pt1.y, closestPt.x, closestPt.y);
        }
      }
    }
  }
  
}

function mouseReleased() {
  if (!buttonClicked) {
    lines.push(new Line(currentPoints));
  }
  currentPoints = [];
  buttonClicked = false;  // Reiniciar estado del botón
}

class Line{
  constructor(points){
    this.points = points;
  }
  draw(){
    beginShape();
    for(let p of this.points){
      vertex(p.x, p.y);
    }
    endShape();
  }
}
