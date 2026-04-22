// Watercolour Shapes
// Closed figures mixing straight segments and arcs, arranged horizontally,
// overlapping with MULTIPLY blend. Each composition fades in, holds, fades out,
// then gives way to the next one.

const FADE_IN_DURATION = 1200;
const HOLD_DURATION = 7500;
const FADE_OUT_DURATION = 1500;

const BG_COLOR = "#fbfaf6";

const PALETTE = [
  "#7b4800",
  "#002185",
  "#06e6e6",
  "#fcd300",
  "#ff2702",
  "#1235fc",
  "#ff771c",
  "#289cf2",
  "#00417b"
];

const STROKE_BRUSHES = ["2H", "HB", "rotring", "pen"];
const HATCH_BRUSHES = ["marker", "marker2"];

let figures = [];
let horizons = [];
let phase = "render"; // "render" | "fadeIn" | "hold" | "fadeOut"
let phaseStart = 0;
let snapshot = null;

function setup() {
  const w = document.body.clientWidth;
  const h = floor(w * 2 / 3);
  createCanvas(w, h, WEBGL);
  angleMode(DEGREES);
  pixelDensity(1);
  imageMode(CORNER);

  generateComposition();
  phase = "render";
  phaseStart = millis();
}

function windowResized() {
  const w = document.body.clientWidth;
  const h = floor(w * 2 / 3);
  resizeCanvas(w, h, WEBGL);
  generateComposition();
  snapshot = null;
  phase = "render";
  phaseStart = millis();
}

function mouseClicked() {
  generateComposition();
  snapshot = null;
  phase = "render";
  phaseStart = millis();
}

function draw() {
  // Phase "render" does the expensive one-shot brush pass, then captures the
  // canvas into `snapshot`. All subsequent phases only blit the snapshot, which
  // is cheap.
  if (phase === "render") {
    renderCompositionToCanvas();
    snapshot = get();
    // Hide the raw brush draw so the fade-in starts from a clean background
    // instead of flashing the fully-rendered composition for one frame.
    blendMode(BLEND);
    background(BG_COLOR);
    phase = "fadeIn";
    phaseStart = millis();
    return;
  }

  const t = millis() - phaseStart;
  let opacity = 1;

  if (phase === "fadeIn") {
    opacity = constrain(t / FADE_IN_DURATION, 0, 1);
    if (t >= FADE_IN_DURATION) {
      phase = "hold";
      phaseStart = millis();
    }
  } else if (phase === "hold") {
    opacity = 1;
    if (t >= HOLD_DURATION) {
      phase = "fadeOut";
      phaseStart = millis();
    }
  } else if (phase === "fadeOut") {
    opacity = 1 - constrain(t / FADE_OUT_DURATION, 0, 1);
    if (t >= FADE_OUT_DURATION) {
      generateComposition();
      snapshot = null;
      phase = "render";
      phaseStart = millis();
      return;
    }
  }

  const eased = easeInOut(opacity);

  background(BG_COLOR);
  if (snapshot) {
    push();
    translate(-width / 2, -height / 2);
    tint(255, 255 * eased);
    image(snapshot, 0, 0, width, height);
    noTint();
    pop();
  }
}

function renderCompositionToCanvas() {
  background(BG_COLOR);
  push();
  translate(-width / 2, -height / 2);
  blendMode(MULTIPLY);
  brush.field("seabed");

  // Landscape horizons painted first, so figures overlap on top of them.
  for (const h of horizons) {
    brush.set(h.brushName, h.color, h.weight);
    brush.spline(h.points, h.curvature);
  }
  brush.noStroke();

  for (const fig of figures) {
    drawFigure(fig);
  }
  blendMode(BLEND);
  pop();
}

function easeInOut(x) {
  return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
}

// -----------------------------------------------------------------------------
// Composition: a horizontal row of figures, free to overlap.

function generateComposition() {
  horizons = buildHorizons();

  figures = [];
  const count = floor(random(5, 10));
  const baseY = height * random(0.45, 0.55);
  const cellW = width / count;

  for (let i = 0; i < count; i++) {
    const cx = cellW * (i + 0.5) + random(-cellW * 0.35, cellW * 0.35);
    const cy = baseY + random(-height * 0.12, height * 0.12);
    const size = cellW * random(0.55, 1.1);
    figures.push(buildFigure(cx, cy, size));
  }
}

function buildHorizons() {
  const lines = [];
  const n = floor(random(2, 5));
  for (let i = 0; i < n; i++) {
    const y = height * random(0.18, 0.88);
    const amp = random(height * 0.015, height * 0.06);
    const seed = random(10000);
    const freq = random(0.004, 0.012);
    const step = max(12, width / 80);
    const points = [];
    for (let x = -20; x <= width + 20; x += step) {
      // noise-driven irregular horizontal trajectory.
      const yy = y + (noise(seed + x * freq) - 0.5) * amp * 2;
      points.push([x, yy]);
    }
    lines.push({
      points,
      brushName: random(STROKE_BRUSHES),
      color: random(PALETTE),
      weight: random(0.4, 1.3),
      curvature: random(0.3, 0.7)
    });
  }
  return lines;
}

function buildFigure(cx, cy, size) {
  const n = floor(random(5, 11));
  const rx = size * random(0.5, 0.9);
  const ry = size * random(0.4, 0.85);
  const rot = random(0, 360);

  // Idiosyncratic shapes: uneven angular spacing + dramatic long spikes so
  // some segments protrude well beyond the envelope, neighbours pulled in
  // toward the centre create sharp kinks.
  const rawAngles = [];
  for (let i = 0; i < n; i++) {
    rawAngles.push(rot + (i / n) * 360 + random(-40, 40));
  }
  rawAngles.sort((a, b) => a - b);

  const anchors = [];
  for (let i = 0; i < n; i++) {
    const a = rawAngles[i];
    let r;
    const roll = random();
    if (roll < 0.28) {
      r = random(1.8, 3.2); // long spike
    } else if (roll < 0.45) {
      r = random(0.2, 0.45); // deep indent
    } else {
      r = random(0.6, 1.1);
    }
    anchors.push({
      x: cx + cos(a) * rx * r,
      y: cy + sin(a) * ry * r,
      arc: random() < 0.22, // mostly straight edges, occasional arc
      bulge: random([-1, 1]) * random(0.08, 0.4)
    });
  }

  return {
    verts: sampleOutline(anchors),
    style: randomStyle()
  };
}

function sampleOutline(anchors) {
  const out = [];
  const n = anchors.length;
  for (let i = 0; i < n; i++) {
    const a = anchors[i];
    const b = anchors[(i + 1) % n];
    if (a.arc) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const k = a.bulge * len;
      const ccx = mx + nx * k;
      const ccy = my + ny * k;

      const samples = 16;
      for (let s = 0; s < samples; s++) {
        const u = s / samples;
        const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * ccx + u * u * b.x;
        const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * ccy + u * u * b.y;
        out.push([x, y]);
      }
    } else {
      out.push([a.x, a.y]);
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Per-figure style.

function randomStyle() {
  const variant = random([
    "fill",
    "fill-stroke",
    "stroke",
    "hatch",
    "hatch-stroke",
    "fill-hatch"
  ]);

  return {
    variant,
    fillColor: random(PALETTE),
    fillOpacity: random(55, 100),
    bleed: random(0.08, 0.35),
    fillTextureStrength: random(0.4, 0.8),
    fillBorderStrength: random(0.3, 0.9),

    strokeBrush: random(STROKE_BRUSHES),
    strokeColor: random(PALETTE),
    strokeWeight: random(0.6, 1.6),

    hatchBrush: random(HATCH_BRUSHES),
    hatchColor: random(PALETTE),
    hatchDistance: random(1.8, 6),
    hatchAngle: random(0, 180)
  };
}

function drawFigure(fig) {
  const s = fig.style;

  brush.noFill();
  brush.noStroke();
  brush.noHatch();

  if (s.variant === "fill" || s.variant === "fill-stroke" || s.variant === "fill-hatch") {
    brush.fill(s.fillColor, s.fillOpacity);
    brush.bleed(s.bleed);
    brush.fillTexture(s.fillTextureStrength, s.fillBorderStrength);
  }

  if (s.variant === "stroke" || s.variant === "fill-stroke" || s.variant === "hatch-stroke") {
    brush.set(s.strokeBrush, s.strokeColor, s.strokeWeight);
  }

  if (s.variant === "hatch" || s.variant === "hatch-stroke" || s.variant === "fill-hatch") {
    brush.setHatch(s.hatchBrush, s.hatchColor);
    brush.hatch(s.hatchDistance, s.hatchAngle, {
      rand: 0.2,
      continuous: false,
      gradient: false
    });
  }

  brush.beginShape(0);
  for (const v of fig.verts) {
    brush.vertex(v[0], v[1], 1);
  }
  brush.endShape(CLOSE);

  brush.noFill();
  brush.noStroke();
  brush.noHatch();
}
