// Appendage Vertex Shader
// Renders segmented tube with wave animation

precision highp float;

// Attributes
attribute float aSegmentT;       // 0-1 position along appendage length
attribute float aCircumferenceT; // 0-1 position around circumference
attribute float aBaseRadius;     // Original radius at this segment

// Uniforms
uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uWavePhase;
uniform float uBreathPhase;
uniform float uAppendageType;    // 0=spoke, 1=tendril, 2=limb, 3=tail, 4=cilia, 5=antenna
uniform vec2 uAttachPoint;       // Body edge attachment position
uniform float uAttachAngle;      // Attachment angle in radians

// Varyings to fragment shader
varying float vSegmentT;
varying float vCircumferenceT;
varying vec3 vNormal;
varying float vWaveOffset;

// Constants
const float PI = 3.14159265359;

// Simplex noise for organic motion
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vSegmentT = aSegmentT;
  vCircumferenceT = aCircumferenceT;

  vec3 pos = position;

  // Type-specific wave behavior
  float waveMultiplier = 1.0;
  float tipBoost = 1.0;
  float noiseAmount = 0.0;

  // 0=spoke (rigid), 1=tendril (flowing), 2=limb (jointed),
  // 3=tail (graceful), 4=cilia (rapid), 5=antenna (sensing)
  if (uAppendageType < 0.5) {
    // Spoke: minimal wave, rigid feel
    waveMultiplier = 0.3;
    tipBoost = 0.5;
  } else if (uAppendageType < 1.5) {
    // Tendril: high wave, organic noise
    waveMultiplier = 1.5;
    tipBoost = 2.0;
    noiseAmount = 0.3;
  } else if (uAppendageType < 2.5) {
    // Limb: medium wave, slight noise
    waveMultiplier = 0.8;
    tipBoost = 1.0;
    noiseAmount = 0.1;
  } else if (uAppendageType < 3.5) {
    // Tail: graceful S-curve
    waveMultiplier = 1.2;
    tipBoost = 1.5;
    noiseAmount = 0.15;
  } else if (uAppendageType < 4.5) {
    // Cilia: rapid small waves
    waveMultiplier = 2.0;
    tipBoost = 0.8;
  } else {
    // Antenna: subtle sensing motion
    waveMultiplier = 0.5;
    tipBoost = 1.2;
    noiseAmount = 0.2;
  }

  // Primary wave animation - propagates from base to tip
  float wavePhase = uWavePhase + aSegmentT * uWaveFrequency * PI * 2.0;
  float wave = sin(uTime * uWaveSpeed + wavePhase) * uWaveAmplitude * waveMultiplier;

  // Wave increases toward tip (more movement at end)
  wave *= aSegmentT * tipBoost;

  // Secondary wave for organic movement
  float secondaryWave = 0.0;
  if (noiseAmount > 0.0) {
    secondaryWave = snoise(vec3(aSegmentT * 3.0, uTime * 0.5, uWavePhase)) * noiseAmount * aSegmentT;
  }

  // Combine waves
  float totalWave = wave + secondaryWave;
  vWaveOffset = totalWave;

  // Apply wave as lateral displacement (perpendicular to appendage direction)
  pos.x += totalWave;

  // Breathing affects base more than tip - subtle connection to body
  float breathEffect = (1.0 - aSegmentT) * 0.05;
  float breathOffset = sin(uBreathPhase) * breathEffect;
  pos.y += breathOffset;

  // Calculate normal for lighting (approximate)
  float angle = aCircumferenceT * PI * 2.0;
  vNormal = normalize(vec3(cos(angle), 0.0, sin(angle)));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
