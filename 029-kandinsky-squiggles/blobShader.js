const blobShaderSource = () => {
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
		uniform vec2 centers[25];
		uniform float radii[25];
		uniform vec3 color;
		uniform float progress;
		uniform int numCircles;
		
		float smoothUnion(float d1, float d2, float k) {
      float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
      return mix(d2, d1, h) - k*h*(1.0-h);
    }

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
			float minDist = 10000.;
			vec2 currCoord = gl_FragCoord.xy / pixelDensity;
			for (int i = 0; i < 25; i++) {
				if (i > numCircles) break;
        float dist = max(0.0, length(centers[i] - currCoord) - radii[i]);
        minDist = smoothUnion(minDist, dist, 40.);
      }

			float opacity = 1. - smoothstep(
				0.,
				2. + 25.*noise(vec2(coord.y*0.03, coord.x*0.05)),
				minDist + 5.*fract(10. * noise(coord * 5.2) + 5. * noise(coord * 1.1)) + 25.*(1.-progress)
			);
			
			vec3 tint = vec3(noise(coord*0.01), noise(coord*0.011 + 1000.), noise(coord*0.012 + 2000.));
			vec3 shiftedColor = mix(color, tint, 0.1);

			gl_FragColor = vec4(shiftedColor,opacity*0.95);
		}
	`
	return [vert, frag]
}