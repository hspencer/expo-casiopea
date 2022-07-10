let graphics;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);

  graphics = createGraphics(width, height);
  graphics.colorMode(HSB, 360, 100, 100, 100);
  graphics.noStroke();
  for (let i = 0; i < (width * height * 15) / 100; i++) {
    let r = ((1 - random(random(random()))) * sqrt(sq(width) + sq(height))) / 2;
    let angle = random(360);
    let x = width / 2 + cos(angle) * r;
    let y = height / 2 + sin(angle) * r;
    let w = random(2);
    let h = random(2);

    graphics.fill(0, 0, 0, 33);
    graphics.ellipse(x, y, w, h);
  }
}

function draw() {
  fill(0, 0, 90);
  noStroke();
  rect(0, 0, width, height);

  let offset = width / 15;
  let w = width - offset * 2;
  let h = height - offset * 2;

  let yArr = [];
  let ySum = 0;
  do {
    let num = random();
    ySum += num;
    yArr.push(num);
  } while (random() < 0.95 ? random() < 0.99 : random() < 0.75);
  shuffle(yArr, true);
  for (let i = 0; i < yArr.length; i++) {
    yArr[i] = (yArr[i] / ySum) * h;
  }

  let y = offset;
  for (let yVal of yArr) {
    let x = offset;
    let xArr = [];
    let xSum = 0;
    do {
      let num = random();
      xSum += num;
      xArr.push(num);
    } while (random() < 0.95 ? random() < 0.99 : random() < 0.75);
    shuffle(xArr, true);
    for (let i = 0; i < xArr.length; i++) {
      xArr[i] = (xArr[i] / xSum) * w;
    }
    let n = int(random(2));
    for (let xVal of xArr) {
      // fill(0, 0, random(80));
      stroke(0, 0, 15);
      // rect(x, y, xVal, yVal);
      push();
      translate(x + xVal / 2, y + yVal / 2);
      scale(n % 2 == 0 ? -1 : 1, n % 4 > 2 ? 1 : -1);
      let sclStep = int(random(3, 8));
      for (let scl = 1; scl > 0; scl -= 1 / sclStep) {
        push();
        translate(-xVal / 2, -yVal / 2);
        scale(scl);
        strokeWeight(1 / scl);
        line(0, yVal, xVal, 0);
        pop();
      }
      pop();
      x += xVal;
      n++;
    }
    y += yVal;
  }
  image(graphics, 0, 0);
  noLoop();
}

mouseClicked = () => setup()