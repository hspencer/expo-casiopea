const cellSize = 10;
const gridWidth = 60;
const gridHeight = 40;
let grid;
let p;

let sketch;

function setup() {
  sketch = createCanvas(gridWidth * cellSize, gridHeight * cellSize);
  sketch.parent('#sketch');
  grid = createEmptyGrid();
  p = false;
}

function draw() {
  if (p) {
    background("lightgreen");
    grid = getNextGeneration(grid);
  } else {
    background("pink");
  }

  if (mouseIsPressed) {
    let x = floor(mouseX / cellSize);
    let y = floor(mouseY / cellSize);
    grid[x][y] = 1;
  }

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      if (grid[x][y] === 1) {
        fill(0);
        rect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}

function keyPressed() {
  if (key === " ") {
    grid = getNextGeneration(grid);
  }
  if (key === "e") {
    grid = createEmptyGrid();
  }
  if (key === "p") {
    p = !p;
  }
}

function createEmptyGrid() {
  let grid = new Array(gridWidth);
  for (let x = 0; x < gridWidth; x++) {
    grid[x] = new Array(gridHeight).fill(0);
  }
  return grid;
}

function countNeighbors(grid, x, y) {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx !== 0 || dy !== 0) {
        let nx = (x + dx + gridWidth) % gridWidth;
        let ny = (y + dy + gridHeight) % gridHeight;
        count += grid[nx][ny];
      }
    }
  }
  return count;
}

function getNextGeneration(grid) {
  let newGrid = createEmptyGrid();
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      let neighbors = countNeighbors(grid, x, y);
      if (grid[x][y] === 1 && (neighbors === 2 || neighbors === 3)) {
        newGrid[x][y] = 1;
      } else if (grid[x][y] === 0 && neighbors === 3) {
        newGrid[x][y] = 1;
      }
    }
  }
  return newGrid;
}
