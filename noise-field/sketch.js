let img, p, zoom, speed, msk;

function preload(){
  img = loadImage("https://upload.wikimedia.org/wikipedia/commons/c/c9/Montagne_Sainte-Victoire%2C_par_Paul_C%C3%A9zanne_108.jpg");
}

function setup() {
  createCanvas(windowWidth, round(img.height/3));
  zoom = 300;
  speed = 0;
  p = [];
  
  msk = createGraphics(20, 20);
  msk.noStroke();
  msk.fill(0);
  msk.ellipseMode(CENTER);
  msk.ellipse(10, 10, 10, 10);
  msk.filter(BLUR, 4.5);
  
  for(let i = 0; i < 40; i++){
    createPoints();
  }
  
}

function createPoints(){
  let xStart = width/2 - img.width/6;
  let xEnd = xStart + img.width/3;
  
  let y1 = random(10, height-200);
  let y2 = y1+random(80, 200);
  
  let x1 = random(xStart+10, xEnd-10);
  let x2 = x1+random(10, 20);
  
  for(let i = 0; i < 48; i++){
    particle = new Particle(random(x1, x2), random(y1, y2));
    
    let ix = map(particle.x, xStart, xEnd, 0, img.width);
    let D = img.get(ix - 5, particle.y*3 - 5, 20, 20);
    D.mask(msk);
    particle.img = D;
    p.push(particle);
  }
}

function draw() {
  blendMode(BLEND);
  for(let particle of p){
    particle.go();
  }
  speed += 0.01;
  /*
  noStroke();
  blendMode(ADD);
  fill(200, 1);
  rect(0, 0, width, height);
  */
}

class Particle{
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.c = color(0, 90);
    this.w = random(1, 4);
    this.img = createImage(10, 10);
    this.sc = random(0.5, .9);
  }0
  
  go(){
    let n = noise(this.x/zoom, this.y/zoom, speed);
    let a = map(n, .2, .8, 0, TWO_PI);
    
    this.x += cos(a) * .21;
    this.y += sin(a) * .21;
    
    if(this.x < 0){this.x += width;}
    if(this.y < 0){this.y += height;}
    if(this.x > width){this.x -= width;}
    if(this.y > height){this.y -= height;}
    
    push();
    translate(this.x, this.y);
    scale(this.sc);
    rotate(a);
    
    imageMode(CENTER);
    image(this.img, 0, 0);
    pop();
  }
}