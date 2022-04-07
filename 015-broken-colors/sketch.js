let _minWidth;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  setAttributes("alpha", false);
  colorMode(HSB, 360, 100, 100, 255);
  setObject();
}

let _aryRectXy = [];
let _aryShift = [];
let _numRect;
let _palette;
let _aryColDirection = [];

function setObject() {
  _minWidth = min(width, height) * 0.8;//1.4;//0.75;
  noStroke();
  _numRect = 5;//3;
	_palette = ["#F73B12", "#F88E13", "#E3C725", "#1DB4DF", "#e6e8ea", "#d4d4d4"];
  shuffle(_palette, true);
  let topRatio = [0, 1];
  let bottomRatio = [0, 1];
  for (let i = 0; i < _numRect - 1; i++) {
    topRatio.push(random());
    bottomRatio.push(random());
  }
  topRatio.sort(function(a, b) {
    return a - b;
  });
  bottomRatio.sort(function(a, b) {
    return a - b;
  });
  let rectTopW = _minWidth;//width;//_minWidth;
  let rectBottomW = _minWidth;//width;//_minWidth;
  let rectH = _minWidth / 1.5;//height;//_minWidth;
  let centX = 0;
  let centY = 0;

  _aryRectXy = [];
  _aryShift = [];
  _aryColDirection = [];
  for (let i = 0; i < _numRect; i++) {
    let xy1 = createVector(centX - rectTopW/2 + rectTopW * topRatio[i], centY - rectH/2);
    let xy2 = createVector(centX - rectTopW/2 + rectTopW * topRatio[i+1], centY - rectH/2);
    let xy3 = createVector(centX - rectBottomW/2 + rectBottomW * bottomRatio[i+1], centY + rectH/2);
    let xy4 = createVector(centX - rectBottomW/2 + rectBottomW * bottomRatio[i], centY + rectH/2);
    _aryRectXy[i] = [xy1, xy2, xy3, xy4];
    _aryShift[i] = [_minWidth / 10, random(1000), random(2*PI / 360, 2*PI / 120)];//[shift length, init shift phase, shift speed]
    if (i % 2 == 0) {
      _aryColDirection[i] = "down";
    } else {
      _aryColDirection[i] = "up";
    }
  }
}

function drawBg() {
  beginShape();
  fill(0);
  vertex(-width/2, -height/2);
  vertex(width/2, -height/2);
  fill(100);
  vertex(width/2, height/2);
  vertex(-width/2, height/2);
  endShape();
}

class GridArea {
  constructor(xyTopLeft, xyTopRight, xyBottomRight, xyBottomLeft, numGridX, numGridY, colCode, colDirection) {
    this.xyTopLeft =xyTopLeft;
    this.xyTopRight = xyTopRight;
    this.xyBottomRight = xyBottomRight;
    this.xyBottomLeft = xyBottomLeft;
    this.numGridX = numGridX;
    this.numGridY = numGridY;
    this.aryGridXy = [];
    for (let xi = 0; xi < numGridX + 1; xi++) {
      this.aryGridXy[xi] = [];
      for (let yi = 0; yi < numGridY + 1; yi++) {
        let xyTop = p5.Vector.lerp(xyTopLeft, xyTopRight, xi / numGridX);
        let xyBottom = p5.Vector.lerp(xyBottomLeft, xyBottomRight, xi / numGridX);
        let xy = p5.Vector.lerp(xyTop, xyBottom, yi / numGridY);
        this.aryGridXy[xi][yi] = xy;
      }
    }

    let maxRecursion = 9;//7;
    let clearance = 1;//8;//20;
    this.gridRect = new GridRect(0, 0, numGridX, numGridY, maxRecursion, 0, clearance, colDirection, colCode);
  }

  draw() {
    this.gridRect.draw(this.aryGridXy);
  }
}

class GridRect {
  constructor(startXi, startYi, endXi, endYi, maxRecursion, countRecursion, clearance, colDirection, colCode) {
    this.startXi = startXi;
    this.startYi = startYi;
    this.endXi = endXi;
    this.endYi = endYi;
    this.maxRecursion = maxRecursion;
    this.countRecursion = countRecursion;
    this.clearance = clearance; 
    this.subRects = [];
    this.colCode = colCode;
    this.col1 = color(this.colCode);
    this.col2 = color(this.colCode);
    this.col2.setAlpha(0);
    this.colDirection = colDirection; //"up" "down" "right" "left"
  }

  draw(aryGridXy) {
    if (this.subRects.length == 0) {
      let limitGridXi = 10000;
      let limitGridYi = 10000;
      let lengthXi = this.endXi - this.startXi;
      let lengthYi = this.endYi - this.startYi;
      if (lengthXi <= limitGridXi
        || lengthYi <= limitGridYi) {

        push();
        beginShape();
        if (this.colDirection == "up") {
          fill(this.col1);
          vertex(aryGridXy[this.endXi][this.endYi].x, aryGridXy[this.endXi][this.endYi].y);
          vertex(aryGridXy[this.startXi][this.endYi].x, aryGridXy[this.startXi][this.endYi].y);
          fill(this.col2);
          vertex(aryGridXy[this.startXi][this.startYi].x, aryGridXy[this.startXi][this.startYi].y);
          vertex(aryGridXy[this.endXi][this.startYi].x, aryGridXy[this.endXi][this.startYi].y);
        } else if (this.colDirection == "down") {
          fill(this.col1);
          vertex(aryGridXy[this.startXi][this.startYi].x, aryGridXy[this.startXi][this.startYi].y);
          vertex(aryGridXy[this.endXi][this.startYi].x, aryGridXy[this.endXi][this.startYi].y);
          fill(this.col2);
          vertex(aryGridXy[this.endXi][this.endYi].x, aryGridXy[this.endXi][this.endYi].y);
          vertex(aryGridXy[this.startXi][this.endYi].x, aryGridXy[this.startXi][this.endYi].y);
        }
        endShape();
        pop();
      }
    }
  }
}

function draw() {
  background(100);
  rotate(-PI/2);

  let aryShiftXy = [];
  aryShiftXy[0] = createVector(0, 0);
  let thisAryRectXy = [];
  for (let i = 0; i < _numRect; i++) {
    let shiftValue = _aryShift[i][0] * cos(_aryShift[i][1] + _aryShift[i][2] * frameCount);
    let shiftXy = p5.Vector.sub(_aryRectXy[i][2], _aryRectXy[i][1]).normalize().setMag(shiftValue);
    aryShiftXy[i + 1] = p5.Vector.add(aryShiftXy[i], shiftXy);
    thisAryRectXy[i] = [];
    for (let j = 0; j < 4; j++) {
      thisAryRectXy[i][j] = p5.Vector.add(_aryRectXy[i][j], aryShiftXy[i]);
    }
  }

  let numGridX = 2;//200;
  let numGridY = 2;//800;
  
  for (let i = 0; i < _numRect; i++) {
    let xy1 = thisAryRectXy[i][0];
    let xy2 = thisAryRectXy[i][1];
    let xy3 = thisAryRectXy[i][2];
    let xy4 = thisAryRectXy[i][3];
    let colCode = "" + _palette[i % _palette.length];
    let grid = new GridArea(xy1, xy2, xy3, xy4, numGridX, numGridY, colCode, _aryColDirection[i]);
    grid.draw();
  }
}

function mouseClicked(){
  setup();
}