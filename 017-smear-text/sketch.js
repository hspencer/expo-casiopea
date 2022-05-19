let str = " Este lenguaje será del alma para el alma, resumiéndolo todo, perfumes, sonidos, colores, pensamiento que se aferra al pensamiento y tira de él. Si el poeta definiera qué cantidad de lo desconocido se despierta, en su época, dentro del alma universal, ¡daría algo más — la fórmula de su pensamiento, — la notación de su marcha hacia el Progreso! Enormidad que se convierte en norma, absorbida por todos, ¡el poeta sería en verdad un multiplicador de progreso!";
let g;
let texture;
let palette = ["#FFF","#E52"];
function preload() {
  // font = loadFont("Lato-Black.ttf");
  font = loadFont("../data/Alegreya_Sans/AlegreyaSans-Light.ttf");
}

function setup() {
  let wi = windowWidth;
  let he = windowHeight;
  if(wi>he){
    createCanvas(he, he);
  }else{
    createCanvas(wi, wi);
  }
  createCanvas(800, 800);
  colorMode(HSB, 360, 100, 100, 100);
  angleMode(DEGREES);
  // shuffle(palette, true);
  // blendMode(DARKEST);

  str = str.toUpperCase();
  let sep = 12;//int(random(12, 20));//int(random(3, 10));
  let bounds = font.textBounds(str, 0, 0, width / sep);
  g = createGraphics(bounds.w + 3, bounds.h);
  g.colorMode(HSB, 360, 100, 100, 100);
  g.textFont(font);
  g.textSize(width / sep);
  g.fill(palette[1]);
  g.text(str, -bounds.x, -bounds.y);
  g.erase();
  for (let i = 0; i < g.width * g.height; i++) {
    let r =
      ((1 - random(random())) * sqrt(g.width * g.width + g.height * g.height)) /
      2;
    let angle = random(360);
    let x = g.width / 2 + cos(angle) * r;
    let y = g.height / 2 + sin(angle) * r;
    g.strokeWeight(random(random()) * 4);
    g.point(x, y);
  }
  g.noErase();
  drawingContext.imageSmoothingEnabled = true;
}

function draw() {
  let y = 0;
  let gx = random(g.width);
  while (y < height) {
    let x = 0;
    while (x < width) {
      let xStep = int(random(1, 5)) * 3;
      let n = noise(x / 25, y / 5, frameCount / 150);
      let gg;
      gx %= g.width;
      if (n > 0.5) {
        gg = g.get(gx, 0, xStep, g.height);
        gx += xStep;
      } else {
        gg = g.get(gx, 0, 1, g.height);
        gx += 0.1;
      }
      image(
        gg,
        x,
        y + map(n, 0, 1, (-g.height * 0.25) / 2, (g.height * 0.25) / 2),
        xStep,
        g.height
      );
      x += xStep;
    }
    y += g.height * 1.1;
  }
  let tmp = get();
  background(palette[0]);

  for (let i = 0; i < (width * height * 2.5) / 100; i++) {
    let r =
      ((1 - random(random())) * sqrt(width * width + height * height)) / 2;
    let angle = random(360);
    let x = width / 2 + cos(angle) * r;
    let y = height / 2 + sin(angle) * r;
    stroke(palette[1]);
    strokeWeight(random(0.25, 2));
    point(x, y);
  }

  drawingContext.shadowColor = color(0, 0, 0, 23);
  drawingContext.shadowBlur = width / 45;
  drawingContext.shadowOffsetX = width / 15 / 4;
  drawingContext.shadowOffsetY = width / 15 / 4;
  image(tmp, 0, 0);

  noLoop();
}
