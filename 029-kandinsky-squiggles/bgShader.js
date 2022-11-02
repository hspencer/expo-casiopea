const bgShaderSource = () => {
	const vert = `attribute vec3 aPosition;
		attribute vec2 aTexCoord;

		uniform mat4 uModelViewMatrix;
		uniform mat4 uProjectionMatrix;
		uniform mat3 uNormalMatrix;

		varying highp vec2 vTexCoord;

		void main(void) {
			vec4 positionVec4 = vec4(aPosition, 1.0);
			gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
			vTexCoord = aTexCoord;
		}
	`
	
	const frag = `precision mediump float;
		varying highp vec2 vTexCoord;
		uniform float pixelDensity;
		uniform float seed;

		// Noise functions
		// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
		float rand(float n) {
			return fract(sin(n) * 43758.5453123);
		}
		float rand(vec2 n) { 
			return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
		}
		float noise(float p) {
			float fl = floor(p);
			float fc = fract(p);
			return mix(rand(fl), rand(fl + 1.0), fc);
		}
		float noise(vec2 n) {
			const vec2 d = vec2(0.0, 1.0);
			vec2 b = floor(n);
			vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
			return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
		}

		void main() {
			float angle = seed;

			// Rotate the position (which is used to get a noise value) based on the position
			// to make the noise less repetitive
			vec2 coord = mat2(
				cos(angle), -sin(angle),
				sin(angle), cos(angle)
			) * (gl_FragCoord.xy / pixelDensity);
			
			vec3 color = vec3(235., 232., 225.)/255.;
			vec3 tint = 0.7*vec3(
				pow(noise(coord*0.04),2.),
				pow(noise(coord*0.04), 3.),
				pow(noise(coord*0.032 + 2000.), 8.)
			);
			vec3 shiftedColor = mix(color, tint, noise(coord*0.02)*0.1);

			gl_FragColor = vec4(shiftedColor,1.);
		}
	`
	return [vert, frag]
}