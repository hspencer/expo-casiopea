// Watercolour Named
// Variation of 057: each idiosyncratic figure also gets a poetic name suggested
// by visual similarity, written in Playfair Display with a different size, case
// and weight per figure. Names are HTML labels overlaying the canvas, so they
// fade in/out in sync with the brush composition.

const FADE_IN_DURATION = 1200;
const HOLD_DURATION = 14000;
const FADE_OUT_DURATION = 1800;

// Each label appears on its own clock during the hold phase: random delay
// after hold starts, random fade-in duration. They all fade out together with
// the brush snapshot during fadeOut.
const LABEL_APPEAR_DELAY_MIN = 0;
const LABEL_APPEAR_DELAY_MAX = 5500;
const LABEL_APPEAR_DURATION_MIN = 700;
const LABEL_APPEAR_DURATION_MAX = 2400;

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

// Names, each tagged with the geometric characteristics they read as. The
// tagging is shared with computeShapeTags() below; whatever tags a figure
// produces, we look for names that overlap most.
//
// Tag vocabulary:
//   horizontal | vertical | compact      — bbox aspect
//   elongated | thin                     — long & narrow
//   spiky | smooth                       — perimeter behaviour
//   indented                             — deep concavity (notch / bay)
//   multi-spike                          — several protrusions
//   large | small                        — bbox area vs canvas
const NAMES = [
  // Cartographic
  { name: "península", tags: ["horizontal", "elongated", "spiky"] },
  { name: "península seca", tags: ["horizontal", "elongated", "spiky"] },
  { name: "cabo", tags: ["spiky", "horizontal"] },
  { name: "cabo del fin", tags: ["spiky", "elongated"] },
  { name: "promontorio", tags: ["spiky", "horizontal"] },
  { name: "istmo", tags: ["thin", "elongated"] },
  { name: "estrecho", tags: ["thin", "elongated", "horizontal"] },
  { name: "fiordo", tags: ["indented", "thin", "elongated"] },
  { name: "bahía", tags: ["indented", "horizontal"] },
  { name: "golfo", tags: ["indented", "compact"] },
  { name: "golfo profundo", tags: ["indented", "compact"] },
  { name: "delta", tags: ["multi-spike", "spiky"] },
  { name: "archipiélago", tags: ["multi-spike", "horizontal", "spiky"] },
  { name: "archipiélago menor", tags: ["multi-spike", "small"] },
  { name: "isla", tags: ["compact"] },
  { name: "isla menor", tags: ["compact", "small"] },
  { name: "isla seca", tags: ["compact", "smooth"] },
  { name: "atolón", tags: ["compact", "smooth", "small"] },
  { name: "continente", tags: ["large", "compact"] },
  { name: "continente perdido", tags: ["large"] },
  { name: "país sin nombre", tags: ["compact", "large"] },
  { name: "tierra firme", tags: ["compact", "large"] },
  { name: "tierra incógnita", tags: ["compact"] },
  { name: "región", tags: ["compact"] },
  { name: "territorio", tags: ["compact", "large"] },
  { name: "litoral", tags: ["horizontal", "elongated"] },
  { name: "ribera", tags: ["horizontal", "elongated"] },
  { name: "ribera larga", tags: ["horizontal", "elongated"] },
  { name: "costa oeste", tags: ["horizontal", "elongated"] },
  { name: "costa rota", tags: ["horizontal", "spiky"] },
  { name: "meseta", tags: ["horizontal", "smooth", "large"] },
  { name: "cordillera", tags: ["horizontal", "spiky", "multi-spike"] },

  // Organic / natural
  { name: "ave", tags: ["horizontal", "spiky"] },
  { name: "ave nocturna", tags: ["horizontal", "spiky"] },
  { name: "pez", tags: ["horizontal", "elongated"] },
  { name: "pez espada", tags: ["horizontal", "elongated", "spiky"] },
  { name: "ala", tags: ["horizontal", "spiky", "elongated"] },
  { name: "ala rota", tags: ["spiky", "elongated"] },
  { name: "pluma", tags: ["elongated", "smooth"] },
  { name: "espina", tags: ["vertical", "spiky", "thin"] },
  { name: "rama", tags: ["spiky", "elongated", "multi-spike"] },
  { name: "raíz", tags: ["spiky", "multi-spike"] },
  { name: "raíz vieja", tags: ["spiky", "multi-spike"] },
  { name: "tronco", tags: ["elongated"] },
  { name: "tronco caído", tags: ["horizontal", "elongated"] },
  { name: "fruto", tags: ["compact", "smooth"] },
  { name: "fruto extraño", tags: ["compact", "spiky"] },
  { name: "guijarro", tags: ["compact", "smooth", "small"] },
  { name: "hueso", tags: ["elongated", "thin"] },
  { name: "lengua", tags: ["horizontal", "elongated", "smooth"] },
  { name: "huella", tags: ["compact", "indented"] },
  { name: "monte", tags: ["compact", "spiky"] },
  { name: "cerro", tags: ["compact", "spiky"] },
  { name: "loma", tags: ["compact", "smooth"] },
  { name: "loma incierta", tags: ["compact"] },
  { name: "duna", tags: ["horizontal", "smooth"] },
  { name: "valle", tags: ["indented", "horizontal"] },
  { name: "valle ciego", tags: ["indented"] },
  { name: "grieta", tags: ["thin", "indented", "elongated"] },
  { name: "boca", tags: ["indented", "compact"] },
  { name: "boca de río", tags: ["indented"] },
  { name: "máscara", tags: ["indented", "compact"] },
  { name: "ojo", tags: ["compact", "smooth", "small"] },
  { name: "ojo de aguja", tags: ["thin", "indented"] },
  { name: "cabeza de león", tags: ["spiky", "compact", "multi-spike"] },
  { name: "perfil de roca", tags: ["spiky"] },
  { name: "vela", tags: ["vertical", "elongated"] },
  { name: "barco", tags: ["horizontal", "compact"] },
  { name: "luna", tags: ["compact", "smooth"] },
  { name: "estrella", tags: ["spiky", "multi-spike"] },
  { name: "cometa", tags: ["spiky", "elongated"] },
  { name: "nube", tags: ["smooth", "horizontal"] },
  { name: "humo", tags: ["smooth"] },
  { name: "humo lento", tags: ["smooth", "elongated"] },
  { name: "manto", tags: ["smooth", "large"] },
  { name: "manto de niebla", tags: ["smooth", "horizontal"] },
  { name: "ola", tags: ["horizontal", "smooth"] },
  { name: "ola quieta", tags: ["horizontal", "smooth"] },
  { name: "espuma", tags: ["smooth", "compact"] },
  { name: "remolino", tags: ["compact"] },
  { name: "abismo", tags: ["indented", "vertical"] },
  { name: "pliegue", tags: ["indented", "elongated"] },
  { name: "umbral", tags: ["indented", "compact"] },
  { name: "rastro", tags: ["elongated", "thin"] },
  { name: "sombra", tags: [] },
  { name: "rocío", tags: ["small", "compact"] }
];

let figures = [];
let horizons = [];
let phase = "render"; // "render" | "fadeIn" | "hold" | "fadeOut"
let phaseStart = 0;
let snapshot = null;

let labelEls = [];
let labelsContainer = null;

function setup() {
  const w = document.body.clientWidth;
  const h = floor(w * 2 / 3);
  createCanvas(w, h, WEBGL);
  angleMode(DEGREES);
  pixelDensity(1);
  imageMode(CORNER);

  labelsContainer = document.getElementById("labels");
  sizeLabelContainer();

  generateComposition();
  rebuildLabels();
  phase = "render";
  phaseStart = millis();
}

function windowResized() {
  const w = document.body.clientWidth;
  const h = floor(w * 2 / 3);
  resizeCanvas(w, h, WEBGL);
  sizeLabelContainer();
  generateComposition();
  rebuildLabels();
  snapshot = null;
  phase = "render";
  phaseStart = millis();
}

function mouseClicked() {
  generateComposition();
  rebuildLabels();
  snapshot = null;
  phase = "render";
  phaseStart = millis();
}

function sizeLabelContainer() {
  if (!labelsContainer) return;
  labelsContainer.style.width = width + "px";
  labelsContainer.style.height = height + "px";
}

function draw() {
  if (phase === "render") {
    renderCompositionToCanvas();
    snapshot = get();
    blendMode(BLEND);
    background(BG_COLOR);
    phase = "fadeIn";
    phaseStart = millis();
    setAllLabelOpacity(0);
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
      rebuildLabels();
      snapshot = null;
      phase = "render";
      phaseStart = millis();
      setAllLabelOpacity(0);
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

  updateLabelOpacities(eased, phase, t);
}

function updateLabelOpacities(globalOpacity, currentPhase, phaseT) {
  for (let i = 0; i < labelEls.length; i++) {
    const el = labelEls[i];
    const lab = figures[i].label;
    let op;
    if (currentPhase === "render" || currentPhase === "fadeIn") {
      // Labels stay hidden while the brush composition fades in.
      op = 0;
    } else if (currentPhase === "hold") {
      const dt = phaseT - lab.appearDelay;
      if (dt <= 0) {
        op = 0;
      } else {
        const u = constrain(dt / lab.appearDuration, 0, 1);
        // ease-out: starts fast, settles smoothly
        op = 1 - pow(1 - u, 2);
      }
    } else if (currentPhase === "fadeOut") {
      // All labels fade out together with the composition.
      op = globalOpacity;
    } else {
      op = 0;
    }
    el.style.opacity = op;
  }
}

function setAllLabelOpacity(o) {
  for (const el of labelEls) {
    el.style.opacity = o;
  }
}

function renderCompositionToCanvas() {
  background(BG_COLOR);
  push();
  translate(-width / 2, -height / 2);
  blendMode(MULTIPLY);
  brush.field("seabed");

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

  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    const cx = cellW * (i + 0.5) + random(-cellW * 0.35, cellW * 0.35);
    const cy = baseY + random(-height * 0.12, height * 0.12);
    const size = cellW * random(0.55, 1.1);

    const fig = buildFigure(cx, cy, size);
    fig.cx = cx;
    fig.cy = cy;
    fig.size = size;

    // Shape-aware naming: read the actual outline, choose a name whose tag
    // profile best matches the figure's geometric character.
    fig.shapeTags = computeShapeTags(fig.verts);
    fig.name = pickNameForTags(fig.shapeTags, usedNames);
    usedNames.add(fig.name);

    fig.label = buildLabelStyle(fig);

    figures.push(fig);
  }
}

// -----------------------------------------------------------------------------
// Shape analysis → tag set, used to pick a name that "knows the form".

function computeShapeTags(verts) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  let cx = 0, cy = 0;
  for (const v of verts) {
    if (v[0] < minx) minx = v[0];
    if (v[0] > maxx) maxx = v[0];
    if (v[1] < miny) miny = v[1];
    if (v[1] > maxy) maxy = v[1];
    cx += v[0];
    cy += v[1];
  }
  cx /= verts.length;
  cy /= verts.length;

  const w = maxx - minx;
  const h = maxy - miny;
  const aspect = w / max(h, 1);

  const dists = verts.map(v => sqrt((v[0] - cx) ** 2 + (v[1] - cy) ** 2));
  const maxD = Math.max(...dists);
  const minD = Math.min(...dists);
  const meanD = dists.reduce((a, b) => a + b, 0) / dists.length;
  const variance =
    dists.reduce((a, d) => a + (d - meanD) ** 2, 0) / dists.length;
  const stdD = sqrt(variance);

  const spikiness = maxD / max(meanD, 0.01);
  const indent = meanD / max(minD, 0.01);
  const cv = stdD / max(meanD, 0.01); // irregularity

  // Count vertices that protrude well past the average — multiple spikes.
  const spikeCount = dists.filter(d => d > meanD + stdD * 0.7).length;

  const tags = [];

  // Aspect / orientation
  if (aspect > 1.55) tags.push("horizontal");
  else if (aspect < 0.65) tags.push("vertical");
  else tags.push("compact");

  // Elongation (long & narrow, regardless of orientation)
  const longSide = max(w, h);
  const shortSide = max(min(w, h), 1);
  if (longSide / shortSide > 2.2) tags.push("elongated");
  if (shortSide / longSide < 0.32) tags.push("thin");

  // Spikiness / smoothness
  if (spikiness > 1.7 || cv > 0.32) tags.push("spiky");
  else if (spikiness < 1.3 && cv < 0.18) tags.push("smooth");

  // Concavity / indentation (some vertices much closer than mean)
  if (indent > 1.9) tags.push("indented");

  // Multiple protrusions
  if (spikeCount >= 3) tags.push("multi-spike");

  // Size relative to canvas
  const areaFrac = (w * h) / (width * height);
  if (areaFrac > 0.06) tags.push("large");
  else if (areaFrac < 0.012) tags.push("small");

  return tags;
}

function pickNameForTags(tags, used) {
  let bestScore = -1;
  let bestList = [];
  for (const entry of NAMES) {
    if (used.has(entry.name)) continue;
    let score = 0;
    for (const t of entry.tags) if (tags.includes(t)) score++;
    // Soft penalty for tags the name has but figure doesn't (keeps profiles
    // aligned, prevents overconfident names from sweeping all matches).
    const mismatch = entry.tags.length - score;
    const adjusted = score * 2 - mismatch * 0.5;

    if (adjusted > bestScore) {
      bestScore = adjusted;
      bestList = [entry];
    } else if (adjusted === bestScore) {
      bestList.push(entry);
    }
  }
  if (bestList.length === 0) {
    // Fallback to any unused name (shouldn't happen with current pool).
    const remaining = NAMES.filter(e => !used.has(e.name));
    return random(remaining).name;
  }
  return random(bestList).name;
}

function buildLabelStyle(fig) {
  // Vary size, weight, italic, case and rotation per figure so the type plays
  // alongside the figure rather than repeating itself.
  const sizes = [16, 20, 26, 34, 42, 52, 64];
  const weights = [400, 500, 700, 900];
  const cases = ["upper", "lower", "title", "as-is"];

  // Position the label near the figure's centre, with an offset so it doesn't
  // sit dead-on the centroid every time.
  const offX = random(-fig.size * 0.25, fig.size * 0.25);
  const offY = random(-fig.size * 0.55, fig.size * 0.55);

  return {
    fontSize: random(sizes),
    fontWeight: random(weights),
    italic: random() < 0.3,
    caseTransform: random(cases),
    letterSpacing: random() < 0.4 ? random(0.04, 0.18) : 0,
    rotation: random() < 0.18 ? random(-6, 6) : 0,
    x: fig.cx + offX,
    y: fig.cy + offY,
    // Each label appears on its own clock during the hold phase.
    appearDelay: random(LABEL_APPEAR_DELAY_MIN, LABEL_APPEAR_DELAY_MAX),
    appearDuration: random(LABEL_APPEAR_DURATION_MIN, LABEL_APPEAR_DURATION_MAX)
  };
}

function applyCase(s, t) {
  if (t === "upper") return s.toUpperCase();
  if (t === "lower") return s.toLowerCase();
  if (t === "title") {
    return s.replace(/\b([\p{L}])([\p{L}]*)/gu, (_, a, rest) => a.toUpperCase() + rest.toLowerCase());
  }
  return s;
}

function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function rebuildLabels() {
  if (!labelsContainer) return;
  while (labelsContainer.firstChild) {
    labelsContainer.removeChild(labelsContainer.firstChild);
  }
  labelEls = new Array(figures.length);

  // Pass 1: build elements with their type styles, append off-screen so we can
  // measure the rendered bounding box (rotation included via getBoundingClientRect).
  const items = [];
  for (let i = 0; i < figures.length; i++) {
    const fig = figures[i];
    const lab = fig.label;
    const el = document.createElement("div");
    el.className = "label";
    el.textContent = applyCase(fig.name, lab.caseTransform);
    el.style.fontSize = lab.fontSize + "px";
    el.style.fontWeight = lab.fontWeight;
    el.style.fontStyle = lab.italic ? "italic" : "normal";
    el.style.letterSpacing = lab.letterSpacing + "em";
    el.style.setProperty("--r", lab.rotation + "deg");
    el.style.left = "-10000px";
    el.style.top = "-10000px";
    labelsContainer.appendChild(el);
    const r = el.getBoundingClientRect();
    items.push({ index: i, fig, el, w: r.width, h: r.height });
  }

  // Pass 2: place largest labels first (more constrained), then fill in
  // smaller ones around them. Each placement is clamped so the full bbox lies
  // inside the canvas (no truncation), and a spiral search around the ideal
  // position avoids overlapping any previously-placed label.
  const placementOrder = items.slice().sort((a, b) => b.w * b.h - a.w * a.h);
  const placed = [];
  const margin = 6;
  const gap = 4;
  for (const it of placementOrder) {
    const ideal = { x: it.fig.label.x, y: it.fig.label.y };
    const spot = findFreeSpot(ideal, it.w, it.h, placed, margin, gap);
    it.el.style.left = spot.x + "px";
    it.el.style.top = spot.y + "px";
    placed.push({ x: spot.x, y: spot.y, w: it.w, h: it.h });
  }

  // Pass 3: keep labelEls aligned with figures[] order so the per-label
  // appearDelay/appearDuration apply to the right element.
  for (const it of items) {
    labelEls[it.index] = it.el;
  }
}

function findFreeSpot(ideal, w, h, placed, margin, gap) {
  const minX = margin + w / 2;
  const maxX = width - margin - w / 2;
  const minY = margin + h / 2;
  const maxY = height - margin - h / 2;

  // If the label is wider/taller than the canvas there's nothing to do but
  // park it in the middle. (Shouldn't happen with current font sizes.)
  if (maxX < minX || maxY < minY) {
    return { x: width / 2, y: height / 2 };
  }

  const clamp = p => ({
    x: constrain(p.x, minX, maxX),
    y: constrain(p.y, minY, maxY)
  });

  // Try the figure's ideal position first.
  const start = clamp(ideal);
  if (!collidesAny(start, w, h, placed, gap)) return start;

  // Spiral outward from ideal using the golden angle for nice coverage.
  const goldAngle = (137.508 * Math.PI) / 180;
  const stepBase = max(6, h * 0.35);
  for (let i = 1; i <= 600; i++) {
    const radius = sqrt(i) * stepBase;
    const angle = i * goldAngle;
    const p = clamp({
      x: ideal.x + Math.cos(angle) * radius,
      y: ideal.y + Math.sin(angle) * radius
    });
    if (!collidesAny(p, w, h, placed, gap)) return p;
  }

  // Random sampling fallback.
  for (let i = 0; i < 300; i++) {
    const p = { x: random(minX, maxX), y: random(minY, maxY) };
    if (!collidesAny(p, w, h, placed, gap)) return p;
  }

  // Truly couldn't find a clear spot; clamp to the canvas at least.
  return start;
}

function collidesAny(p, w, h, placed, gap) {
  for (const r of placed) {
    if (
      Math.abs(p.x - r.x) * 2 < w + r.w + gap * 2 &&
      Math.abs(p.y - r.y) * 2 < h + r.h + gap * 2
    ) {
      return true;
    }
  }
  return false;
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
      r = random(1.8, 3.2);
    } else if (roll < 0.45) {
      r = random(0.2, 0.45);
    } else {
      r = random(0.6, 1.1);
    }
    anchors.push({
      x: cx + cos(a) * rx * r,
      y: cy + sin(a) * ry * r,
      arc: random() < 0.22,
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
