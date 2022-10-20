let str = "hallazgo ajeno descubrimientos oh marinos sus pájaras salvajes mar incierto gentes desnudas entre sus dioses! porquedon mostrarse equivoca esperanza? no dejó así primera pasión oro navegante ciego esa claridad sin nombre tarde premia destruye apariencia? ¿y día ni noche tercera jornada no llegó isla suavemente sin violentar engaños queaire humano recibiera sus orillas? también nosotros destino despierte mansamente desde aquella gratuidad yerro abren todavía grandes ríos crueles anchas complacencias montañas solas lluvias árboles difíciles dejando frutos casa abandonada";
let str_arr = [];

let font;
let sdgreg;

function preload() {
  font = loadFont("../data/Alegreya_Sans/AlegreyaSans-Thin.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  let strs = str.split(" ");
  for (let i = 0; i < strs.length*20; i++) {
    let x = random(-width / 2, width / 2);
    let y = random(-height / 2, height / 2);
    let z = random(-width*5, width/2);
    str_arr.push(new Type(strs[i%strs.length], x, y, z));
  }
}

function draw() {
  background(255);
	orbitControl();
  for (let i = 0; i < str_arr.length; i++) {
    str_arr[i].update();
    str_arr[i].display();
  }
}

class Type {
  constructor(_str, _x, _y, _z) {
    this.str = _str;
    this.x = _x;
    this.y = _y;
    this.z = _z;
  }

  update() {
    this.z += 2;
    if(this.z > width/2){
    	this.z = -width*5;
    }
  }

  display() {
    push();
    translate(this.x, this.y, this.z);
    textAlign(CENTER, CENTER);
    textFont(font);
    textSize(80);
    fill(0, 200);
    text(this.str, 0, 0);
    pop();
  }
}