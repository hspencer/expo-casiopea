let b = [];
let num = 70;

function setup() {
  createCanvas(windowWidth - 20, windowHeight - 20);
  b.push(new Blob(random(width), random(height)));
}

function draw() {
  //blendMode(BLEND);
  background("#FFFFFFaa");
  //blendMode(MULTIPLY); 
  for (let blob of b) {
    blob.live();
  }

  if (b.length < num && random(1) < 0.0075) {
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
    
    // determina el primer y último vértice
    let first = this.v[0];
    let last = this.v[this.v.length - 1];

    if (this.open) {
      noiseSeed(this.seed);
      let n = noise(millis() / this.zoom) - 0.5;

      // si ya es muy largo tiene que comenzar a volver
      if (this.v.length >= this.perimeter) {
        
        let ang = atan2(first.y - last.y, first.x - last.x);
        let diff = ang - this.t;
        this.t += diff * 0.345 + n;

        let distLast = dist(first.x, first.y, last.x, last.y);
        let distBefore = dist(first.x, first.y, this.v[this.v.length - 2].x, this.v[this.v.length - 2].y);
        
        // si los extremos están cerca cierre la figura
        if (distLast < 2) {
          this.open = false;
        }
        
        // si se está alejando, que gire en 180º
        if(distLast > distBefore){
          this.t += PI;
        }

      } else {
        this.t += n;
      }
      // si choca con los bordes
      if (last.x > width || last.x < 0 || last.y < 0 || last.y > height) {
        this.t += PI;
      }

      // identidad circular
      let x = last.x + cos(this.t) * 1;
      let y = last.y + sin(this.t) * 1;

      // agregue un nuevo vértice (sólo si tiene un largo razonable)
      if (this.v.length < this.perimeter * 2.5) {
        this.v.push(createVector(x, y));
      }
    }

    if (!this.open) {

      // relleno de color
      noStroke();
      beginShape();
      fill(this.fill);
      for (let p of this.v) {
        vertex(p.x, p.y);
      }
      endShape();

      // y el trazo que cierra la figura
      stroke(this.strk);
      line(first.x, first.y, last.x, last.y);
    }

    // todos los otros trazos
    for (let i = 1; i < this.v.length; i++) {
      strokeWeight(noise(this.v[i].x / 20, this.v[i].y / 20) * 5);
      stroke(this.strk);
      line(this.v[i].x, this.v[i].y, this.v[i - 1].x, this.v[i - 1].y);
    }
  }
}

let fillColors = [
  "#56766199", "#987f25c7", "#78858599", "#c93b03bf", "#b05e0cc7", "#0490a9bf"
  
];

let strokeColors = [
  "#08054dbf","#2a9d8f22","#1a2f32bf","#68860391","#e76f5122"
]

function getCol(palete) {
  return palete[floor(random(palete.length))];
}

function mousePressed(){
  b = [];
  b.push(new Blob(mouseX, mouseY));
}