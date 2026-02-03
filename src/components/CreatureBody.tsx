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
 * Simplex noise for organic shapes.
 */
function noise2D(x: number, y: number, seed: number): number {
  const random = createSeededRandom(Math.floor(x * 1000 + y * 7919 + seed));
  return random() * 2 - 1;
}

/**
 * Smooth noise with interpolation.
 */
function smoothNoise(angle: number, frequency: number, seed: number): number {
  const x = Math.cos(angle) * frequency;
  const y = Math.sin(angle) * frequency;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Bilinear interpolation of noise
  const n00 = noise2D(ix, iy, seed);
  const n10 = noise2D(ix + 1, iy, seed);
  const n01 = noise2D(ix, iy + 1, seed);
  const n11 = noise2D(ix + 1, iy + 1, seed);

  const nx0 = n00 * (1 - fx) + n10 * fx;
  const nx1 = n01 * (1 - fx) + n11 * fx;

  return nx0 * (1 - fy) + nx1 * fy;
}

/**
 * Generate wild body forms based on traits.
 *
 * Forms:
 * - Cosmic (geometricOrganic < 0.3): Crystalline polygon with fractal spikes
 * - Organic (geometricOrganic > 0.7): Amoeba with pseudopods
 * - Lovecraftian (connectedIsolated > 0.7): Multi-lobed mass
 * - Balanced: Rounder, relatable form with gentle undulation
 */
function generateBodyBuffers(
  body: BodyConfig,
  seed: number,
  traits: TraitVector
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
  const { resolution, radius, aspect } = body;
  const { geometricOrganic, connectedIsolated, intensityScale } = traits;

  // Determine form type
  const isCosmic = geometricOrganic < 0.3;
  const isOrganic = geometricOrganic > 0.7;
  const isLovecraftian = !isCosmic && !isOrganic && connectedIsolated > 0.7;

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
  positions[2] = 0.06;
  edgeFactors[0] = 0;
  noiseOffsets[0] = random() * 100;
  angles[0] = 0;

  // Generate perimeter based on form type
  for (let i = 0; i < resolution; i++) {
    const t = i / resolution;
    const angle = t * Math.PI * 2;
    const idx = i + 1;

    let r = radius;

    if (isCosmic) {
      // COSMIC/CRYSTALLINE: Sharp polygon with fractal spikes
      const sides = 5 + Math.floor(random() * 3); // 5-7 sides
      const polygonAngle = angle * sides / (Math.PI * 2);
      const sidePhase = polygonAngle - Math.floor(polygonAngle);

      // Sharp polygon edge
      const polygonRadius = radius / Math.cos(Math.PI / sides * (2 * Math.abs(sidePhase - 0.5)));
      r = Math.min(polygonRadius, radius * 1.3);

      // Fractal spikes at vertices
      const vertexProximity = Math.abs(sidePhase - 0.5) * 2; // 0 at vertices, 1 at midpoints
      const spikeAmount = Math.pow(1 - vertexProximity, 3) * radius * 0.4 * intensityScale;
      r += spikeAmount;

      // Secondary crystalline detail
      const crystalNoise = Math.sin(angle * 12 + seed) * 0.03 * radius;
      r += crystalNoise;

    } else if (isOrganic) {
      // ORGANIC/BIOLUMINESCENT: Amoeba with pseudopods
      // Multiple overlapping pseudopod bulges
      const pseudopodCount = 3 + Math.floor(random() * 3);
      let pseudopodEffect = 0;

      for (let p = 0; p < pseudopodCount; p++) {
        const podAngle = (random() * Math.PI * 2);
        const podWidth = 0.3 + random() * 0.4; // How wide the pseudopod is
        const podLength = 0.2 + random() * 0.4 * intensityScale; // How far it extends

        // Gaussian-like falloff from pod center
        let angleDiff = Math.abs(angle - podAngle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        const podInfluence = Math.exp(-angleDiff * angleDiff / (podWidth * podWidth));

        pseudopodEffect += podInfluence * podLength * radius;
      }

      r += pseudopodEffect;

      // Flowing organic noise
      const organicNoise = smoothNoise(angle, 3, seed) * 0.1 * radius;
      r += organicNoise;

      // Soft undulation
      r += Math.sin(angle * 5 + seed * 0.1) * 0.02 * radius;

    } else if (isLovecraftian) {
      // LOVECRAFTIAN: Multi-lobed mass with tentacular extensions
      // Asymmetric lobes
      const lobeCount = 2 + Math.floor(random() * 2);
      let lobeEffect = 0;

      for (let l = 0; l < lobeCount; l++) {
        const lobeAngle = random() * Math.PI * 2;
        const lobeSize = 0.15 + random() * 0.25;
        const lobeExtent = 0.3 + random() * 0.5 * intensityScale;

        let angleDiff = Math.abs(angle - lobeAngle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        const lobeInfluence = Math.exp(-angleDiff * angleDiff / (lobeSize * lobeSize));

        lobeEffect += lobeInfluence * lobeExtent * radius;
      }

      r += lobeEffect;

      // Tentacular base extensions (thin spikes going down)
      const tentacleCount = 2 + Math.floor(random() * 3);
      for (let tc = 0; tc < tentacleCount; tc++) {
        const tentAngle = Math.PI + (random() - 0.5) * 1.2; // Bottom half
        const tentWidth = 0.08 + random() * 0.05;
        const tentLength = 0.2 + random() * 0.3 * intensityScale;

        let angleDiff = Math.abs(angle - tentAngle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        const tentInfluence = Math.exp(-angleDiff * angleDiff / (tentWidth * tentWidth));

        r += tentInfluence * tentLength * radius;
      }

      // Unsettling irregular noise
      const eerieNoise = smoothNoise(angle, 5, seed + 999) * 0.08 * radius * connectedIsolated;
      r += eerieNoise;

    } else {
      // BALANCED: Rounder, friendly form with gentle variation
      // Soft bilateral symmetry tendency
      const symmetryBias = 0.5 + 0.5 * Math.cos(angle * 2);
      const gentleVariation = smoothNoise(angle, 2, seed) * 0.06 * radius * symmetryBias;
      r += gentleVariation;

      // Subtle breathing-friendly roundness
      r += Math.sin(angle * 3 + seed * 0.05) * 0.02 * radius;
    }

    // Apply aspect ratio
    const x = Math.cos(angle) * r * aspect[0];
    const y = Math.sin(angle) * r * aspect[1];

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

    indices[i * 3] = 0;
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

  // Generate body buffers (memoized) - pass traits for wild forms
  const buffers = useMemo(
    () => generateBodyBuffers(body, 12345, traitVector),
    [body, traitVector]
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
      // Boost opacity so body stands out from background (min 0.85)
      uOpacity: { value: Math.max(0.85, body.membrane.opacity) },
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
