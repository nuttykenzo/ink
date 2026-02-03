"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EyeConfig } from "@/lib/creature/types";

// Import shaders as raw strings
import vertexShader from "@/shaders/creature/eye.vert";
import fragmentShader from "@/shaders/creature/eye.frag";

/** Iris pattern type to shader int */
const IRIS_PATTERN_MAP = {
  rings: 0,
  radial: 1,
  spiral: 2,
  organic: 3,
} as const;

/** Pupil shape type to shader int */
const PUPIL_SHAPE_MAP = {
  round: 0,
  vertical: 1,
  horizontal: 2,
  star: 3,
} as const;

interface CreatureEyeProps {
  config: EyeConfig;
  /** Body radius for positioning */
  bodyRadius: number;
  /** Animation state: current gaze offset [-1, 1] */
  gazeOffset: [number, number];
  /** Animation state: current pupil dilation [0, 1] */
  pupilDilation: number;
  /** Animation state: current blink amount [0=open, 1=closed] */
  blinkAmount: number;
  /** Animation speed multiplier */
  animSpeed: number;
}

export default function CreatureEye({
  config,
  bodyRadius,
  gazeOffset,
  pupilDilation,
  blinkAmount,
  animSpeed,
}: CreatureEyeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Calculate actual size and position
  const eyeSize = config.size * bodyRadius * 2; // Diameter
  const position: [number, number, number] = [
    config.position[0] * bodyRadius,
    config.position[1] * bodyRadius,
    0.08, // Z position in front of body
  ];

  // Calculate actual pupil size from dilation
  const { dilationRange, baseSize } = config.pupil;
  const actualPupilSize = baseSize + (dilationRange[1] - dilationRange[0]) * pupilDilation;

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGazeOffset: { value: new THREE.Vector2(gazeOffset[0], gazeOffset[1]) },
      uPupilDilation: { value: pupilDilation },
      uBlinkAmount: { value: blinkAmount },
      uIrisColor: { value: new THREE.Vector3(...config.iris.color) },
      uPupilColor: { value: new THREE.Vector3(0.02, 0.02, 0.02) },
      uIrisRings: { value: config.iris.ringCount },
      uFiberDensity: { value: config.iris.fiberDensity },
      uPupilShape: { value: PUPIL_SHAPE_MAP[config.pupil.shape] },
      uPupilSize: { value: actualPupilSize },
      uGlowing: { value: config.pupil.glowing },
      uGlowColor: {
        value: config.pupil.glowColor
          ? new THREE.Vector3(...config.pupil.glowColor)
          : new THREE.Vector3(0.5, 0.5, 1.0),
      },
      uIrisPattern: { value: IRIS_PATTERN_MAP[config.iris.pattern] },
    }),
    [config, gazeOffset, pupilDilation, blinkAmount, actualPupilSize]
  );

  // Update uniforms each frame
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time * animSpeed;
      materialRef.current.uniforms.uGazeOffset.value.set(gazeOffset[0], gazeOffset[1]);
      materialRef.current.uniforms.uPupilDilation.value = pupilDilation;
      materialRef.current.uniforms.uBlinkAmount.value = blinkAmount;

      // Recalculate pupil size with current dilation
      const currentPupilSize = baseSize + (dilationRange[1] - dilationRange[0]) * pupilDilation;
      materialRef.current.uniforms.uPupilSize.value = currentPupilSize;
    }
  });

  return (
    <mesh ref={meshRef} position={position} renderOrder={3}>
      <planeGeometry args={[eyeSize, eyeSize]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}
