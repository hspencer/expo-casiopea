let particles = [];
let gridSize = 30; // Tamaño de la celda de la cuadrícula
let gridCols, gridRows;
let distanceSlider;

function setup() {
  createCanvas(windowWidth - 16, 350);
  distanceSlider = createSlider(5, 500, 80, 1);
  distanceSlider.position(10, 10);
  gridCols = ceil(width / gridSize) + 1;
  gridRows = ceil(height / gridSize) + 1;
  for (let i = 0; i < 400; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  clear();
  grid = Array.from({ length: gridCols }, () => Array.from({ length: gridRows }, () => []));
  for (let p of particles) {
    let x = floor(p.pos.x / gridSize);
    let y = floor(p.pos.y / gridSize);
    if (x >= 0 && x < gridCols && y >= 0 && y < gridRows) {
      grid[x][y].push(p);
    }
  }
  for (let p of particles) {
    p.move();
    p.connect(grid);
  }
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(random(-1, 1), random(-1, 1));
  }

  move() {
    this.pos.add(this.vel);
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  connect(grid) {
    let x = floor(this.pos.x / gridSize);
    let y = floor(this.pos.y / gridSize);
    for (let i = max(0, x - 1); i <= min(gridCols - 1, x + 1); i++) {
      for (let j = max(0, y - 1); j <= min(gridRows - 1, y + 1); j++) {
        for (let other of grid[i][j]) {
          if (this !== other) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (d < distanceSlider.value()) {
              let weight = map(d, 0, distanceSlider.value(), 4, 1);
              let alpha = map(d, 0, distanceSlider.value(), 100, 50);
              stroke(0, alpha);
              strokeWeight(weight);
              line(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            }
          }
        }
      }
    }
  }
}
