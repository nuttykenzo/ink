// Characteristic Form Fragment Shader
// Renders bio-digital forms with edge glow, color variation, and subtle animation

precision highp float;

// Uniforms
uniform float uTime;
uniform vec3 uColor1;           // Primary color from palette
uniform vec3 uColor2;           // Secondary color from palette
uniform vec3 uColor3;           // Accent color from palette
uniform float uSaturation;      // Color saturation
uniform float uIntensity;       // Form prominence (intensityScale)
uniform float uOrganicFactor;   // Organic vs geometric (geometricOrganic)
uniform float uMotionTempo;     // Animation speed

// Varyings from vertex shader
varying float vFormIndex;
varying float vEdgeFactor;
varying vec2 vLocalPos;
varying float vNoiseOffset;

// Golden ratio for aesthetically pleasing distribution
const float PHI = 1.61803398875;

void main() {
  // Animated time
  float animTime = uTime * (0.3 + uMotionTempo * 0.7);

  // Base color selection using golden ratio for pleasing distribution
  // Each form gets a unique position on the color spectrum
  float colorPhase = fract(vFormIndex * (1.0 / PHI));

  // Blend between color1 and color2 based on form index
  vec3 baseColor = mix(uColor1, uColor2, colorPhase);

  // Add accent color influence based on edge factor
  // Edges get more accent color for a glow effect
  float accentMix = vEdgeFactor * 0.4;
  vec3 color = mix(baseColor, uColor3, accentMix);

  // Interior gradient: darker toward center, brighter at edges
  // This gives forms a subtle 3D quality
  float centerDist = length(vLocalPos);
  float interiorShade = 0.85 + vEdgeFactor * 0.15;
  color *= interiorShade;

  // Subtle hue shift based on organic factor
  // More organic forms have slight color variation across surface
  if (uOrganicFactor > 0.3) {
    float hueShift = sin(vNoiseOffset * 0.5 + animTime * 0.2) * uOrganicFactor * 0.1;
    // Rotate color slightly in RGB space
    float c = cos(hueShift);
    float s = sin(hueShift);
    color = vec3(
      color.r * c - color.g * s * 0.5,
      color.g * c + color.r * s * 0.5,
      color.b
    );
  }

  // Apply saturation adjustment
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);

  // Edge glow: soft bright edge
  float edgeGlow = smoothstep(0.5, 1.0, vEdgeFactor);
  color += uColor3 * edgeGlow * 0.4;

  // Alpha calculation
  // - Base alpha from intensity
  // - Edges slightly more transparent for soft look
  // - Center more opaque
  float baseAlpha = 0.45 + uIntensity * 0.35; // 0.45-0.8 range
  float edgeAlpha = 1.0 - vEdgeFactor * 0.3;  // Edges fade out gently
  float alpha = baseAlpha * edgeAlpha;

  // Subtle pulse animation per form
  float pulseFreq = 2.0 + vFormIndex * 0.5;
  float pulsePhase = vFormIndex * 2.3;
  float pulse = 1.0 + sin(animTime * pulseFreq + pulsePhase) * 0.08;
  alpha *= pulse;

  // Very subtle inner glow at center
  float innerGlow = 1.0 - smoothstep(0.0, 0.5, centerDist);
  color += uColor1 * innerGlow * 0.1;

  gl_FragColor = vec4(color, alpha);
}
