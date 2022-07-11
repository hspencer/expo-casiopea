////////////////////////////////////////////////////////////////////////////////
// Based on https://www.rudyrucker.com/oldhomepage/celdoc/rules.html#HGlass
////////////////////////////////////////////////////////////////////////////////
const n = 300
let step
let board = []

setup = () => {
  createCanvas(windowWidth, windowHeight)
  step = width / n
  noStroke()
  fill('black')
  board.length = 0
  for (let x = n; x--;) {
    board[x] = []
    for (let y = n; y--;) {
      board[x][y] = (random(1) < .5 && y > n / 8)? 1 : 0
    }
  }
}
draw = () => {
  background('white')
  let next = []
  for (let x = n; x--;) next[x] = []
  
	for (let y = n; y--;) {
    for (let x = n; x--;) {
      const neighbors = 
				+ 1 * board[x][y] 							// self
        + 2 * board[x][(y - 1 + n) % n] // north
        + 4 * board[x][(y + 1) % n] 		// south
        + 8 * board[(x - 1 + n) % n][y] // west
				+ 16 * board[(x + 1) % n][y] 		// east
      switch (neighbors) {
			case 1: case 2: case 3:
			case 11: case 21: case 25:
			case 29: case 30:case 31:
        next[x][y] = 1
				fill(map(dist(x * step, y * step, mouseX, mouseY), 0, height, 0, 255))
        rect(x * step, y * step, step + 1, step + 1)
        break;
      default:
        next[x][y] = 0
      }
    }
  }
  board = next
}
mousePressed = () => setup()