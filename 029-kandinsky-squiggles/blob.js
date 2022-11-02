function blob({ maxScale }) {
	push()
	
	const c = color(random(['#b34830', '#f7ee8d', '#3852a6', '#f5c242', '#6958a8']))
	const offset = createVector(randomGaussian(0, width/4), randomGaussian(0, height/4))
	const numCircles = floor(random(10, 25))
	const scale = random(1, maxScale / (numCircles/2))
	
	const centers = [{
		x: randomGaussian(width/2, width/24) + offset.x,
		y: randomGaussian(height/2, height/24) + offset.y
	}]
	const radii = [scale * random(4, 15)]
	while (centers.length < numCircles) {
		const parent = floor(random(centers.length))
		const parentCenter = centers[parent]
		const parentRadius = radii[parent]
		const radius = scale * random(4, 15)
		const offset = createVector(radius + parentRadius + random(-10, 5), 0).rotate(random(TWO_PI))
		centers.push({ x: parentCenter.x + offset.x, y: parentCenter.y + offset.y })
		radii.push(radius)
	}
	pop()
	
	const seed = random(1000)
	return (progress) => {
		push()
		shader(blobShader)
		blobShader.setUniform('pixelDensity', pixelDensity())
		blobShader.setUniform('seed', seed)
		blobShader.setUniform('color', [red(c), green(c), blue(c)].map(v => v/255))
		blobShader.setUniform('centers', centers.flatMap(({x,y}) => [x,y]))
		blobShader.setUniform('radii', radii.map((r, i) => r*Ease.easeInOutCubic(map(progress, i/50, (i+25)/50, 0, 1, true))))
		blobShader.setUniform('numCircles', numCircles)
		blobShader.setUniform('progress', Ease.easeOutCubic(progress))

		rectMode(CENTER)
		rect(0, 0, width, height)
		pop()
	}
}

