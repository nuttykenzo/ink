/**
 * Style Generator
 *
 * Generates creature visual style from trait vector.
 * Maps traits to style mode and effect parameters.
 */

import type { TraitVector } from '../generation/traitVocabulary';

/**
 * Style modes for creature rendering.
 */
export type StyleMode = 'cosmic' | 'bioluminescent' | 'lovecraftian' | 'balanced';

/**
 * Style configuration for creature shaders.
 */
export interface CreatureStyle {
  /** Primary style mode */
  mode: StyleMode;
  /** Numeric mode for shader (0=cosmic, 1=bio, 2=lovecraft, 3=balanced) */
  modeValue: number;

  // Cosmic/crystalline parameters
  /** Fractal edge detail intensity (0-1) */
  fractalDetail: number;
  /** Prismatic color shift amount (0-1) */
  prismaticShift: number;

  // Bioluminescent/organic parameters
  /** Glow intensity (0-1) */
  glowIntensity: number;
  /** Subsurface scatter amount (0-1) */
  subsurfaceScatter: number;

  // Lovecraftian parameters
  /** Eerie effect intensity (0-1) */
  eerieIntensity: number;
  /** Dark desaturation amount (0-1) */
  darkDesaturation: number;
}

/**
 * Linear interpolation.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate creature style from trait vector.
 *
 * Style selection:
 * - geometricOrganic < 0.3: cosmic (crystalline, geometric)
 * - geometricOrganic > 0.7: bioluminescent (organic, glowing)
 * - connectedIsolated > 0.7: lovecraftian (unsettling, isolated)
 * - else: balanced mix
 *
 * @param traits - 4D trait vector
 * @returns Style configuration for shaders
 */
export function generateStyle(traits: TraitVector): CreatureStyle {
  const { geometricOrganic, connectedIsolated, intensityScale } = traits;

  // Determine primary mode
  let mode: StyleMode;
  let modeValue: number;

  if (geometricOrganic < 0.3) {
    mode = 'cosmic';
    modeValue = 0;
  } else if (geometricOrganic > 0.7) {
    mode = 'bioluminescent';
    modeValue = 1;
  } else if (connectedIsolated > 0.7) {
    mode = 'lovecraftian';
    modeValue = 2;
  } else {
    mode = 'balanced';
    modeValue = 3;
  }

  // Cosmic parameters (stronger for geometric creatures)
  const fractalDetail = (1 - geometricOrganic) * intensityScale;
  const prismaticShift = (1 - geometricOrganic) * 0.5;

  // Bioluminescent parameters (stronger for organic creatures)
  const glowIntensity = geometricOrganic * intensityScale;
  const subsurfaceScatter = geometricOrganic * 0.7;

  // Lovecraftian parameters (stronger for isolated creatures)
  const eerieIntensity = connectedIsolated * lerp(0.3, 0.8, intensityScale);
  const darkDesaturation = connectedIsolated * 0.4;

  return {
    mode,
    modeValue,
    fractalDetail,
    prismaticShift,
    glowIntensity,
    subsurfaceScatter,
    eerieIntensity,
    darkDesaturation,
  };
}
