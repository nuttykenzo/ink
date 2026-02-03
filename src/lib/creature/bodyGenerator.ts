/**
 * Body Generator
 *
 * Generates creature body configuration from trait vector and maturity.
 * Maps traits to body plan, membrane properties, and optional nucleus.
 */

import type { TraitVector } from '../generation/traitVocabulary';
import type { BodyConfig, BodyPlan, MaturityConfig } from './types';

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
 * Determine body plan from traits.
 *
 * Mapping:
 * - geometricOrganic 0.0-0.3: radial (crystalline, geometric)
 * - geometricOrganic 0.3-0.7 + connectedIsolated 0.0-0.5: bilateral (relatable)
 * - geometricOrganic 0.3-0.7 + connectedIsolated 0.5-1.0: asymmetric (unique)
 * - geometricOrganic 0.7-1.0: bilateral (organic)
 */
function getBodyPlan(traits: TraitVector): BodyPlan {
  const { geometricOrganic, connectedIsolated } = traits;

  if (geometricOrganic < 0.3) {
    return 'radial';
  } else if (geometricOrganic > 0.7) {
    return 'bilateral';
  } else {
    // Middle range: connectivity determines bilateral vs asymmetric
    return connectedIsolated > 0.5 ? 'asymmetric' : 'bilateral';
  }
}

/**
 * Get vertex resolution based on body plan and maturity.
 */
function getResolution(plan: BodyPlan, maturity: MaturityConfig): number {
  const baseResolution = {
    radial: 6, // Fewer vertices for geometric look
    bilateral: 24, // More for smooth curves
    asymmetric: 32, // Most for organic irregularity
  };

  // Scale with detail level
  const base = baseResolution[plan];
  const scaled = Math.round(base * (1 + maturity.detailLevel * 0.5));

  return Math.min(64, scaled); // Cap at 64 vertices
}

/**
 * Generate membrane configuration from traits.
 */
function generateMembrane(
  traits: TraitVector,
  maturity: MaturityConfig
): BodyConfig['membrane'] {
  const { geometricOrganic, motionTempo, intensityScale } = traits;

  // Thickness: geometric = thicker membrane, organic = thinner
  const thickness = lerp(0.15, 0.05, geometricOrganic);

  // Opacity: intensity affects how solid the body appears
  const opacity = lerp(0.5, 0.85, intensityScale);

  // Breath amplitude: organic forms breathe more visibly
  const breathAmplitude = lerp(0.02, 0.08, geometricOrganic) * (0.8 + maturity.detailLevel * 0.4);

  // Breath rate: motion tempo affects breathing speed
  // Slow tempo = slow breathing (6 bpm), fast = faster (16 bpm)
  const breathRate = lerp(0.1, 0.27, motionTempo); // cycles per second (6-16 bpm)

  return {
    thickness,
    opacity,
    breathAmplitude,
    breathRate,
  };
}

/**
 * Generate nucleus configuration if maturity allows.
 */
function generateNucleus(
  traits: TraitVector,
  maturity: MaturityConfig,
  random: () => number,
  palette: { primary: { r: number; g: number; b: number } }
): BodyConfig['nucleus'] | undefined {
  if (!maturity.hasNucleus) {
    return undefined;
  }

  const { geometricOrganic, intensityScale } = traits;

  // Position: geometric = centered, organic = offset
  const offsetAmount = geometricOrganic * 0.2;
  const angle = random() * Math.PI * 2;
  const position: [number, number] = [
    Math.cos(angle) * offsetAmount,
    Math.sin(angle) * offsetAmount,
  ];

  // Size: scales with maturity
  const size = lerp(0.15, 0.25, maturity.detailLevel);

  // Pulse rate: correlates with intensity
  const pulseRate = lerp(0.3, 0.8, intensityScale);

  // Color: brighter version of primary palette color
  const color: [number, number, number] = [
    Math.min(1, palette.primary.r * 1.3),
    Math.min(1, palette.primary.g * 1.3),
    Math.min(1, palette.primary.b * 1.3),
  ];

  return {
    position,
    size,
    pulseRate,
    color,
  };
}

/**
 * Generate body configuration from traits and maturity.
 *
 * @param traits - 4D trait vector from agent
 * @param maturity - Maturity configuration from session count
 * @param seed - Deterministic seed for randomness
 * @param palette - Color palette for nucleus color
 * @returns Body configuration
 */
export function generateBody(
  traits: TraitVector,
  maturity: MaturityConfig,
  seed: number,
  palette: { primary: { r: number; g: number; b: number } }
): BodyConfig {
  const random = createSeededRandom(seed + 1000);
  const plan = getBodyPlan(traits);

  // Base radius: scales with intensity (0.15 - 0.28)
  const radius = lerp(0.15, 0.28, traits.intensityScale);

  // Aspect ratio based on body plan
  let aspect: [number, number];
  switch (plan) {
    case 'radial':
      // Radial: nearly circular with slight variation
      aspect = [1 + (random() - 0.5) * 0.1, 1 + (random() - 0.5) * 0.1];
      break;
    case 'bilateral':
      // Bilateral: slightly tall or wide
      const isWide = random() > 0.5;
      aspect = isWide ? [1.15 + random() * 0.15, 0.9] : [0.9, 1.15 + random() * 0.15];
      break;
    case 'asymmetric':
      // Asymmetric: more pronounced asymmetry
      aspect = [
        0.85 + random() * 0.4,
        0.85 + random() * 0.4,
      ];
      break;
  }

  // Irregularity: organic forms have more irregular edges
  const irregularity = lerp(0.02, 0.2, traits.geometricOrganic);

  // Resolution
  const resolution = getResolution(plan, maturity);

  // Membrane
  const membrane = generateMembrane(traits, maturity);

  // Nucleus (if mature enough)
  const nucleus = generateNucleus(traits, maturity, random, palette);

  return {
    plan,
    radius,
    aspect,
    irregularity,
    resolution,
    membrane,
    nucleus,
  };
}
