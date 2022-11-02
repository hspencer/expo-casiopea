/**
 * Kandinsky Squiggles
 * by Dave Pagurek 
 * 
 * https://openprocessing.org/sketch/1629875
 */

let lineShader, blobShader, bgShader

let state

function generate() {
	const squiggles = []
	const blobs = []
	
	const maxScale = random(8, 25)
	const numBlobs = ceil(map(maxScale, 8, 25, 12, 5))
	for (let i = 0; i < numBlobs; i++) {
		blobs.push(blob({ maxScale }))
	}
	
	const maxK = random(1, 5)
	const numSquiggles = ceil(map(maxK, 1, 5, 24, 12))
	for (let i = 0; i < numSquiggles; i++) {
		const newSquiggle = squiggle({ maxK })
		const x = randomGaussian(0, width/6)
		const y = randomGaussian(0, height/6)
		squiggles.push((progress) => {
			push()
			translate(x, y)
			newSquiggle(progress)
			pop()
		})
	}
	
	const bgSeed = random()*1000
	const bg = () => {
		push()
		shader(bgShader)
		bgShader.setUniform('pixelDensity', pixelDensity())
		bgShader.setUniform('seed', bgSeed)
		rectMode(CENTER)
		rect(0, 0, width, height)
		pop()
	}
	
	state = {
		startTime: millis(),
		blobs,
		squiggles,
		bg,
	}
}

function setup() {
	createCanvas(windowWidth, 300, WEBGL)
	setAttributes({ antialias: true })
	lineShader = createShader(...lineShaderSource())
	blobShader = createShader(...blobShaderSource())
	bgShader = createShader(...bgShaderSource())
	generate()
}

function mousePressed() {
	generate()
}

function draw() {
	const gl = _renderer.GL
	gl.enable(gl.BLEND)
	gl.disable(gl.DEPTH_TEST)
	background(255)
	noStroke()
	
	const { bg, blobs, squiggles, startTime } = state
	const delta = millis() - startTime
	const progress = map(delta, 0, 5000, 0, 1, true)
	
	bg()
	for (const blob of blobs) blob(progress)
	for (const squiggle of squiggles) squiggle(progress)
}

function mousePressed() {
	generate()
}