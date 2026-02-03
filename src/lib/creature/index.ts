/**
 * Creature System
 *
 * Generates living creatures from agent trait vectors.
 * Each creature has a body, eyes, optional appendages, and behaviors.
 */

// Types
export type {
  Creature,
  MaturityConfig,
  MaturityStage,
  BodyConfig,
  BodyPlan,
  EyeConfig,
  PupilShape,
  IrisPattern,
  GazeStyle,
  AppendageConfig,
  AppendageType,
  BehaviorConfig,
  CreatureColors,
  EyeAnimationState,
  CreatureAnimationState,
} from './types';

// Generators
export { generateCreature, getDefaultCreature } from './generator';
export { getMaturityConfig, canHaveFeature } from './maturity';
export { generateBody } from './bodyGenerator';
export { generateEyes } from './eyeGenerator';
export { generateAppendages } from './appendageGenerator';
export { generateBehavior } from './behaviorGenerator';
