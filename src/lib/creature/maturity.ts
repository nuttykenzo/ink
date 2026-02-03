/**
 * Maturity Configuration Generator
 *
 * Maps session count to creature maturity, controlling which features
 * are unlocked (eyes, nucleus, circulation, appendage complexity).
 */

import type { MaturityConfig, MaturityStage } from './types';

/**
 * Session count thresholds for maturity stages.
 */
const STAGE_THRESHOLDS = {
  nascent: { min: 0, max: 10 },
  developing: { min: 11, max: 100 },
  mature: { min: 101, max: 500 },
  elder: { min: 501, max: Infinity },
} as const;

/**
 * Get the maturity stage from session count.
 */
function getStage(sessionsCount: number): MaturityStage {
  if (sessionsCount <= STAGE_THRESHOLDS.nascent.max) return 'nascent';
  if (sessionsCount <= STAGE_THRESHOLDS.developing.max) return 'developing';
  if (sessionsCount <= STAGE_THRESHOLDS.mature.max) return 'mature';
  return 'elder';
}

/**
 * Calculate detail level (0-1) based on session count.
 * Uses logarithmic scaling for diminishing returns.
 */
function getDetailLevel(sessionsCount: number): number {
  // Log scale: 1 session = 0, 10 = 0.25, 100 = 0.5, 1000 = 0.75, 10000 = 1.0
  const log = Math.log10(Math.max(1, sessionsCount + 1));
  return Math.min(1, log / 4);
}

/**
 * Generate maturity configuration from session count.
 *
 * Stage progression:
 * - nascent (0-10 sessions): 1 eye, no nucleus, no circulation, no appendages
 * - developing (11-100): 1-2 eyes, nucleus, no circulation, simple appendages
 * - mature (101-500): 1-3 eyes, nucleus, circulation, full appendages
 * - elder (500+): 1-3 eyes, nucleus, circulation, complex appendages + rare features
 *
 * @param sessionsCount - Number of sessions the agent has had
 * @returns MaturityConfig for creature generation
 */
export function getMaturityConfig(sessionsCount: number): MaturityConfig {
  const stage = getStage(sessionsCount);
  const detailLevel = getDetailLevel(sessionsCount);

  switch (stage) {
    case 'nascent':
      return {
        stage,
        sessionsCount,
        maxEyes: 1,
        hasNucleus: false,
        hasCirculation: false,
        appendageComplexity: 0,
        detailLevel,
      };

    case 'developing':
      return {
        stage,
        sessionsCount,
        maxEyes: 2,
        hasNucleus: true,
        hasCirculation: false,
        appendageComplexity: 1,
        detailLevel,
      };

    case 'mature':
      return {
        stage,
        sessionsCount,
        maxEyes: 3,
        hasNucleus: true,
        hasCirculation: true,
        appendageComplexity: 2,
        detailLevel,
      };

    case 'elder':
      return {
        stage,
        sessionsCount,
        maxEyes: 3,
        hasNucleus: true,
        hasCirculation: true,
        appendageComplexity: 3,
        detailLevel,
      };
  }
}

/**
 * Check if a creature at given maturity can have a specific feature.
 */
export function canHaveFeature(
  maturity: MaturityConfig,
  feature: 'multipleEyes' | 'nucleus' | 'circulation' | 'appendages' | 'rareFeatures'
): boolean {
  switch (feature) {
    case 'multipleEyes':
      return maturity.maxEyes > 1;
    case 'nucleus':
      return maturity.hasNucleus;
    case 'circulation':
      return maturity.hasCirculation;
    case 'appendages':
      return maturity.appendageComplexity > 0;
    case 'rareFeatures':
      return maturity.stage === 'elder';
  }
}
