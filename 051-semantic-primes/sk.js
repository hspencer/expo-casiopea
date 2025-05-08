let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint,
    Runner = Matter.Runner,
    engine, chains = [], boxes = [], boundaries = [], font, primesData;

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
    createCanvas(windowWidth, windowHeight);
    engine = Engine.create();

    // Mouse control
    let canvasMouse = Mouse.create(canvas.elt);
    let mouseConstraint = MouseConstraint.create(engine, {
        mouse: canvasMouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });
    World.add(engine.world, mouseConstraint);

    let runner = Runner.create();

    let margin = 10;
    let w = width - margin;
    let h = height - margin;

    // Create boundaries
    let wallThickness = 1000;
    boundaries.push(Bodies.rectangle(w / 2, -wallThickness / 2, w + 2 * wallThickness, wallThickness, { isStatic: true }));
    boundaries.push(Bodies.rectangle(w / 2, h + wallThickness / 2, w + 2 * wallThickness, wallThickness, { isStatic: true }));
    boundaries.push(Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h + 2 * wallThickness, { isStatic: true }));
    boundaries.push(Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h + 2 * wallThickness, { isStatic: true }));
    World.add(engine.world, boundaries);

    let xOffset = width / 9;

    for (let category in primesData) {
        let words = primesData[category];

        // Create a chain with 48 links
        let chain = Composites.stack(xOffset, 200, 48, 1, 0, 0, (x, y) => {
            return Bodies.circle(x, y, 10, { isStatic: false, density: 0.05 });
        });

        Composites.chain(chain, 0.5, 0, -0.5, 0, {
            stiffness: 1,
            length: 12
        });

        World.add(engine.world, chain);
        chains.push(chain);

        words.forEach((word, i) => {
            let points = font.textToPoints(word, 0, 0, 24, {
                sampleFactor: 0.1,
                simplifyThreshold: 0
            });

            let vertices = points.map(pt => ({ x: pt.x, y: pt.y }));

            let wordBody = Bodies.fromVertices(xOffset + i * 50, height / 2, vertices, {
                restitution: 0.5,
                mass: word.length * 0.2,
                friction: 0.1
            });

            World.add(engine.world, wordBody);
            boxes.push({ body: wordBody, text: word });
        });

        xOffset += width / Object.keys(primesData).length;
    }

    Runner.run(runner, engine);
}

function draw() {
    background(255);

    chains.forEach(chain => {
        stroke(0);
        for (let i = 0; i < chain.bodies.length - 1; i++) {
            let bodyA = chain.bodies[i];
            let bodyB = chain.bodies[i + 1];
            line(bodyA.position.x, bodyA.position.y, bodyB.position.x, bodyB.position.y);
        }
    });

    boxes.forEach(wordObj => {
        const { body, text: texto } = wordObj;

        push();
        translate(body.position.x, body.position.y);
        rotate(body.angle);
        
        // Draw body shape
        fill(0);
        beginShape();
        body.vertices.forEach(v => vertex(v.x - body.position.x, v.y - body.position.y));
        endShape(CLOSE);
        
        // Draw text
        fill(255);
        noStroke();
        textFont(font);
        textSize(12);
        textAlign(CENTER, CENTER);
        text(texto, 0, 0);
        
        pop();
    });
}