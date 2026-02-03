// Characteristic Form Vertex Shader
// Renders bio-digital forms with organic distortion and breathing animation

precision highp float;

// Per-vertex attributes
attribute float aFormIndex;     // Which form this vertex belongs to
attribute float aEdgeFactor;    // 0 = center, 1 = edge
attribute float aNoiseOffset;   // Unique per vertex for animation variation

// Uniforms
uniform float uTime;
uniform float uMotionTempo;     // 0-1, from trait vector
uniform float uOrganicFactor;   // 0-1, geometricOrganic from trait vector
uniform float uIntensity;       // 0-1, intensityScale from trait vector

// Varyings to fragment shader
varying float vFormIndex;
varying float vEdgeFactor;
varying vec2 vLocalPos;
varying float vNoiseOffset;

// Simplex permutation
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Simplex 2D noise (same as noise.glsl)
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
  vFormIndex = aFormIndex;
  vEdgeFactor = aEdgeFactor;
  vNoiseOffset = aNoiseOffset;

  // Store local position for fragment shader (before transformations)
  vLocalPos = position.xy;

  // Animated time scaled by motion tempo
  float animTime = uTime * (0.3 + uMotionTempo * 0.7);

  // Organic edge distortion - only affects edge vertices (edgeFactor = 1)
  // Varies position outward/inward based on noise
  float organicWarp = 0.0;
  if (aEdgeFactor > 0.5) {
    // Multi-frequency noise for more interesting organic movement
    float noise1 = snoise(vec2(aNoiseOffset + animTime * 0.5, aFormIndex * 10.0));
    float noise2 = snoise(vec2(aNoiseOffset * 2.0 + animTime * 0.3, aFormIndex * 5.0)) * 0.5;

    // Combine noises, scale by organic factor
    organicWarp = (noise1 + noise2) * uOrganicFactor * 0.12;
  }

  // Breathing animation - subtle scale oscillation
  float breathFreq = 1.0 + aFormIndex * 0.3; // Slightly different frequency per form
  float breathPhase = aFormIndex * 1.5; // Different phase per form
  float breath = 1.0 + sin(animTime * breathFreq + breathPhase) * 0.04 * uIntensity;

  // Calculate final position
  vec3 pos = position;

  // Apply organic warp as radial displacement
  // Edge vertices move outward/inward, center stays fixed
  float warpScale = 1.0 + organicWarp * aEdgeFactor;

  // Apply breathing
  float totalScale = warpScale * breath;

  // Scale from center (center vertices have edgeFactor = 0, so they don't move)
  // For edge vertices, we need to scale relative to form center
  // Since positions are already in world space with center embedded, we just scale the offset
  pos.xy = pos.xy * totalScale;

  // Transform to clip space
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
