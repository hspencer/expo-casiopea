const DRAW_DURATION = 20000; 
const FADE_DURATION = 5000;
const TOTAL_CYCLE = DRAW_DURATION + FADE_DURATION;

let particles = [];
let tracers = [];
let lastResetTime = 0;
let numSymmetries;
let isFading = false;

function setup() {
    let container = select('#p5');
    let canvas = createCanvas(container.width, 555);
    canvas.parent('p5');
    initSketch();
}

function initSketch() {
    particles = [];
    tracers = [];
    lastResetTime = millis();
    isFading = false;
    
    // Selección de simetría y trazadores
    let dice = random();
    let tracersInQuadrant;
    if (dice < 0.33) {
        numSymmetries = 4;
        tracersInQuadrant = 3; 
    } else if (dice < 0.66) {
        numSymmetries = 8;
        tracersInQuadrant = 2;
    } else {
        numSymmetries = 16;
        tracersInQuadrant = 1;
    }
    
    for (let i = 0; i < tracersInQuadrant; i++) {
        tracers.push(new Tracer());
    }
    
    background(255);
}

function draw() {
    let currentTime = millis() - lastResetTime;

    if (currentTime > DRAW_DURATION) {
        isFading = true;
        noStroke();
        fill(255, 30); // Fade out hacia blanco
        rect(0, 0, width, height);
    }

    if (currentTime >= TOTAL_CYCLE) {
        initSketch();
        return;
    }

    translate(width / 2, height / 2);

    if (!isFading) {
        for (let t of tracers) {
            t.update();
            // Creamos partículas persistentes en el camino del tracer
            // El alpha es muy bajo (15-20) para que necesite superposición
            for(let j=0; j<3; j++) {
                particles.push(new Particle(t.pos.x, t.pos.y)); 
            }
        }
    }

    let angleStep = TWO_PI / numSymmetries;
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        
        for (let s = 0; s < numSymmetries; s++) {
            push();
            rotate(s * angleStep);
            if (s % 2 === 1) scale(1, -1);
            p.show();
            pop();
        }

        // Si estamos en fade out, limpiamos el array más rápido
        if (p.alpha <= 0 || isFading) {
            particles.splice(i, 1);
        }
    }
}

class Tracer {
    constructor() {
        this.pos = createVector(0, 0);
        this.noiseOffset = random(1000);
    }

    update() {
        // Movimiento ortogonal puro
        let n = floor(noise(this.noiseOffset) * 4);
        let angle = n * HALF_PI; 
        let v = p5.Vector.fromAngle(angle);
        v.mult(4); // Paso más largo para cubrir área
        this.pos.add(v);
        
        this.noiseOffset += 0.01;

        // Si se sale del límite, resetea al centro (nuevo trazo)
        if (this.pos.mag() > height / 2.2) {
            this.pos.set(0, 0);
        }
    }
}

class Particle {
    constructor(x, y) {
        this.location = createVector(x, y);
        this.alpha = 25; // Alpha bajo para acumulación
        this.rate = random(0.5, 1.5);
        this.amp = 2;
    }

    update() {
        // Un noise muy suave para que la partícula no sea un punto estático
        // pero que mantenga la ortogonalidad (0, 90, 180, 270)
        let n = floor(noise(this.location.x * 0.05, this.location.y * 0.05) * 4);
        let v = p5.Vector.fromAngle(n * HALF_PI);
        this.location.add(v.mult(0.5));
        
        this.alpha -= this.rate;
    }

    show() {
        noStroke();
        fill(40, this.alpha); 
        // Dibujo cuadrado para estética técnica
        rect(this.location.x, this.location.y, this.amp, this.amp);
    }
}

function windowResized() {
    let container = select('#p5');
    resizeCanvas(container.width, 555);
    background(255);
}