let str = "¿no fue el hallazgo ajeno a los descubrimientos oh marinos sus pájaras salvajes el mar incierto las gentes desnudas entre sus dioses! porque el don para mostrarse equivoca la esperanza? no dejó así la primera pasión del oro al navegante ciego por esa claridad sin nombre con que la tarde premia y destruye la apariencia? ¿y ni día ni noche la tercera jornada no llegó como una isla y suavemente sin violentar engaños para que el aire humano recibiera sus orillas? que también para nosotros el destino despierte mansamente desde aquella gratuidad del yerro se abren todavía los grandes ríos crueles de anchas complacencias las montañas solas sobre las lluvias los árboles difíciles dejando frutos en la casa abandonada";
let str_arr = [];

let font;
let sdgreg;

function preload() {
  font = loadFont("../data/Alegreya_Sans/AlegreyaSans-Thin.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  let strs = str.split(" ");
  for (let i = 0; i < strs.length*20; i++) {
    let x = random(-width / 2, width / 2);
    let y = random(-height / 2, height / 2);
    let z = random(-width*5, width/2);
    str_arr.push(new Type(strs[i%strs.length], x, y, z));
  }
}

function draw() {
  background(0,0,100);
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
    textSize(100);
		fill(0,0,0);
    text(this.str, 0, 0);
    pop();
  }
}