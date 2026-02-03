/**
 * Generate a deterministic 32-bit hash from a string.
 * Used to create consistent visual parameters from agent IDs.
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a float between 0 and 1 from a hash and offset.
 * Useful for deterministic random-like values.
 */
export function hashToFloat(hash: number, offset: number = 0): number {
  const combined = hashString(`${hash}-${offset}`);
  return (combined % 10000) / 10000;
}

/**
 * Generate an integer in a range from a hash and offset.
 */
export function hashToInt(
  hash: number,
  min: number,
  max: number,
  offset: number = 0
): number {
  const float = hashToFloat(hash, offset);
  return Math.floor(min + float * (max - min + 1));
}
