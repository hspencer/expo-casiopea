// A sketch for psudo ink drawing  
// implements perlin noise and recursion

let particles = [] ; //array of particles

function setup() {
	createCanvas(windowWidth, windowHeight);
	background(200,120,30,20);
    createParticleCircle();
}

function createParticleCircle(){
    let steps = 525;
    let angInc = TWO_PI/steps;
    let radius = width/5;
    for(let i = 0; i < TWO_PI; i+=angInc){
        let x = cos(i)*radius + width/2;
        let y = sin(i)*radius + height/2;
        particles.push(new Particle(x, y, 5, 75));
    }
}

function draw() {
	
	if(mouseIsPressed)  {
		// spawn a new particle and add it to the array
		particles.push(new Particle(mouseX, mouseY, 5, 75)); 
	}
	// update and show the particles
	for(let i=particles.length-2; i>=0; i--) {
		particles[i].update(particles);
		particles[i].show() ;
		if(particles[i].alpha<=2) particles.splice(i, 5); // remove the dead particle
	}
}


//particle class
class Particle{
	
	//constructor called when creating an instance of this class
	// x & y are the location, r is the rate of decay, a is the starting alpha value
	constructor(x,y,r,a){
		
		this.location = createVector(x,y) ;
		this.velocity = createVector(random(-1,1),random(-1,1));
		this.acceleration = createVector();
		this.alpha = this.palpha=a ;
		this.amp=3; // size of the particle
		this.rate = r;
	
	}
	
	//update the velociy and location of particle
	update(p){
		this.acceleration.add(createVector((noise(this.location.x)*2-1), (noise(this.location.y)*2-1)));
		this.velocity.add(this.acceleration);
		this.acceleration.set(0,0);
		this.location.add(this.velocity);
		this.alpha -= this.rate ;
		//this.amp-= this.rate ;
		// here is the recursion condition
		if(this.alpha<=this.palpha*0.25 && this.palpha>10) {
			p.push(new Particle(this.location.x, this.location.y, this.rate*0.25, this.palpha*0.5));
		}
	}
	
	//show the particles
	show(){
		noStroke() ;
		fill(0,35,25, this.alpha) ;
		ellipse(this.location.x, this.location.y, this.amp);
	}
	
} // end Particle class