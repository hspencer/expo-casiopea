//////////////////////////////////////////////////
// Object for creation and real-time resize of canvas
// Good function to create canvas and resize functions. I use this in all examples.
const C = {
  loaded: false,
  prop() {
    return this.height / this.width;
  },
  isLandscape() {
    return window.innerHeight <= window.innerWidth * this.prop();
  },
  resize() {
    if (this.isLandscape()) {
      console.log("yes");
      document.getElementById(this.css).style.height = "100%";
      document.getElementById(this.css).style.removeProperty("width");
    } else {
      document.getElementById(this.css).style.removeProperty("height");
      document.getElementById(this.css).style.width = "100%";
    }
  },
  setSize(w, h, p, css) {
    (this.width = w), (this.height = h), (this.pD = p), (this.css = css);
  },
  createCanvas() {
    (this.main = createCanvas(this.width, this.height, WEBGL)),
      pixelDensity(this.pD),
      this.main.id(this.css),
      this.resize();
  },
};
C.setSize(1500, 2000, 1, "mainCanvas");

function windowResized() {
  C.resize();
}

//////////////////////////////////////////////////
// The example really starts here

let palette = [
  "#7b4800",
  "#002185",
  "#003c32",
  "#fcd300",
  "#ff2702",
  "#6b9404",
];

function setup() {
  createCanvas(windowWidth, 500, WEBGL);
  angleMode(DEGREES);

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
  let border = floor(random(100, 380));
  let col_size = (width - border) / num_cols;
  let row_size = (height - border) / num_rows;

  // We define the brushes for the hatches, and the brushes for the strokes
  let hatch_brushes = ["marker", "marker2", "2B"];
  let stroke_brushes = ["2H", "HB", "cpencil"];

  // Test Different Flowfields here: "zigzag", "seabed", "curved", "truncated"
  brush.field("truncated");
  // You can also disable field completely with brush.noField()

  background("#fffceb");
  push();
  translate(-width / 2, -height / 2);

  // We create the grid here
  for (let i = 0; i < num_rows; i++) {
    for (let j = 0; j < num_cols; j++) {
      // We fill 10% of the cells
      if (random() < 0.1) {
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
        brush.hatch(random(10, 60), random(0, 180), {
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
