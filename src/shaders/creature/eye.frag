// Creature Eye Fragment Shader
// Renders realistic eye with iris, pupil, gaze, blink, and specular highlights
// This is the "soul" of the creature - critical for emotional connection

precision highp float;

// Uniforms
uniform float uTime;
uniform vec2 uGazeOffset;       // -1 to 1, shifts pupil/iris position
uniform float uPupilDilation;   // 0-1 (maps to dilationRange)
uniform float uBlinkAmount;     // 0=open, 1=closed
uniform vec3 uIrisColor;        // Base iris color
uniform vec3 uPupilColor;       // Pupil color (usually very dark)
uniform float uIrisRings;       // Number of concentric rings
uniform float uFiberDensity;    // Radial fiber count
uniform int uPupilShape;        // 0=round, 1=vertical, 2=horizontal, 3=star
uniform float uPupilSize;       // Base pupil size (fraction of iris)
uniform bool uGlowing;          // Whether pupil glows
uniform vec3 uGlowColor;        // Glow color if glowing
uniform int uIrisPattern;       // 0=rings, 1=radial, 2=spiral, 3=organic

// Varyings from vertex shader
varying vec2 vUv;

// Constants
const float PI = 3.14159265359;
const float IRIS_RADIUS = 0.65;
const float LIMBUS_WIDTH = 0.08;

// Pseudo-random for procedural patterns
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Smooth noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Iris ring pattern
float irisRingsPattern(vec2 p, float rings) {
  float dist = length(p);
  float ringPattern = sin(dist * rings * PI * 2.0) * 0.5 + 0.5;
  return ringPattern * 0.3;
}

// Iris radial fiber pattern
float irisRadialPattern(vec2 p, float density) {
  float angle = atan(p.y, p.x);
  float dist = length(p);

  // Radial fibers
  float fibers = sin(angle * density) * 0.5 + 0.5;
  fibers *= smoothstep(0.0, 0.3, dist); // Fade toward center

  // Add some noise for organic feel
  float n = noise(p * 10.0 + uTime * 0.1);

  return (fibers * 0.3 + n * 0.15) * (1.0 - dist * 0.5);
}

// Iris spiral pattern
float irisSpiralPattern(vec2 p, float density) {
  float angle = atan(p.y, p.x);
  float dist = length(p);

  // Spiral
  float spiral = sin(angle * density * 0.5 + dist * 8.0) * 0.5 + 0.5;
  spiral *= smoothstep(0.0, 0.2, dist);

  return spiral * 0.25;
}

// Iris organic pattern
float irisOrganicPattern(vec2 p) {
  float dist = length(p);

  // Multiple layers of noise
  float n1 = fbm(p * 5.0, 3);
  float n2 = fbm(p * 10.0 + 3.7, 2);

  // Radial gradient
  float radial = 1.0 - dist;

  return (n1 * 0.3 + n2 * 0.2) * radial;
}

// Combined iris pattern based on type
float getIrisPattern(vec2 p) {
  if (uIrisPattern == 0) {
    return irisRingsPattern(p, uIrisRings);
  } else if (uIrisPattern == 1) {
    return irisRadialPattern(p, uFiberDensity);
  } else if (uIrisPattern == 2) {
    return irisSpiralPattern(p, uFiberDensity);
  } else {
    return irisOrganicPattern(p);
  }
}

// Pupil SDF based on shape
float pupilSDF(vec2 p, float size) {
  if (uPupilShape == 0) {
    // Round
    return length(p) - size;
  } else if (uPupilShape == 1) {
    // Vertical slit
    vec2 scaled = vec2(p.x * 3.0, p.y);
    return length(scaled) - size;
  } else if (uPupilShape == 2) {
    // Horizontal slit
    vec2 scaled = vec2(p.x, p.y * 3.0);
    return length(scaled) - size;
  } else {
    // Star (4-pointed)
    float angle = atan(p.y, p.x);
    float dist = length(p);
    float star = 1.0 + sin(angle * 4.0) * 0.3;
    return dist * star - size;
  }
}

void main() {
  // Center UV at origin (-1 to 1)
  vec2 uv = vUv * 2.0 - 1.0;

  // Apply blink (vertical squash)
  float blinkSquash = 1.0 - uBlinkAmount * 0.95;
  if (abs(uv.y / blinkSquash) > 1.0) {
    discard; // Outside squashed eye
  }
  vec2 blinkUv = vec2(uv.x, uv.y / blinkSquash);

  // Distance from center (for sclera)
  float scleraDist = length(blinkUv);

  // Discard outside eye
  if (scleraDist > 1.0) {
    discard;
  }

  // === SCLERA (white of eye) ===
  vec3 scleraColor = vec3(0.95, 0.95, 0.93);
  // Slight darkening toward edges
  scleraColor *= 1.0 - smoothstep(0.6, 1.0, scleraDist) * 0.15;

  // === IRIS ===
  // Shift iris/pupil by gaze offset
  vec2 irisCenter = blinkUv - uGazeOffset * 0.25;
  float irisDist = length(irisCenter);

  // Iris mask (inside iris radius)
  float irisMask = 1.0 - smoothstep(IRIS_RADIUS - 0.02, IRIS_RADIUS, irisDist);

  // Limbus darkening (dark ring at iris edge)
  float limbus = smoothstep(IRIS_RADIUS - LIMBUS_WIDTH, IRIS_RADIUS, irisDist);
  limbus *= smoothstep(IRIS_RADIUS + 0.02, IRIS_RADIUS - 0.02, irisDist);

  // Iris color with pattern
  vec2 irisUvNorm = irisCenter / IRIS_RADIUS;
  float pattern = getIrisPattern(irisUvNorm);
  vec3 irisColor = uIrisColor * (0.6 + pattern * 0.6);

  // Darken iris toward center and at limbus
  irisColor *= 1.0 - limbus * 0.4;
  irisColor *= 0.85 + (1.0 - irisDist / IRIS_RADIUS) * 0.15;

  // === PUPIL ===
  float pupilRadius = uPupilSize * IRIS_RADIUS;
  float pupilDist = pupilSDF(irisCenter, pupilRadius);

  // Soft pupil edge
  float pupilMask = 1.0 - smoothstep(-0.02, 0.02, pupilDist);

  // Pupil color (very dark, or glowing)
  vec3 pupilColor = uGlowing ? uGlowColor * 0.3 : uPupilColor;

  // Pupil glow effect
  float glowAmount = 0.0;
  if (uGlowing) {
    glowAmount = (1.0 - smoothstep(0.0, pupilRadius * 2.0, length(irisCenter))) * 0.5;
  }

  // === SPECULAR HIGHLIGHTS ===
  // Primary highlight (life spark)
  vec2 specPos1 = vec2(-0.22, 0.28);
  float spec1 = 1.0 - smoothstep(0.0, 0.1, length(blinkUv - specPos1));

  // Secondary smaller highlight
  vec2 specPos2 = vec2(0.12, 0.18);
  float spec2 = 1.0 - smoothstep(0.0, 0.05, length(blinkUv - specPos2));

  float specular = spec1 * 0.9 + spec2 * 0.4;

  // === COMPOSITE ===
  vec3 color = scleraColor;

  // Apply iris
  color = mix(color, irisColor, irisMask);

  // Apply pupil
  color = mix(color, pupilColor, pupilMask * irisMask);

  // Apply pupil glow
  if (uGlowing) {
    color += uGlowColor * glowAmount * irisMask;
  }

  // Apply specular highlights (on top of everything)
  color += vec3(1.0) * specular * 0.8;

  // === ALPHA ===
  // Soft edge at sclera boundary
  float alpha = 1.0 - smoothstep(0.95, 1.0, scleraDist);

  // Blink affects alpha at edges
  float blinkEdge = abs(uv.y) / blinkSquash;
  alpha *= 1.0 - smoothstep(0.85, 1.0, blinkEdge) * 0.5;

  gl_FragColor = vec4(color, alpha);
}
