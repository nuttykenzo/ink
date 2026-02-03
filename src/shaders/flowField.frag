// Flow Field Fragment Shader
// Generates organic, flowing patterns based on Perlin noise

precision highp float;

uniform float uTime;
uniform float uSeed;
uniform float uComplexity;
uniform float uOrganicness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uSaturation;

varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion - optimized version with configurable octaves
float fbm(vec2 p, float seed) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency + seed);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

// Lighter FBM for domain warping (3 octaves)
float fbmLight(vec2 p, float seed) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p * frequency + seed);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;

  // Create flow field based on noise
  float time = uTime * 0.1;
  float seed = uSeed * 0.001;

  // Domain warping for organic feel (simplified: removed r layer)
  vec2 q = vec2(
    fbmLight(uv * uComplexity + seed, seed),
    fbmLight(uv * uComplexity + vec2(5.2, 1.3) + seed, seed + 1.0)
  );

  // Mix organic distortion (use q directly instead of r)
  float f = fbm(uv * uComplexity + 4.0 * q * uOrganicness + time, seed + 2.0);

  // Create color mixing (reuse f for secondary mix instead of extra snoise)
  float colorMix = f * 0.5 + 0.5;
  float colorMix2 = (q.x + q.y) * 0.25 + 0.5;

  // Blend colors
  vec3 color = mix(uColor1, uColor2, colorMix);
  color = mix(color, uColor3, colorMix2 * 0.3);

  // Apply saturation
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);

  // Add subtle glow at edges
  float edge = smoothstep(0.0, 0.3, min(min(uv.x, 1.0-uv.x), min(uv.y, 1.0-uv.y)));
  color *= edge * 0.3 + 0.7;

  // Vignette
  float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5) * 1.5);
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
