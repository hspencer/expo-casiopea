/*
By Metamere
12-08-2023
A recreation/rethinking of Bridget Riley's untitled work from 1965, known as "Fragment 5".

I had wanted to create an interactive sketch based on this work
in the style of my Morphable Winged Curves sketch,
then noticed that Enrique Jiménez beat me to it! https://openprocessing.org/sketch/2091276
He did a good job with it, but I wanted to make the interaction more intuitive, 
make it work on mobile, and make it fully responsive.

I used his shape position and size calculations as a starting point,
and made them much more efficient by moving a lot of calculations outside of the loops,
removing the y coordinate calculations (they are all 0), and other unnecessary calcs.
I also only recalculate each set of coordinates when necessary.

A perfect representation of the original work would require some more complicated
bezier curves like I used for the other work, along with a discontinuous distortion curve,
but I think this is good enough, and is a nice variant.
I made some improvements on the interaction design from the previous sketch, in order to
make the motion smoother and to fully isolate the touch interaction modes from each other.
I finally got my touch controls to work in Chrome and Firefox on Windows and Android, and Chrome and Safari on iOS.
I also added in a blur filter toggle, because I love that new feature so much. 
The blur doesn't run quite as well in Firefox, though.
Oh, and an animation mode to drive all but mY2.
*/

var touchmode = 0
var mX, mY, mX2, mY2
const initial_coords = [0.2, 0.228, 0.53, 0.86]
// var coloring = true
var coloring = false
var blur_on = false
const blur_amount = 4 // 4 is the default for the blur filter
var animate = false

function setup(init=true) {
	interaction_1 = false 
	interaction_2 = false 
	W = windowWidth 
	H = windowHeight
	if(init){
		[mX, mY, mX2, mY2] = initial_coords
		createCanvas(W, H)
	}
	else resizeCanvas(W, H)
	
	W_actual = int(W * pixelDensity())
	H_actual = int(H * pixelDensity())
	h = int(H / 2) // int prevents gaps in the middle when height is odd
	
	// strokeWeight(2)
	// strokeCap(SQUARE)
	noStroke()
	refresh = true

	const margin = 0.02
	x1 = W * margin
	x2 = W * (1 - margin)
	xs = []
	subX = []
	fill_col = 'rgb(18,18,255)'
	bg_col2 = 'rgb(45,113,66)'
	t = 0
}

function draw() {
	if(refresh || animate){
		const delayed = millis() - press_time > delay_amount
		if (interaction_1 && delayed) {
			// the map makes it start from 0 a bit farther from the edge
			// the lerp makes it shift a percent of the way towards the target,
			// rather than instantly jumping to it.
			mX = lerp(mX, max(0.01, 2 * map(mouseX / W, 0.05, 1, 0, 1)), 0.08) 
			mY = lerp(mY, max(0, 2 * map(mouseY / W, 0.05, 1, 0, 1)), 0.02)
		} 
		else if (interaction_2 && delayed) {
			if(!animate) mX2 = lerp(mX2, max(0, 2 * map(mouseX / W, 0.05, 1, 0, 1)), 0.08)
			mY2 = lerp(mY2, max(0, 2 * mouseY / H), 0.05) 
		}
		if(animate){
			mX = 2 * noise(t + 1e4)
			mY = 2 * noise(t + 2e4)
			mX2 = 2 * noise(t + 3e4)
			// mY2 = 2 * noise(t + 4e4) // too jittery
		}

		bg_col = coloring? bg_col2 : 255
		background(bg_col)

		const outer_distort = 30 * mX
		const outer_wave_count = map(sq(mY), 0, 4, 3, 80)
		const inner_distort = mX2
		let inner_wave_count = int(map(sq(mY2), 0, 4, 2, 80))
		inner_wave_count += (inner_wave_count % 2 == 0) // keeps it odd to avoid visual oddity
		
		if ((interaction_1 && delayed ) || t == 0 || animate) {
			xs = []
			// Calculate coordinates for the outer waves
			const angle_min = atan(-outer_distort)
			const angle_max = atan(outer_distort)
			const ratio1 = outer_distort * 2 / outer_wave_count

			for (i = 0; i <= outer_wave_count; i++) {
				const angle1 = atan(-outer_distort + ratio1 * i)
				xs.push(map(angle1, angle_min, angle_max, 0, x2 - x1))
			}
		}
		if ((interaction_1 || interaction_2 && delayed) || t == 0 || animate) {
			// Calculate coordinates for inner waves
			subX = []
			const coord_min = atan(-inner_distort * 6)
			const coord_max = atan(0.1 * 6)
			for (i = 0; i < outer_wave_count; i++) {
				const x_range = xs[i + 1] - xs[i]
				subX[i] = []
				for (j = 0; j <= inner_wave_count; j++) {
					const coord = atan((-inner_distort + (inner_distort + 0.1) / inner_wave_count * j) * 6)
					subX[i].push(xs[i] + map(coord, coord_min, coord_max, 0, x_range))
				}
			}
		}

		for (i = 0; i < subX.length - 1; i++) {
			for (j = 1; j < subX[i].length; j++) {

				// Calculate control points and radius for arc
				const cx_temp = ([...subX[i + 1]].reverse()[j] - subX[i][j]) / 2 + subX[i][j]
				if(isNaN(cx_temp)) continue
				const cx = cx_temp
				const p2 = subX[i][j]
				const r = abs(cx - p2)
				const diam = r * 2
				const a = (i % 2) ? PI : TAU

				if( j == 1 && r < 3) break // prevent drawing shapes when they are super small
				if(coloring){
					if(j % 2) fill(fill_col)
					else fill(bg_col)
				} 
				else fill((j % 2 == 0) * 255)

				arc(cx + x1, h, diam, diam, a, a + PI) // half circle arc
				// arc(cx + x1, h, r * 2, r * 2, 0, a + PI) // an interesting variant that does some loops
			}
		}
		if(blur_on) filter(BLUR, blur_amount)
		if(!mouseIsPressed){
			refresh = false
			interaction_1 = false 
			interaction_2 = false 
		} 
		t += 0.001
	}
}

function windowResized() {
	if (!((windowWidth === H && windowHeight === W) ||
			(windowWidth === W && windowHeight === H))) {
		setup(false)
	}
}

const delay_amount = 100
var press_time = 0
var primed = 0

function input_pressed() {
	touchmode = touches.length
	refresh = true
	interaction_1 = false
	interaction_2 = false
	press_time = int(millis())
	if (touchmode === 5)prime(5)
	else if ((touchmode === 0 && mouseButton === CENTER) || touchmode === 4 && 
					 millis() - press_time < delay_amount) prime(4)
	else if (touchmode === 3 && millis() - press_time < delay_amount)	prime(3)
	else if ((touchmode == 0 && mouseButton === RIGHT) || touchmode === 2) {
		interaction_2 = true
	}
	else if ((touchmode == 0 && mouseButton === LEFT) || touchmode === 1){
		interaction_1 = true
	}
}

function prime(mode){
	primed = mode
	interaction_1 = false
	interaction_2 = false
}

function input_released(){
	if(primed == 5){
		blur_on = !blur_on
		refresh = true
	}
	else if(primed == 4) setup()
	else if(primed == 3){
		coloring = !coloring
		refresh = true	
	} 
	primed = 0
	if (touchmode > 0) go_fullscreen()
}

function keyPressed() {
	if (key === 's') save_img()
	else if (key === 'r') setup()
	else if (key === 'f') {
		if (fullscreen()) fullscreen(false)
		else go_fullscreen()
	} 
	else if (key == 'c') {
		coloring = !coloring
		refresh = true
	}
	else if (key == 'a') animate = !animate
	else if (key == 'b'){
		blur_on = !blur_on
		refresh = true
	} 
}

function save_img() {
	let save_name = "Riley-Fragment5-" + W_actual + 'x' + H_actual
	save_name += '-' + nf(mX, 0, 2) + '-' + nf(mY, 0, 2) + '-' + nf(mX2, 0, 2) + '-' + nf(mY2, 0, 2)
	if(coloring) save_name += '-c'
	if(blur_on) save_name += '-b'
	saveCanvas(save_name, "png")
}

function go_fullscreen() {
	if(fullscreen()) return
	fullscreen(true)
}

function touchStarted(){input_pressed()}
function touchEnded(){input_released()}
// function touchMoved(){input_dragged()}
function mousePressed(){input_pressed()}
function mouseReleased(){input_released()}
// function mouseDragged(){input_dragged()}

document.addEventListener("contextmenu", (event) => event.preventDefault(), "true")
document.addEventListener("touchmove", (event) => event.preventDefault(), {passive: false})
document.addEventListener("touchStarted", (event) => event.stopPropagation(), "true")
document.addEventListener("touchEnded", (event) => event.stopPropagation(), "true")
document.addEventListener("touchMoved", (event) => event.stopPropagation(), "true")
