import type { AgentData } from "../data/schema";
import { hashString } from "./hash";
import { generatePalette, type ColorPalette } from "./palette";

/**
 * Visual parameters derived from agent data.
 * These control the portrait rendering.
 */
export interface VisualParams {
  // Deterministic seed from agent_id
  seed: number;

  // Structure
  complexity: number; // 1-10
  layerCount: number; // 2-5

  // Color
  palette: ColorPalette;
  saturation: number; // 0-1
  colorVariety: number; // 0-1

  // Shape
  organicness: number; // 0-1 (0=geometric, 1=organic)

  // Motion
  animSpeed: number; // 0.5-2
  pulseIntensity: number; // 0-1

  // Particles
  particleCount: number;
  trailLength: number; // 0-1
}

/**
 * Normalize a value from one range to another.
 */
function normalize(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  const ratio = (clamped - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

/**
 * Convert agent data to visual parameters.
 */
export function dataToVisualParams(data: AgentData): VisualParams {
  const seed = hashString(data.agent_id);

  // Complexity based on sessions (logarithmic scale)
  // 1 session → ~1, 10 → ~3, 100 → ~6, 1000 → ~9
  const complexity = Math.min(
    10,
    Math.max(1, Math.log10(data.sessions_count + 1) * 3)
  );

  // Layer count based on memory entries
  const layerCount = Math.round(
    normalize(data.memory_entries, 0, 500, 2, 5)
  );

  // Generate palette based on seed and topics
  const palette = generatePalette(seed, data.primary_topics);

  // Saturation from assertiveness
  const saturation = normalize(data.metrics.assertiveness, 1, 10, 0.4, 1.0);

  // Color variety from creativity
  const colorVariety = normalize(data.metrics.creativity, 1, 10, 0.2, 1.0);

  // Organicness is inverse of precision
  const organicness = 1 - normalize(data.metrics.precision, 1, 10, 0, 1);

  // Animation speed from response_speed
  const animSpeed = normalize(data.metrics.response_speed, 1, 10, 0.5, 2.0);

  // Pulse intensity from session count (more sessions = more alive)
  const pulseIntensity = normalize(data.sessions_count, 0, 1000, 0.2, 0.8);

  // Particle count scales with complexity
  const particleCount = Math.round(1000 + complexity * 900);

  // Trail length from verbosity
  const trailLength = normalize(
    data.metrics.avg_response_length,
    1,
    10,
    0.1,
    0.9
  );

  return {
    seed,
    complexity,
    layerCount,
    palette,
    saturation,
    colorVariety,
    organicness,
    animSpeed,
    pulseIntensity,
    particleCount,
    trailLength,
  };
}

/**
 * Create default visual params for preview/placeholder.
 */
export function getDefaultVisualParams(): VisualParams {
  return {
    seed: 42,
    complexity: 5,
    layerCount: 3,
    palette: {
      primary: { r: 0, g: 0.9, b: 0.8 }, // Cyan
      secondary: { r: 1, g: 0.3, b: 0.3 }, // Coral
      accent: { r: 0.66, g: 0.33, b: 0.97 }, // Purple
      background: { r: 0.02, g: 0.03, b: 0.06 }, // Deep navy
    },
    saturation: 0.7,
    colorVariety: 0.5,
    organicness: 0.5,
    animSpeed: 1,
    pulseIntensity: 0.5,
    particleCount: 5000,
    trailLength: 0.5,
  };
}
