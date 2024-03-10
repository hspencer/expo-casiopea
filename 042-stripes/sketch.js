/** Stripes */

let container, canvas;

function setup() {
  container = document.getElementById("container");
  canvas = createCanvas(container.offsetWidth, 500);
  canvas.parent(container);
  noStroke();
  fill(0);
}

function draw() {
  clear();
  let h = 10;
  let f = true;
  for (let y = 0; y < height; y += h + h/2) {
    let s = (sin(millis()/2000 + y/200) + 1) * width/8 + h;
    /*
    for (let x = 0; x < width; x+= 2*s) {
     rect(x, y, s, h, h/2);
    }
    */
   for(let x = 0; x < 120; x++){
    f = !f;

    if(f){fill(0)}else{noFill()}
    rect(width/2 + s*(x+1), y, s, h, h/2);
    
   
    if(f){fill(0)}else{noFill()}
    rect(width/2 - s*(x-1), y, s, h, h/2);

 
   }

   f = !f;
  }
}

