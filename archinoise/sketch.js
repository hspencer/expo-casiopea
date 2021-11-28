const points=[]
const n=3
let   t=0

setup=_=>{
  createCanvas(w=windowWidth,windowHeight)
  for(i=0;i<w*n;i++){
		points[i]=createVector(random(width),random(height))  // Create all the points
	}
  background(255) // My god this color has some deep dark feelings    Mama Mia !
}

draw=_=>{
  for(let p of points){ // For all the points
		
    let n=noise(p.x*0.01,p.y*0.01)*TWO_PI
    
		m=3
		a=TWO_PI/m
    b=round(n/TWO_PI*m)
    n=a*b
    
		p.add(cos(n),sin(n))
    
    stroke(0,t)
		
		lx=width/64;ly=height/32
		px=constrain(p.x, lx, width-lx);py=constrain(p.y, ly, height-ly)
		
		point(px,py)
  }
  t++;
}

function mousePressed(){
	t = 0;
	setup();
}