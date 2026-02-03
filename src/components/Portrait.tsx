"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { VisualParams } from "@/lib/generation/params";
import type { CanvasCapture } from "@/lib/export/types";
import ParticleSystem from "./ParticleSystem";
import CharacteristicForms from "./CharacteristicForms";

// Import shaders as raw strings
import vertexShader from "@/shaders/flowField.vert";
import fragmentShader from "@/shaders/flowField.frag";

interface FlowFieldProps {
  params: VisualParams;
}

function FlowField({ params }: FlowFieldProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create uniforms from visual params
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: params.seed },
      uComplexity: { value: params.complexity },
      uOrganicness: { value: params.organicness },
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

  // Animate uTime
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value =
        state.clock.elapsedTime * params.animSpeed;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

interface ExportControllerProps {
  onRegister: (capture: CanvasCapture) => void;
  animSpeed: number;
}

/**
 * Internal component that exposes canvas capture capabilities
 * Must be inside the Canvas to access R3F context
 */
function ExportController({ onRegister, animSpeed }: ExportControllerProps) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const capture: CanvasCapture = {
      canvas: gl.domElement,
      getSize: () => ({
        width: gl.domElement.width,
        height: gl.domElement.height,
      }),
      setSize: (width: number, height: number) => {
        gl.setSize(width, height);
        // Update camera aspect ratio to prevent distortion
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      },
      render: () => {
        gl.render(scene, camera);
      },
      setTime: () => {
        // For PNG, we just render current frame
        // Video/GIF will need more sophisticated time control
      },
      getAnimSpeed: () => animSpeed,
    };

    onRegister(capture);
  }, [gl, scene, camera, animSpeed, onRegister]);

  return null;
}

interface PortraitProps {
  params: VisualParams;
  className?: string;
  onRegisterCapture?: (capture: CanvasCapture) => void;
}

export default function Portrait({
  params,
  className,
  onRegisterCapture,
}: PortraitProps) {
  return (
    <div className={className}>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [0, 0, 1], fov: 90 }}
        style={{ width: "100%", height: "100%" }}
      >
        <FlowField params={params} />
        <CharacteristicForms params={params} />
        <ParticleSystem params={params} />
        {onRegisterCapture && (
          <ExportController
            onRegister={onRegisterCapture}
            animSpeed={params.animSpeed}
          />
        )}
      </Canvas>
    </div>
  );
}
