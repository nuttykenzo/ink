"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AppendageConfig, CreatureColors } from "@/lib/creature/types";

// Import shaders
import vertexShader from "@/shaders/creature/appendage.vert";
import fragmentShader from "@/shaders/creature/appendage.frag";

/** Appendage type to shader int mapping */
const APPENDAGE_TYPE_MAP: Record<AppendageConfig["type"], number> = {
  spoke: 0,
  tendril: 1,
  limb: 2,
  tail: 3,
  cilia: 4,
  antenna: 5,
};

interface CreatureAppendageProps {
  config: AppendageConfig;
  bodyRadius: number;
  colors: CreatureColors;
  animSpeed: number;
  breathPhase: number;
  glowIntensity?: number;
}

/**
 * Generate segmented tube geometry for appendage.
 * Creates vertices along length with circumference at each segment.
 */
function generateAppendageGeometry(
  config: AppendageConfig,
  bodyRadius: number
): {
  positions: Float32Array;
  segmentTs: Float32Array;
  circumferenceTs: Float32Array;
  baseRadii: Float32Array;
  indices: Uint16Array;
} {
  const { segments, length, thickness, taper } = config;
  const circumferenceResolution = 8; // Vertices around each ring

  const totalVertices = (segments + 1) * circumferenceResolution;
  const positions = new Float32Array(totalVertices * 3);
  const segmentTs = new Float32Array(totalVertices);
  const circumferenceTs = new Float32Array(totalVertices);
  const baseRadii = new Float32Array(totalVertices);

  const actualLength = length * bodyRadius * 3; // Scale for good visibility
  const baseThickness = thickness * bodyRadius * 5; // Visible but not chunky

  // Generate vertices
  let vertexIndex = 0;
  for (let seg = 0; seg <= segments; seg++) {
    const t = seg / segments; // 0 at base, 1 at tip
    const y = t * actualLength;
    const radius = baseThickness * (1 - t * taper);

    for (let c = 0; c < circumferenceResolution; c++) {
      const angle = (c / circumferenceResolution) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      positions[vertexIndex * 3] = x;
      positions[vertexIndex * 3 + 1] = y;
      positions[vertexIndex * 3 + 2] = z;

      segmentTs[vertexIndex] = t;
      circumferenceTs[vertexIndex] = c / circumferenceResolution;
      baseRadii[vertexIndex] = radius;

      vertexIndex++;
    }
  }

  // Generate indices for quad strips between segments
  const totalQuads = segments * circumferenceResolution;
  const indices = new Uint16Array(totalQuads * 6);

  let indexOffset = 0;
  for (let seg = 0; seg < segments; seg++) {
    for (let c = 0; c < circumferenceResolution; c++) {
      const current = seg * circumferenceResolution + c;
      const next = seg * circumferenceResolution + ((c + 1) % circumferenceResolution);
      const currentUp = (seg + 1) * circumferenceResolution + c;
      const nextUp = (seg + 1) * circumferenceResolution + ((c + 1) % circumferenceResolution);

      // Two triangles per quad
      indices[indexOffset++] = current;
      indices[indexOffset++] = currentUp;
      indices[indexOffset++] = next;

      indices[indexOffset++] = next;
      indices[indexOffset++] = currentUp;
      indices[indexOffset++] = nextUp;
    }
  }

  return { positions, segmentTs, circumferenceTs, baseRadii, indices };
}

export default function CreatureAppendage({
  config,
  bodyRadius,
  colors,
  animSpeed,
  breathPhase,
  glowIntensity = 0.5,
}: CreatureAppendageProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Calculate attachment position on body edge
  const attachX = Math.cos(config.attachAngle) * bodyRadius;
  const attachY = Math.sin(config.attachAngle) * bodyRadius;

  // Generate geometry buffers
  const buffers = useMemo(
    () => generateAppendageGeometry(config, bodyRadius),
    [config, bodyRadius]
  );

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveAmplitude: { value: config.wave.amplitude },
      uWaveFrequency: { value: config.wave.frequency },
      uWaveSpeed: { value: config.wave.speed },
      uWavePhase: { value: config.wave.phase },
      uBreathPhase: { value: breathPhase },
      uAppendageType: { value: APPENDAGE_TYPE_MAP[config.type] },
      uAttachPoint: { value: new THREE.Vector2(attachX, attachY) },
      uAttachAngle: { value: config.attachAngle },
      uBodyColor: { value: new THREE.Vector3(...colors.body) },
      uAccentColor: { value: new THREE.Vector3(...colors.accent) },
      uMembraneColor: { value: new THREE.Vector3(...colors.membrane) },
      uOpacity: { value: 0.85 },
      uGlowIntensity: { value: glowIntensity },
    }),
    [config, colors, attachX, attachY, breathPhase, glowIntensity]
  );

  // Set up buffer attributes
  useEffect(() => {
    if (!geometryRef.current) return;

    const geometry = geometryRef.current;

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(buffers.positions, 3)
    );
    geometry.setAttribute(
      "aSegmentT",
      new THREE.BufferAttribute(buffers.segmentTs, 1)
    );
    geometry.setAttribute(
      "aCircumferenceT",
      new THREE.BufferAttribute(buffers.circumferenceTs, 1)
    );
    geometry.setAttribute(
      "aBaseRadius",
      new THREE.BufferAttribute(buffers.baseRadii, 1)
    );
    geometry.setIndex(new THREE.BufferAttribute(buffers.indices, 1));

    geometry.computeBoundingSphere();
  }, [buffers]);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time * animSpeed;
      materialRef.current.uniforms.uBreathPhase.value = breathPhase;
    }
  });

  // Rotation to point appendage in correct direction
  // Appendage grows along +Y, so rotate to match attachAngle
  const rotation: [number, number, number] = [
    0,
    0,
    config.attachAngle - Math.PI / 2, // Rotate so +Y aligns with attach direction
  ];

  return (
    <mesh
      ref={meshRef}
      position={[attachX, attachY, 0.04]} // Slightly behind body (body is at 0.06)
      rotation={rotation}
      renderOrder={1}
    >
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
