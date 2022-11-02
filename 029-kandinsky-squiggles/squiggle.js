function squiggle({ maxK }) {
	push()
	noiseSeed(random(20))
	const points = []
	const k = eachAxis(() => random(0.1, maxK))
	const scale = eachAxis(() => random(400, 800))
	const octaves = eachAxis(() => random([1, 2, 3, 4]))
	
	const lfoAngle = random(TWO_PI)
	const lfoK = random(1, 10)
	const lfoScale = random(0.01, 0.1)
	const lfo = (t) => createVector(
		lfoScale*cos(lfoAngle + lfoK*t),
		lfoScale*sin(lfoAngle + lfoK*t),
	)
	const generator = (t) => {
		const result = {}
		for (const axis of ['x', 'y']) {
			noiseDetail(octaves[axis], 0.5)
			result[axis] = noise(k[axis] * t, axis.charCodeAt(0)*100)
		}
		return { pt: toVec(result).add(lfo(t)) }
	}
	
	const numPoints = 40
	for (let i = 0; i < numPoints; i++) {
		points.push(generator(i / (numPoints-1)))
	}
	
	const avg = createVector()
	for (const { pt } of points) avg.add(pt)
	avg.div(numPoints)
	for (const { pt } of points) {
		pt.sub(avg)
		pt.x *= scale.x
		pt.y *= scale.y
	}
	
	// Add bezier tangent control points to make it smooth
	const smoothFrac = 0.3
	for (let i = 1; i < points.length - 1; i++) {
		const prev = points[i - 1]
		const curr = points[i]
		const next = points[i + 1]
		const tangent = next.pt.copy().sub(prev.pt).mult(smoothFrac)
		curr.left = curr.pt.copy().sub(tangent)
		curr.right = curr.pt.copy().add(tangent)
	}
	
	const path = createBezierPath(points)
	
	const numSamples = ceil(path.getTotalLength()/3)
	noiseDetail(random([1, 2]), 0.5)
	const thicknessScale = random(0.001, 0.02)
	const thickness = (length) => {
		const rawThickness = map(noise(length*thicknessScale, 5000), 0, 1, 2, 10, true)
		const taperPow = 0.75
		const taper =
			pow(map(length, 0, 60, 0, 1, true), taperPow) *
			pow(map(length, path.getTotalLength()-60, path.getTotalLength(), 1, 0, true), taperPow)
		/*const delta = 1
		const curvature = toVec(path.getTangentAtLength(length + delta)).normalize().sub(
			toVec(path.getTangentAtLength(length)).normalize()
		).div(delta)*/
		return rawThickness * taper // * map(curvature, 0, 10, 1, 0.1, true)
	}
	const thicknesses = []
	for (let i = 0; i < numSamples; i++) {
		const v = i / (numSamples - 1)
		const len = v * path.getTotalLength()
		thicknesses.push(thickness(len))
	}
	pop()
	
	const seed = random()*1000
	const maxOffset = 0.3
	const duration = 0.5
	const offset = random(maxOffset)
	return (progress) => {
		const mappedProgress = map(progress, offset, offset + offset + duration, 0, 1, true)
		const samplesToRender = max(2, floor(numSamples * Ease.easeInOutCubic(mappedProgress)))
		push()
		textureMode(NORMAL)
		shader(lineShader)
		lineShader.setUniform('pixelDensity', pixelDensity())
		lineShader.setUniform('seed', seed)
		for (const side of [1, 1]) {
			beginShape(TRIANGLE_STRIP)
			for (let vPoint = 0; vPoint < samplesToRender; vPoint++) {
				const v = vPoint / (numSamples - 1)
				const len = v * path.getTotalLength()
				const center = toVec(path.getPointAtLength(len))
				const tangent = toVec(path.getTangentAtLength(len))
				const normal = createVector(-tangent.y, tangent.x)
					.normalize()
				for (const uSide of [0, side]) {
					const u = map(uSide, -1, 1, 0, 1)
					const { x, y } = center.copy().add(normal.copy().mult(uSide * thicknesses[vPoint]))
					vertex(x, y, 0, u, v)
				}
			}
			endShape(CLOSE)
		}
		pop()
	}
}

function toVec({ x, y }) {
	return createVector(x, y)
}

function eachAxis(fn) {
	return { x: fn(), y: fn() }
}