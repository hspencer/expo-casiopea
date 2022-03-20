/**
 * 70 Giros en desarrollo
 * 
 * hspencer
 */

let gg, num, m;

function setup() {
  createCanvas(windowWidth, windowHeight);

  gg = [];
  num = 70;
  m = 50;
  let yInc = (height - 2 * m) / (num - 1);

  for (let i = 0; i < num; i++) {
    gg[i] = new Giro(m, m + yInc * i, random(yInc/1.5, yInc*2.5));
  }
  background("white");
}

function draw() {
  for (let i = 0; i < gg.length; i++) {
    gg[i].go();
  }
  
  for (let i = 0; i < gg.length; i++) {
    if(gg[i].x > width-m){
      gg.splice(i, 1);
    }
  }
}

class Giro {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.a = random(TWO_PI);
    this.seed = round(random(999999));
    this.c = color(random(180, 220), random(10, 50), random(70), random(10, 50));
    this.aInc = random(0.7);
    this.xInc = random(0.51, 5);
  }

  draw() {
    let n = noise(millis() / 300) * this.r;
    push();
    {
      translate(this.x, this.y);
      let nx = cos(this.a) * n;
      let ny = sin(this.a) * n;
      push();
      {
        translate(nx, ny);
        rotate(this.a - HALF_PI);
        stroke(this.c);
        line(-n * 2, 0, n * 2, 0);
      }
      pop();
    }
    pop();
  }
  go() {
    this.draw();
    this.x += this.xInc;
    this.a += this.aInc;
  }
}
