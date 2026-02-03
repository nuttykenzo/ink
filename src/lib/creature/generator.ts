/**
 * Main Creature Generator
 *
 * Composes all sub-generators to produce a complete Creature configuration
 * from visual parameters and session count.
 */

import type { VisualParams } from '../generation/params';
import type { Creature, CreatureColors } from './types';
import { getMaturityConfig } from './maturity';
import { generateBody } from './bodyGenerator';
import { generateEyes } from './eyeGenerator';
import { generateAppendages } from './appendageGenerator';
import { generateBehavior } from './behaviorGenerator';

/**
 * Generate creature color scheme from palette.
 */
function generateColors(palette: VisualParams['palette']): CreatureColors {
  return {
    body: [palette.primary.r, palette.primary.g, palette.primary.b],
    membrane: [
      palette.primary.r * 0.8 + palette.secondary.r * 0.2,
      palette.primary.g * 0.8 + palette.secondary.g * 0.2,
      palette.primary.b * 0.8 + palette.secondary.b * 0.2,
    ],
    accent: [palette.accent.r, palette.accent.g, palette.accent.b],
    nucleus: [
      Math.min(1, palette.accent.r * 1.2),
      Math.min(1, palette.accent.g * 1.2),
      Math.min(1, palette.accent.b * 1.2),
    ],
  };
}

/**
 * Generate a complete creature from visual parameters.
 *
 * @param params - Visual parameters from agent data
 * @param sessionsCount - Number of sessions for maturity calculation
 * @returns Complete creature configuration
 */
export function generateCreature(
  params: VisualParams,
  sessionsCount: number
): Creature {
  const { seed, traitVector, palette } = params;

  // Generate maturity from session count
  const maturity = getMaturityConfig(sessionsCount);

  // Generate all components
  const body = generateBody(traitVector, maturity, seed, palette);
  const eyes = generateEyes(traitVector, maturity, seed, palette);
  const appendages = generateAppendages(traitVector, maturity, seed);
  const behavior = generateBehavior(traitVector);
  const colors = generateColors(palette);

  return {
    seed,
    maturity,
    body,
    eyes,
    appendages,
    behavior,
    colors,
  };
}

/**
 * Generate a default creature for preview/placeholder.
 */
export function getDefaultCreature(): Creature {
  const defaultParams: VisualParams = {
    seed: 42,
    complexity: 5,
    layerCount: 3,
    palette: {
      primary: { r: 0, g: 0.9, b: 0.8 },
      secondary: { r: 1, g: 0.3, b: 0.3 },
      accent: { r: 0.66, g: 0.33, b: 0.97 },
      background: { r: 0.02, g: 0.03, b: 0.06 },
    },
    saturation: 0.7,
    colorVariety: 0.5,
    organicness: 0.5,
    animSpeed: 1,
    pulseIntensity: 0.5,
    particleCount: 5000,
    trailLength: 0.5,
    traitVector: {
      geometricOrganic: 0.5,
      connectedIsolated: 0.5,
      intensityScale: 0.5,
      motionTempo: 0.5,
    },
    formCount: 5,
    formScale: 0.18,
    sessionsCount: 50,
  };

  return generateCreature(defaultParams, defaultParams.sessionsCount);
}
