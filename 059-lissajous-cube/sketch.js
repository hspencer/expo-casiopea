// 059 — Lissajous Cube
// Grafo de Gabriel sobre los 8 vértices de un cubo + N puntos de una curva
// Lissajous 3D. Aristas dibujadas como cilindros con perfil de barril.
// Versión responsive con sliders.

const params = {
  freqX: 3,
  freqY: 2,
  freqZ: 5,
  phaseUnits: 0.25, // múltiplos de PI
  numPoints: 128,   // 8 esquinas + (numPoints - 8) puntos de curva
  boxThickness: 2,
  endThickness: 10,
  segments: 7,
  rotSpeed: -0.005,
  cubeStroke: 10,
  showCube: true,
};

let points = [];
let edges = [];
let needsRebuild = true;
let cubeSize = 500;

function setup() {
  const c = createCanvas(windowWidth, windowHeight, WEBGL);
  c.parent("stage");
  perspective(PI / 3, width / height, 0.1, 100000);
  recomputeCubeSize();
  bindControls();
  rebuild();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(PI / 3, width / height, 0.1, 100000);
  recomputeCubeSize();
  needsRebuild = true;
}

function recomputeCubeSize() {
  // Cubo proporcional al lado menor, dejando margen para que entre rotado.
  cubeSize = min(width, height) * 0.55;
}

function draw() {
  background(255);
  orbitControl(1, 1, 0.1);

  if (needsRebuild) {
    rebuild();
    needsRebuild = false;
  }

  rotateY(frameCount * params.rotSpeed);

  if (params.showCube && params.cubeStroke > 0) {
    noFill();
    stroke(0);
    strokeWeight(params.cubeStroke);
    box(cubeSize);
  }

  fill(0);
  noStroke();
  for (const e of edges) {
    drawTaperedEdge(e.a, e.b);
  }
}

function lissajousPoint(t, scale) {
  const phase = params.phaseUnits * PI;
  const x = sin(params.freqX * t + phase) * scale;
  const y = sin(params.freqY * t) * scale;
  const z = sin(params.freqZ * t) * scale;
  return createVector(x, y, z);
}

function rebuild() {
  points = [];
  edges = [];

  const bipolar = [-1, 1];
  for (const x of bipolar) {
    for (const y of bipolar) {
      for (const z of bipolar) {
        points.push(createVector(x, y, z).mult(cubeSize / 2));
      }
    }
  }

  const count = max(0, params.numPoints - 8);
  for (let i = 0; i < count; i++) {
    const t = map(i, 0, count, 0, TWO_PI);
    points.push(lissajousPoint(t, cubeSize * 0.45));
  }

  buildGabrielGraph();
}

function buildGabrielGraph() {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];
      const mid = p5.Vector.add(a, b).mult(0.5);
      const radiusSq = p5.Vector.sub(a, mid).magSq();

      let ok = true;
      for (let k = 0; k < points.length; k++) {
        if (k === i || k === j) continue;
        const distSq = p5.Vector.sub(points[k], mid).magSq();
        if (distSq < radiusSq - 0.1) {
          ok = false;
          break;
        }
      }
      if (ok) edges.push({ a, b });
    }
  }
}

function drawTaperedEdge(p1, p2) {
  const dir = p5.Vector.sub(p2, p1);
  const len = dir.mag();
  if (len < 0.0001) return;

  const angleY = atan2(dir.x, dir.z);
  const angleX = acos(constrain(dir.y / len, -1, 1));
  const segs = params.segments;

  for (let i = 0; i < segs; i++) {
    const tStart = map(i, 0, segs, -1, 1);
    const tEnd = map(i + 1, 0, segs, -1, 1);
    const tMid = (tStart + tEnd) / 2;

    const segLen = len / segs;
    const segMid = p5.Vector.lerp(p1, p2, (i + 0.5) / segs);

    push();
    translate(segMid.x, segMid.y, segMid.z);
    rotateY(angleY);
    rotateX(angleX);
    cylinder(currentThickness(tMid), segLen + 0.5);
    pop();
  }
}

function currentThickness(t) {
  return (
    (params.boxThickness +
      (params.endThickness - params.boxThickness) * (t * t)) /
    2
  );
}

// --- UI -------------------------------------------------------------

function bindControls() {
  const panel = document.getElementById("panel");
  const toggle = document.getElementById("toggle");
  toggle.addEventListener("click", () => {
    panel.classList.toggle("collapsed");
    toggle.textContent = panel.classList.contains("collapsed") ? "+" : "–";
  });

  // Sliders que requieren reconstruir el grafo
  bindSlider("freqX", "freqX", parseFloat, true);
  bindSlider("freqY", "freqY", parseFloat, true);
  bindSlider("freqZ", "freqZ", parseFloat, true);
  bindSlider("phase", "phaseUnits", parseFloat, true, (v) => v.toFixed(2));
  bindSlider("points", "numPoints", (v) => parseInt(v, 10), true);

  // Sliders solo de render
  bindSlider("boxThick", "boxThickness", parseFloat, false, (v) => v.toFixed(1));
  bindSlider("endThick", "endThickness", parseFloat, false, (v) => v.toFixed(1));
  bindSlider("segments", "segments", (v) => parseInt(v, 10), false);
  bindSlider("rotSpeed", "rotSpeed", parseFloat, false, (v) => v.toFixed(3));
  bindSlider("cubeStroke", "cubeStroke", parseFloat, false, (v) => v.toFixed(1));

  const showCube = document.getElementById("showCube");
  showCube.addEventListener("change", () => {
    params.showCube = showCube.checked;
  });
}

function bindSlider(id, key, parser, rebuildOnChange, formatter) {
  const input = document.getElementById(id);
  const valEl = document.getElementById(id + "-val");
  const format = formatter || ((v) => String(v));

  const update = () => {
    const v = parser(input.value);
    params[key] = v;
    if (valEl) valEl.textContent = format(v);
    if (rebuildOnChange) needsRebuild = true;
  };

  input.addEventListener("input", update);
  update();
}
