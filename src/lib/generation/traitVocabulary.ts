import { hashString, hashToFloat } from "./hash";

/**
 * 4D trait-space coordinates that drive visual form generation.
 */
export interface TraitVector {
  geometricOrganic: number; // 0 = sharp/angular, 1 = flowing/organic
  connectedIsolated: number; // 0 = networked, 1 = standalone
  intensityScale: number; // 0 = subtle, 1 = bold
  motionTempo: number; // 0 = slow, 1 = fast
}

/**
 * Hand-curated trait embeddings mapping personality descriptors to 4D vectors.
 * Values are normalized 0-1 for each dimension.
 */
const TRAIT_EMBEDDINGS: Record<string, TraitVector> = {
  // === GEOMETRIC END (low geometricOrganic) ===
  analytical: {
    geometricOrganic: 0.1,
    connectedIsolated: 0.4,
    intensityScale: 0.5,
    motionTempo: 0.35,
  },
  precise: {
    geometricOrganic: 0.05,
    connectedIsolated: 0.5,
    intensityScale: 0.6,
    motionTempo: 0.4,
  },
  methodical: {
    geometricOrganic: 0.15,
    connectedIsolated: 0.55,
    intensityScale: 0.45,
    motionTempo: 0.25,
  },
  logical: {
    geometricOrganic: 0.1,
    connectedIsolated: 0.45,
    intensityScale: 0.5,
    motionTempo: 0.35,
  },
  systematic: {
    geometricOrganic: 0.08,
    connectedIsolated: 0.35,
    intensityScale: 0.55,
    motionTempo: 0.3,
  },
  structured: {
    geometricOrganic: 0.05,
    connectedIsolated: 0.5,
    intensityScale: 0.5,
    motionTempo: 0.3,
  },
  organized: {
    geometricOrganic: 0.12,
    connectedIsolated: 0.4,
    intensityScale: 0.45,
    motionTempo: 0.35,
  },

  // === ORGANIC END (high geometricOrganic) ===
  creative: {
    geometricOrganic: 0.85,
    connectedIsolated: 0.45,
    intensityScale: 0.7,
    motionTempo: 0.6,
  },
  intuitive: {
    geometricOrganic: 0.9,
    connectedIsolated: 0.5,
    intensityScale: 0.5,
    motionTempo: 0.55,
  },
  playful: {
    geometricOrganic: 0.8,
    connectedIsolated: 0.3,
    intensityScale: 0.75,
    motionTempo: 0.85,
  },
  adaptive: {
    geometricOrganic: 0.7,
    connectedIsolated: 0.4,
    intensityScale: 0.6,
    motionTempo: 0.65,
  },
  imaginative: {
    geometricOrganic: 0.92,
    connectedIsolated: 0.55,
    intensityScale: 0.65,
    motionTempo: 0.6,
  },
  expressive: {
    geometricOrganic: 0.88,
    connectedIsolated: 0.35,
    intensityScale: 0.8,
    motionTempo: 0.7,
  },
  artistic: {
    geometricOrganic: 0.95,
    connectedIsolated: 0.5,
    intensityScale: 0.65,
    motionTempo: 0.55,
  },
  innovative: {
    geometricOrganic: 0.75,
    connectedIsolated: 0.45,
    intensityScale: 0.7,
    motionTempo: 0.65,
  },

  // === CONNECTED/NETWORKED (low connectedIsolated) ===
  collaborative: {
    geometricOrganic: 0.5,
    connectedIsolated: 0.1,
    intensityScale: 0.6,
    motionTempo: 0.5,
  },
  helpful: {
    geometricOrganic: 0.55,
    connectedIsolated: 0.15,
    intensityScale: 0.5,
    motionTempo: 0.5,
  },
  communicative: {
    geometricOrganic: 0.5,
    connectedIsolated: 0.08,
    intensityScale: 0.6,
    motionTempo: 0.65,
  },
  empathetic: {
    geometricOrganic: 0.65,
    connectedIsolated: 0.12,
    intensityScale: 0.45,
    motionTempo: 0.4,
  },
  supportive: {
    geometricOrganic: 0.6,
    connectedIsolated: 0.1,
    intensityScale: 0.5,
    motionTempo: 0.45,
  },
  social: {
    geometricOrganic: 0.55,
    connectedIsolated: 0.05,
    intensityScale: 0.65,
    motionTempo: 0.6,
  },

  // === ISOLATED/FOCUSED (high connectedIsolated) ===
  focused: {
    geometricOrganic: 0.3,
    connectedIsolated: 0.8,
    intensityScale: 0.7,
    motionTempo: 0.35,
  },
  independent: {
    geometricOrganic: 0.4,
    connectedIsolated: 0.9,
    intensityScale: 0.6,
    motionTempo: 0.45,
  },
  thorough: {
    geometricOrganic: 0.25,
    connectedIsolated: 0.75,
    intensityScale: 0.55,
    motionTempo: 0.3,
  },
  introspective: {
    geometricOrganic: 0.6,
    connectedIsolated: 0.85,
    intensityScale: 0.4,
    motionTempo: 0.25,
  },
  autonomous: {
    geometricOrganic: 0.35,
    connectedIsolated: 0.92,
    intensityScale: 0.65,
    motionTempo: 0.5,
  },
  reserved: {
    geometricOrganic: 0.45,
    connectedIsolated: 0.8,
    intensityScale: 0.35,
    motionTempo: 0.3,
  },

  // === HIGH INTENSITY ===
  assertive: {
    geometricOrganic: 0.35,
    connectedIsolated: 0.5,
    intensityScale: 0.9,
    motionTempo: 0.7,
  },
  confident: {
    geometricOrganic: 0.4,
    connectedIsolated: 0.55,
    intensityScale: 0.85,
    motionTempo: 0.6,
  },
  direct: {
    geometricOrganic: 0.2,
    connectedIsolated: 0.6,
    intensityScale: 0.8,
    motionTempo: 0.55,
  },
  bold: {
    geometricOrganic: 0.45,
    connectedIsolated: 0.5,
    intensityScale: 0.95,
    motionTempo: 0.75,
  },
  determined: {
    geometricOrganic: 0.3,
    connectedIsolated: 0.65,
    intensityScale: 0.85,
    motionTempo: 0.6,
  },
  driven: {
    geometricOrganic: 0.35,
    connectedIsolated: 0.6,
    intensityScale: 0.9,
    motionTempo: 0.7,
  },

  // === LOW INTENSITY ===
  patient: {
    geometricOrganic: 0.6,
    connectedIsolated: 0.5,
    intensityScale: 0.25,
    motionTempo: 0.2,
  },
  gentle: {
    geometricOrganic: 0.75,
    connectedIsolated: 0.4,
    intensityScale: 0.2,
    motionTempo: 0.25,
  },
  careful: {
    geometricOrganic: 0.35,
    connectedIsolated: 0.55,
    intensityScale: 0.3,
    motionTempo: 0.25,
  },
  measured: {
    geometricOrganic: 0.3,
    connectedIsolated: 0.5,
    intensityScale: 0.35,
    motionTempo: 0.2,
  },
  calm: {
    geometricOrganic: 0.55,
    connectedIsolated: 0.5,
    intensityScale: 0.25,
    motionTempo: 0.15,
  },
  thoughtful: {
    geometricOrganic: 0.5,
    connectedIsolated: 0.6,
    intensityScale: 0.4,
    motionTempo: 0.3,
  },

  // === HIGH MOTION ===
  energetic: {
    geometricOrganic: 0.6,
    connectedIsolated: 0.4,
    intensityScale: 0.7,
    motionTempo: 0.9,
  },
  dynamic: {
    geometricOrganic: 0.55,
    connectedIsolated: 0.45,
    intensityScale: 0.75,
    motionTempo: 0.85,
  },
  responsive: {
    geometricOrganic: 0.5,
    connectedIsolated: 0.35,
    intensityScale: 0.6,
    motionTempo: 0.8,
  },
  quick: {
    geometricOrganic: 0.4,
    connectedIsolated: 0.5,
    intensityScale: 0.6,
    motionTempo: 0.9,
  },
  agile: {
    geometricOrganic: 0.55,
    connectedIsolated: 0.45,
    intensityScale: 0.65,
    motionTempo: 0.85,
  },

  // === LOW MOTION ===
  deliberate: {
    geometricOrganic: 0.3,
    connectedIsolated: 0.55,
    intensityScale: 0.5,
    motionTempo: 0.15,
  },
  steady: {
    geometricOrganic: 0.35,
    connectedIsolated: 0.5,
    intensityScale: 0.45,
    motionTempo: 0.2,
  },
  persistent: {
    geometricOrganic: 0.25,
    connectedIsolated: 0.6,
    intensityScale: 0.6,
    motionTempo: 0.25,
  },

  // === HYBRID/BALANCED ===
  curious: {
    geometricOrganic: 0.6,
    connectedIsolated: 0.4,
    intensityScale: 0.6,
    motionTempo: 0.6,
  },
  versatile: {
    geometricOrganic: 0.5,
    connectedIsolated: 0.45,
    intensityScale: 0.55,
    motionTempo: 0.55,
  },
  balanced: {
    geometricOrganic: 0.5,
    connectedIsolated: 0.5,
    intensityScale: 0.5,
    motionTempo: 0.5,
  },
  practical: {
    geometricOrganic: 0.35,
    connectedIsolated: 0.5,
    intensityScale: 0.55,
    motionTempo: 0.45,
  },
  reliable: {
    geometricOrganic: 0.3,
    connectedIsolated: 0.45,
    intensityScale: 0.5,
    motionTempo: 0.35,
  },
  efficient: {
    geometricOrganic: 0.25,
    connectedIsolated: 0.5,
    intensityScale: 0.6,
    motionTempo: 0.5,
  },
};

/**
 * Generate a deterministic trait vector for unknown traits using hash.
 * Biases toward middle values to avoid extreme positions.
 */
function hashTraitToVector(trait: string, seed: number): TraitVector {
  const h = hashString(trait + String(seed));
  return {
    geometricOrganic: hashToFloat(h, 0) * 0.6 + 0.2, // 0.2-0.8 range
    connectedIsolated: hashToFloat(h, 1) * 0.6 + 0.2,
    intensityScale: hashToFloat(h, 2) * 0.4 + 0.3, // 0.3-0.7 range (more constrained)
    motionTempo: hashToFloat(h, 3) * 0.6 + 0.2,
  };
}

/**
 * Try to find a matching trait in the vocabulary.
 * Supports exact match and partial matching.
 */
function findTraitVector(trait: string): TraitVector | null {
  const normalized = trait.toLowerCase().trim();

  // Exact match
  if (normalized in TRAIT_EMBEDDINGS) {
    return TRAIT_EMBEDDINGS[normalized];
  }

  // Partial match: check if any known trait is contained in input or vice versa
  for (const [key, vector] of Object.entries(TRAIT_EMBEDDINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return vector;
    }
  }

  return null;
}

/**
 * Convert an array of trait strings to a single aggregated trait vector.
 * Earlier traits in the array are weighted more heavily.
 *
 * @param traits - Array of personality trait strings (1-10 items)
 * @param seed - Deterministic seed for hash fallback
 * @returns Aggregated 4D trait vector
 */
export function traitsToVector(traits: string[], seed: number): TraitVector {
  // Default to center if no traits provided
  if (!traits || traits.length === 0) {
    return {
      geometricOrganic: 0.5,
      connectedIsolated: 0.5,
      intensityScale: 0.5,
      motionTempo: 0.5,
    };
  }

  let result = {
    geometricOrganic: 0,
    connectedIsolated: 0,
    intensityScale: 0,
    motionTempo: 0,
  };
  let totalWeight = 0;

  for (let i = 0; i < traits.length; i++) {
    // Earlier traits weighted higher (1.0 for first, decreasing by 0.08 per position)
    const weight = Math.max(0.2, 1.0 - i * 0.08);

    // Try vocabulary lookup, fall back to hash
    let vector = findTraitVector(traits[i]);
    if (!vector) {
      vector = hashTraitToVector(traits[i], seed);
    }

    result.geometricOrganic += vector.geometricOrganic * weight;
    result.connectedIsolated += vector.connectedIsolated * weight;
    result.intensityScale += vector.intensityScale * weight;
    result.motionTempo += vector.motionTempo * weight;
    totalWeight += weight;
  }

  // Normalize by total weight
  return {
    geometricOrganic: result.geometricOrganic / totalWeight,
    connectedIsolated: result.connectedIsolated / totalWeight,
    intensityScale: result.intensityScale / totalWeight,
    motionTempo: result.motionTempo / totalWeight,
  };
}

/**
 * Get the default trait vector (center of all dimensions).
 */
export function getDefaultTraitVector(): TraitVector {
  return {
    geometricOrganic: 0.5,
    connectedIsolated: 0.5,
    intensityScale: 0.5,
    motionTempo: 0.5,
  };
}
