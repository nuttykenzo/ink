// Particle Fragment Shader
// Renders soft, glowing particles with color blending

precision highp float;

// Uniforms
uniform vec3 uColor1;       // Primary color (particle head)
uniform vec3 uColor2;       // Secondary color (particle tail)
uniform vec3 uColor3;       // Accent color (highlights)
uniform float uSaturation;
uniform float uColorVariety;
uniform float uTime;

// Varyings from vertex shader
varying float vTrailPosition;
varying float vAge;
varying vec3 vColor;

void main() {
  // Create soft circular point
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Soft edge falloff
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  // Discard pixels outside circle
  if (alpha < 0.01) discard;

  // Trail fade: head is bright, tail fades
  float trailAlpha = 1.0 - vTrailPosition * 0.8;

  // Age fade-in
  float ageFade = smoothstep(0.0, 0.15, vAge);

  // Color blending along trail
  // Head: primary color, Tail: secondary color
  vec3 color = mix(uColor1, uColor2, vTrailPosition);

  // Add accent highlights at particle head
  float accentMix = (1.0 - vTrailPosition) * 0.3;
  color = mix(color, uColor3, accentMix);

  // Color variety: add subtle hue variation based on particle color attribute
  color = mix(color, vColor, uColorVariety * 0.3);

  // Apply saturation
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);

  // Inner glow: brighter at center
  float glow = 1.0 - dist * 1.5;
  color *= 1.0 + glow * 0.3;

  // Final alpha - keep particles subtle so flow field shows through
  float finalAlpha = alpha * trailAlpha * ageFade * 0.4;

  gl_FragColor = vec4(color, finalAlpha);
}
