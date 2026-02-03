"use client";

import { useRef, useCallback, useMemo } from "react";
import type {
  Creature,
  EyeAnimationState,
  CreatureAnimationState,
} from "@/lib/creature/types";

/**
 * Seeded random for deterministic but varied animation.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Linear interpolation.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Ease in-out for smooth transitions.
 */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Animation result returned by the hook.
 */
export interface CreatureAnimationResult {
  /** Current breathing phase (0-2π) */
  breathPhase: number;
  /** Current drift offset [x, y] */
  driftOffset: [number, number];
  /** Per-eye animation states */
  eyes: Array<{
    gazeOffset: [number, number];
    pupilDilation: number;
    blinkAmount: number;
  }>;
  /** Update function to call each frame */
  update: (time: number, delta: number) => void;
}

/**
 * Hook for managing creature animation state.
 * Handles blinking, gaze movement, pupil dilation, and breathing.
 */
export function useCreatureAnimation(creature: Creature): CreatureAnimationResult {
  const { eyes, behavior, seed } = creature;

  // Initialize animation state
  const stateRef = useRef<CreatureAnimationState | null>(null);

  // Lazy initialization of state
  if (!stateRef.current) {
    const eyeStates: EyeAnimationState[] = eyes.map((eye, i) => {
      const eyeSeed = seed + i * 1000;
      return {
        gazeOffset: [0, 0] as [number, number],
        gazeTarget: [
          (seededRandom(eyeSeed) - 0.5) * eye.behavior.gazeRange,
          (seededRandom(eyeSeed + 1) - 0.5) * eye.behavior.gazeRange,
        ] as [number, number],
        pupilDilation: 0.5,
        blinkAmount: 0,
        blinkTimer: seededRandom(eyeSeed + 2) * 5, // Staggered initial blink
        isBlinking: false,
      };
    });

    stateRef.current = {
      breathPhase: 0,
      driftOffset: [0, 0],
      eyes: eyeStates,
      lastUpdateTime: 0,
    };
  }

  // Gaze target timer (shared across eyes for sync)
  const gazeTimerRef = useRef(0);
  const gazeTargetTimeRef = useRef(2 + seededRandom(seed) * 3); // 2-5 seconds

  /**
   * Update a single eye's animation state.
   */
  const updateEye = useCallback(
    (
      eyeState: EyeAnimationState,
      eyeConfig: typeof eyes[number],
      delta: number,
      shouldUpdateGazeTarget: boolean,
      time: number
    ) => {
      const { behavior: eyeBehavior } = eyeConfig;

      // === BLINK ===
      eyeState.blinkTimer -= delta;

      if (eyeState.isBlinking) {
        // Currently in blink animation
        // Blink duration: 0.15s (0.06s close, 0.03s hold, 0.06s open)
        const blinkDuration = eyeBehavior.blinkDuration;
        const closeTime = blinkDuration * 0.4;
        const holdTime = blinkDuration * 0.2;
        const openTime = blinkDuration * 0.4;

        if (eyeState.blinkTimer > closeTime + holdTime) {
          // Closing phase
          const progress = 1 - (eyeState.blinkTimer - closeTime - holdTime) / openTime;
          eyeState.blinkAmount = easeInOut(progress);
        } else if (eyeState.blinkTimer > closeTime) {
          // Hold phase - fully closed
          eyeState.blinkAmount = 1;
        } else if (eyeState.blinkTimer > 0) {
          // Opening phase
          const progress = eyeState.blinkTimer / closeTime;
          eyeState.blinkAmount = easeInOut(progress);
        } else {
          // Blink complete
          eyeState.isBlinking = false;
          eyeState.blinkAmount = 0;
          // Set timer for next blink (60 / blinksPerMinute = seconds between blinks)
          const avgInterval = 60 / eyeBehavior.blinkRate;
          eyeState.blinkTimer = avgInterval * (0.7 + seededRandom(time * 1000) * 0.6);
        }
      } else if (eyeState.blinkTimer <= 0) {
        // Start new blink
        eyeState.isBlinking = true;
        eyeState.blinkTimer = eyeBehavior.blinkDuration;
      }

      // === GAZE ===
      if (shouldUpdateGazeTarget) {
        // Pick new gaze target
        const { gazeRange, gazeStyle } = eyeBehavior;
        let newTargetX: number;
        let newTargetY: number;

        switch (gazeStyle) {
          case "focused":
            // Stays near center
            newTargetX = (seededRandom(time * 100) - 0.5) * gazeRange * 0.3;
            newTargetY = (seededRandom(time * 100 + 1) - 0.5) * gazeRange * 0.3;
            break;
          case "tracking":
            // Biased toward center (looking at viewer)
            newTargetX = (seededRandom(time * 100) - 0.5) * gazeRange * 0.5;
            newTargetY = (seededRandom(time * 100 + 1) - 0.5) * gazeRange * 0.3;
            break;
          case "contemplative":
            // Slow, deliberate movement, often looking down/away
            newTargetX = (seededRandom(time * 100) - 0.5) * gazeRange;
            newTargetY = seededRandom(time * 100 + 1) * gazeRange * 0.5 - gazeRange * 0.3;
            break;
          case "wandering":
          default:
            // Full range, independent
            newTargetX = (seededRandom(time * 100) - 0.5) * gazeRange * 2;
            newTargetY = (seededRandom(time * 100 + 1) - 0.5) * gazeRange * 2;
            break;
        }

        eyeState.gazeTarget = [newTargetX, newTargetY];
      }

      // Lerp gaze toward target
      const gazeSpeed = eyeBehavior.gazeSpeed * delta * 2;
      eyeState.gazeOffset[0] = lerp(eyeState.gazeOffset[0], eyeState.gazeTarget[0], gazeSpeed);
      eyeState.gazeOffset[1] = lerp(eyeState.gazeOffset[1], eyeState.gazeTarget[1], gazeSpeed);

      // === PUPIL DILATION ===
      // Slow oscillation (8-15 second period)
      const dilationPeriod = 8 + seededRandom(seed) * 7;
      eyeState.pupilDilation = 0.5 + Math.sin(time / dilationPeriod * Math.PI * 2) * 0.3;
    },
    [seed]
  );

  /**
   * Main update function called each frame.
   */
  const update = useCallback(
    (time: number, delta: number) => {
      if (!stateRef.current) return;

      const state = stateRef.current;
      const clampedDelta = Math.min(delta, 0.1); // Cap delta to prevent jumps

      // === BREATHING ===
      const breathRate = behavior.breathing.rate / 60; // Convert bpm to Hz
      state.breathPhase += clampedDelta * breathRate * Math.PI * 2;
      if (state.breathPhase > Math.PI * 2) {
        state.breathPhase -= Math.PI * 2;
      }

      // Add irregularity to breathing if needed
      if (behavior.breathing.pattern === "irregular") {
        const irregularity = Math.sin(time * 0.3) * 0.2;
        state.breathPhase += irregularity * clampedDelta;
      } else if (behavior.breathing.pattern === "sighing") {
        // Occasional deep breath
        if (seededRandom(Math.floor(time * 0.1)) < 0.1) {
          state.breathPhase += clampedDelta * 0.5;
        }
      }

      // === IDLE DRIFT ===
      const driftAmount = behavior.idle.drift * 0.02;
      state.driftOffset[0] = Math.sin(time * 0.5) * driftAmount;
      state.driftOffset[1] = Math.cos(time * 0.3) * driftAmount;

      // === GAZE TARGET TIMING ===
      gazeTimerRef.current += clampedDelta;
      let shouldUpdateGazeTarget = false;

      if (gazeTimerRef.current >= gazeTargetTimeRef.current) {
        shouldUpdateGazeTarget = true;
        gazeTimerRef.current = 0;
        // Next target time based on curiosity
        const baseInterval = 2 + (1 - behavior.gaze.curiosity) * 4; // 2-6 seconds
        gazeTargetTimeRef.current = baseInterval * (0.7 + seededRandom(time * 10) * 0.6);
      }

      // === UPDATE EYES ===
      for (let i = 0; i < state.eyes.length; i++) {
        const eyeState = state.eyes[i];
        const eyeConfig = eyes[i];

        // For synchronized eyes, only update gaze target for first eye
        // Other eyes follow with slight variation
        const updateGaze = shouldUpdateGazeTarget && (i === 0 || behavior.gaze.syncFactor < 0.8);

        updateEye(eyeState, eyeConfig, clampedDelta, updateGaze, time + i * 0.1);

        // Sync other eyes to first eye's gaze (with syncFactor)
        if (i > 0 && behavior.gaze.syncFactor > 0.5) {
          const syncAmount = behavior.gaze.syncFactor;
          eyeState.gazeOffset[0] = lerp(
            eyeState.gazeOffset[0],
            state.eyes[0].gazeOffset[0],
            syncAmount * 0.5
          );
          eyeState.gazeOffset[1] = lerp(
            eyeState.gazeOffset[1],
            state.eyes[0].gazeOffset[1],
            syncAmount * 0.5
          );
        }
      }

      state.lastUpdateTime = time;
    },
    [behavior, eyes, updateEye]
  );

  // Create result object (memoized structure, but values update via refs)
  const result = useMemo((): CreatureAnimationResult => {
    const getState = () => stateRef.current!;

    return {
      get breathPhase() {
        return getState().breathPhase;
      },
      get driftOffset() {
        return getState().driftOffset;
      },
      get eyes() {
        return getState().eyes.map((eye) => ({
          gazeOffset: eye.gazeOffset,
          pupilDilation: eye.pupilDilation,
          blinkAmount: eye.blinkAmount,
        }));
      },
      update,
    };
  }, [update]);

  return result;
}
