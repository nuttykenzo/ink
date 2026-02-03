/**
 * Appendage Generator
 *
 * Generates appendage configurations from trait vector and maturity.
 * Maps traits to appendage type, count, and wave animation parameters.
 */

import type { TraitVector } from '../generation/traitVocabulary';
import type { AppendageConfig, AppendageType, MaturityConfig } from './types';

/**
 * Seeded random number generator.
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Linear interpolation.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Determine primary appendage type from traits.
 *
 * Mapping:
 * - geometricOrganic 0.0-0.3: spoke (rigid, radial)
 * - geometricOrganic 0.3-0.6 + connectedIsolated 0.0-0.5: limb (jointed)
 * - geometricOrganic 0.3-0.6 + connectedIsolated 0.5-1.0: tail (single trailing)
 * - geometricOrganic 0.6-1.0 + connectedIsolated 0.0-0.5: tendril (flowing)
 * - geometricOrganic 0.6-1.0 + connectedIsolated 0.5-1.0: tendril + tail
 */
function getAppendageTypes(traits: TraitVector): AppendageType[] {
  const { geometricOrganic, connectedIsolated } = traits;

  if (geometricOrganic < 0.3) {
    return ['spoke'];
  } else if (geometricOrganic < 0.6) {
    return connectedIsolated > 0.5 ? ['tail'] : ['limb'];
  } else {
    return connectedIsolated > 0.5 ? ['tendril', 'tail'] : ['tendril'];
  }
}

/**
 * Get appendage count based on type and maturity.
 */
function getAppendageCount(
  type: AppendageType,
  traits: TraitVector,
  maturity: MaturityConfig
): number {
  if (maturity.appendageComplexity === 0) return 0;

  const complexity = maturity.appendageComplexity;

  switch (type) {
    case 'spoke':
      // Radial: 4-8 spokes based on complexity
      return 4 + complexity * 2;
    case 'tendril':
      // Organic: 2-6 tendrils
      return 2 + complexity;
    case 'limb':
      // Bilateral: 2-4 limbs
      return 2 + Math.floor(complexity / 2);
    case 'tail':
      // Single tail
      return 1;
    case 'cilia':
      // Many small: 8-16
      return 8 + complexity * 4;
    case 'antenna':
      // 1-2 antenna
      return Math.min(2, complexity);
  }
}

/**
 * Get base parameters for appendage type.
 */
function getTypeParameters(type: AppendageType): {
  lengthRange: [number, number];
  thicknessRange: [number, number];
  segmentsRange: [number, number];
  taperRange: [number, number];
} {
  switch (type) {
    case 'spoke':
      return {
        lengthRange: [0.3, 0.5],
        thicknessRange: [0.02, 0.04],
        segmentsRange: [2, 4],
        taperRange: [0.3, 0.5],
      };
    case 'tendril':
      return {
        lengthRange: [0.5, 0.9],
        thicknessRange: [0.015, 0.03],
        segmentsRange: [6, 12],
        taperRange: [0.7, 0.9],
      };
    case 'limb':
      return {
        lengthRange: [0.3, 0.5],
        thicknessRange: [0.025, 0.04],
        segmentsRange: [3, 5],
        taperRange: [0.3, 0.5],
      };
    case 'tail':
      return {
        lengthRange: [0.6, 1.0],
        thicknessRange: [0.03, 0.05],
        segmentsRange: [8, 14],
        taperRange: [0.8, 0.95],
      };
    case 'cilia':
      return {
        lengthRange: [0.1, 0.2],
        thicknessRange: [0.005, 0.01],
        segmentsRange: [2, 3],
        taperRange: [0.5, 0.7],
      };
    case 'antenna':
      return {
        lengthRange: [0.4, 0.6],
        thicknessRange: [0.01, 0.02],
        segmentsRange: [4, 6],
        taperRange: [0.6, 0.8],
      };
  }
}

/**
 * Generate wave parameters for appendage animation.
 */
function generateWaveParams(
  type: AppendageType,
  traits: TraitVector,
  random: () => number
): AppendageConfig['wave'] {
  const { motionTempo, geometricOrganic } = traits;

  // Base wave amplitude from type
  const baseAmplitude = {
    spoke: 0.05,
    tendril: 0.2,
    limb: 0.1,
    tail: 0.25,
    cilia: 0.15,
    antenna: 0.1,
  }[type];

  // Modify by organic factor
  const amplitude = baseAmplitude * lerp(0.5, 1.5, geometricOrganic);

  // Frequency based on type and tempo
  const baseFrequency = {
    spoke: 0.5,
    tendril: 1.0,
    limb: 0.8,
    tail: 0.6,
    cilia: 2.0,
    antenna: 1.2,
  }[type];

  const frequency = baseFrequency * lerp(0.7, 1.5, motionTempo);

  // Speed correlates with motion tempo
  const speed = lerp(0.3, 1.2, motionTempo);

  // Random phase offset for variety
  const phase = random() * Math.PI * 2;

  return { amplitude, frequency, speed, phase };
}

/**
 * Calculate attachment angles for appendages.
 */
function getAttachmentAngles(
  type: AppendageType,
  count: number,
  random: () => number
): number[] {
  const angles: number[] = [];

  switch (type) {
    case 'spoke':
    case 'cilia':
      // Radial distribution
      for (let i = 0; i < count; i++) {
        const baseAngle = (i / count) * Math.PI * 2;
        const jitter = (random() - 0.5) * 0.2;
        angles.push(baseAngle + jitter);
      }
      break;

    case 'tendril':
    case 'limb':
      // Bilateral/semi-symmetric
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const baseAngle = Math.PI / 2 + side * (0.3 + (Math.floor(i / 2) * 0.4));
        const jitter = (random() - 0.5) * 0.2;
        angles.push(baseAngle + jitter);
      }
      break;

    case 'tail':
      // Single, pointing down/back
      angles.push(Math.PI * 1.5 + (random() - 0.5) * 0.3);
      break;

    case 'antenna':
      // Top of head, angled outward
      for (let i = 0; i < count; i++) {
        const spread = 0.3 + random() * 0.2;
        const side = i % 2 === 0 ? -1 : 1;
        angles.push(Math.PI / 2 + side * spread);
      }
      break;
  }

  return angles;
}

/**
 * Generate a single appendage configuration.
 */
function generateSingleAppendage(
  type: AppendageType,
  attachAngle: number,
  traits: TraitVector,
  maturity: MaturityConfig,
  random: () => number
): AppendageConfig {
  const params = getTypeParameters(type);

  // Scale parameters with maturity detail level
  const detailScale = 0.7 + maturity.detailLevel * 0.6;

  const length = lerp(params.lengthRange[0], params.lengthRange[1], random()) * detailScale;
  const thickness = lerp(params.thicknessRange[0], params.thicknessRange[1], random());
  const segments = Math.round(lerp(params.segmentsRange[0], params.segmentsRange[1], random()));
  const taper = lerp(params.taperRange[0], params.taperRange[1], random());

  const wave = generateWaveParams(type, traits, random);

  return {
    type,
    attachAngle,
    length,
    thickness,
    segments,
    taper,
    wave,
  };
}

/**
 * Generate appendage configurations from traits and maturity.
 *
 * @param traits - 4D trait vector from agent
 * @param maturity - Maturity configuration from session count
 * @param seed - Deterministic seed for randomness
 * @returns Array of appendage configurations
 */
export function generateAppendages(
  traits: TraitVector,
  maturity: MaturityConfig,
  seed: number
): AppendageConfig[] {
  if (maturity.appendageComplexity === 0) {
    return [];
  }

  const random = createSeededRandom(seed + 3000);
  const types = getAppendageTypes(traits);
  const appendages: AppendageConfig[] = [];

  for (const type of types) {
    const count = getAppendageCount(type, traits, maturity);
    const angles = getAttachmentAngles(type, count, random);

    for (let i = 0; i < count; i++) {
      appendages.push(
        generateSingleAppendage(type, angles[i], traits, maturity, random)
      );
    }
  }

  return appendages;
}
