const DRAW_DURATION = 25000;
const FADE_DURATION = 1000;
const TOTAL_CYCLE = DRAW_DURATION + FADE_DURATION;
const MAX_TRACERS = 100;
const MARGIN = 15;

let tracers = [];
let particles = [];
let lastResetTime = 0;
let isFading = false;
let zoomSlider;

const PALETTE = [
    '#1b5870', // Azul oscuro técnico
    '#27c1af', // Turquesa
    '#fcf5f5', // color claro
    '#e9c46a', // Amarillo ocre
    '#f68c29', // Naranja suave
    '#ec4318'  // Terracota
];

function setup() {
    pixelDensity(1);
    let container = document.getElementById('p5');
    let w = container ? container.offsetWidth : 555;
    let canvas = createCanvas(w, 555);
    canvas.parent('p5');

    zoomSlider = createSlider(1, 100, 20);
    zoomSlider.position(width / 2 - 100, height - 20);
    zoomSlider.style('width', '200px');

    initSketch();
}

function initSketch() {
    tracers = [];
    particles = [];
    lastResetTime = millis();
    isFading = false;
    spawnTracer(0, 0); 
    background(255);
}

function spawnTracer(x, y) {
    let col = color(random(PALETTE));
    tracers.push(new Tracer(x, y, random(99999), 0, col));
}

function mouseDragged() {
    if (document.activeElement === zoomSlider.elt) return;
    if (mouseY > height - 40) return;

    if (!isFading) {
        let mx = mouseX - width / 2;
        let my = mouseY - height / 2;
        if (tracers.length < MAX_TRACERS) {
            if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
                spawnTracer(mx, my);
            }
        }
    }
    return false;
}

function draw() {
    let currentTime = millis() - lastResetTime;
    let zoomScale = map(zoomSlider.value(), 1, 100, 0.1, 0.005);

    if (currentTime > DRAW_DURATION) {
        isFading = true;
        noStroke();
        fill(255, 30);
        rect(0, 0, width, height);
    }

    if (currentTime >= TOTAL_CYCLE) {
        initSketch();
        return;
    }

    translate(width / 2, height / 2);

    if (!isFading) {
        if (tracers.length === 0) {
            spawnTracer(0, 0);
        }

        for (let i = tracers.length - 1; i >= 0; i--) {
            let t = tracers[i];
            
            if (t.alive) {
                t.update(zoomScale);
                
                // Colisión más sensible para líneas finas
                for (let j = 0; j < tracers.length; j++) {
                    if (i !== j && tracers[j].alive) {
                        let d = dist(t.pos.x, t.pos.y, tracers[j].pos.x, tracers[j].pos.y);
                        if (d < 1.5 && t.age > 15) {
                            t.alive = false;
                            break;
                        }
                    }
                }

                // RAMIFICACIÓN MÁS IMPROBABLE (0.03)
                let maxDist = min(width / 2, height / 2) - MARGIN;
                let currentDist = t.pos.mag();
                let distFactor = constrain(map(currentDist, 0, maxDist, 1, 0), 0, 1);
                let ageFactor = constrain(map(t.age, 0, 200, 1, 0), 0, 1);

                if (random(1) < (0.03 * distFactor * ageFactor)) {
                    if (tracers.length < MAX_TRACERS) {
                        let branchAngle = t.angle + (random() > 0.5 ? QUARTER_PI : -QUARTER_PI);
                        tracers.push(new Tracer(t.pos.x, t.pos.y, random(99999), branchAngle, t.col));
                    }
                }

                particles.push(new Particle(t.pos.x, t.pos.y, t.col));
            } else {
                tracers.splice(i, 1);
            }
        }
    }

    blendMode(MULTIPLY);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.show(); 
        push();
        scale(-1, 1); 
        p.show();
        pop();

        let dead = false;
        if (p.alpha <= 0 || (isFading && random() < 0.2)) dead = true;
        if (dead) particles.splice(i, 1);
    }
    blendMode(BLEND);
}

class Tracer {
    constructor(x, y, seed, angle, col) {
        this.pos = createVector(x, y);
        this.seed = seed;
        this.alive = true;
        this.age = 0;
        this.stepSize = 1.0; // DIBUJO MÁS FINO
        this.angle = angle || 0;
        this.col = col;
    }

    update(zScale) {
        this.age++;
        let n = noise(this.seed, this.pos.x * zScale, this.pos.y * zScale);
        this.angle = floor(n * 8) * QUARTER_PI;

        let v = p5.Vector.fromAngle(this.angle);
        v.mult(this.stepSize);
        this.pos.add(v);

        let boundaryX = width / 2 - MARGIN;
        let boundaryY = height / 2 - MARGIN;
        if (abs(this.pos.x) > boundaryX || abs(this.pos.y) > boundaryY) {
            this.alive = false;
        }
    }
}

class Particle {
    constructor(x, y, col) {
        this.location = createVector(x, y);
        this.col = col;
        // RANGO DE TRANSPARENCIA MÁS AMPLIO
        this.alpha = random(60, 90); 
        // MUEREN MÁS LENTO (CHORREADO MÁS LARGO)
        this.rate = random(0.2, 0.6); 
        this.amp = 0.8; // MÁS FINO
    }

    update() {
        // DERIVA TRANSVERSAL MÁS PRESENTE
        let nx = (noise(this.location.x * 0.05, this.location.y * 0.05) - 0.5) * 0.4;
        let ny = (noise(this.location.y * 0.05, this.location.x * 0.05) - 0.5) * 0.4;
        this.location.x += nx;
        this.location.y += ny;
        this.alpha -= this.rate;
    }

    show() {
        noStroke();
        let c = color(this.col);
        c.setAlpha(this.alpha);
        fill(c);
        rect(this.location.x, this.location.y, this.amp, this.amp);
    }
}

function windowResized() {
    let container = document.getElementById('p5');
    if (container) {
        resizeCanvas(container.offsetWidth, 555);
        zoomSlider.position(width / 2 - 100, height - 20);
        background(255);
    }
}