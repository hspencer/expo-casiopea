/** Stripes */

let container, canvas, veil;

function setup() {
  container = document.getElementById("p5");
  canvas = createCanvas(container.offsetWidth, 390);
  canvas.parent(container);
  noStroke();
  fill(0);

  veil = createImage(10, 10);

  veil.loadPixels();
  for (let x = 0; x < veil.width; x += 1) {
    for (let y = 0; y < veil.height; y += 1) {
      let a = map(x, 0, veil.width, 255, 0);
      let c = color(255, a);
      veil.set(x, y, c);
    }
  }
  veil.updatePixels();
}

function draw() {
  clear();
  let h = 10;
  let f = true;
  for (let y = 0; y < height; y += h + h / 2) {
    let s = (sin(millis() / 2000 + y / 200) + 1) * width / 8 + h;
    
    for (let x = 0; x < 120; x++) {
      f = !f;

      if (f) {
        fill(0)
      } else {
        noFill()
      }
      rect(width / 2 + s * (x + 1), y, s, h, h / 2);


      if (f) {
        fill(0)
      } else {
        noFill()
      }
      rect(width / 2 - s * (x - 1), y, s, h, h / 2);
    }
    f = !f;
  }
  image(veil, 0, 0, 100, height);
  push();
  scale(-1, 1);
  image(veil, -width, 0, 100, height);
  pop();
}
