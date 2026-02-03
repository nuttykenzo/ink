// Creature Body Fragment Shader
// Renders body with membrane edge, inner glow, and optional nucleus
// Style modes: cosmic (geometric), bioluminescent (organic), lovecraftian

precision highp float;

// Uniforms
uniform float uTime;
uniform vec3 uBodyColor;        // Primary body color
uniform vec3 uMembraneColor;    // Edge/membrane color
uniform vec3 uAccentColor;      // Highlight color
uniform float uOpacity;         // Base opacity
uniform float uMembraneThickness; // Membrane edge thickness
uniform float uSaturation;      // Color saturation

// Style uniforms
uniform float uStyleMode;       // 0=cosmic, 1=bioluminescent, 2=lovecraftian, 3=balanced
uniform float uBioluminescence; // Glow intensity for organic (0-1)
uniform float uFractalDetail;   // Edge complexity for geometric (0-1)
uniform float uEerieIntensity;  // Unsettling effect intensity (0-1)

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
const float PI = 3.14159265359;

// Simplex noise for effects
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m * m * m;
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

  // ===========================================
  // STYLE-SPECIFIC EFFECTS
  // ===========================================

  // COSMIC/CRYSTALLINE (uStyleMode ~= 0)
  // Sharp facet lines, prismatic color shifts
  if (uStyleMode < 0.5) {
    // Facet pattern using angle
    float facetCount = 6.0 + uFractalDetail * 6.0;
    float facetAngle = mod(vAngle * facetCount, PI * 2.0);
    float facetLine = abs(sin(facetAngle * 3.0)) * 0.1 * uFractalDetail;
    color += uAccentColor * facetLine * vEdgeFactor;

    // Prismatic color shift at edges
    float prismatic = sin(vAngle * 5.0 + uTime * 0.5) * 0.1 * uFractalDetail;
    color.r += prismatic * vEdgeFactor;
    color.b -= prismatic * vEdgeFactor;

    // Sharper edge falloff
    float crystalEdge = pow(vEdgeFactor, 1.5);
    color = mix(color, uAccentColor, crystalEdge * 0.15 * uFractalDetail);
  }

  // BIOLUMINESCENT/ORGANIC (uStyleMode ~= 1)
  // Soft glowing edges, subsurface scatter simulation
  if (uStyleMode > 0.5 && uStyleMode < 1.5) {
    // Pulsing bioluminescent glow
    float bioGlow = sin(uTime * 1.5 + vNoiseOffset * 0.5) * 0.5 + 0.5;
    float glowStrength = (1.0 - vEdgeFactor) * uBioluminescence * bioGlow;
    color += uAccentColor * glowStrength * 0.4;

    // Subsurface scatter - light bleeding through edges
    float scatter = smoothstep(0.3, 0.8, vEdgeFactor) * uBioluminescence;
    color += uMembraneColor * scatter * 0.3;

    // Organic flowing patterns
    float flow = snoise(vec2(vAngle * 3.0 + uTime * 0.2, centerDist * 5.0));
    color += uAccentColor * flow * 0.1 * uBioluminescence * (1.0 - vEdgeFactor);
  }

  // LOVECRAFTIAN (uStyleMode ~= 2)
  // Eerie desaturation, unsettling color shifts, dark edges
  if (uStyleMode > 1.5 && uStyleMode < 2.5) {
    // Desaturate toward edges
    float eerieGray = dot(color, vec3(0.299, 0.587, 0.114));
    float desatAmount = vEdgeFactor * uEerieIntensity * 0.5;
    color = mix(color, vec3(eerieGray), desatAmount);

    // Eerie color shift (greenish tint at edges)
    color.g += vEdgeFactor * uEerieIntensity * 0.1;
    color.r -= vEdgeFactor * uEerieIntensity * 0.05;

    // Unsettling pulsation (irregular)
    float eerieNoise = snoise(vec2(vAngle * 2.0, uTime * 0.7 + vNoiseOffset));
    float eeriePulse = eerieNoise * 0.15 * uEerieIntensity;
    color *= 1.0 + eeriePulse * vEdgeFactor;

    // Dark edge vignette
    float darkEdge = pow(vEdgeFactor, 2.0) * uEerieIntensity * 0.3;
    color *= 1.0 - darkEdge;
  }

  // Apply saturation adjustment
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);

  // Alpha calculation
  // - Base alpha from opacity uniform
  // - Very subtle edge softness (reduced from 0.25 to 0.1 for more solid look)
  float edgeAlpha = 1.0 - vEdgeFactor * 0.1;
  float alpha = uOpacity * edgeAlpha;

  // Subtle pulse animation
  float pulseFreq = 2.0;
  float pulse = 1.0 + sin(uTime * pulseFreq + vNoiseOffset * 0.1) * 0.05;
  alpha *= pulse;

  gl_FragColor = vec4(color, alpha);
}
