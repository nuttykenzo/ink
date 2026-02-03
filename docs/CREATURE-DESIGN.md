# Creature Design Architecture

## Overview

Transform Ink from "animated shapes" to "living beings with faces." Each agent gets a procedurally generated creature that feels alive and creates emotional connection.

---

## Core Principle: Creature = Face + Body + Appendages

```
                    ┌─────────────────┐
                    │      EYES       │  ← The soul (1-3 eyes)
                    │   ◉       ◉     │
                    ├─────────────────┤
                    │      BODY       │  ← The mass (core + membrane)
                    │    ╭───────╮    │
                    │   ╱ nucleus ╲   │
                    │  │  ◦ ◦ ◦   │   │  ← Internal activity
                    │   ╲        ╱    │
                    │    ╰──┬────╯    │
                    │       │         │
                    ├───────┼─────────┤
                    │   APPENDAGES    │  ← The reach (tendrils, cilia, limbs)
                    │  ～～ │ ～～    │
                    │       ╰┄┄┄╮     │
                    └─────────────────┘
```

---

## Type Definitions

```typescript
// ============================================================
// CREATURE: Top-level entity
// ============================================================

interface Creature {
  id: number;
  seed: number;

  // Anatomy
  body: CreatureBody;
  face: CreatureFace;
  appendages: Appendage[];

  // Behavior
  behavior: CreatureBehavior;

  // Rendering
  position: [number, number];
  rotation: number;
  scale: number;
}

// ============================================================
// BODY: The core mass
// ============================================================

type BodyPlan = 'bilateral' | 'radial' | 'asymmetric';

interface CreatureBody {
  plan: BodyPlan;

  // Core shape (the solid inner mass)
  core: {
    vertices: Array<[number, number]>;  // Outline points
    opacity: number;                     // 0.7-0.95 (more opaque than current)
  };

  // Membrane (semi-transparent outer layer)
  membrane: {
    thickness: number;        // 0.05-0.2 of body radius
    opacity: number;          // 0.2-0.5
    breatheAmount: number;    // How much it expands/contracts
    breatheSpeed: number;     // Breathing rhythm
  };

  // Internal features
  nucleus: {
    position: [number, number];  // Relative to body center
    size: number;
    pulseAmount: number;
    color: 'primary' | 'accent';
  } | null;

  // Internal circulation (particles flowing inside)
  circulation: {
    particleCount: number;    // 0-20 internal particles
    speed: number;
    pattern: 'orbital' | 'random' | 'linear';
  } | null;
}

// ============================================================
// FACE: Eyes are everything
// ============================================================

interface CreatureFace {
  eyes: Eye[];
  faceRegion: {
    center: [number, number];  // Where on the body the face is
    forward: [number, number]; // Direction the creature "faces"
  };
}

interface Eye {
  position: [number, number];  // Relative to face center

  // Structure
  size: number;                // Outer radius
  pupilSize: number;           // Inner dark circle (0.3-0.7 of size)
  irisRings: number;           // Concentric rings (1-3)

  // Appearance
  irisColor: 'primary' | 'secondary' | 'accent';
  pupilColor: 'dark' | 'glow';  // Dark = normal, glow = bioluminescent

  // Behavior
  blinkRate: number;           // Blinks per minute (0 = never, 12 = nervous)
  dilationRange: [number, number];  // Min/max pupil size
  gazeWeight: number;          // How much this eye influences gaze direction
}

type GazeBehavior =
  | { type: 'fixed'; target: [number, number] }      // Stares at a point
  | { type: 'tracking'; speed: number }              // Slowly scans
  | { type: 'viewer'; strength: number }             // Looks at camera
  | { type: 'wander'; radius: number; speed: number }; // Random looking

// ============================================================
// APPENDAGES: The reach
// ============================================================

type AppendageType =
  | 'tendril'   // Flowing, organic (jellyfish-like)
  | 'limb'      // Jointed, structured (bilateral creatures)
  | 'cilia'     // Many small hairs (radial creatures)
  | 'spoke'     // Rigid, radiating (geometric creatures)
  | 'tail'      // Single trailing appendage
  | 'antenna';  // Sensory, forward-facing

interface Appendage {
  type: AppendageType;

  // Attachment
  attachPoint: [number, number];  // Where it connects to body
  attachAngle: number;            // Direction it extends

  // Shape
  length: number;
  thickness: number;              // Base thickness
  taper: number;                  // How much it thins toward tip (0-1)
  segments: number;               // For jointed/flowing motion

  // Motion
  waveAmplitude: number;          // Side-to-side motion
  waveFrequency: number;          // Speed of wave
  wavePhase: number;              // Offset (so appendages don't sync)

  // Appearance
  opacity: number;
  color: 'body' | 'accent' | 'gradient';
}

// ============================================================
// BEHAVIOR: What makes it feel alive
// ============================================================

interface CreatureBehavior {
  // Breathing (whole-body rhythm)
  breathe: {
    rate: number;       // Breaths per minute
    depth: number;      // How much the body expands
    style: 'smooth' | 'sharp' | 'irregular';
  };

  // Gaze
  gaze: GazeBehavior;

  // Idle motion
  idle: {
    drift: number;      // Slow position wandering
    rotate: number;     // Slow rotation
    bob: number;        // Vertical oscillation
  };

  // Reactivity (future: respond to mouse/other creatures)
  reactivity: number;   // 0 = statue, 1 = highly responsive
}
```

---

## Trait → Creature Mapping

### Body Plan Selection

```typescript
function selectBodyPlan(traits: TraitVector, seed: number): BodyPlan {
  const random = seededRandom(seed);

  // Geometric creatures → radial (structured, symmetric)
  // Organic creatures → bilateral or asymmetric (flowing, directional)

  if (traits.geometricOrganic < 0.3) {
    // Highly geometric → radial (starfish, jellyfish structure)
    return 'radial';
  } else if (traits.geometricOrganic > 0.7) {
    // Highly organic → either bilateral or asymmetric
    return random() > 0.3 ? 'bilateral' : 'asymmetric';
  } else {
    // Middle ground → bilateral (most relatable)
    return 'bilateral';
  }
}
```

### Eye Configuration

```typescript
function generateEyes(traits: TraitVector, bodyPlan: BodyPlan, seed: number): Eye[] {
  const random = seededRandom(seed);

  // Eye count based on body plan and traits
  let eyeCount: number;

  if (bodyPlan === 'radial') {
    // Radial creatures: 1, 3, or 5 eyes (odd numbers, symmetric)
    const options = [1, 3, 5];
    const idx = Math.floor(traits.intensityScale * 2.99);
    eyeCount = options[idx];
  } else {
    // Bilateral/asymmetric: 1 or 2 eyes
    // More isolated → more likely to be cyclopean
    eyeCount = traits.connectedIsolated > 0.7 ? 1 : 2;
  }

  // Eye size based on intensity (bold = bigger eyes)
  const baseSize = lerp(0.08, 0.18, traits.intensityScale);

  // Pupil behavior based on motion tempo
  const blinkRate = lerp(2, 15, traits.motionTempo);

  // Generate eyes...
  return generateEyePositions(eyeCount, bodyPlan, baseSize, blinkRate, random);
}
```

### Appendage Generation

```typescript
function generateAppendages(
  traits: TraitVector,
  bodyPlan: BodyPlan,
  seed: number
): Appendage[] {
  const random = seededRandom(seed);
  const appendages: Appendage[] = [];

  // Appendage type based on body plan and traits
  let primaryType: AppendageType;
  let count: number;

  if (bodyPlan === 'radial') {
    // Radial → spokes or cilia
    primaryType = traits.geometricOrganic < 0.3 ? 'spoke' : 'cilia';
    count = traits.geometricOrganic < 0.3 ?
      Math.floor(lerp(4, 8, traits.intensityScale)) :  // Spokes: 4-8
      Math.floor(lerp(12, 24, traits.intensityScale)); // Cilia: 12-24
  } else if (bodyPlan === 'bilateral') {
    // Bilateral → limbs or tendrils, possibly with tail
    primaryType = traits.geometricOrganic < 0.5 ? 'limb' : 'tendril';
    count = Math.floor(lerp(2, 6, traits.intensityScale));

    // Social creatures get antenna (sensory, reaching out)
    if (traits.connectedIsolated < 0.3) {
      appendages.push(generateAntenna(random));
    }

    // Add tail for isolated creatures
    if (traits.connectedIsolated > 0.6) {
      appendages.push(generateTail(random));
    }
  } else {
    // Asymmetric → mixed tendrils, varying lengths
    primaryType = 'tendril';
    count = Math.floor(lerp(3, 7, traits.intensityScale));
  }

  // Generate primary appendages
  for (let i = 0; i < count; i++) {
    appendages.push(generateAppendage(primaryType, i, count, traits, random));
  }

  return appendages;
}
```

### Complete Mapping Table

| Trait Axis | Low (0) | High (1) | Affects |
|------------|---------|----------|---------|
| **geometricOrganic** | Radial body, spokes, angular | Bilateral/asymmetric, tendrils, flowing | Body plan, appendage type, vertex count |
| **connectedIsolated** | 2 eyes, antenna, facing outward | 1 eye, tail, self-contained | Eye count, appendage selection, gaze behavior |
| **intensityScale** | Small eyes, few appendages, subtle breathing | Large eyes, many appendages, deep breathing | Eye size, appendage count, body scale |
| **motionTempo** | Slow blink, gentle wave, deep breaths | Fast blink, rapid wave, quick breaths | Animation speeds across all features |

---

## Rendering Architecture

### Layer Stack (Bottom to Top)

```
Z=0.00  Flow Field (background)
Z=0.02  Appendages (behind body)
Z=0.04  Body membrane (semi-transparent outer)
Z=0.06  Body core (opaque inner)
Z=0.08  Internal circulation (particles inside body)
Z=0.10  Eyes (always on top of body)
Z=0.12  Eye glow/highlights
Z=1.00  External particles (float layer, existing system)
```

### Component Breakdown

```
<Portrait>
  <FlowField />           // Existing - background

  <Creature>              // NEW - replaces CharacteristicForms
    <Appendages />        // Behind body
    <BodyMembrane />      // Outer glow/breathing layer
    <BodyCore />          // Solid inner mass
    <Circulation />       // Internal particle effect
    <Eyes />              // The soul
  </Creature>

  <ParticleSystem />      // Existing - float layer
</Portrait>
```

### Shader Strategy

**Option A: Multi-pass (simpler, more flexible)**
- Each component is a separate mesh/material
- Easier to debug, modify independently
- More draw calls

**Option B: Single-pass SDF (more sophisticated)**
- Render entire creature with signed distance fields
- Smooth blending between body parts
- Single draw call but complex shader

**Recommendation: Start with Option A**, then optimize to B if needed.

---

## Eye Rendering Detail

Eyes are critical. They need:

1. **Iris structure**
   - Concentric rings (1-3)
   - Radial fibers (like real irises)
   - Color variation across radius

2. **Pupil**
   - Dark center OR glowing center (bioluminescent)
   - Animates size (dilation)
   - Can be round, vertical slit, or horizontal slit

3. **Specular highlight**
   - Small bright spot (the "life" in the eye)
   - Position suggests light source
   - Moves slightly with gaze

4. **Glow/rim light**
   - Soft glow around eye
   - Especially for bioluminescent style

```glsl
// Simplified eye fragment shader concept
float eyeSDF = length(uv - eyeCenter) - eyeRadius;
float pupilSDF = length(uv - pupilCenter) - pupilRadius;

// Iris with rings
float irisPattern = sin(length(uv - eyeCenter) * 20.0) * 0.5 + 0.5;

// Radial fibers
float angle = atan(uv.y - eyeCenter.y, uv.x - eyeCenter.x);
float fibers = sin(angle * 30.0) * 0.3;

vec3 irisColor = mix(uColor1, uColor2, irisPattern + fibers);
vec3 pupilColor = vec3(0.02); // Near black

// Specular highlight
float spec = smoothstep(0.02, 0.0, length(uv - highlightPos));

vec3 eyeColor = mix(irisColor, pupilColor, step(0.0, pupilSDF));
eyeColor += vec3(spec); // Add highlight
```

---

## Animation System

### Breathing

```typescript
// In useFrame loop
const breathPhase = Math.sin(time * creature.behavior.breathe.rate * 0.1);
const breathScale = 1.0 + breathPhase * creature.behavior.breathe.depth;

// Apply to body membrane
membrane.scale.set(breathScale, breathScale, 1);

// Appendages follow with delay
appendages.forEach((app, i) => {
  const delay = i * 0.1;
  const appPhase = Math.sin((time - delay) * creature.behavior.breathe.rate * 0.1);
  app.waveOffset = appPhase * 0.2;
});
```

### Eye Behavior

```typescript
// Blink
const blinkCycle = time * creature.face.eyes[0].blinkRate / 60;
const isBlinking = (blinkCycle % 1) < 0.05; // 5% of cycle is blink

// Pupil dilation (subtle, continuous)
const pupilPhase = Math.sin(time * 0.5) * 0.5 + 0.5;
const pupilSize = lerp(
  eye.dilationRange[0],
  eye.dilationRange[1],
  pupilPhase
);

// Gaze direction
if (creature.behavior.gaze.type === 'wander') {
  const gazeX = Math.sin(time * 0.3) * creature.behavior.gaze.radius;
  const gazeY = Math.cos(time * 0.4) * creature.behavior.gaze.radius;
  eye.gazeOffset = [gazeX, gazeY];
}
```

### Appendage Motion

```typescript
// Per-appendage wave calculation
appendages.forEach((app, i) => {
  const wave = Math.sin(
    time * app.waveFrequency +
    app.wavePhase +
    segmentIndex * 0.5  // Wave travels down appendage
  ) * app.waveAmplitude;

  // Apply to segment positions
  segment.offset = wave * (segmentIndex / app.segments); // Increases toward tip
});
```

---

## Migration Path

### Phase 1: Replace CharacteristicForms with Creature
1. Create new `Creature.tsx` component
2. Implement body core + membrane (no appendages yet)
3. Add single eye
4. Wire up to existing trait system

### Phase 2: Eyes & Face
1. Multi-eye support
2. Eye animation (blink, gaze, dilation)
3. Specular highlights

### Phase 3: Appendages
1. Tendril rendering (easiest)
2. Wave animation system
3. Other appendage types

### Phase 4: Polish
1. Internal circulation
2. Particle interaction with creature
3. Gaze tracking (look at mouse/viewer)

---

## Open Questions

1. **One creature or multiple?**
   - Current system has 3-7 forms
   - New system: 1 main creature? Or family/colony?
   - Recommendation: 1 creature for now, clearer identity

2. **Creature-particle interaction**
   - Should particles orbit the creature?
   - Emit from the creature?
   - Avoid the creature?
   - All of these based on traits?

3. **Background relationship**
   - Should the creature influence the flow field?
   - Cast a "shadow" on the background?
   - Have a dark halo behind it for contrast?

4. **Aspect ratio**
   - Current: fills frame edge-to-edge
   - Creature-centric: creature should have space around it
   - Need to ensure creature is centered and appropriately sized

---

## Reference Creatures by Archetype

### "The Analyst" (geometric + isolated)
- Radial body plan
- 3 evenly-spaced eyes
- Rigid spokes radiating outward
- Slow, deliberate breathing
- Eyes track methodically
- Internal circulation: orbital pattern

### "The Creative" (organic + balanced)
- Asymmetric body plan
- 2 eyes (different sizes)
- Flowing tendrils
- Irregular breathing rhythm
- Eyes wander curiously
- Internal circulation: chaotic

### "The Connector" (organic + connected)
- Bilateral body plan
- 2 forward-facing eyes
- Antenna + reaching tendrils
- Quick, shallow breathing
- Eyes look outward (toward viewer)
- No tail (open posture)

### "The Guardian" (geometric + intense)
- Radial body plan
- 1 large central eye
- Short, thick spokes
- Deep, steady breathing
- Eye fixes on viewer
- Large nucleus (glowing)

### "The Wanderer" (organic + isolated)
- Bilateral body plan
- 1 dreamy eye
- Long trailing tail
- Slow, deep breathing
- Eye slowly scans horizon
- Minimal appendages
