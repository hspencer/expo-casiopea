////////////////////////////////////////////////////////
// Reference: https://inconvergent.net/generative/
//            https://openprocessing.org/sketch/871349
////////////////////////////////////////////////////////

let nodes = []
const r = 7

setup = () => {
  createCanvas(windowWidth, windowHeight)
  fill('lightgrey')
  noStroke()
  nodes.length = 0
  for (let i = 3; i--;) {
    const r = random(TWO_PI)
    nodes[i] = createVector(cos(r) * 20 + width / 2, sin(r) * 5 + height / 2)
  }
}

draw = () => {
  background('white')
  splits()
  reject()
  beginShape()
  for (const p of nodes) curveVertex(p.x, p.y)
  endShape(CLOSE)
}

reject = () => {
  for (const p of nodes) {
    force = createVector(0)
    for (const q of nodes) {
      if (p === q) continue;
      const d = distance(p, q)
      if (d < 2 * r) {
        delta = p5.Vector.sub(p, q)
        force.add(delta.mult((2 * r - d) * .025))
      }
    }
    p.add(force.limit(1))
    p.x = constrain(p.x, 0, width)
    p.y = constrain(p.y, 0, height)
  }
}

distance = (u, v) => sqrt((u.x - v.x) ** 2 + (u.y - v.y) ** 2)

splits = () => {
  let next = []
  for (let i = 0; i < nodes.length; i++) {
    current = nodes[i]
    next.push(current)
    neighbor = nodes[(i + 1) % nodes.length]
    const d = distance(current, neighbor)
    if (d > 2 * r && nodes.length < 1000) {
      next.push(p5.Vector.add(current, neighbor).mult(1 / 2))
    }
  }
  nodes = next
}

mouseClicked = () => setup()