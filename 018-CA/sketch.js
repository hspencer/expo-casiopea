let w = 5;
let cells;
let generation;
let inputs = [];
let wi;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight - 50);
  canvas.parent("p5");

  for (let i = 0; i < 8; i++) {
    inputs[i] = createInput(round(random(1)).toString(), "number");
    inputs[i].parent("controls");
    inputs[i].input(updateRules);
    inputs[i].attribute("min", "0");
    inputs[i].attribute("max", "1");
  }

  wi = createSlider(1, 20, 10, 1);
  wi.parent("controls");
  wi.changed(updateRules);

  updateRules();
}

function updateRules() {
  background(255);
  ruleset = [
    Number(inputs[0].value()),
    Number(inputs[1].value()),
    Number(inputs[2].value()),
    Number(inputs[3].value()),
    Number(inputs[4].value()),
    Number(inputs[5].value()),
    Number(inputs[6].value()),
    Number(inputs[7].value()),
  ];
  init();
}

function init() {
  w = wi.value();

  if (w < 3) {
    noStroke();
  } else {
    stroke(0, 80);
    strokeWeight(0.25);
  }
  generation = 0;
  // cell = [];
  cells = Array(floor(width / w));
  for (let i = 0; i < cells.length; i++) {
    cells[i] = 0;
  }
  cells[round(cells.length / 2)] = 1;
}

function draw() {
  // print("generation = " + generation);
  if (generation < height / w) {
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === 1) {
        fill(30);
        rect(i * w, generation * w, w, w);
      } else {
        fill(255);
        rect(i * w, generation * w, w, w);
      }
    }
    generate();
  } else {
    init();
  }
}

// The process of creating the new generation
function generate() {
  // First we create an empty array for the new values
  let nextgen = Array(cells.length);
  // For every spot, determine new state by examing current state, and neighbor states
  // Ignore edges that only have one neighor
  for (let i = 1; i < cells.length - 1; i++) {
    let left = cells[i - 1]; // Left neighbor state
    let me = cells[i]; // Current state
    let right = cells[i + 1]; // Right neighbor state
    nextgen[i] = rules(left, me, right); // Compute next generation state based on ruleset
  }
  // The current generation is the new generation
  cells = nextgen;
  generation++;
}

// Implementing the Wolfram rules
// Could be improved and made more concise, but here we can explicitly see what is going on for each case
function rules(a, b, c) {
  if (a == 1 && b == 1 && c == 1) return ruleset[0];
  if (a == 1 && b == 1 && c == 0) return ruleset[1];
  if (a == 1 && b == 0 && c == 1) return ruleset[2];
  if (a == 1 && b == 0 && c == 0) return ruleset[3];
  if (a == 0 && b == 1 && c == 1) return ruleset[4];
  if (a == 0 && b == 1 && c == 0) return ruleset[5];
  if (a == 0 && b == 0 && c == 1) return ruleset[6];
  if (a == 0 && b == 0 && c == 0) return ruleset[7];
  return 0;
}

function windowResized() {
  let canvas = createCanvas(windowWidth, windowHeight - 50);
  canvas.parent("p5");
}
