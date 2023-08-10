 // Scribbles

 // adaptado de https://openprocessing.org/sketch/1979157/ por SamuelYAN

let tiles = []
let TILE_SZ = 200
let colors = "000-000".split("-").map(a=>"#"+a)
let cnv
let overAllTexture
let showDebug = false
let dotDensity = 20
let maxDistortAmp = 0.2
let MAX_FREQ = 5
function easeInOutSine(x) {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}
function drawArcBetweenPoints(options) {
  const { g, p1, p2, radius } = options;

  // calculate the midpoint
  let midPoint = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};

  // calculate the distance between p1 and p2
  let distance = g.dist(p1.x, p1.y, p2.x, p2.y);
  
  // check if such a circle can exist
  if (distance / 2 > radius) {
    console.error('A circle of the given radius cannot be drawn between these two points.');
    return;
  }
  
  // calculate the distance from midpoint to the circle center
  let distanceToCenter = g.sqrt(radius * radius - (distance / 2) * (distance / 2));

  // calculate the direction from midpoint to p1
  let dir = {x: p1.x - midPoint.x, y: p1.y - midPoint.y};

  // normalize the direction
  let dirLength = g.dist(0, 0, dir.x, dir.y);
  dir.x /= dirLength;
  dir.y /= dirLength;

  // rotate the direction by 90 degrees (to get the direction from midpoint to the circle center)
  let dirRotated = {x: -dir.y, y: dir.x};

  // calculate the center of the circle
  let center = {x: midPoint.x + dirRotated.x * distanceToCenter, y: midPoint.y + dirRotated.y * distanceToCenter};

  // calculate the start and end angles
  let startAngle = g.atan2(p1.y - center.y, p1.x - center.x);
  let endAngle = g.atan2(p2.y - center.y, p2.x - center.x);

  // Make sure startAngle is less than endAngle
  if (startAngle > endAngle) {
    let temp = startAngle;
    startAngle = endAngle;
    endAngle = temp;
  }

  // draw the circle for debugging
	// g.push()
	// g.noFill();
	// g.drawingContext.setLineDash([5,5])
	// g.strokeWeight(1)
	// g.circle(center.x, center.y, radius * 2);
	// g.pop()
  
  // draw the arc
  g.arc(center.x, center.y, radius * 2, radius * 2, startAngle, endAngle);
}

function dotLine(p1, p2, graphic, numDots, jitterAmount =1) {
		// // Debug 
		// graphic.strokeWeight(4)
		// if (random()<0.5){
			// graphic.line(p1.x,p1.y,p2.x,p2.y)
		// }else{
		// 	drawArcBetweenPoints({p1,p2,g: graphic,radius: p1.dist(p2)*1})
		// }
		// return
	
		noiseSeed(random(10000))
		let freqMult = random(0.1,50)
		let noiseFreqs = [random(1,random(1,MAX_FREQ)),random(1,random(1,MAX_FREQ)),random(1,random(1,MAX_FREQ)),random(1,random(1,MAX_FREQ))]
    noiseFreqs.forEach(freq=>freq*=freqMult)
		// If numDots is not defined, set it as the distance from p1 to p2
    if (!numDots) {
        numDots = Math.round(dist(p1.x, p1.y, p2.x, p2.y))*dotDensity;
    }

    // Start drawing on the given p5 graphics
    graphic.beginShape();

		let distortAmp =random(random(0.5,maxDistortAmp))
		let distortSize = TILE_SZ
		let lastX,lastY
		
    for (let i = 0; i <= numDots; i++) {
        // Calculate the current position by interpolating between p1 and p2
        let t = i / numDots;
        let x = lerp(p1.x, p2.x, t) ;
        let y = lerp(p1.y, p2.y, t) ;
				let ratio = map(i,0,numDots,0,1)
				let distortRatio = ratio + ((ratio>=0.5 && ratio<=1)?map(ratio,0.5,1,0,-1):0)
				let easedDistortRatio = easeInOutSine(distortRatio)
				
				
				let lineType = 1
				let _x,_y
				if (lineType==0){
					_x = x+ map(noise(x/noiseFreqs[0],y/noiseFreqs[1]),0,1,-1,1)*easedDistortRatio*distortSize*distortAmp
					_y = y+ map(noise(x/noiseFreqs[2],y/noiseFreqs[3]),0,1,-1,1)*easedDistortRatio*distortSize*distortAmp
				}else if (lineType==1){
				  _x = x+ sin(x/noiseFreqs[0],y/noiseFreqs[1])*easedDistortRatio*distortSize*distortAmp
				  _y = y+ cos(x/noiseFreqs[2],y/noiseFreqs[3])*easedDistortRatio*distortSize*distortAmp
				}
			
				// if (i>0){
				graphic.curveVertex(_x,_y)
				// }
				// lastX = _x
				// lastY = _y
				// _x =lerp(_x,TILE_SZ/2,easedDistortRatio/3)
				// _y =lerp(_y,TILE_SZ/2,easedDistortRatio/3)

        // Draw a point at the current position 
				
				// let repeats = random(5);
				// 	for (let j = 0; j < repeats; j++) {
				// 		let _jitterAmount = random(jitterAmount)
				// 		graphic.strokeWeight(random(random(2.5)))
				// 			graphic.point(_x+ random(-1,1)*_jitterAmount, _y+ random(-1,1)*_jitterAmount);
						  
				// } 
    }
		// graphic.drawingContext.setLineDash([5,5])
		graphic.noFill()
    // End the shape
    graphic.endShape();
}
function getHexagonMidPoints(x, y, radius) {
	let points = []
	let _r = radius*sqrt(3)/2
  let angle = TWO_PI / 6;
	let deltaAngle = TWO_PI / 12;
  for (let a = 0; a < TWO_PI-angle; a += angle) {
    let sx = x + cos(a+deltaAngle) * _r;
    let sy = y + sin(a+deltaAngle) * _r;
    points.push(createVector(sx,sy))
  }
	return points
}

function hexagon(x, y, radius,graphics) {
  let angle = TWO_PI / 6;
  graphics.stroke("pink");
  graphics.beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    graphics.vertex(sx, sy);
  }
  graphics.endShape(CLOSE);
}
function setup() {
	pixelDensity(3);
	cnv = createCanvas(windowWidth - 20, 300);
	overAllTexture=createGraphics(width,height)
	overAllTexture.loadPixels()
	for(var i=0;i<width+5;i++){
		for(var o=0;o<height+5;o++){
			overAllTexture.set(i,o,color(120,noise(i/10,o/10)*random([0,0,0,0,10,20])))
		}
	}
	overAllTexture.updatePixels()
	background(0)
	colors.sort((a,b)=>random(-1,1))
	noLoop();
	let tileImgCount = width/TILE_SZ*height/TILE_SZ*2
	
	for(let i=0;i<tileImgCount;i++){
		//noprotect
		let tile = createGraphics(TILE_SZ,TILE_SZ)
		tile.push()
		// tile.background(colors[0])
		tile.noFill()
		tile.noStroke()
		tile.rect(0,0,TILE_SZ,TILE_SZ)
		let lWidth = TILE_SZ/3

		tile.stroke(0) 
		//grid
		showDebug && tile.rect(0,0,TILE_SZ,TILE_SZ)
		// tile.stroke(colors[i+1])
		
		 
		// tile.drawingContext.shadowBlur = 0
		// tile.drawingContext.shadowColor = color(0,30)

		let type = random([0,0,0,0,0,1,1,2,3])
		
		/////debug---
		tile.push()
			tile.noFill()
			tile.drawingContext.setLineDash([5,15])
		    hexagon(TILE_SZ/2,TILE_SZ/2,TILE_SZ/2,tile)
		tile.pop()
		
		// //show type
		// tile.push()
		// 	tile.fill(0)
		// 	tile.textSize(20)
		// 	tile.textAlign(CENTER)
		// 	 tile.text(type+"",TILE_SZ/2,TILE_SZ/2)
		// tile.pop()
		
		////---
		
		let shrinkRatio = random([random(0.3,0.9),1]) 
		let MIDPOINT = createVector(TILE_SZ/2,TILE_SZ/2)
		let originalHexR = TILE_SZ/2
		let hexR = originalHexR * shrinkRatio
		let orginalBoundaryPoints = getHexagonMidPoints(TILE_SZ/2,TILE_SZ/2,originalHexR)
		let orginalPoints = getHexagonMidPoints(TILE_SZ/2,TILE_SZ/2,hexR)
		if (shrinkRatio<1){
			for(let i=0;i<6;i++){
					dotLine(orginalBoundaryPoints[i],
									orginalPoints[i],
									tile
					) 
			}
		}
		// if (random()<0.5){
		// 	HEXR=TILE_SZ/4
			
		// }
		// points.sort((a,b)=>random()>0.5?-1:1)
		 
		// if (random()<0.2){
		// tile.fill(random(['red','blue']))
		// points.forEach( (p,pid)=>{
		// 	// tile.circle(p.x,p.y,20)
		// 	tile.textSize(20)
		// 	tile.text(pid,p.x,p.y)
		// })
		// }
		 
		
		//draw the lines
		for(let i=0;i<colors.length;i++){
		  type = random([0,0,0,0,0,1,1,2,3])
			points = orginalPoints.slice()
			tile.stroke(colors[i])
			
			if (type==0){
				points.sort((a,b)=>random()>0.5?-1:1)
				dotLine(points[0],
								points[1],
								tile
				 ) 
				dotLine(points[2],
								points[3],
								tile
				 ) 
				dotLine(points[4],
								points[5],
								tile
				) 
			}else if (type==1){
				if (random()<0.2){
					dotLine(points[0],
									points[3],
									tile
					 ) 
					dotLine(points[1],
									points[4],
									tile
					 ) 
					dotLine(points[2],
									points[5],
									tile
					) 
				}else{
					for(let i=0;i<6;i++){
						dotLine(MIDPOINT,
										points[i],
										tile
						) 
						
					}
				}
			}else if (type==2){
				points = points.concat(points).slice(int(random(points.length)))
				//double star
				dotLine(points[0],
								points[2],
								tile
				 ) 
				dotLine(points[0],
								points[4],
								tile
				 ) 
				// dotLine(points[2],
				// 				points[4],
				// 				tile
				//  ) 
				dotLine(points[3],
								points[1],
								tile
				 ) 
				dotLine(points[3],
								points[5],
								tile
				 ) 
				// dotLine(points[1],
				// 				points[5],
				// 				tile
				//  ) 
			}else if (type==3){ 
				points.sort((a,b)=>random()>0.5?-1:1)
				for(let k=0;k<points.length-1;k++){
					dotLine(points[k],
									points[k+1],
									tile
		 		  ) 
				}
			
			}
		}
		 
		
		tile.pop()
		
		tiles[i] = tile
		 
		
	}
	background(255);
	
	 
	 
	// drawingContext.filter = "blur(20px)"
	// blendMode(SCREEN)
	// image(cnv,0,0)
	
	stroke(0)
	noFill()
	strokeWeight(80)
	rect(0,0,width,height)
		
	
	tiles = tiles.concat(tiles.slice().sort((a,b)=>random(-1,1)))
}
let ang = [],angTarget = []
function draw() {
	background(255)
	let r = TILE_SZ/2
	let rowId= 0
	let tileId = 0
	for(let y=0;y<height+TILE_SZ;y+=r*sqrt(3)/2){
		rowId++
		for(let x=0;x<width+TILE_SZ;x+=r*3){
			let _x = x,_y=y
			if (rowId%2==0){
				_x+= 1.5*r
			}
			push()
			let key = x+","+y 
			ang[key] = lerp(ang[key] || 0,angTarget[key] || 0,0.1 )
			angTarget[key] = [0,1,2,3,0,1,2,3,0,1,2,3][int(noise(x/10,y/10)*12)]*PI/3
			if (frameCount==1){
				ang[key] = angTarget[key] 
			}
			translate(_x,_y)
			rotate(ang[key])
			// translate(-TILE_SZ/2,-TILE_SZ/2)
			// 
			imageMode(CENTER)
			// translate(TILE_SZ/2,TILE_SZ/2)
			let tileImg = tiles[ (tileId++) % tiles.length] 
			if (tileImg){
			 image(tileImg,0,0,TILE_SZ,TILE_SZ)
				textAlign(CENTER)
				// text(rowId,0,0)
			}
			pop()
		}	
	}  
	// push()
	// drawingContext.filter = "blur(10px)"
	// blendMode(SCREEN)
	// image(cnv,0,0)
	// 	pop()
	
	
	// if (frameCount%20==0){
	// push()
	// drawingContext.filter = "blur(10px)"
	// blendMode(SCREEN)
	// image(cnv,0,0)
	// 	pop()
	// }
	
	push()
		blendMode(MULTIPLY)
		image(overAllTexture,0,0)
	pop()
	// noLoop()
	// circle(mouseX, mouseY, 20);
}