// Particle Vertex Shader
// Renders particles as points with size based on trail position

precision highp float;

// Attributes (per-particle)
attribute float aSize;
attribute float aTrailPosition;  // 0 = head (newest), 1 = tail (oldest)
attribute float aAge;
attribute vec3 aColor;

// Uniforms
uniform float uTime;
uniform float uPulseIntensity;
uniform float uPointSize;

// Varyings to fragment shader
varying float vTrailPosition;
varying float vAge;
varying vec3 vColor;

void main() {
  vTrailPosition = aTrailPosition;
  vAge = aAge;
  vColor = aColor;

  // Transform position
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Point size: larger at head, smaller at tail
  float baseSize = uPointSize * aSize;

  // Trail fade: head is full size, tail shrinks
  float trailFade = 1.0 - vTrailPosition * 0.7;

  // Pulse effect based on time
  float pulse = 1.0 + sin(uTime * 3.0 + aAge * 6.28) * uPulseIntensity * 0.2;

  // Age fade-in: new particles start small
  float ageFade = smoothstep(0.0, 0.1, aAge);

  gl_PointSize = baseSize * trailFade * pulse * ageFade;

  // Attenuate size by distance (optional, for depth effect)
  // gl_PointSize *= (300.0 / -mvPosition.z);
}
