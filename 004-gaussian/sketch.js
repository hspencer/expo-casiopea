const DRAG = 0.176;
let spinners;

let pal = [ 
	"#f2c90002",
	"#21e1ff02",
	"#b7270b02",
	"#522ac102",
	"#ff6e0002",
	"#0083ff02"
];
	
function col(){
	return i = pal[Math.floor(Math.random()*pal.length)];
}

function setup(){
  spinners = [];
  createCanvas(windowWidth, windowHeight);

  let num1 = 7;
  let num2 = 7;
  for(let i = 0; i < num1; i++){
		let x = randomGaussian(width/2, width/10);
		let y = randomGaussian(height/2, width/10); 
		for (let j = 0; j < num2; j++){
			let r = random(5, 300);
			let speed = random(-1/r, 1/r);
			let s = new Spinner(x, y, r, speed);
			spinners.push(s);
		}
	}
}

function draw(){
	blendMode(BLEND);
	for(let i = 0; i < spinners.length; i++){
		spinners[i].draw();
	}

	if(frameCount % 1000 == 0){
		for(let i = 0; i < spinners.length; i++){
			for(let j = 0; j < i; j++){
				let d = dist(spinners[i].x, spinners[i].y, spinners[j].x, spinners[j].y);
				d = constrain(d, 0, 1000);
				if( d < width/4 && d > 1){
					stroke(0, 100);
					strokeWeight(1);
					line(spinners[i].x, spinners[i].y,spinners[j].x, spinners[j].y);
				}
			}
		}
	}

	blendMode(ADD);
	noStroke();
	fill(255, 1);
	rect(0, 0, width, height);
}

class Spinner{

	constructor(x, y, r, speed){
		this.x = x;
		this.y = y;
		this.r = r;
		this.s = speed;
		this.a = random(TWO_PI);
		this.c = col();
		this.w = map(r, 5, 100, 1, 35);
	}

	draw(){
		strokeWeight(this.w);
		stroke(this.c);

		push();
		translate(this.x, this.y);
		let x = cos(this.a) * this.r * sin(this.a*2.5);
		let y = sin(this.a) * this.r * cos(this.a*2);;
		point(x,y);
		this.a += this.s;
		pop();

		if(mouseIsPressed){
			this.follow(mouseX, mouseY);
		}
	}

	follow(x, y){
		let difx = x - this.x;
		let dify = y - this.y;

		this.x += difx * DRAG * 1/this.r;
		this.y += dify * DRAG * 1/this.r;
	}
}