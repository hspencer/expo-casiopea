/**
 * differential growth
 */

let curves;
let rad = 8;
let spd = 0.05;

function setup() {
	createCanvas(windowWidth, windowHeight);
	background(255);
	stroke(0, 20);
	curves = [];
	frameCount = 0;
    textAlign(CENTER);
    fill(0);
    textFont('Alegreya Sans', 28);
    text("Crecimiento Diferencial", width/2, height/2);
    textFont('Alegreya Sans', 16);
    text("dibuja en cualquier parte", width/2, height/2 + 22);
	textFont('Alegreya Sans', 16);
    text("(ESPACIO para reiniciar)", width/2, height/2 + 44);
    noFill();
}

function mousePressed() {
	let mousePos = new p5.Vector(mouseX,mouseY);
	curves.push([mousePos]);
}

function mouseDragged() {
	if(curves.length > 0) {
		let mousePos = new p5.Vector(mouseX,mouseY);
		let lastPos = curves[curves.length-1][curves[curves.length-1].length-1];
		if(p5.Vector.sub(mousePos,lastPos).mag() > 2) {
			curves[curves.length-1].push(mousePos);
		}
	}
}

function draw() {
	if(frameCount > 200){background(255, 15);}
	if(curves.length >= 1 && !mouseIsPressed) {
		for(var i1=0; i1<curves.length; ++i1) {
			for(var j1=0; j1<curves[i1].length; ++j1) {
				for(var i2=0; i2<curves.length; ++i2) {
					for(var j2=0; j2<curves[i2].length; ++j2) {
						if(p5.Vector.sub(curves[i1][j1],curves[i2][j2]).mag() < 2*rad) {
							curves[i1][j1] = curves[i1][j1].add(p5.Vector.sub(curves[i1][j1],curves[i2][j2]).setMag((2*rad-p5.Vector.dist(curves[i1][j1],curves[i2][j2]))*spd));
							// break;
						}
					}
				}
			}
		}
		
		for(var i1=0; i1<curves.length; ++i1) {
			for(var j1=1; j1<curves[i1].length; ++j1) {
				if(p5.Vector.sub(curves[i1][j1],curves[i1][j1-1]).mag() > 2*rad) {
					curves[i1].splice(j1,0,p5.Vector.add(curves[i1][j1],curves[i1][j1-1]).mult(0.5));
					// break;
				}
			}
		}
		
	}
	
	if(curves.length >= 1) {
		for(var i=0; i<curves.length; ++i) {
			beginShape();
			for(var j=0; j<curves[i].length; ++j) {
				curveVertex(curves[i][j].x,curves[i][j].y);
			}
			endShape();
		}
	}
}

function windowResized(){
    setup();
}

function keyTyped(){
	if(key=== ' ' || key ==='x' || key === 'X'){
		setup();
	}
}