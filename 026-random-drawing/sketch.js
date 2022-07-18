const DRAG = 0.111;
const inc = 0.0002;
let num = 10;

let col = [
  "#a3162133",
  "#bfdbf733",
  "#053c5e33",
  "#1f7a8c33",
  "#db222a33",
  "#d8e2dc33",
  "#ffe5d933",
  "#ffcad433",
  "#f4acb733",
  "#9d818933",
  "#17161433",
  "#3a261833",
  "#75404333",
  "#9a887333",
  "#37423d33",
];

function getCol() {
  return col[floor(random(col.length))];
}

let f;

function setup() {
  let c = createCanvas(windowWidth - 20, windowHeight - 20);
  c.parent("container");
  regen();
}

function draw() {
  blendMode(BLEND);
  background("white");
  blendMode(MULTIPLY);
  for (let i = 0; i < f.length; i++) {
    f[i].display();
  }
  if (frameCount%1500 === 0) {
    regen();
  }
}

class Figure {
  constructor(px, py, radius) {
    this.points = [];
    this.bitmap = createGraphics(width + 200, height + 200);
    for (let t = 0; t < TWO_PI; t += random(0.1, 1)) {
      let r = random(radius * 0.5, radius * 1.5);
      let nx = 100 + px + cos(t) * r;
      let ny = 100 + py + sin(t) * r;
      let p = createVector(nx, ny);
      this.points.push(p);
    }
    this.w = radius / 50;
    this.x = this.points[0].x;
    this.y = this.points[0].y;
    this.tracing = true;
    this.fill = getCol();
    this.stroke = getCol();
    this.ox = 0;
    this.oy = 0;
    this.oa = 0;
    this.s = 1;
    this.xinc = random(-inc, inc);
    this.yinc = random(-inc, inc);
    this.ainc = random(-inc, inc);
    this.sinc = this.s + random(-inc, inc);
  }

  render() {
    this.border();
    this.bitmap.noStroke();
    this.bitmap.fill(this.fill);
    this.bitmap.beginShape();
    for (let i = 0; i < this.points.length; i++) {
      this.bitmap.vertex(this.points[i].x, this.points[i].y);
    }
    this.bitmap.endShape(CLOSE);
  }

  border() {
    let count = 1;
    if (this.tracing) {
      do {
        let tx = this.points[count].x;
        let ty = this.points[count].y;

        let difX = tx - this.x;
        let difY = ty - this.y;

        let sw = noise(this.x / 3, this.y / 3) * this.w;

        this.bitmap.strokeWeight(sw);
        this.bitmap.stroke(this.stroke);

        this.bitmap.line(this.x, this.y, this.x + difX, this.y + difY);

        this.x += difX * DRAG;
        this.y += difY * DRAG;

        //print("x = " + this.x + " y = " + this.y);

        if (dist(this.x, this.y, tx, ty) < 1) {
          if (count === 0) {
            this.tracing = false;
            //print("no more tracing");
          }
          count++;
          count %= this.points.length;
        }
      } while (this.tracing);
    }
  }
  display() {
    push();
    translate(this.ox, this.oy);
    rotate(this.oa);
    scale(this.s)
    image(this.bitmap, -100, -100);
    pop();

    this.ox += this.xinc;
    this.oy += this.yinc;
    this.oa += this.ainc;
    this.s *= this.sinc;
  }
}

function regen() {
  f = [];
  for (let i = 0; i < 15; i++) {
    let fig = new Figure(
      random(width),
      random(height),
      random(width / 10, width / 3)
    );
    fig.render();
    f.push(fig);
  }
}

function mousePressed(){
  regen();
}
