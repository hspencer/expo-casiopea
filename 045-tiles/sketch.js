

let palette = [
  "#7b4800",
  "#002185",
  "#06e6e6",
  "#fcd300",
  "#ff2702",
  "#1235fc",
  "#ff771c",
  "#289cf2",
  "#00417b"
];

let imgs = [];

function preload() {
  // Cargamos las imágenes previamente
  for (let i = 1; i <= 13; i++) {
    imgs[i] = loadImage('frag/' + nf(i, 2) + '.JPG'); // nf() agrega ceros a la izquierda si es necesario
  }
}

function setup() {
  createCanvas(document.body.clientWidth, 500, WEBGL);
  angleMode(DEGREES);
  blendMode(MULTIPLY);
  for (let i = 1; i <= 13; i++) {
    image(imgs[i], 0, 0);
  }

  newDrawing();
}

function keyTyped() {
  newDrawing();
}
function mouseClicked() {
  newDrawing();
}

function newDrawing() {
  // We create a grid here
  let num_cols = floor(random(4, 18));
  let num_rows = floor(random(2, 10));
  let border = floor(random(random(width/20), random(width/8)));
  let col_size = (width - border) / num_cols;
  let row_size = (height - border) / num_rows;

  // We define the brushes for the hatches, and the brushes for the strokes
  let hatch_brushes = ["marker", "marker2"];
  let stroke_brushes = ["2H", "HB", "rotring"];

  // Test Different Flowfields here: "zigzag", "seabed", "curved", "truncated"
  brush.field("truncated");
  // You can also disable field completely with brush.noField()

  background("#fbfaf6");
  push();
  translate(-width / 2, -height / 2);

  // We create the grid here
  for (let i = 0; i < num_rows; i++) {
    for (let j = 0; j < num_cols; j++) {

      let img = random(imgs);
      let x = border / 2 + col_size * j;
      let y = border / 2 + row_size * i;
      if(img != null){

        push();
        translate(x, y);
        stamp(img, -col_size/2, -row_size/2, col_size, row_size);
        pop();
        /*

        push();
        translate(border / 2 + col_size * j, border / 2 + row_size * i);
        beginShape();
        texture(img);
        vertex(0, 0, 0, 0);
        vertex(col_size, 0, img.width/2, 0);
        vertex(col_size, row_size, img.width/2, img.height/2);
        vertex(0, row_size, 0, img.height/2);
        endShape(CLOSE);
        pop();

        */
      }
      
      // We fill 15% of the cells
      if (random() < 0.25) {
        // Set Fill
        brush.fill(random(palette), random(60, 100));
        brush.bleed(random(0.1, 0.4));
        brush.fillTexture(0.55, 0.9);

      }

      // We stroke + hatch the remaining
      else {
        // Set Stroke
        brush.set(random(stroke_brushes), random(palette));

        // Set Hatch
        // You set color and brush with .setHatch(brush_name, color)
        brush.setHatch(random(hatch_brushes), random(palette));
        // You set hatch params with .hatch(distance_between_lines, angle, options: see reference)
        brush.hatch(random(5, 40), random(0, 180), {
          rand: 0,
          continuous: false,
          gradient: false,
        });
      }

      // We draw the rectangular grid here
      brush.rect(
        border / 2 + col_size * j,
        border / 2 + row_size * i,
        col_size,
        row_size
      );

      // Reset states for next cell
      brush.noStroke();
      brush.noFill();
      brush.noHatch();
    }
  }
  pop();
}

function windowResized(){
  resizeCanvas(document.body.clientWidth, 500, WEBGL);
  newDrawing();
}

function stamp(img, x, y, w, h){
  let rot = HALF_PI * floor(random(4));
  push();
  translate(x,y);
  rotate(rot);
  image(img, -w/2, -h/2, w, h);
  pop();
}