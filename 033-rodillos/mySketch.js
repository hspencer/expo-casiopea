 // by SamuelYAN
 // more works //
 // https://twitter.com/SamuelAnn0924
 // https://www.instagram.com/samuel_yan_1990/

 // GENUARY 2023
 // JAN. 19 (credit: Lionel Radisson)
 // Black and white

 var films;
 let seed = Math.random() * 397;
 var mySize;
 let str_wei = 0;
 // let x_space;

 // colors
 let colors_b = "281914-1a1a1a-202020-242e30".split("-").map((a) => "#" + a);
 let colors_w = "fef9fb-fafdff-ffffff-fcfbf4-f9f8f6".split("-").map((a) => "#" + a);

 let colorselet = [];
 let plus, margin;
 let filter1;

 function setup() {
 	// pixelDensity(5);
 	// randomSeed(seed);
 	mySize = min(windowWidth, windowHeight);
 	createCanvas(windowWidth, windowHeight);//mySize, mySize);
 	colorselet[0] = random(colors_b);
 	colorselet[1] = random(colors_w);
 	colorselet[2] = random(colors_b);
 	colorselet[3] = random(colors_w);
 	background(random(colorselet));
 	margin = mySize / 100;
 	films = int(random(30, 60));//10, 20));
 	plus = 0;
 	filter1 = new makeFilter();
 }

 function draw() {
 	randomSeed(seed);
 	noFill();
 	for (let i = 0; i < films; i++) {
 		strokeWeight(str_wei);
 		stroke(random(colorselet));
 		if (films % 3 == 0) {
 			drawingContext.shadowColor = str(random(colors_b)) + "1a";
 			drawingContext.shadowOffsetX = str_wei;
 			drawingContext.shadowOffsetY = str_wei;
 			drawingContext.shadowBlur = 0;
 		} else {
 			drawingContext.shadowColor = str(random(colors_w)) + "1a";
 			drawingContext.shadowOffsetX = str_wei;
 			drawingContext.shadowOffsetY = str_wei;
 			drawingContext.shadowBlur = 0;
 		}

 		// by SamuelYAN
 		// more works //
 		// https://twitter.com/SamuelAnn0924
 		// https://www.instagram.com/samuel_yan_1990/

 		let y = random(height * 0.1, height * 0.9);
 		drawingContext.setLineDash([1, int(random(48, 24)), 3, int(random(24, 48)), 4, int(random(44, 22)), 2]);
 		ellipse(width * random(0.15, 0.85) + mySize / 2 * sin(0.7 * sin(0.5 * plus - 0.5) - 0.5), y - random(4, 10) * sin(random(1, 0.5) * plus), 0.00, random(mySize / 20, mySize / 2));
 		ellipse(width * random(0.85, 0.15) - mySize / 2 * sin(0.75 * sin(0.7 * plus - 0.5) - 0.25), y - random(10, 4) * cos(random(0.5, 1) * plus), 0.00, random(mySize / 2, mySize / 20));
 	}
 	if (str_wei < 0.5) {
 		str_wei += 0.1;
 	}

 	if (plus * random(35, 50) < 1 * mySize / random(3, 4)) {
 		plus += 0.01;
 		if (plus * random(20, 50) < random(0.25, 0.5) * mySize / 3) {
 			image(overAllTexture, 0, 0);
 		}
 	} else {
 		drawingContext.shadowColor = str(random(colors_w)) + "00";
 		drawingContext.shadowOffsetX = 0;
 		drawingContext.shadowOffsetY = 0;
 		drawingContext.shadowBlur = 0;

 		//frame
 		noLoop();
 		blendMode(BLEND);
 		image(overAllTexture, 0, 0);
 		drawingContext.setLineDash([]);

 		noFill();
 		strokeWeight(margin);
    /*
 		rectMode(CORNER);
 		stroke("#202020");

 		rect(0, 0, width, height);
		*/
 	}
 }

 // by SamuelYAN
 // more works //
 // https://twitter.com/SamuelAnn0924
 // https://www.instagram.com/samuel_yan_1990/