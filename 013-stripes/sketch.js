let h, num;

let range;

function setup() {
  createCanvas(windowWidth, windowHeight);
  h = [];
  num = 4;
  let yInc = height/(num - 1);
  let y1, y2;
  y1 = 0;
  y2 = yInc;
  for(let i = 0; i < num; i++){
    h[i] = new Hal(y1, y2, 0);
    y1 = y2;
    y2 += yInc;
  }

  background(255);
  range = 0.5;
  mouseX = width/2;
}

function draw() {
  for(let i = 0; i < h.length; i++){
    h[i].draw();
  }
  range = mouseX/width;
}

class Hal{
  constructor(y1, y2, tam){
    this.y1 = y1;
    this.y2 = y2;
    this.tam = tam;
    this.seed = round(random(9999999));
    this.zoom = random(200, 1200); 
    this.x1 = 0;
    this.x2 = 0;
  }
  
  run(){
    noiseSeed(this.seed);
    this.x1 += noise(millis()/this.zoom);
    this.x2 += noise((millis()+this.seed)/this.zoom);
    
    if(this.x1 > width || this.x2 > width){
      this.x1 = this.x2 = 0;
      noStroke();
      fill(255, 100);
      rectMode(CORNERS);
      rect(0, this.y1, width, this.y2);
    }
  }
  
  draw(){
    this.run();
    stroke(0, 20);
    noFill();
    
    //line(this.x1, this.y1, this.x2, this.y2);
    
    bezier(this.x1, this.y1, 
           this.x1, lerp(this.y1, this.y2, range), 
           this.x2, lerp(this.y1, this.y2, 1-range), 
           this.x2, this.y2);
           
  }
}