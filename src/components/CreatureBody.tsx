"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BodyConfig, CreatureColors, BehaviorConfig } from "@/lib/creature/types";
import type { TraitVector } from "@/lib/generation/traitVocabulary";
import { generateStyle } from "@/lib/creature/styleGenerator";

// Import shaders as raw strings
import vertexShader from "@/shaders/creature/body.vert";
import fragmentShader from "@/shaders/creature/body.frag";

interface CreatureBodyProps {
  body: BodyConfig;
  colors: CreatureColors;
  behavior: BehaviorConfig;
  animSpeed: number;
  saturation: number;
  breathPhase: number;
  driftOffset: [number, number];
  traitVector: TraitVector;
}

/**
 * Seeded random number generator.
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate body mesh buffers from configuration.
 * Creates a triangle fan with center vertex + perimeter vertices.
 */
function generateBodyBuffers(
  body: BodyConfig,
  seed: number
): {
  positions: Float32Array;
  edgeFactors: Float32Array;
  noiseOffsets: Float32Array;
  angles: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  triangleCount: number;
} {
  const random = createSeededRandom(seed);
  const { resolution, radius, aspect, irregularity } = body;

  // Total vertices = center + perimeter
  const vertexCount = resolution + 1;
  const triangleCount = resolution;

  const positions = new Float32Array(vertexCount * 3);
  const edgeFactors = new Float32Array(vertexCount);
  const noiseOffsets = new Float32Array(vertexCount);
  const angles = new Float32Array(vertexCount);
  const indices = new Uint16Array(triangleCount * 3);

  // Center vertex (index 0)
  positions[0] = 0;
  positions[1] = 0;
  positions[2] = 0.06; // Z position for layer ordering
  edgeFactors[0] = 0;
  noiseOffsets[0] = random() * 100;
  angles[0] = 0;

  // Perimeter vertices
  for (let i = 0; i < resolution; i++) {
    const angle = (i / resolution) * Math.PI * 2;
    const idx = i + 1;

    // Base position on ellipse
    let x = Math.cos(angle) * radius * aspect[0];
    let y = Math.sin(angle) * radius * aspect[1];

    // Add irregularity (static noise based on seed)
    const irregularityAmount = irregularity * radius * 0.3;
    x += (random() - 0.5) * 2 * irregularityAmount;
    y += (random() - 0.5) * 2 * irregularityAmount;

    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = 0.06;

    edgeFactors[idx] = 1;
    noiseOffsets[idx] = random() * 100;
    angles[idx] = angle;
  }

  // Triangle indices (fan from center)
  for (let i = 0; i < resolution; i++) {
    const v1 = i + 1;
    const v2 = ((i + 1) % resolution) + 1;

    indices[i * 3] = 0; // center
    indices[i * 3 + 1] = v1;
    indices[i * 3 + 2] = v2;
  }

  return {
    positions,
    edgeFactors,
    noiseOffsets,
    angles,
    indices,
    vertexCount,
    triangleCount,
  };
}

export default function CreatureBody({
  body,
  colors,
  behavior,
  animSpeed,
  saturation,
  breathPhase,
  driftOffset,
  traitVector,
}: CreatureBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Generate style from traits
  const style = useMemo(() => generateStyle(traitVector), [traitVector]);

  // Generate body buffers (memoized)
  const buffers = useMemo(
    () => generateBodyBuffers(body, 12345),
    [body]
  );

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBreathPhase: { value: breathPhase },
      uBreathAmplitude: { value: body.membrane.breathAmplitude },
      uIrregularity: { value: body.irregularity },
      uOrganicFactor: { value: body.irregularity > 0.1 ? 1.0 : 0.3 },
      uDriftOffset: { value: new THREE.Vector2(driftOffset[0], driftOffset[1]) },

      // Fragment uniforms
      uBodyColor: { value: new THREE.Vector3(...colors.body) },
      uMembraneColor: { value: new THREE.Vector3(...colors.membrane) },
      uAccentColor: { value: new THREE.Vector3(...colors.accent) },
      uOpacity: { value: body.membrane.opacity },
      uMembraneThickness: { value: body.membrane.thickness },
      uSaturation: { value: saturation },

      // Style uniforms
      uStyleMode: { value: style.modeValue },
      uBioluminescence: { value: style.glowIntensity },
      uFractalDetail: { value: style.fractalDetail },
      uEerieIntensity: { value: style.eerieIntensity },

      // Nucleus uniforms
      uHasNucleus: { value: body.nucleus !== undefined },
      uNucleusPos: {
        value: body.nucleus
          ? new THREE.Vector2(body.nucleus.position[0] * body.radius, body.nucleus.position[1] * body.radius)
          : new THREE.Vector2(0, 0),
      },
      uNucleusSize: {
        value: body.nucleus ? body.nucleus.size * body.radius : 0,
      },
      uNucleusPulse: { value: 0 },
      uNucleusColor: {
        value: body.nucleus
          ? new THREE.Vector3(...body.nucleus.color)
          : new THREE.Vector3(...colors.nucleus),
      },
    }),
    [body, colors, saturation, breathPhase, driftOffset, style]
  );

  // Set up buffer attributes
  useEffect(() => {
    if (!geometryRef.current) return;

    const geometry = geometryRef.current;

    // Position attribute
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(buffers.positions, 3)
    );

    // Edge factor attribute
    geometry.setAttribute(
      "aEdgeFactor",
      new THREE.BufferAttribute(buffers.edgeFactors, 1)
    );

    // Noise offset attribute
    geometry.setAttribute(
      "aNoiseOffset",
      new THREE.BufferAttribute(buffers.noiseOffsets, 1)
    );

    // Angle attribute
    geometry.setAttribute(
      "aAngle",
      new THREE.BufferAttribute(buffers.angles, 1)
    );

    // Index buffer
    geometry.setIndex(new THREE.BufferAttribute(buffers.indices, 1));

    // Set draw range
    geometry.setDrawRange(0, buffers.triangleCount * 3);

    // Compute bounding sphere
    geometry.computeBoundingSphere();
  }, [buffers]);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time * animSpeed;
      materialRef.current.uniforms.uBreathPhase.value = breathPhase;
      materialRef.current.uniforms.uDriftOffset.value.set(driftOffset[0], driftOffset[1]);

      // Nucleus pulse
      if (body.nucleus) {
        materialRef.current.uniforms.uNucleusPulse.value =
          time * body.nucleus.pulseRate * Math.PI * 2;
      }
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={2}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}
