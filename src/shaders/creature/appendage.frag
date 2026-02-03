// Appendage Fragment Shader
// Colors appendage with gradient, lighting, and type-specific effects

precision highp float;

// Uniforms
uniform vec3 uBodyColor;
uniform vec3 uAccentColor;
uniform vec3 uMembraneColor;
uniform float uOpacity;
uniform float uTime;
uniform float uAppendageType;    // 0=spoke, 1=tendril, 2=limb, 3=tail, 4=cilia, 5=antenna
uniform float uGlowIntensity;    // For bioluminescent style

// Varyings from vertex shader
varying float vSegmentT;
varying float vCircumferenceT;
varying vec3 vNormal;
varying float vWaveOffset;

// Constants
const float PI = 3.14159265359;

void main() {
  // Base gradient from body color (base) to accent (tip)
  float gradientT = vSegmentT;

  // Type-specific color behavior
  float accentBlend = 0.0;
  float rimLight = 0.0;
  float innerGlow = 0.0;

  if (uAppendageType < 0.5) {
    // Spoke: solid color, minimal gradient, sharp edges
    accentBlend = gradientT * 0.3;
    rimLight = 0.2;
  } else if (uAppendageType < 1.5) {
    // Tendril: strong gradient, soft glow, organic
    accentBlend = gradientT * 0.7;
    rimLight = 0.4;
    innerGlow = 0.3;
  } else if (uAppendageType < 2.5) {
    // Limb: moderate gradient, structured
    accentBlend = gradientT * 0.4;
    rimLight = 0.3;
  } else if (uAppendageType < 3.5) {
    // Tail: elegant gradient, flowing
    accentBlend = gradientT * 0.6;
    rimLight = 0.35;
    innerGlow = 0.2;
  } else if (uAppendageType < 4.5) {
    // Cilia: subtle color, translucent
    accentBlend = gradientT * 0.25;
    rimLight = 0.1;
  } else {
    // Antenna: tip glow, sensory bulb
    accentBlend = pow(gradientT, 2.0) * 0.8; // Concentrated at tip
    rimLight = 0.2;
    innerGlow = gradientT * 0.5; // Tip glows
  }

  // Mix colors
  vec3 color = mix(uBodyColor, uAccentColor, accentBlend);

  // Add membrane color at edges (based on circumference)
  float edgeFactor = abs(cos(vCircumferenceT * PI * 2.0));
  color = mix(color, uMembraneColor, edgeFactor * 0.3);

  // Lighting based on normal
  float lighting = 0.6 + 0.4 * max(0.0, vNormal.x);
  color *= lighting;

  // Rim light effect (highlights edges)
  float rim = pow(1.0 - abs(cos(vCircumferenceT * PI * 2.0)), 2.0);
  color += uAccentColor * rim * rimLight;

  // Inner glow for organic appendages
  if (innerGlow > 0.0) {
    float glowPulse = 0.5 + 0.5 * sin(uTime * 2.0 + vSegmentT * PI);
    color += uAccentColor * innerGlow * glowPulse * uGlowIntensity;
  }

  // Subtle wave-based color shift (movement = slight highlight)
  float waveHighlight = abs(vWaveOffset) * 0.5;
  color += uAccentColor * waveHighlight * 0.2;

  // Alpha: fade toward tip, more transparent at edges
  float baseAlpha = uOpacity;
  float tipFade = 1.0 - vSegmentT * 0.4;
  float edgeFade = 0.8 + 0.2 * (1.0 - edgeFactor);
  float alpha = baseAlpha * tipFade * edgeFade;

  // Cilia are more transparent
  if (uAppendageType > 3.5 && uAppendageType < 4.5) {
    alpha *= 0.6;
  }

  gl_FragColor = vec4(color, alpha);
}
