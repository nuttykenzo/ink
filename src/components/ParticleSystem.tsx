"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useParticlePhysics } from "@/hooks/useParticlePhysics";
import type { VisualParams } from "@/lib/generation/params";

// Import shaders as raw strings
import vertexShader from "@/shaders/particle.vert";
import fragmentShader from "@/shaders/particle.frag";

interface ParticleSystemProps {
  params: VisualParams;
}

export default function ParticleSystem({ params }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Get particle physics simulation
  const { buffers, update, totalVertices } = useParticlePhysics(params);

  // Create uniforms from visual params
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
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
      uColorVariety: { value: params.colorVariety },
      uPulseIntensity: { value: params.pulseIntensity },
      uPointSize: { value: 4.0 }, // Base point size in pixels
    }),
    [params]
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

    // Size attribute
    geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(buffers.sizes, 1)
    );

    // Trail position attribute (0 = head, 1 = tail)
    geometry.setAttribute(
      "aTrailPosition",
      new THREE.BufferAttribute(buffers.trailIndices, 1)
    );

    // Age attribute
    geometry.setAttribute(
      "aAge",
      new THREE.BufferAttribute(buffers.ages, 1)
    );

    // Color attribute
    geometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(buffers.colors, 3)
    );

    // Set draw range
    geometry.setDrawRange(0, totalVertices);
  }, [buffers, totalVertices]);

  // Animation loop
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Update particle physics
    update(time, delta);

    // Mark position buffer as needing update
    if (geometryRef.current) {
      const positionAttr = geometryRef.current.getAttribute("position");
      if (positionAttr) {
        (positionAttr as THREE.BufferAttribute).needsUpdate = true;
      }

      const ageAttr = geometryRef.current.getAttribute("aAge");
      if (ageAttr) {
        (ageAttr as THREE.BufferAttribute).needsUpdate = true;
      }
    }

    // Update time uniform
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time * params.animSpeed;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
