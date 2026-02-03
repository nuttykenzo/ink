import { hashToFloat } from "./hash";

export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export interface ColorPalette {
  primary: RGB;
  secondary: RGB;
  accent: RGB;
  background: RGB;
}

/**
 * Base color palettes for different topic categories.
 */
const topicPalettes: Record<string, { primary: RGB; secondary: RGB }> = {
  // Technical → cool cyans and blues
  technical: {
    primary: { r: 0, g: 0.9, b: 0.8 },
    secondary: { r: 0.05, g: 0.65, b: 0.91 },
  },
  coding: {
    primary: { r: 0, g: 0.9, b: 0.8 },
    secondary: { r: 0.05, g: 0.65, b: 0.91 },
  },
  development: {
    primary: { r: 0, g: 0.9, b: 0.8 },
    secondary: { r: 0.05, g: 0.65, b: 0.91 },
  },
  automation: {
    primary: { r: 0.08, g: 0.72, b: 0.65 },
    secondary: { r: 0.02, g: 0.71, b: 0.83 },
  },

  // Creative → warm oranges and pinks
  design: {
    primary: { r: 0.98, g: 0.45, b: 0.09 },
    secondary: { r: 0.98, g: 0.75, b: 0.14 },
  },
  writing: {
    primary: { r: 0.93, g: 0.28, b: 0.6 },
    secondary: { r: 0.66, g: 0.33, b: 0.97 },
  },
  art: {
    primary: { r: 1, g: 0.3, b: 0.3 },
    secondary: { r: 0.98, g: 0.45, b: 0.09 },
  },
  creative: {
    primary: { r: 1, g: 0.3, b: 0.3 },
    secondary: { r: 0.98, g: 0.45, b: 0.09 },
  },

  // Analytical → violet and indigo
  finance: {
    primary: { r: 0.55, g: 0.36, b: 0.96 },
    secondary: { r: 0.39, g: 0.4, b: 0.95 },
  },
  research: {
    primary: { r: 0.39, g: 0.4, b: 0.95 },
    secondary: { r: 0.23, g: 0.51, b: 0.96 },
  },
  analysis: {
    primary: { r: 0.55, g: 0.36, b: 0.96 },
    secondary: { r: 0.39, g: 0.4, b: 0.95 },
  },

  // Productivity → teal and green
  productivity: {
    primary: { r: 0.08, g: 0.72, b: 0.65 },
    secondary: { r: 0.25, g: 0.73, b: 0.32 },
  },
  organization: {
    primary: { r: 0.08, g: 0.72, b: 0.65 },
    secondary: { r: 0.02, g: 0.71, b: 0.83 },
  },
};

// Default palette when no topics match
const defaultPalette = {
  primary: { r: 0, g: 0.9, b: 0.8 }, // Cyan
  secondary: { r: 1, g: 0.3, b: 0.3 }, // Coral
};

/**
 * Generate a color palette based on seed and topics.
 */
export function generatePalette(seed: number, topics: string[]): ColorPalette {
  // Find matching palette from topics
  let basePalette = defaultPalette;

  for (const topic of topics) {
    const normalized = topic.toLowerCase();
    for (const [key, palette] of Object.entries(topicPalettes)) {
      if (normalized.includes(key)) {
        basePalette = palette;
        break;
      }
    }
    if (basePalette !== defaultPalette) break;
  }

  // Add seed-based variation
  const hueShift = hashToFloat(seed, 0) * 0.1 - 0.05; // ±5% hue shift

  return {
    primary: shiftHue(basePalette.primary, hueShift),
    secondary: shiftHue(basePalette.secondary, hueShift),
    accent: { r: 0.66, g: 0.33, b: 0.97 }, // Purple accent
    background: { r: 0.02, g: 0.03, b: 0.06 }, // Deep navy
  };
}

/**
 * Shift the hue of an RGB color.
 * Simple approximation - for more accurate results, convert to HSL.
 */
function shiftHue(color: RGB, amount: number): RGB {
  // Rotate RGB channels slightly
  const shift = amount * 3;
  return {
    r: Math.max(0, Math.min(1, color.r + shift * (color.g - color.b))),
    g: Math.max(0, Math.min(1, color.g + shift * (color.b - color.r))),
    b: Math.max(0, Math.min(1, color.b + shift * (color.r - color.g))),
  };
}

/**
 * Convert RGB to hex string.
 */
export function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(color.g * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(color.b * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
}

/**
 * Convert RGB to Three.js-compatible array.
 */
export function rgbToArray(color: RGB): [number, number, number] {
  return [color.r, color.g, color.b];
}
