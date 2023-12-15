let o;
let num;
let palette;

function setup() {
  createCanvas(400, 400);
  shuffle(colorScheme, true); // randomize order from colorScheme
  palette = colorScheme[0]; // pick first

  num = 222;
  let j = 15; // rango de descalce del centro
  o = [];
  const v = -0.5; // velocidad constante de las órbitas
  for(let i = 0; i < num; i++){
    let r = skewedRandom(10, 180, 0.59);
    let s = v / r;
    o.push(new Orbit(width/2 + random(-j, j), height/2 + random(-j, j), r, random(TWO_PI), s))
  }
}

function skewedRandom(min, max, skew) {
  let range = max - min;
  let rand = pow(random(), skew); // Usar la función de potencia para sesgar la distribución
  return min + rand * range;
}

function draw() {
  background("#fffceb");
  // translate(-width/2, -height/2);
 
  // let the orbits go
  for(let orbit of o){
    orbit.update();
  }
  
  // draw connecting lines
  let connectDist = 32;
   for (let i = 0; i < o.length; i++) {
    for (let j = o.length - 1; j > i; j--) {
      let d = dist(o[i].px, o[i].py, o[j].px, o[j].py);
      if (d < connectDist) {

         let alfa = map(d, 0, connectDist, 130, 0);
         //let sw = map(d, 0, connectDist, 9, 2);
         alfa = constrain(alfa, 0, 255);
         let c = color(o[i].colHex);
         c.setAlpha(alfa);
        strokeWeight(8);
        stroke(c);
        line(o[i].px, o[i].py, o[j].px, o[j].py);
      }
    }
  }
}

class Orbit{
  constructor(x, y, r, a, s){
    this.a = a;
    this.x = x;
    this.y = y;
    this.s = s;
    this.r = r;
    this.px = x;
    this.py = y;
    this.colHex = random(palette.colors);
    this.col = color(this.colHex);
  }
  
  draw(){
    circle(this.px, this.py, 3);
  }
  
  update(){
    this.a += this.s;
    this.px = this.x + cos(this.a) * this.r;
    this.py = this.y + sin(this.a) * this.r;
  }
  
  go(){
    this.update();
    this.draw();
  }
}

/* 
colorScheme stolen from https://openprocessing.org/sketch/2125892/
by Takawo
*/

let colorScheme = [
  {
    name: "Benedictus",
    colors: ["#F27EA9", "#366CD9", "#5EADF2", "#636E73", "#F2E6D8"],
  },
  {
    name: "Cross",
    colors: ["#D962AF", "#58A6A6", "#8AA66F", "#F29F05", "#F26D6D"],
  },
  {
    name: "Demuth",
    colors: ["#222940", "#D98E04", "#F2A950", "#BF3E21", "#F2F2F2"],
  },
  {
    name: "Hiroshige",
    colors: ["#1B618C", "#55CCD9", "#F2BC57", "#F2DAAC", "#F24949"],
  },
  {
    name: "Hokusai",
    colors: ["#074A59", "#F2C166", "#F28241", "#F26B5E", "#F2F2F2"],
  },
  {
    name: "Hokusai Blue",
    colors: ["#023059", "#459DBF", "#87BF60", "#D9D16A", "#F2F2F2"],
  },
  {
    name: "Java",
    colors: ["#632973", "#02734A", "#F25C05", "#F29188", "#F2E0DF"],
  },
  {
    name: "Kandinsky",
    colors: ["#8D95A6", "#0A7360", "#F28705", "#D98825", "#F2F2F2"],
  },
  {
    name: "Monet",
    colors: ["#4146A6", "#063573", "#5EC8F2", "#8C4E03", "#D98A29"],
  },
  {
    name: "Nizami",
    colors: ["#034AA6", "#72B6F2", "#73BFB1", "#F2A30F", "#F26F63"],
  },
  {
    name: "Renoir",
    colors: ["#303E8C", "#F2AE2E", "#F28705", "#D91414", "#F2F2F2"],
  },
  {
    name: "VanGogh",
    colors: ["#424D8C", "#84A9BF", "#C1D9CE", "#F2B705", "#F25C05"],
  },
  {
    name: "Mono",
    colors: ["#D9D7D8", "#3B5159", "#5D848C", "#7CA2A6", "#262321"],
  },
  {
    name: "RiverSide",
    colors: ["#906FA6", "#025951", "#252625", "#D99191", "#F2F2F2"],
  },
];
