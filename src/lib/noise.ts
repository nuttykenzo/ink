/**
 * Simplex Noise Implementation for TypeScript
 * Matches the GLSL implementation in src/shaders/noise.glsl exactly
 * Used for CPU-side particle physics simulation
 */

// Permutation helper - matches GLSL permute()
function permute(x: number): number {
  return ((x * 34.0 + 1.0) * x) % 289.0;
}

// Floor helper
function floor(x: number): number {
  return Math.floor(x);
}

// Fract helper
function fract(x: number): number {
  return x - Math.floor(x);
}

/**
 * 2D Simplex Noise
 * Returns value in range approximately [-1, 1]
 * Matches GLSL snoise() exactly
 */
export function snoise2D(x: number, y: number): number {
  // Constants from GLSL
  const C_x = 0.211324865405187;   // (3.0 - sqrt(3.0)) / 6.0
  const C_y = 0.366025403784439;   // 0.5 * (sqrt(3.0) - 1.0)
  const C_z = -0.577350269189626;  // -1.0 + 2.0 * C.x
  const C_w = 0.024390243902439;   // 1.0 / 41.0

  // Skew input space
  const dot_vy = x * C_y + y * C_y;
  const i_x = floor(x + dot_vy);
  const i_y = floor(y + dot_vy);

  const dot_ix = i_x * C_x + i_y * C_x;
  const x0_x = x - i_x + dot_ix;
  const x0_y = y - i_y + dot_ix;

  // Determine simplex
  const i1_x = x0_x > x0_y ? 1.0 : 0.0;
  const i1_y = x0_x > x0_y ? 0.0 : 1.0;

  // Offsets for corners
  const x12_x = x0_x + C_x - i1_x;
  const x12_y = x0_y + C_x - i1_y;
  const x12_z = x0_x + C_z;
  const x12_w = x0_y + C_z;

  // Wrap indices
  const i_x_mod = ((i_x % 289.0) + 289.0) % 289.0;
  const i_y_mod = ((i_y % 289.0) + 289.0) % 289.0;

  // Permutation
  const p0 = permute(permute(i_y_mod) + i_x_mod);
  const p1 = permute(permute(i_y_mod + i1_y) + i_x_mod + i1_x);
  const p2 = permute(permute(i_y_mod + 1.0) + i_x_mod + 1.0);

  // Gradients
  let m0 = Math.max(0.5 - (x0_x * x0_x + x0_y * x0_y), 0.0);
  let m1 = Math.max(0.5 - (x12_x * x12_x + x12_y * x12_y), 0.0);
  let m2 = Math.max(0.5 - (x12_z * x12_z + x12_w * x12_w), 0.0);

  m0 = m0 * m0 * m0 * m0;
  m1 = m1 * m1 * m1 * m1;
  m2 = m2 * m2 * m2 * m2;

  const x0 = 2.0 * fract(p0 * C_w) - 1.0;
  const x1 = 2.0 * fract(p1 * C_w) - 1.0;
  const x2 = 2.0 * fract(p2 * C_w) - 1.0;

  const h0 = Math.abs(x0) - 0.5;
  const h1 = Math.abs(x1) - 0.5;
  const h2 = Math.abs(x2) - 0.5;

  const ox0 = floor(x0 + 0.5);
  const ox1 = floor(x1 + 0.5);
  const ox2 = floor(x2 + 0.5);

  const a0_0 = x0 - ox0;
  const a0_1 = x1 - ox1;
  const a0_2 = x2 - ox2;

  m0 *= 1.79284291400159 - 0.85373472095314 * (a0_0 * a0_0 + h0 * h0);
  m1 *= 1.79284291400159 - 0.85373472095314 * (a0_1 * a0_1 + h1 * h1);
  m2 *= 1.79284291400159 - 0.85373472095314 * (a0_2 * a0_2 + h2 * h2);

  const g0 = a0_0 * x0_x + h0 * x0_y;
  const g1 = a0_1 * x12_x + h1 * x12_y;
  const g2 = a0_2 * x12_z + h2 * x12_w;

  return 130.0 * (m0 * g0 + m1 * g1 + m2 * g2);
}

/**
 * Fractal Brownian Motion
 * Combines 5 octaves of Simplex noise
 */
export function fbm(x: number, y: number, seed: number): number {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 1.0;

  for (let i = 0; i < 5; i++) {
    value += amplitude * snoise2D(x * frequency + seed, y * frequency + seed);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

/**
 * Get flow field velocity at a position
 * Used for particle advection - particles follow this velocity field
 * Matches GLSL getFlowVelocity() exactly
 *
 * @returns [vx, vy] velocity vector (normalized)
 */
export function getFlowVelocity(
  posX: number,
  posY: number,
  time: number,
  seed: number,
  complexity: number,
  organicness: number
): [number, number] {
  const s = seed * 0.001;
  const t = time * 0.1;

  // Domain warping (same as flowField.frag main())
  const q_x = fbm(posX * complexity + s, posY * complexity + s, s);
  const q_y = fbm(posX * complexity + 5.2 + s, posY * complexity + 1.3 + s, s + 1.0);

  const r_x = fbm(
    posX * complexity + 4.0 * q_x + 1.7 + t,
    posY * complexity + 4.0 * q_y + 9.2 + t,
    s + 2.0
  );
  const r_y = fbm(
    posX * complexity + 4.0 * q_x + 8.3 + t,
    posY * complexity + 4.0 * q_y + 2.8 + t,
    s + 3.0
  );

  // Compute gradient via central difference
  const eps = 0.01;
  const warpedX = posX * complexity + 4.0 * r_x * organicness;
  const warpedY = posY * complexity + 4.0 * r_y * organicness;

  const f0 = fbm(warpedX, warpedY, s + 4.0);
  const fx = fbm(warpedX + eps, warpedY, s + 4.0);
  const fy = fbm(warpedX, warpedY + eps, s + 4.0);

  // Gradient
  const gradX = (fx - f0) / eps;
  const gradY = (fy - f0) / eps;

  // Rotate 90 degrees for curl (more interesting flow)
  let vx = -gradY;
  let vy = gradX;

  // Normalize
  const len = Math.sqrt(vx * vx + vy * vy);
  if (len > 0.001) {
    vx /= len;
    vy /= len;
  }

  return [vx, vy];
}
