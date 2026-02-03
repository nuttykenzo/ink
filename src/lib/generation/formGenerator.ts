import { hashString, hashToFloat } from "./hash";
import type { TraitVector } from "./traitVocabulary";

/**
 * A single characteristic form with its geometry and properties.
 */
export interface CharacteristicForm {
  // Geometry: array of [x, y] vertices defining the form boundary
  vertices: Array<[number, number]>;
  // Center position in normalized coordinates (-1 to 1)
  center: [number, number];
  // Scale factor
  scale: number;
  // Base rotation in radians
  rotation: number;
  // Position on geometric-organic spectrum (0-1)
  archetypeBlend: number;
  // Indices of other forms this one connects to (for network rendering)
  connectionTargets: number[];
  // Unique identifier for this form (for animation offsets)
  formId: number;
}

/**
 * Create a seeded random number generator.
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    // Simple mulberry32 PRNG
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Linear interpolation between two values.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate vertex ring for a single form.
 * More vertices = more organic, fewer = more geometric.
 */
function generateVertexRing(
  vertexCount: number,
  organicFactor: number,
  random: () => number
): Array<[number, number]> {
  const vertices: Array<[number, number]> = [];

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    const baseRadius = 1.0;

    // Add irregularity based on organic factor
    // Geometric (0): very regular, Organic (1): quite irregular
    const irregularity = organicFactor * 0.35;
    const radiusVariation = 1 + (random() - 0.5) * 2 * irregularity;

    // For organic forms, also add slight angle perturbation
    const angleOffset = organicFactor * (random() - 0.5) * 0.2;

    const finalAngle = angle + angleOffset;
    const finalRadius = baseRadius * radiusVariation;

    vertices.push([
      Math.cos(finalAngle) * finalRadius,
      Math.sin(finalAngle) * finalRadius,
    ]);
  }

  return vertices;
}

/**
 * Generate layout positions for forms based on connectivity.
 * Low connectedIsolated = clustered, High = spread out.
 */
function generateLayout(
  count: number,
  connectedIsolated: number,
  random: () => number
): Array<[number, number]> {
  const positions: Array<[number, number]> = [];

  // Base spread radius: 0.15 (clustered) to 0.55 (spread)
  const spreadRadius = lerp(0.15, 0.55, connectedIsolated);

  // Add slight randomness to base angle to avoid perfect symmetry
  const baseAngleOffset = random() * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    // Distribute forms in a rough circle/spiral
    const angle = baseAngleOffset + (i / count) * Math.PI * 2;

    // Radius varies: closer together when connected, farther when isolated
    const radiusVariation = 0.7 + random() * 0.6;
    const r = spreadRadius * radiusVariation;

    // Add some randomness to position
    const jitter = lerp(0.08, 0.02, connectedIsolated); // More jitter when clustered
    const jitterX = (random() - 0.5) * jitter;
    const jitterY = (random() - 0.5) * jitter;

    positions.push([
      Math.cos(angle) * r + jitterX,
      Math.sin(angle) * r + jitterY,
    ]);
  }

  return positions;
}

/**
 * Determine which forms should connect to each other.
 * Only creates connections when connectedIsolated is low (networked).
 */
function generateConnections(
  formCount: number,
  connectedIsolated: number,
  random: () => number
): Array<number[]> {
  const connections: Array<number[]> = Array.from(
    { length: formCount },
    () => []
  );

  // No connections if too isolated
  if (connectedIsolated > 0.6) {
    return connections;
  }

  // Connection probability decreases as isolation increases
  const connectionProb = lerp(0.7, 0.1, connectedIsolated / 0.6);

  for (let i = 0; i < formCount; i++) {
    for (let j = i + 1; j < formCount; j++) {
      if (random() < connectionProb) {
        connections[i].push(j);
        connections[j].push(i);
      }
    }
  }

  // Ensure at least some connectivity when very connected
  if (connectedIsolated < 0.2) {
    for (let i = 0; i < formCount; i++) {
      const next = (i + 1) % formCount;
      if (!connections[i].includes(next)) {
        connections[i].push(next);
        connections[next].push(i);
      }
    }
  }

  return connections;
}

/**
 * Generate all characteristic forms based on trait vector.
 *
 * @param traitVector - 4D trait-space coordinates
 * @param seed - Deterministic seed for randomness
 * @param formCount - Number of forms to generate (typically 3-7)
 * @returns Array of CharacteristicForm objects
 */
export function generateForms(
  traitVector: TraitVector,
  seed: number,
  formCount: number
): CharacteristicForm[] {
  const random = createSeededRandom(seed);
  const forms: CharacteristicForm[] = [];

  // Determine vertex count based on geometric-organic axis
  // Geometric (0): 5-8 vertices, Organic (1): 16-28 vertices
  const minVerts = Math.round(lerp(5, 16, traitVector.geometricOrganic));
  const maxVerts = Math.round(lerp(8, 28, traitVector.geometricOrganic));

  // Generate layout positions
  const positions = generateLayout(
    formCount,
    traitVector.connectedIsolated,
    random
  );

  // Generate connections
  const connections = generateConnections(
    formCount,
    traitVector.connectedIsolated,
    random
  );

  // Base scale from intensity (more intense = larger forms)
  const baseScale = lerp(0.15, 0.35, traitVector.intensityScale);

  for (let i = 0; i < formCount; i++) {
    // Vary vertex count per form
    const vertexCount = Math.round(minVerts + random() * (maxVerts - minVerts));

    // Generate vertices
    const vertices = generateVertexRing(
      vertexCount,
      traitVector.geometricOrganic,
      random
    );

    // Scale varies slightly per form
    const scaleVariation = 0.7 + random() * 0.6;
    const scale = baseScale * scaleVariation;

    // Random rotation
    const rotation = random() * Math.PI * 2;

    forms.push({
      vertices,
      center: positions[i],
      scale,
      rotation,
      archetypeBlend: traitVector.geometricOrganic,
      connectionTargets: connections[i],
      formId: i,
    });
  }

  return forms;
}

/**
 * Convert forms to flat buffer arrays for GPU rendering.
 * Returns arrays suitable for BufferGeometry attributes.
 */
export function formsToBuffers(forms: CharacteristicForm[]): {
  positions: Float32Array;
  formIndices: Float32Array;
  edgeFactors: Float32Array;
  noiseOffsets: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  triangleCount: number;
} {
  // Calculate total vertices and triangles
  // Each form is a triangle fan: center + perimeter vertices
  // Triangles = number of perimeter vertices (forms a closed fan)
  let totalVertices = 0;
  let totalTriangles = 0;

  for (const form of forms) {
    totalVertices += form.vertices.length + 1; // perimeter + center
    totalTriangles += form.vertices.length; // fan triangles
  }

  const positions = new Float32Array(totalVertices * 3);
  const formIndices = new Float32Array(totalVertices);
  const edgeFactors = new Float32Array(totalVertices);
  const noiseOffsets = new Float32Array(totalVertices);
  const indices = new Uint16Array(totalTriangles * 3);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (let f = 0; f < forms.length; f++) {
    const form = forms[f];
    const centerIndex = vertexOffset;

    // Center vertex
    positions[vertexOffset * 3] = form.center[0];
    positions[vertexOffset * 3 + 1] = form.center[1];
    positions[vertexOffset * 3 + 2] = 0.05; // Z position for layer ordering
    formIndices[vertexOffset] = f;
    edgeFactors[vertexOffset] = 0; // Center has edge factor 0
    noiseOffsets[vertexOffset] = f * 17.3; // Unique per form
    vertexOffset++;

    // Perimeter vertices
    for (let v = 0; v < form.vertices.length; v++) {
      const [x, y] = form.vertices[v];

      // Apply rotation and scale, then translate to center
      const cos = Math.cos(form.rotation);
      const sin = Math.sin(form.rotation);
      const rotX = x * cos - y * sin;
      const rotY = x * sin + y * cos;

      positions[vertexOffset * 3] = form.center[0] + rotX * form.scale;
      positions[vertexOffset * 3 + 1] = form.center[1] + rotY * form.scale;
      positions[vertexOffset * 3 + 2] = 0.05;
      formIndices[vertexOffset] = f;
      edgeFactors[vertexOffset] = 1; // Perimeter has edge factor 1
      noiseOffsets[vertexOffset] = f * 17.3 + v * 0.7;
      vertexOffset++;
    }

    // Generate triangle indices (fan from center)
    const perimeterStart = centerIndex + 1;
    for (let v = 0; v < form.vertices.length; v++) {
      const v1 = perimeterStart + v;
      const v2 = perimeterStart + ((v + 1) % form.vertices.length);

      indices[indexOffset] = centerIndex;
      indices[indexOffset + 1] = v1;
      indices[indexOffset + 2] = v2;
      indexOffset += 3;
    }
  }

  return {
    positions,
    formIndices,
    edgeFactors,
    noiseOffsets,
    indices,
    vertexCount: totalVertices,
    triangleCount: totalTriangles,
  };
}

/**
 * Generate connection line geometry between forms.
 * Returns simple line segment data.
 */
export function generateConnectionLines(forms: CharacteristicForm[]): {
  positions: Float32Array;
  lineCount: number;
} {
  // Count unique connections (avoid duplicates)
  const connections: Array<[number, number]> = [];
  for (let i = 0; i < forms.length; i++) {
    for (const target of forms[i].connectionTargets) {
      if (target > i) {
        // Only add once per pair
        connections.push([i, target]);
      }
    }
  }

  const positions = new Float32Array(connections.length * 6); // 2 vertices per line, 3 coords each

  for (let i = 0; i < connections.length; i++) {
    const [a, b] = connections[i];
    const formA = forms[a];
    const formB = forms[b];

    // Line from center A to center B
    positions[i * 6] = formA.center[0];
    positions[i * 6 + 1] = formA.center[1];
    positions[i * 6 + 2] = 0.04; // Slightly behind forms

    positions[i * 6 + 3] = formB.center[0];
    positions[i * 6 + 4] = formB.center[1];
    positions[i * 6 + 5] = 0.04;
  }

  return {
    positions,
    lineCount: connections.length,
  };
}
