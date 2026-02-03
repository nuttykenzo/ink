// Shared Noise Functions for Ink
// Used by flowField.frag and particle shaders

// Simplex permutation
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Simplex 2D noise
// Returns value in range [-1, 1]
float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
    -0.577350269189626,  // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion
// Combines multiple octaves of noise for natural-looking patterns
float fbm(vec2 p, float seed) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency + seed);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

// Get flow field velocity at a position
// Used for particle advection - particles follow this velocity field
vec2 getFlowVelocity(vec2 pos, float time, float seed, float complexity, float organicness) {
  float s = seed * 0.001;
  float t = time * 0.1;

  // Domain warping (same as flowField.frag main())
  vec2 q = vec2(
    fbm(pos * complexity + s, s),
    fbm(pos * complexity + vec2(5.2, 1.3) + s, s + 1.0)
  );

  vec2 r = vec2(
    fbm(pos * complexity + 4.0 * q + vec2(1.7, 9.2) + t, s + 2.0),
    fbm(pos * complexity + 4.0 * q + vec2(8.3, 2.8) + t, s + 3.0)
  );

  // Compute gradient via central difference
  float eps = 0.01;
  vec2 warpedPos = pos * complexity + 4.0 * r * organicness;

  float f0 = fbm(warpedPos, s + 4.0);
  float fx = fbm(warpedPos + vec2(eps, 0.0), s + 4.0);
  float fy = fbm(warpedPos + vec2(0.0, eps), s + 4.0);

  // Gradient gives flow direction (perpendicular for curl-like flow)
  vec2 gradient = vec2(fx - f0, fy - f0) / eps;

  // Rotate 90 degrees for curl (more interesting flow)
  vec2 velocity = vec2(-gradient.y, gradient.x);

  // Normalize and scale
  float len = length(velocity);
  if (len > 0.001) {
    velocity = velocity / len;
  }

  return velocity;
}
