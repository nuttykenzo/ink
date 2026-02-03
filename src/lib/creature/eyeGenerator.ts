/**
 * Eye Generator
 *
 * Generates eye configurations from trait vector and maturity.
 * Maps traits to eye count, size, pupil shape, iris pattern, and behavior.
 */

import type { TraitVector } from '../generation/traitVocabulary';
import type {
  EyeConfig,
  GazeStyle,
  IrisPattern,
  MaturityConfig,
  PupilShape,
} from './types';

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
 * Determine number of eyes from intensity and maturity.
 *
 * Mapping:
 * - intensityScale 0.0-0.3: 1 eye
 * - intensityScale 0.3-0.6: 1-2 eyes (based on maturity)
 * - intensityScale 0.6-1.0: up to maxEyes
 */
function getEyeCount(traits: TraitVector, maturity: MaturityConfig): number {
  const { intensityScale } = traits;

  if (intensityScale < 0.3) {
    return 1;
  } else if (intensityScale < 0.6) {
    return Math.min(maturity.maxEyes, 2);
  } else {
    return maturity.maxEyes;
  }
}

/**
 * Get eye size from intensity scale.
 *
 * Mapping:
 * - Low intensity: 0.08-0.12 (small, subtle)
 * - Medium: 0.12-0.16 (balanced)
 * - High: 0.16-0.22 (prominent, expressive)
 */
function getEyeSize(intensityScale: number): number {
  if (intensityScale < 0.3) {
    return lerp(0.08, 0.12, intensityScale / 0.3);
  } else if (intensityScale < 0.6) {
    return lerp(0.12, 0.16, (intensityScale - 0.3) / 0.3);
  } else {
    return lerp(0.16, 0.22, (intensityScale - 0.6) / 0.4);
  }
}

/**
 * Determine pupil shape from geometric-organic axis.
 *
 * Mapping:
 * - 0.0-0.25: star (geometric, crystalline)
 * - 0.25-0.5: vertical slit (predatory, focused)
 * - 0.5-0.75: round (balanced, friendly)
 * - 0.75-1.0: round with organic iris (soft, approachable)
 */
function getPupilShape(geometricOrganic: number): PupilShape {
  if (geometricOrganic < 0.25) {
    return 'star';
  } else if (geometricOrganic < 0.5) {
    return 'vertical';
  } else {
    return 'round';
  }
}

/**
 * Determine iris pattern from geometric-organic axis.
 */
function getIrisPattern(geometricOrganic: number): IrisPattern {
  if (geometricOrganic < 0.25) {
    return 'rings';
  } else if (geometricOrganic < 0.5) {
    return 'radial';
  } else if (geometricOrganic < 0.75) {
    return 'spiral';
  } else {
    return 'organic';
  }
}

/**
 * Determine gaze style from connected-isolated axis.
 */
function getGazeStyle(connectedIsolated: number): GazeStyle {
  if (connectedIsolated < 0.25) {
    return 'tracking'; // Social, follows user
  } else if (connectedIsolated < 0.5) {
    return 'focused'; // Attentive but not following
  } else if (connectedIsolated < 0.75) {
    return 'contemplative'; // Introspective, slow movement
  } else {
    return 'wandering'; // Independent, looks around freely
  }
}

/**
 * Calculate eye positions based on count and body plan context.
 */
function getEyePositions(
  count: number,
  random: () => number
): Array<[number, number]> {
  const positions: Array<[number, number]> = [];

  if (count === 1) {
    // Single eye: centered, slightly above vertical center
    const offsetX = (random() - 0.5) * 0.05;
    const offsetY = 0.05 + random() * 0.05;
    positions.push([offsetX, offsetY]);
  } else if (count === 2) {
    // Two eyes: symmetric, horizontal placement
    const spread = 0.15 + random() * 0.08;
    const yOffset = 0.05 + random() * 0.05;
    positions.push([-spread, yOffset]);
    positions.push([spread, yOffset]);
  } else if (count === 3) {
    // Three eyes: two normal + one above (third eye) or triangle
    const useThirdEye = random() > 0.5;

    if (useThirdEye) {
      // Third eye configuration
      const spread = 0.14 + random() * 0.06;
      const yOffset = 0.02 + random() * 0.04;
      positions.push([-spread, yOffset]);
      positions.push([spread, yOffset]);
      positions.push([0, 0.18 + random() * 0.04]); // Third eye above
    } else {
      // Triangle configuration
      const radius = 0.12 + random() * 0.04;
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2; // Start at top
        positions.push([
          Math.cos(angle) * radius,
          Math.sin(angle) * radius + 0.05,
        ]);
      }
    }
  }

  return positions;
}

/**
 * Generate a single eye configuration.
 */
function generateSingleEye(
  position: [number, number],
  index: number,
  traits: TraitVector,
  maturity: MaturityConfig,
  random: () => number,
  irisBaseColor: [number, number, number]
): EyeConfig {
  const { geometricOrganic, connectedIsolated, intensityScale, motionTempo } = traits;

  // Size with slight variation per eye
  const baseSize = getEyeSize(intensityScale);
  const size = baseSize * (0.9 + random() * 0.2);

  // Iris color: base with variation
  const irisColor: [number, number, number] = [
    Math.max(0, Math.min(1, irisBaseColor[0] + (random() - 0.5) * 0.1)),
    Math.max(0, Math.min(1, irisBaseColor[1] + (random() - 0.5) * 0.1)),
    Math.max(0, Math.min(1, irisBaseColor[2] + (random() - 0.5) * 0.1)),
  ];

  // Iris complexity scales with maturity
  const ringCount = Math.round(lerp(2, 5, maturity.detailLevel));
  const fiberDensity = lerp(8, 24, maturity.detailLevel);

  // Pupil properties
  const pupilShape = getPupilShape(geometricOrganic);
  const basePupilSize = lerp(0.2, 0.35, intensityScale);
  const dilationMin = basePupilSize * 0.7;
  const dilationMax = basePupilSize * 1.3;

  // Glowing pupils for elder creatures
  const glowing = maturity.stage === 'elder' && random() > 0.5;
  const glowColor: [number, number, number] | undefined = glowing
    ? [
        Math.min(1, irisColor[0] * 1.5),
        Math.min(1, irisColor[1] * 1.5),
        Math.min(1, irisColor[2] * 1.5),
      ]
    : undefined;

  // Behavior: blink rate from motion tempo
  // Slow tempo: 3-6 blinks/min, fast: 12-20 blinks/min
  const blinkRate = lerp(3, 20, motionTempo);
  const blinkDuration = 0.15; // Standard blink duration

  // Gaze behavior
  const gazeStyle = getGazeStyle(connectedIsolated);
  const gazeSpeed = lerp(0.2, 0.8, motionTempo);
  const gazeRange = lerp(0.3, 0.6, 1 - connectedIsolated); // Isolated = narrower gaze

  return {
    position,
    size,
    iris: {
      color: irisColor,
      ringCount,
      fiberDensity,
      pattern: getIrisPattern(geometricOrganic),
    },
    pupil: {
      shape: pupilShape,
      baseSize: basePupilSize,
      dilationRange: [dilationMin, dilationMax],
      glowing,
      glowColor,
    },
    behavior: {
      blinkRate,
      blinkDuration,
      gazeSpeed,
      gazeRange,
      gazeStyle,
    },
  };
}

/**
 * Generate eye configurations from traits and maturity.
 *
 * @param traits - 4D trait vector from agent
 * @param maturity - Maturity configuration from session count
 * @param seed - Deterministic seed for randomness
 * @param palette - Color palette for iris color
 * @returns Array of eye configurations
 */
export function generateEyes(
  traits: TraitVector,
  maturity: MaturityConfig,
  seed: number,
  palette: { secondary: { r: number; g: number; b: number } }
): EyeConfig[] {
  const random = createSeededRandom(seed + 2000);
  const eyeCount = getEyeCount(traits, maturity);
  const positions = getEyePositions(eyeCount, random);

  // Base iris color from palette secondary
  const irisBaseColor: [number, number, number] = [
    palette.secondary.r,
    palette.secondary.g,
    palette.secondary.b,
  ];

  const eyes: EyeConfig[] = [];

  for (let i = 0; i < eyeCount; i++) {
    eyes.push(
      generateSingleEye(
        positions[i],
        i,
        traits,
        maturity,
        random,
        irisBaseColor
      )
    );
  }

  return eyes;
}
