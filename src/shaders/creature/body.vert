// Creature Body Vertex Shader
// Renders organic body with breathing animation and edge distortion

precision highp float;

// Per-vertex attributes
attribute float aEdgeFactor;    // 0 = center, 1 = edge
attribute float aNoiseOffset;   // Unique per vertex for animation variation
attribute float aAngle;         // Angle around body center (for edge vertices)

// Uniforms
uniform float uTime;
uniform float uBreathPhase;     // Current breathing phase (0-2π)
uniform float uBreathAmplitude; // Breathing scale amount
uniform float uIrregularity;    // Edge irregularity (0-1)
uniform float uOrganicFactor;   // From trait vector
uniform vec2 uDriftOffset;      // Idle drift offset

// Varyings to fragment shader
varying float vEdgeFactor;
varying vec2 vLocalPos;
varying float vNoiseOffset;
varying float vAngle;

// Simplex permutation
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Simplex 2D noise
float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
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

void main() {
  vEdgeFactor = aEdgeFactor;
  vNoiseOffset = aNoiseOffset;
  vAngle = aAngle;
  vLocalPos = position.xy;

  // Breathing animation - sinusoidal scale
  float breath = 1.0 + sin(uBreathPhase) * uBreathAmplitude;

  // Organic edge distortion (only for edge vertices)
  float organicWarp = 0.0;
  if (aEdgeFactor > 0.5) {
    // Multi-frequency noise for organic movement
    float noise1 = snoise(vec2(aNoiseOffset + uTime * 0.5, aAngle * 2.0));
    float noise2 = snoise(vec2(aNoiseOffset * 2.0 + uTime * 0.3, aAngle * 4.0)) * 0.5;

    // Combine noises, scale by organic factor and irregularity
    organicWarp = (noise1 + noise2) * uOrganicFactor * uIrregularity * 0.15;
  }

  // Calculate final position
  vec3 pos = position;

  // Apply organic warp as radial displacement
  float warpScale = 1.0 + organicWarp * aEdgeFactor;

  // Apply breathing
  float totalScale = warpScale * breath;

  // Scale position
  pos.xy = pos.xy * totalScale;

  // Apply drift offset
  pos.xy += uDriftOffset;

  // Transform to clip space
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
