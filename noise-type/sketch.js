letter = "faltan palabras para la forma de nombrar la andada - ";
let pos;
let font;
let margin = 20;

/*
function preload(){
	font = loadFont("CutiveMono-Regular.ttf");
}
*/

function setup(){
  
	pos = [];
	createCanvas(600, 600);//windowWidth, windowHeight);
	smooth();
	noLoop();
	textFont("Courier", 12);
	textAlign(CENTER, CENTER);
	let c = 50;
	let w = height / c;
	for (let i = 0; i < c-margin/6; i+=1.2) {
		for (let j = 0; j < c-margin/6; j+=1) {
			let x = margin + j * w;
			let y = margin + i * w;
			let arr = [x, y, w];
			pos.push(arr);
		}
	}
	
}
function draw(){
	background(255);
	let num = 0;
	fill(0);
	noStroke();
	for (let i = 0; i < pos.length; i++) {
		let x = pos[i][0];
		let y = pos[i][1];
		let s = pos[i][2];
		let size = map(noise(x * 0.005, y * 0.005), 0, 1, -s * 0.5, s * 3);
		textSize(size);
		text(letter[num], x, y);
		num ++;
		if(num >= letter.length){
			num = 0;
		}
	}
}

function mousePressed(){
	draw();
	noiseSeed(round(random(99999)));
}