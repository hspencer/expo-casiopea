var world = [];
var size = 10;
var paused = true;

function setup() {
	createCanvas(windowWidth, windowHeight);
	create_world(size);
    frameRate(10);
}

function draw() {
	background(240);
	draw_world(world, size);
	if (!paused){update_world(world);}
}

/*--------------------------------- world */

function create_world(size){
  for (var y = 0;y < int(height/size);y++){
		var row = [];
	  for (var x = 0;x < int(width/size);x++){
			var num = random(100);
      //if (num < 10){row.push(1);}
			if ((x == 2 && y == 5) || (x == 3 && y == 5) || (x == 2 && y == 6) || (x == 3 && y == 6)){row.push(1);}
			else if ((x == 12 && y == 5) || (x == 12 && y == 6) || (x == 12 && y == 7) || (x == 13 && y == 4) || (x == 14 && y == 3) || 
							 (x == 15 && y == 3) || (x == 13 && y == 8) || (x == 14 && y == 9) || (x == 15 && y == 9) || (x == 16 && y == 6)  || 
							 (x == 17 && y == 8) || (x == 18 && y == 7) || (x == 18 && y == 6) || (x == 18 && y == 5) || (x == 19 && y == 6) ||
							 (x == 17 && y == 4)){row.push(1);}
			else if ((x == 22 && y == 3) || (x == 23 && y == 3) || (x == 22 && y == 4) || (x == 23 && y == 4) || (x == 22 && y == 5) || 
							 (x == 23 && y == 5) || (x == 24 && y == 2) || (x == 24 && y == 6) || (x == 26 && y == 6)  || (x == 26 && y == 7) ||
							 (x == 26 && y == 2) || (x == 26 && y == 1)){row.push(1);}
			else if ((x == 36 && y == 3) || (x == 37 && y == 3) || (x == 36 && y == 4) || (x == 37 && y == 4)){row.push(1);}
			else{row.push(0);}
		}
		world.push(row);
	}
}

//.....................................

function draw_world(world, size){
  for (var y = 0;y < world.length;y++){
	  for (var x = 0;x < world[0].length;x++){
			if (world[y][x] != 0){
				noStroke();
				fill(30);
				
				rect(x*size, y*size, size, size);
			}
		}
	} 
}

//.....................................

function update_world(world){
	var neighbor_world = [];
  for (var y = 0;y < world.length;y++){
		var row = [];
	  for (var x = 0;x < world[0].length;x++){
			var possible_neighbors = [[x-1, y-1], [x, y-1], [x+1, y-1],
																[x-1, y], [x+1, y],
																[x-1, y+1], [x, y+1], [x+1, y+1]];
      var howdy_neighbor = 0;
				
			for (var i = 0;i < possible_neighbors.length;i++){
				if ( possible_neighbors[i][0] >= 0 && possible_neighbors[i][0] <= world[0].length-1 &&
						possible_neighbors[i][1] >= 0 && possible_neighbors[i][1] <= world.length-1){
					  if (world[possible_neighbors[i][1]][possible_neighbors[i][0]] == 1){howdy_neighbor ++;}}
			}
			row.push(howdy_neighbor);
		}
		neighbor_world.push(row);
	}
	
  for (var y = 0;y < neighbor_world.length;y++){
	  for (var x = 0;x < neighbor_world[0].length;x++){
			if (world[y][x] == 0 && neighbor_world[y][x] == 3){world[y][x] = 1;}
			if (world[y][x] == 1 && (neighbor_world[y][x] < 2 || neighbor_world[y][x] >= 4)){world[y][x] = 0;}
			if (world[y][x] == 1 && (neighbor_world[y][x] == 2 || neighbor_world[y][x] == 3)){world[y][x] = 1;}
		}
	}	
}

/*---------------------------- input */

function mousePressed(){
  var x = int(mouseX/size);
	var y = int(mouseY/size);
	
	world[y][x] = 1-world[y][x];
}

function keyPressed(){
  if (key == ' '){if (paused){paused = false;}else{paused = true;}}
}

function mouseDragged(){
    var x = int(mouseX/size);
	var y = int(mouseY/size);
	
	world[y][x] = 1-world[y][x];
}