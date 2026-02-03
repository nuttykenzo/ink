// Creature Eye Vertex Shader
// Simple pass-through with UV coordinates for eye rendering

precision highp float;

// Varyings to fragment shader
varying vec2 vUv;

void main() {
  vUv = uv;

  // Transform to clip space
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
