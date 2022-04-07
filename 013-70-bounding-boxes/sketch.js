/**
 *  Acto del Momento Simultáneo
 *  e[ad] Escuela de Arquitectura y Diseño
 *  2020
 */

let sketch; // html canvas object
let data, words;
let notes;  // array of visual objects
let w, h;   // global width and height

// matter aliases : thanks Dan Shiffman and CodingTrain, Nature of Code, etc...
var Engine = Matter.Engine,
  World = Matter.World,
  Bodies = Matter.Bodies,
  Constraint = Matter.Constraint,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint;

// matter.js main components
let engine;
let world;
let boundaries = [];

// typefaces
let serif, sans, sansBold;

function preload() {
  data = "comienza a caer otro poco de nieve";
  
  w = document.getElementById("p5").offsetWidth;
  h = document.getElementById("p5").offsetHeight;
  
  serif = loadFont("fonts/Alegreya-Regular.ttf");
  sans = loadFont("fonts/AlegreyaSans-Light.ttf");
  sansBold = loadFont("fonts/AlegreyaSans-Bold.ttf");
}

function construct() {
  let words = data.split(" ");
  console.log(words);

  /*
  for (let key in data.query.results) {
    let thisResult = data.query.results[key];
    let lat = thisResult.printouts['Posición'][0].lat;
    let lon = thisResult.printouts['Posición'][0].lon;
    let autor = thisResult.printouts['Autor'][0].fulltext;
    let title = thisResult.fulltext;
    let t = thisResult.printouts['Nota'][0];
    let thisNote = new Note(lat, lon, title, t, autor);
    notes.push(thisNote);
  }
  */

  for(let word in words){
    let x = 10;
    let y = height/2;
    
    console.log(word);

    let thisWord = new Note (x, y, word,  word, words[word]);
    notes.push(thisWord);

    x+= 200;
  }
}

function setup() {
  sketch = createCanvas(w, h);
  
  notes = [];
  sketch.parent('p5');
  engine = Engine.create();
  world = engine.world;
  //Engine.run(engine);

  // limits
  boundaries.push(new Boundary(w / 2, height + 23, width, 50, 0));
  boundaries.push(new Boundary(-10, h / 2, 20, height * 5, 0));
  boundaries.push(new Boundary(w + 10, h / 2, 20, height * 5, 0));
  
  // top bumps
  /*
  let n = 8;
  for(let i = 1; i < n; i++){
    let spacer = w/n;
    let tl = new Boundary(spacer * i, -10, 20, 10, random(-1, 1));
    //tl.show();
    boundaries.push(tl);
  }*/

  construct();
  //createObjects();

  let canvasmouse = Mouse.create(sketch.elt);
  canvasmouse.pixelRatio = pixelDensity();
  //console.log(canvasmouse);
  let options = {
    mouse: canvasmouse
  };
  mConstraint = MouseConstraint.create(engine, options);
  World.add(world, mConstraint);
  //console.log(mConstraint);
}

function windowResized() {
  w = document.getElementById("p5").offsetWidth;
  h = document.getElementById("p5").offsetHeight;
  sketch = createCanvas(w, h);
  sketch.parent('p5');
  createObjects();
}

function draw() {
  Engine.update(engine);
  for (let i = 0; i < notes.length; i++) {
    notes[i].display();

    // if a note is being clicked or dragged
    if (mConstraint.body === notes[i].body) {
      fill(255, 7);
      rectMode(CORNER);
      noStroke();
      rect(0, 0, w, h);
      textAlign(LEFT);
      textFont(sansBold);
      textSize(18);
      fill(180, 30, 0, 10);
      text(notes[i].title.toUpperCase(), 0, 20);
      textFont(serif);
      textSize(40);
      fill(0, 10);
      text(notes[i].text, 0, 45, w, h - 45);
    }
  }

  if (mConstraint.body) {
    let pos = mConstraint.body.position;
    let offset = mConstraint.constraint.pointB;
    let m = mConstraint.mouse.position;
    // paint line while dragging object
    /*
    strokeWeight(3);
    stroke(180, 30, 0, 90);
    line(pos.x + offset.x, pos.y + offset.y, m.x, m.y);
    */
  }
}
