let url = "https://wiki.ead.pucv.cl/api.php?action=ask&format=json&query=%5B%5BCategor%C3%ADa%3ACurso%5D%5D%5B%5BA%C3%B1o%3A%3A2023%5D%5D%5B%5BTipo%20de%20Curso%3A%3ATaller%20de%20Etapa%5D%5D%7C%3FProfesores%7C%3FAlumnos!%7C%3FCarreras%20Relacionadas%7C%3FAginaturas%20Relacionadas&utf8=1";
let data;

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

let mouseOverBody = null;

let w, h, talleres;

// typefaces
let serif, sans, sansBold;

function preload(){
  talleres = [];
  data = loadJSON(url, gotData, 'jsonp');
  // load fonts
  serif = loadFont("../data/Alegreya/Alegreya-Regular.ttf");
	sans = loadFont("../data/Alegreya_Sans/AlegreyaSans-Light.ttf");
	sansBold = loadFont("../data/Alegreya_Sans/AlegreyaSans-Bold.ttf");
}


function gotData(){
  createCanvas(400, 400);
  for (let key in data.query.results) {
    let thisResult = data.query.results[key];
    console.log(thisResult);
  }
}


function setup() {
  createCanvas(windowWidth - 10, windowHeight - 35);
  rectMode(CENTER);
  w = width;
  h = height;
  createMatterStuff();
  createConstraints();

  //text specs
  textFont(sans, 14);
  textAlign(CENTER, CENTER);

  // create main artifacts
  for (let key in data.query.results) {
    let thisResult = data.query.results[key];
    let taller = new Taller(thisResult);
    talleres.push(taller);
  }
}

function draw() {
  clear();

  for(let i = 0; i < talleres.length; i++){
    talleres[i].display();
  }

  if (mConstraint.body) {
		mouseOverBody = event.body;
		let pos = mConstraint.body.position;
		let offset = mConstraint.constraint.pointB;
		let m = mConstraint.mouse.position;

		// paint line while dragging object
		strokeWeight(2);
		stroke(200);
		line(pos.x + offset.x, pos.y + offset.y, m.x, m.y);
	}else{
		mouseOverBody = null;
	}

	/*
    // Listen for start of collision
    Matter.Events.on(mConstraint, "startdrag", function (event) {
        mouseOverBody = event.body;
    });
	

    // Listen for end of collision
    Matter.Events.on(mConstraint, "enddrag", function (event) {
        mouseOverBody = null;
    });
	*/


	if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
		mConstraint.constraint.bodyB = null;
	}
  Engine.update(engine);
}

function createMatterStuff() {
	engine = Engine.create();
	world = engine.world;
	engine.world.gravity.y = .1;
}

function createConstraints() {
	/// mouse
	let canvasmouse = Mouse.create(sketch.elt);
	canvasmouse.pixelRatio = pixelDensity();
	let options = {
		mouse: canvasmouse,
		angularStiffness: 0.999,
		stiffness: 0.999,
		length: 0.01
	};

	mConstraint = MouseConstraint.create(engine, options);
	World.add(world, mConstraint);

	/// limits
	let thickness = 500;

	// top
	boundaries.push(new Boundary(w / 2, 0 - thickness / 2, w*2, thickness, 0));

	// bottom
	boundaries.push(new Boundary(w / 2, height + thickness / 2 - 5, w*2, thickness, 0));

	// sides
	boundaries.push(new Boundary(-thickness / 2, h / 2, thickness, height * 15, 0));
	boundaries.push(new Boundary(w + thickness / 2, h / 2, thickness, height * 15, 0));
}