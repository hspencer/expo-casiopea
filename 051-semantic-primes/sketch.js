
let primesData;
let cubeSize = 300;
let font;
let rotationX = 0, rotationY = 0, rotationZ = 0;
let targetX = 0, targetY = 0, targetZ = 0;
let animStartTime = 0;
let animDuration = 12000;
let waitDuration = 1000;

function preload() {
    primesData = {
        "pronombres personales e identidad": ["yo", "tú", "alguien", "algo~cosa", "gente"],
        "existencia y realidad": ["ser (alguien/algo)", "hay", "porque", "suceder"],
        "cantidad y números": ["uno", "dos", "muchos", "todos", "algunos"],
        "tiempo y relaciones temporales": ["cuándo/tiempo", "ahora", "antes", "después", "mucho tiempo"],
        "espacio y relaciones espaciales": ["dónde/lugar", "aquí", "arriba", "abajo", "lejos", "cerca"],
        "conexiones lógicas y causales": ["si", "no", "quizás", "poder", "muy"],
        "evaluación y deseabilidad": ["bueno", "malo", "grande", "pequeño"],
        "acción y eventos": ["hacer", "mover", "tocar", "ver", "oír", "decir"],
        "actos mentales y de habla": ["pensar", "saber", "querer", "sentir", "gustar", "entender", "recordar"]
    };
    font = loadFont("Rubik.ttf");
}

function setup() {
    createCanvas(windowWidth, 550, WEBGL);
    ortho();
    textFont(font);
    scheduleNextRotation();
}

function draw() {
    background(240);

    let elapsedTime = millis() - animStartTime;
    if (elapsedTime < animDuration) {
        let t = elapsedTime / animDuration;
        t = t * t * (3 - 2 * t); // Ease-in ease-out interpolation
        rotationX = lerp(rotationX, targetX, t);
        rotationY = lerp(rotationY, targetY, t);
        rotationZ = lerp(rotationZ, targetZ, t);
    } else if (elapsedTime > animDuration + waitDuration) {
        scheduleNextRotation();
    }

    rotateX(rotationX);
    rotateY(rotationY);
    rotateZ(rotationZ);

    let groups = Object.keys(primesData);
    let numGroups = groups.length;
    let gridSize = Math.ceil(Math.cbrt(numGroups));
    let spacing = cubeSize / gridSize;
    let index = 0;

    for (let z = 0; z < gridSize; z++) {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (index >= numGroups) return;

                push();
                let nx = -cubeSize / 2 + x * spacing;
                let ny = -cubeSize / 2 + y * spacing;
                let nz = round(map(index, 0, numGroups - 1, -cubeSize / 2, cubeSize / 2));
                translate(nx, ny, nz);

                rotateX(HALF_PI)
                fill(200, 30, 0);
                textSize(32)
                text(char(33 + index), 0, 0);
              
                let groupName = groups[index];
                let primes = primesData[groupName];
                textSize(14);
                textAlign(LEFT, TOP);
                fill(50);
                rotateX(-HALF_PI);
                text(groupName, 0, 0, spacing * 0.7, spacing);
                pop();

                for (let i = 0; i < primes.length; i++) {
                    push();
                    translate(nx + i * 15, ny + i * 15, nz + i * 15);
                    rotateY(HALF_PI);
                    fill(150, 30, 0);
                    text(primes[i], 0, 0);
                    pop();
                }
                index++;
            }
        }
    }
}

function scheduleNextRotation() {
    animStartTime = millis();
    targetX = random([0, PI / 2, PI, (3 * PI) / 2, TWO_PI]);
    targetY = random([0, PI / 2, PI, (3 * PI) / 2, TWO_PI]);
    targetZ = random([0, PI / 2, PI, (3 * PI) / 2, TWO_PI]);
}
