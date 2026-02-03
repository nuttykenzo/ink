"use client";

import { useFrame } from "@react-three/fiber";
import type { VisualParams } from "@/lib/generation/params";
import type { Creature as CreatureType } from "@/lib/creature/types";
import { useCreatureAnimation } from "@/hooks/useCreatureAnimation";
import CreatureBody from "./CreatureBody";
import CreatureEye from "./CreatureEye";

interface CreatureProps {
  params: VisualParams;
  creature: CreatureType;
}

/**
 * Main creature component that composes body and eyes.
 * Manages animation state and renders all creature parts.
 */
export default function Creature({ params, creature }: CreatureProps) {
  const { body, eyes, behavior, colors } = creature;

  // Get animation state and update function
  const animation = useCreatureAnimation(creature);

  // Update animation each frame
  useFrame((state, delta) => {
    animation.update(state.clock.elapsedTime, delta);
  });

  return (
    <group>
      {/* Body (renders behind eyes) */}
      <CreatureBody
        body={body}
        colors={colors}
        behavior={behavior}
        animSpeed={params.animSpeed}
        saturation={params.saturation}
        breathPhase={animation.breathPhase}
        driftOffset={animation.driftOffset}
      />

      {/* Eyes (render in front of body) */}
      {eyes.map((eyeConfig, index) => (
        <CreatureEye
          key={index}
          config={eyeConfig}
          bodyRadius={body.radius}
          gazeOffset={animation.eyes[index]?.gazeOffset ?? [0, 0]}
          pupilDilation={animation.eyes[index]?.pupilDilation ?? 0.5}
          blinkAmount={animation.eyes[index]?.blinkAmount ?? 0}
          animSpeed={params.animSpeed}
        />
      ))}
    </group>
  );
}
