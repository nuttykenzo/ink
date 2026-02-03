"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { VisualParams } from "@/lib/generation/params";
import { generateForms, formsToBuffers } from "@/lib/generation/formGenerator";

// Import shaders as raw strings
import vertexShader from "@/shaders/form.vert";
import fragmentShader from "@/shaders/form.frag";

interface CharacteristicFormsProps {
  params: VisualParams;
}

export default function CharacteristicForms({
  params,
}: CharacteristicFormsProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Generate forms based on trait vector
  const forms = useMemo(
    () => generateForms(params.traitVector, params.seed, params.formCount),
    [params.traitVector, params.seed, params.formCount]
  );

  // Convert forms to GPU buffers
  const buffers = useMemo(() => formsToBuffers(forms), [forms]);

  // Create uniforms from visual params
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotionTempo: { value: params.traitVector.motionTempo },
      uOrganicFactor: { value: params.traitVector.geometricOrganic },
      uIntensity: { value: params.traitVector.intensityScale },
      uColor1: {
        value: new THREE.Vector3(
          params.palette.primary.r,
          params.palette.primary.g,
          params.palette.primary.b
        ),
      },
      uColor2: {
        value: new THREE.Vector3(
          params.palette.secondary.r,
          params.palette.secondary.g,
          params.palette.secondary.b
        ),
      },
      uColor3: {
        value: new THREE.Vector3(
          params.palette.accent.r,
          params.palette.accent.g,
          params.palette.accent.b
        ),
      },
      uSaturation: { value: params.saturation },
    }),
    [params]
  );

  // Set up buffer attributes
  useEffect(() => {
    if (!geometryRef.current) return;

    const geometry = geometryRef.current;

    // Position attribute (vec3)
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(buffers.positions, 3)
    );

    // Form index attribute (float) - which form this vertex belongs to
    geometry.setAttribute(
      "aFormIndex",
      new THREE.BufferAttribute(buffers.formIndices, 1)
    );

    // Edge factor attribute (float) - 0 = center, 1 = edge
    geometry.setAttribute(
      "aEdgeFactor",
      new THREE.BufferAttribute(buffers.edgeFactors, 1)
    );

    // Noise offset attribute (float) - unique per vertex for animation
    geometry.setAttribute(
      "aNoiseOffset",
      new THREE.BufferAttribute(buffers.noiseOffsets, 1)
    );

    // Index buffer for triangles
    geometry.setIndex(new THREE.BufferAttribute(buffers.indices, 1));

    // Set draw range
    geometry.setDrawRange(0, buffers.triangleCount * 3);

    // Compute bounding sphere for frustum culling
    geometry.computeBoundingSphere();
  }, [buffers]);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Update time uniform
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time * params.animSpeed;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={1}>
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
