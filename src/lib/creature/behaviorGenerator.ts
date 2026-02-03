/**
 * Behavior Generator
 *
 * Generates behavior configuration from trait vector.
 * Controls breathing, idle movement, and gaze patterns.
 */

import type { TraitVector } from '../generation/traitVocabulary';
import type { BehaviorConfig } from './types';

/**
 * Linear interpolation.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate breathing configuration from traits.
 */
function generateBreathing(traits: TraitVector): BehaviorConfig['breathing'] {
  const { motionTempo, geometricOrganic } = traits;

  // Breath rate: 6-20 breaths per minute
  // Slower for low tempo, faster for high
  const rate = lerp(6, 20, motionTempo);

  // Breath depth: organic forms breathe more visibly
  const depth = lerp(0.3, 0.8, geometricOrganic);

  // Breathing pattern
  let pattern: BehaviorConfig['breathing']['pattern'];
  if (geometricOrganic < 0.33) {
    pattern = 'regular'; // Geometric: mechanical, regular breathing
  } else if (geometricOrganic < 0.66) {
    pattern = 'sighing'; // Mixed: occasional deeper breaths
  } else {
    pattern = 'irregular'; // Organic: natural, variable breathing
  }

  return { rate, depth, pattern };
}

/**
 * Generate idle movement configuration from traits.
 */
function generateIdle(traits: TraitVector): BehaviorConfig['idle'] {
  const { motionTempo, geometricOrganic, connectedIsolated } = traits;

  // Drift: organic forms float more, geometric stay still
  const drift = lerp(0.05, 0.3, geometricOrganic);

  // Wobble: motion tempo affects wobble intensity
  const wobble = lerp(0.1, 0.5, motionTempo);

  // Pulse: isolated creatures have more visible pulse (self-contained energy)
  const pulse = lerp(0.2, 0.6, connectedIsolated);

  return { drift, wobble, pulse };
}

/**
 * Generate gaze behavior configuration from traits.
 */
function generateGaze(traits: TraitVector): BehaviorConfig['gaze'] {
  const { connectedIsolated, motionTempo } = traits;

  // Center bias: connected creatures look at "you" more
  const centerBias = lerp(0.7, 0.2, connectedIsolated);

  // Sync factor: how synchronized multiple eyes are
  // Connected = more synchronized, isolated = more independent
  const syncFactor = lerp(0.9, 0.4, connectedIsolated);

  // Curiosity: how often gaze changes
  // Fast tempo = more curious/restless
  const curiosity = lerp(0.3, 0.8, motionTempo);

  return { centerBias, syncFactor, curiosity };
}

/**
 * Generate behavior configuration from traits.
 *
 * @param traits - 4D trait vector from agent
 * @returns Behavior configuration
 */
export function generateBehavior(traits: TraitVector): BehaviorConfig {
  return {
    breathing: generateBreathing(traits),
    idle: generateIdle(traits),
    gaze: generateGaze(traits),
  };
}
