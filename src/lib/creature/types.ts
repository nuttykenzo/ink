/**
 * Creature System Types
 *
 * Defines the data structures for generating and rendering living creatures
 * from agent trait vectors. Each creature has a body, eyes, and optional appendages.
 */

// ============================================================================
// Enums and Type Unions
// ============================================================================

/** Maturity stage based on session count */
export type MaturityStage = 'nascent' | 'developing' | 'mature' | 'elder';

/** Body symmetry/organization pattern */
export type BodyPlan = 'radial' | 'bilateral' | 'asymmetric';

/** Types of appendages the creature can have */
export type AppendageType = 'tendril' | 'limb' | 'cilia' | 'spoke' | 'tail' | 'antenna';

/** Pupil shape variations */
export type PupilShape = 'round' | 'vertical' | 'horizontal' | 'star';

/** Iris pattern variations */
export type IrisPattern = 'rings' | 'radial' | 'spiral' | 'organic';

/** Gaze behavior style */
export type GazeStyle = 'focused' | 'wandering' | 'tracking' | 'contemplative';

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Maturity configuration derived from session count.
 * Controls what features the creature has unlocked.
 */
export interface MaturityConfig {
  stage: MaturityStage;
  sessionsCount: number;
  /** Maximum number of eyes (1-3) */
  maxEyes: 1 | 2 | 3;
  /** Whether creature has visible nucleus */
  hasNucleus: boolean;
  /** Whether creature has internal circulation particles */
  hasCirculation: boolean;
  /** Appendage complexity level (0=none, 1=simple, 2=moderate, 3=complex) */
  appendageComplexity: 0 | 1 | 2 | 3;
  /** Detail level for visual fidelity (0-1) */
  detailLevel: number;
}

/**
 * Body configuration defining the creature's core form.
 */
export interface BodyConfig {
  /** Symmetry pattern */
  plan: BodyPlan;
  /** Base radius in normalized units */
  radius: number;
  /** Aspect ratio [width, height] multipliers */
  aspect: [number, number];
  /** Edge irregularity amount (0=perfect, 1=very irregular) */
  irregularity: number;
  /** Vertex resolution for the body outline */
  resolution: number;
  /** Membrane/skin properties */
  membrane: {
    /** Membrane thickness as fraction of radius */
    thickness: number;
    /** Base opacity (0-1) */
    opacity: number;
    /** Breathing animation amplitude */
    breathAmplitude: number;
    /** Breathing animation rate (cycles per second) */
    breathRate: number;
  };
  /** Optional glowing nucleus */
  nucleus?: {
    /** Position offset from center [-1 to 1, -1 to 1] */
    position: [number, number];
    /** Size as fraction of body radius */
    size: number;
    /** Pulse animation rate */
    pulseRate: number;
    /** RGB color [0-1, 0-1, 0-1] */
    color: [number, number, number];
  };
}

/**
 * Configuration for a single eye.
 */
export interface EyeConfig {
  /** Position relative to body center [-1 to 1, -1 to 1] */
  position: [number, number];
  /** Eye size as fraction of body radius */
  size: number;
  /** Iris properties */
  iris: {
    /** RGB color [0-1, 0-1, 0-1] */
    color: [number, number, number];
    /** Number of concentric rings */
    ringCount: number;
    /** Radial fiber density */
    fiberDensity: number;
    /** Visual pattern style */
    pattern: IrisPattern;
  };
  /** Pupil properties */
  pupil: {
    /** Shape of the pupil */
    shape: PupilShape;
    /** Base size as fraction of iris */
    baseSize: number;
    /** Dilation range [min, max] as fraction of iris */
    dilationRange: [number, number];
    /** Whether pupil glows */
    glowing: boolean;
    /** Glow color if glowing [RGB 0-1] */
    glowColor?: [number, number, number];
  };
  /** Behavior parameters */
  behavior: {
    /** Blinks per minute */
    blinkRate: number;
    /** Duration of a blink in seconds */
    blinkDuration: number;
    /** Speed of gaze movement (0-1) */
    gazeSpeed: number;
    /** How far the eye can look (0-1) */
    gazeRange: number;
    /** Gaze movement style */
    gazeStyle: GazeStyle;
  };
}

/**
 * Configuration for a single appendage.
 */
export interface AppendageConfig {
  /** Type of appendage */
  type: AppendageType;
  /** Attachment angle in radians */
  attachAngle: number;
  /** Length as fraction of body radius */
  length: number;
  /** Base thickness */
  thickness: number;
  /** Number of segments for articulation */
  segments: number;
  /** How much the appendage tapers (0=uniform, 1=point) */
  taper: number;
  /** Wave animation parameters */
  wave: {
    /** Wave amplitude */
    amplitude: number;
    /** Wave frequency */
    frequency: number;
    /** Wave propagation speed */
    speed: number;
    /** Initial phase offset */
    phase: number;
  };
}

/**
 * Behavior configuration controlling idle animations.
 */
export interface BehaviorConfig {
  /** Breathing animation */
  breathing: {
    /** Breaths per minute (6-20) */
    rate: number;
    /** Breath depth/intensity (0-1) */
    depth: number;
    /** Breathing pattern style */
    pattern: 'regular' | 'irregular' | 'sighing';
  };
  /** Idle movement */
  idle: {
    /** Drift/float amount (0-1) */
    drift: number;
    /** Wobble intensity (0-1) */
    wobble: number;
    /** Pulse animation intensity (0-1) */
    pulse: number;
  };
  /** Eye gaze behavior */
  gaze: {
    /** Tendency to look at center (0-1) */
    centerBias: number;
    /** How synchronized multiple eyes are (0-1) */
    syncFactor: number;
    /** How often gaze changes (0-1) */
    curiosity: number;
  };
}

/**
 * Color scheme for the creature.
 */
export interface CreatureColors {
  /** Primary body color [RGB 0-1] */
  body: [number, number, number];
  /** Membrane/edge color [RGB 0-1] */
  membrane: [number, number, number];
  /** Accent/highlight color [RGB 0-1] */
  accent: [number, number, number];
  /** Nucleus glow color [RGB 0-1] */
  nucleus: [number, number, number];
}

// ============================================================================
// Main Creature Interface
// ============================================================================

/**
 * Complete creature configuration.
 * Generated from agent traits and used to render the creature.
 */
export interface Creature {
  /** Deterministic seed for reproducibility */
  seed: number;
  /** Maturity stage configuration */
  maturity: MaturityConfig;
  /** Body configuration */
  body: BodyConfig;
  /** Eye configurations (1-3 eyes) */
  eyes: EyeConfig[];
  /** Appendage configurations */
  appendages: AppendageConfig[];
  /** Behavior configuration */
  behavior: BehaviorConfig;
  /** Color scheme */
  colors: CreatureColors;
}

// ============================================================================
// Animation State Interfaces (for runtime)
// ============================================================================

/**
 * Runtime animation state for a single eye.
 */
export interface EyeAnimationState {
  /** Current gaze offset [-1 to 1, -1 to 1] */
  gazeOffset: [number, number];
  /** Target gaze offset for lerping */
  gazeTarget: [number, number];
  /** Current pupil dilation (0-1) */
  pupilDilation: number;
  /** Current blink amount (0=open, 1=closed) */
  blinkAmount: number;
  /** Time until next blink */
  blinkTimer: number;
  /** Is currently in blink animation */
  isBlinking: boolean;
}

/**
 * Runtime animation state for the creature.
 */
export interface CreatureAnimationState {
  /** Current breathing phase (0-2π) */
  breathPhase: number;
  /** Current idle drift offset [x, y] */
  driftOffset: [number, number];
  /** Per-eye animation states */
  eyes: EyeAnimationState[];
  /** Time since last animation update */
  lastUpdateTime: number;
}
