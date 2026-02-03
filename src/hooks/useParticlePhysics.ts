"use client";

import { useRef, useMemo, useCallback } from "react";
import { getFlowVelocity } from "@/lib/noise";
import type { VisualParams } from "@/lib/generation/params";

interface ParticleBuffers {
  positions: Float32Array;      // Current positions (x, y, z) * particleCount
  trailPositions: Float32Array; // Trail history (x, y, z) * particleCount * trailSegments
  sizes: Float32Array;          // Size per particle
  ages: Float32Array;           // Age per particle (0-1)
  colors: Float32Array;         // RGB per particle
  trailIndices: Float32Array;   // Trail position index (0=head, 1=tail)
  respawnData: Float32Array;    // Pre-computed respawn positions (x, y) * particleCount * RESPAWN_POOL_SIZE
}

interface ParticlePhysicsResult {
  buffers: ParticleBuffers;
  update: (time: number, delta: number) => void;
  totalVertices: number;
  trailSegments: number;
}

// Pre-compute respawn pool size per particle (module constant)
const RESPAWN_POOL_SIZE = 16;

// Seeded random number generator for deterministic initialization
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function useParticlePhysics(params: VisualParams): ParticlePhysicsResult {
  const { particleCount, trailLength, seed, complexity, organicness, animSpeed } = params;

  // Calculate trail segments from trailLength (0.1-0.9 -> 2-18 segments)
  const trailSegments = Math.floor(trailLength * 18) + 2;

  // Total vertices = particles * segments (for drawing trail lines/points)
  const totalVertices = particleCount * trailSegments;

  // Initialize buffers with useMemo (only recreate if particle count changes)
  const buffers = useMemo(() => {
    const random = seededRandom(seed);

    // Current positions
    const positions = new Float32Array(totalVertices * 3);

    // Trail positions (ring buffer per particle)
    const trailPositions = new Float32Array(totalVertices * 3);

    // Sizes (randomized per particle)
    const sizes = new Float32Array(totalVertices);

    // Ages (staggered for natural look)
    const ages = new Float32Array(totalVertices);

    // Colors (RGB per vertex, will be set from palette)
    const colors = new Float32Array(totalVertices * 3);

    // Trail indices (0 = head, 1 = tail)
    const trailIndices = new Float32Array(totalVertices);

    // Pre-computed respawn positions (x, y) per particle
    const respawnData = new Float32Array(particleCount * RESPAWN_POOL_SIZE * 2);
    const margin = 0.1;
    for (let p = 0; p < particleCount; p++) {
      for (let r = 0; r < RESPAWN_POOL_SIZE; r++) {
        const idx = (p * RESPAWN_POOL_SIZE + r) * 2;
        const edge = Math.floor(random() * 4);
        let rx: number, ry: number;
        switch (edge) {
          case 0: rx = (random() - 0.5) * 2; ry = -1 - margin * 0.5; break;
          case 1: rx = (random() - 0.5) * 2; ry = 1 + margin * 0.5; break;
          case 2: rx = -1 - margin * 0.5; ry = (random() - 0.5) * 2; break;
          default: rx = 1 + margin * 0.5; ry = (random() - 0.5) * 2; break;
        }
        respawnData[idx] = rx;
        respawnData[idx + 1] = ry;
      }
    }

    // Initialize particles
    for (let p = 0; p < particleCount; p++) {
      // Random starting position in normalized space [-1, 1]
      const startX = (random() - 0.5) * 2;
      const startY = (random() - 0.5) * 2;
      const startZ = 0;

      // Base size for this particle
      const baseSize = 0.5 + random() * 0.5;

      // Staggered age
      const baseAge = random();

      // Random color variation (will be mixed with palette)
      const colorR = 0.8 + random() * 0.2;
      const colorG = 0.8 + random() * 0.2;
      const colorB = 0.8 + random() * 0.2;

      // Initialize all trail segments for this particle
      for (let t = 0; t < trailSegments; t++) {
        const idx = p * trailSegments + t;

        // Position: start all trail segments at same position
        // Z = 0.1 to render in front of flow field (at z=0)
        positions[idx * 3] = startX;
        positions[idx * 3 + 1] = startY;
        positions[idx * 3 + 2] = 0.1;

        // Copy to trail positions
        trailPositions[idx * 3] = startX;
        trailPositions[idx * 3 + 1] = startY;
        trailPositions[idx * 3 + 2] = 0.1;

        // Size decreases along trail
        const trailFactor = t / (trailSegments - 1);
        sizes[idx] = baseSize * (1 - trailFactor * 0.5);

        // Age
        ages[idx] = baseAge;

        // Trail index (0 = head, 1 = tail)
        trailIndices[idx] = trailFactor;

        // Color
        colors[idx * 3] = colorR;
        colors[idx * 3 + 1] = colorG;
        colors[idx * 3 + 2] = colorB;
      }
    }

    return {
      positions,
      trailPositions,
      sizes,
      ages,
      colors,
      trailIndices,
      respawnData,
    };
  }, [particleCount, trailSegments, seed, totalVertices]);

  // Store previous head positions for trail update
  const headPositions = useRef<Float32Array | null>(null);

  // Respawn counters per particle (cycles through pre-computed respawn positions)
  const respawnCounters = useRef<Uint8Array | null>(null);

  // Initialize/resize refs and head positions when buffers change
  useMemo(() => {
    const headPosSize = particleCount * 3;
    const countersSize = particleCount;

    // Resize refs if needed
    if (!headPositions.current || headPositions.current.length !== headPosSize) {
      headPositions.current = new Float32Array(headPosSize);
    }
    if (!respawnCounters.current || respawnCounters.current.length !== countersSize) {
      respawnCounters.current = new Uint8Array(countersSize);
    }

    // Initialize head positions from buffer
    for (let p = 0; p < particleCount; p++) {
      const headIdx = p * trailSegments;
      headPositions.current[p * 3] = buffers.positions[headIdx * 3];
      headPositions.current[p * 3 + 1] = buffers.positions[headIdx * 3 + 1];
      headPositions.current[p * 3 + 2] = buffers.positions[headIdx * 3 + 2];
    }
  }, [buffers, particleCount, trailSegments]);

  // Update function called each frame
  const update = useCallback(
    (time: number, delta: number) => {
      // Guard against uninitialized refs (should never happen in practice)
      if (!headPositions.current || !respawnCounters.current) return;

      const dt = Math.min(delta, 0.05); // Cap delta to prevent large jumps
      const speed = animSpeed * 0.5; // Base movement speed

      for (let p = 0; p < particleCount; p++) {
        const headIdx = p * trailSegments;

        // Get current head position
        let x = headPositions.current[p * 3];
        let y = headPositions.current[p * 3 + 1];

        // Convert from [-1, 1] to [0, 1] UV space for flow sampling
        const uvX = x * 0.5 + 0.5;
        const uvY = y * 0.5 + 0.5;

        // Sample flow field velocity
        const [vx, vy] = getFlowVelocity(
          uvX,
          uvY,
          time * animSpeed,
          seed,
          complexity,
          organicness
        );

        // Update head position
        x += vx * dt * speed;
        y += vy * dt * speed;

        // Boundary handling: wrap around or respawn
        const margin = 0.1;
        if (x < -1 - margin || x > 1 + margin || y < -1 - margin || y > 1 + margin) {
          // Use pre-computed respawn position (cycle through pool)
          const respawnIdx = respawnCounters.current[p];
          const dataIdx = (p * RESPAWN_POOL_SIZE + respawnIdx) * 2;
          x = buffers.respawnData[dataIdx];
          y = buffers.respawnData[dataIdx + 1];
          respawnCounters.current[p] = (respawnIdx + 1) % RESPAWN_POOL_SIZE;

          // Reset trail to new position
          for (let t = 0; t < trailSegments; t++) {
            const idx = headIdx + t;
            buffers.positions[idx * 3] = x;
            buffers.positions[idx * 3 + 1] = y;
          }

          // Reset age for fade-in effect
          buffers.ages[headIdx] = 0;
        }

        // Store new head position
        headPositions.current[p * 3] = x;
        headPositions.current[p * 3 + 1] = y;

        // Shift trail positions using native copyWithin (much faster than loop)
        const trailStart = headIdx * 3;
        const trailLen = (trailSegments - 1) * 3;
        buffers.positions.copyWithin(trailStart + 3, trailStart, trailStart + trailLen);

        // Shift ages to match position shifts
        const ageTrailLen = trailSegments - 1;
        buffers.ages.copyWithin(headIdx + 1, headIdx, headIdx + ageTrailLen);

        // Set new head position (z=0.1 to render in front of flow field)
        buffers.positions[headIdx * 3] = x;
        buffers.positions[headIdx * 3 + 1] = y;
        buffers.positions[headIdx * 3 + 2] = 0.1;

        // Update head age only (trail ages propagate via copyWithin)
        buffers.ages[headIdx] = Math.min(buffers.ages[headIdx] + dt * 0.5, 1.0);
      }
    },
    [buffers, particleCount, trailSegments, seed, complexity, organicness, animSpeed]
  );

  return {
    buffers,
    update,
    totalVertices,
    trailSegments,
  };
}
