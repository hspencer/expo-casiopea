let b = [];
let num = 7;

function setup() {
  createCanvas(windowWidth - 17, windowHeight - 17);
  b.push(new Blob(random(width), random(height)));
}

function draw() {
  blendMode(BLEND);
  background("#f2edd945");
  blendMode(MULTIPLY); 
  for (let blob of b) {
    blob.live();
  }

  if (b.length < num && random(1) < 0.01) {
    b.push(new Blob(random(width), random(height)));
  }
}

class Blob {
  constructor(x, y) {
    this.v = [];
    this.open = true;
    this.v.push(createVector(x, y));
    this.t = random(TWO_PI);
    this.perimeter = round(random(30, 500));
    this.seed = round(random(50, 100));
    this.fill = getCol(fillColors);
    this.strk = getCol(strokeColors);
    this.zoom = random(40);
  }

  live() {
    let first = this.v[0];
    let last = this.v[this.v.length - 1];

    if (this.open) {
      noiseSeed(this.seed);
      let n = noise(millis() / this.zoom) - 0.5;

      // si ya es muy largo tiene que comenzar a volver
      if (this.v.length >= this.perimeter) {
        let ang = atan2(first.y - last.y, first.x - last.x);
        let diff = ang - this.t;
        this.t += diff * 0.1 + n;

        // si los extremos están cerca cierre la figura
        if (dist(first.x, first.y, last.x, last.y) < 5) {
          this.open = false;
        }
      } else {
        this.t += n;
      }
     

      // si choca con los bordes
      if (last.x > width || last.x < 0 || last.y < 0 || last.y > height) {
        this.t += PI;
      }

      // identidad circular
      let x = last.x + cos(this.t) * 2;
      let y = last.y + sin(this.t) * 2;

      // agregue un nuevo vértice (sólo si tiene un largo razonable)
      if (this.v.length < this.perimeter * 2.5) {
        this.v.push(createVector(x, y));
      }
    }

    if (!this.open) {
      noStroke();
      beginShape();
      fill(this.fill);
      for (let p of this.v) {
        vertex(p.x, p.y);
      }
      endShape();
      stroke(this.strk);
      line(first.x, first.y, last.x, last.y);
    }

    for (let i = 1; i < this.v.length; i++) {
      strokeWeight(noise(this.v[i].x / 20, this.v[i].y / 20) * 5);
      line(this.v[i].x, this.v[i].y, this.v[i - 1].x, this.v[i - 1].y);
    }
  }
}

let fillColors = [
  "#26465322","#2a9d8f22","#e9c46a66","#f4a26122","#e76f5122"
];

let strokeColors = [
  "#56766166", "#9caea966", "#78858566", "#6f686666", "#38302e44"
]

function getCol(palete) {
  return palete[floor(random(palete.length))];
}

function mousePressed(){
  b = [];
  b.push(new Blob(mouseX, mouseY));
}