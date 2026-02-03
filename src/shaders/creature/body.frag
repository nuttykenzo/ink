// Creature Body Fragment Shader
// Renders body with membrane edge, inner glow, and optional nucleus

precision highp float;

// Uniforms
uniform float uTime;
uniform vec3 uBodyColor;        // Primary body color
uniform vec3 uMembraneColor;    // Edge/membrane color
uniform vec3 uAccentColor;      // Highlight color
uniform float uOpacity;         // Base opacity
uniform float uMembraneThickness; // Membrane edge thickness
uniform float uSaturation;      // Color saturation

// Nucleus uniforms (optional)
uniform bool uHasNucleus;
uniform vec2 uNucleusPos;       // Nucleus position offset
uniform float uNucleusSize;     // Nucleus radius
uniform float uNucleusPulse;    // Current pulse phase
uniform vec3 uNucleusColor;     // Nucleus glow color

// Varyings from vertex shader
varying float vEdgeFactor;
varying vec2 vLocalPos;
varying float vNoiseOffset;
varying float vAngle;

// Golden ratio for aesthetics
const float PHI = 1.61803398875;

void main() {
  // Distance from center (normalized)
  float centerDist = length(vLocalPos);

  // Base color with interior gradient
  // Slightly darker toward center for depth
  float interiorShade = 0.85 + vEdgeFactor * 0.15;
  vec3 color = uBodyColor * interiorShade;

  // Membrane edge effect
  // Smooth transition to membrane color at edges
  float membraneStart = 1.0 - uMembraneThickness;
  float membraneFactor = smoothstep(membraneStart, 1.0, vEdgeFactor);
  color = mix(color, uMembraneColor, membraneFactor * 0.6);

  // Edge glow (accent color at very edge)
  float edgeGlow = smoothstep(0.7, 1.0, vEdgeFactor);
  color += uAccentColor * edgeGlow * 0.25;

  // Subtle inner glow at center
  float innerGlow = 1.0 - smoothstep(0.0, 0.4, centerDist);
  color += uBodyColor * innerGlow * 0.15;

  // Nucleus rendering (if present)
  if (uHasNucleus) {
    vec2 nucleusCenter = uNucleusPos;
    float nucleusDist = length(vLocalPos - nucleusCenter);

    // Nucleus glow - soft radial gradient
    float nucleusGlow = 1.0 - smoothstep(0.0, uNucleusSize, nucleusDist);

    // Pulse animation
    float pulse = 1.0 + sin(uNucleusPulse) * 0.15;
    nucleusGlow *= pulse;

    // Add nucleus glow to color
    color += uNucleusColor * nucleusGlow * 0.5;
  }

  // Apply saturation adjustment
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);

  // Alpha calculation
  // - Base alpha from opacity uniform
  // - Edges slightly more transparent for soft look
  // - Center more opaque
  float edgeAlpha = 1.0 - vEdgeFactor * 0.25;
  float alpha = uOpacity * edgeAlpha;

  // Subtle pulse animation
  float pulseFreq = 2.0;
  float pulse = 1.0 + sin(uTime * pulseFreq + vNoiseOffset * 0.1) * 0.05;
  alpha *= pulse;

  gl_FragColor = vec4(color, alpha);
}
