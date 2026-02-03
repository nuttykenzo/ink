# Ink - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Next.js   │  │    R3F      │  │   Export Pipeline       │  │
│  │   App       │→ │   Canvas    │→ │   (MediaRecorder +      │  │
│  │             │  │   + Shaders │  │    FFmpeg.wasm)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         ↓                ↓                     ↓                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    State Management                          ││
│  │  - Agent data (parsed JSON)                                  ││
│  │  - Visual parameters (derived)                               ││
│  │  - Export state (progress, format)                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Data Layer (`src/lib/data/`)

Handles parsing and validation of agent self-report data.

```typescript
// src/lib/data/schema.ts
import { z } from 'zod';

export const AgentDataSchema = z.object({
  agent_id: z.string(),
  created_at: z.string().datetime().optional(),
  sessions_count: z.number().min(0),
  memory_entries: z.number().min(0),
  primary_topics: z.array(z.string()).max(10),
  tools_usage: z.record(z.string(), z.number()),
  metrics: z.object({
    avg_response_length: z.number().min(1).max(10),
    response_speed: z.number().min(1).max(10),
    assertiveness: z.number().min(1).max(10),
    creativity: z.number().min(1).max(10),
    precision: z.number().min(1).max(10),
  }),
  self_assessed_traits: z.array(z.string()).max(10),
  signature_phrase: z.string().optional(),
});

export type AgentData = z.infer<typeof AgentDataSchema>;
```

```typescript
// src/lib/data/parser.ts
export function parseAgentData(input: string): Result<AgentData, ParseError> {
  // 1. Try to extract JSON from markdown code blocks
  // 2. Try to parse as raw JSON
  // 3. Validate against schema
  // 4. Return parsed data or error
}
```

### 2. Generation Layer (`src/lib/generation/`)

Converts agent data into visual parameters.

```typescript
// src/lib/generation/params.ts
export interface VisualParams {
  // Deterministic seed
  seed: number;           // From hash(agent_id)

  // Structure
  complexity: number;     // 1-10, from sessions_count
  layerCount: number;     // 2-5, from memory_entries

  // Color
  palette: ColorPalette;  // Base + accents
  saturation: number;     // 0-1, from assertiveness
  colorVariety: number;   // 0-1, from creativity

  // Shape
  organicness: number;    // 0-1, inverse of precision

  // Motion
  animSpeed: number;      // 0.5-2, from response_speed
  pulseIntensity: number; // 0-1, from sessions_count

  // Particles
  particleCount: number;  // 1000-10000, from complexity
  trailLength: number;    // 0-1, from avg_response_length
}

export function dataToVisualParams(data: AgentData): VisualParams {
  const seed = hashString(data.agent_id);

  return {
    seed,
    complexity: normalize(data.sessions_count, 0, 1000, 1, 10),
    layerCount: normalize(data.memory_entries, 0, 500, 2, 5),
    palette: generatePalette(seed, data.primary_topics),
    saturation: data.metrics.assertiveness / 10,
    colorVariety: data.metrics.creativity / 10,
    organicness: 1 - (data.metrics.precision / 10),
    animSpeed: 0.5 + (data.metrics.response_speed / 10) * 1.5,
    pulseIntensity: normalize(data.sessions_count, 0, 1000, 0.2, 0.8),
    particleCount: 1000 + (data.sessions_count * 10),
    trailLength: data.metrics.avg_response_length / 10,
  };
}
```

### 3. Rendering Layer (`src/components/canvas/`)

React Three Fiber components for the actual visualization.

```typescript
// src/components/canvas/Portrait.tsx
export function Portrait({ params }: { params: VisualParams }) {
  return (
    <Canvas>
      <FlowField params={params} />
      <Particles params={params} />
      <GrainOverlay intensity={0.04} />
      <PostProcessing>
        <Bloom intensity={0.5} />
      </PostProcessing>
    </Canvas>
  );
}
```

```typescript
// src/components/canvas/FlowField.tsx
export function FlowField({ params }: { params: VisualParams }) {
  const shaderRef = useRef<ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.elapsedTime * params.animSpeed;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={shaderRef}
        vertexShader={flowFieldVert}
        fragmentShader={flowFieldFrag}
        uniforms={{
          uSeed: { value: params.seed },
          uComplexity: { value: params.complexity },
          uOrganicness: { value: params.organicness },
          uColor1: { value: params.palette.primary },
          uColor2: { value: params.palette.secondary },
          uTime: { value: 0 },
        }}
      />
    </mesh>
  );
}
```

### 4. Shader Layer (`src/shaders/`)

GLSL shaders for visual effects.

```glsl
// src/shaders/flowField.frag
uniform float uTime;
uniform float uSeed;
uniform float uComplexity;
uniform float uOrganicness;
uniform vec3 uColor1;
uniform vec3 uColor2;

// Simplex noise functions...

void main() {
  vec2 uv = vUv;

  // Flow field based on noise
  float noise = snoise(vec3(uv * uComplexity, uTime * 0.1 + uSeed));

  // Organic distortion
  uv += vec2(
    snoise(vec3(uv * 3.0, uTime * 0.05)) * uOrganicness * 0.1,
    snoise(vec3(uv * 3.0 + 100.0, uTime * 0.05)) * uOrganicness * 0.1
  );

  // Color mixing
  vec3 color = mix(uColor1, uColor2, noise * 0.5 + 0.5);

  gl_FragColor = vec4(color, 1.0);
}
```

### 5. Export Layer (`src/lib/export/`)

Handles video, GIF, and image export.

```typescript
// src/lib/export/video.ts
export async function exportVideo(
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number = 30
): Promise<Blob> {
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 15_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);

  recorder.start();
  await sleep(duration * 1000);
  recorder.stop();

  await new Promise(r => recorder.onstop = r);

  // Convert to MP4 using FFmpeg.wasm if needed
  const webm = new Blob(chunks, { type: 'video/webm' });
  return convertToMp4(webm);
}
```

```typescript
// src/lib/export/gif.ts
import gif from 'gif.js';

export async function exportGif(
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number = 15
): Promise<Blob> {
  const encoder = new gif({
    workers: 4,
    quality: 10,
    width: 720,
    height: 720,
  });

  const frameCount = duration * fps;
  for (let i = 0; i < frameCount; i++) {
    // Render frame
    encoder.addFrame(canvas, { delay: 1000 / fps, copy: true });
    await nextFrame();
  }

  return new Promise((resolve) => {
    encoder.on('finished', resolve);
    encoder.render();
  });
}
```

## State Management

Using Zustand for simple, performant state:

```typescript
// src/lib/store.ts
import { create } from 'zustand';

interface InkState {
  // Input state
  rawInput: string;
  agentData: AgentData | null;
  parseError: string | null;

  // Visual state
  visualParams: VisualParams | null;

  // Export state
  exporting: boolean;
  exportProgress: number;
  exportFormat: 'video' | 'gif' | 'png';

  // Actions
  setRawInput: (input: string) => void;
  parseInput: () => void;
  setExportFormat: (format: 'video' | 'gif' | 'png') => void;
  startExport: () => void;
}

export const useInkStore = create<InkState>((set, get) => ({
  rawInput: '',
  agentData: null,
  parseError: null,
  visualParams: null,
  exporting: false,
  exportProgress: 0,
  exportFormat: 'video',

  setRawInput: (input) => set({ rawInput: input }),

  parseInput: () => {
    const result = parseAgentData(get().rawInput);
    if (result.ok) {
      const params = dataToVisualParams(result.value);
      set({
        agentData: result.value,
        parseError: null,
        visualParams: params,
      });
    } else {
      set({ parseError: result.error.message });
    }
  },

  setExportFormat: (format) => set({ exportFormat: format }),

  startExport: async () => {
    set({ exporting: true, exportProgress: 0 });
    // Export logic...
    set({ exporting: false });
  },
}));
```

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts, metadata
│   ├── page.tsx             # Landing page
│   ├── create/
│   │   └── page.tsx         # Main creation flow
│   └── globals.css          # Global styles
│
├── components/
│   ├── canvas/
│   │   ├── Portrait.tsx     # Main R3F canvas
│   │   ├── FlowField.tsx    # Flow field mesh
│   │   ├── Particles.tsx    # Particle system
│   │   └── GrainOverlay.tsx # Texture overlay
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── TextArea.tsx
│   │   └── ProgressBar.tsx
│   └── export/
│       ├── ExportPanel.tsx  # Export options UI
│       └── ExportPreview.tsx
│
├── lib/
│   ├── data/
│   │   ├── schema.ts        # Zod schemas
│   │   ├── parser.ts        # JSON extraction/parsing
│   │   └── validate.ts      # Validation helpers
│   ├── generation/
│   │   ├── params.ts        # Data → visual params
│   │   ├── palette.ts       # Color palette generation
│   │   └── hash.ts          # Deterministic hashing
│   ├── export/
│   │   ├── video.ts         # Video export
│   │   ├── gif.ts           # GIF export
│   │   └── image.ts         # PNG export
│   └── store.ts             # Zustand store
│
├── shaders/
│   ├── flowField.vert
│   ├── flowField.frag
│   ├── particles.vert
│   ├── particles.frag
│   └── grain.frag
│
└── hooks/
    ├── usePortraitExport.ts
    └── useAnimationLoop.ts
```

## Performance Considerations

### Rendering
- Use `useMemo` for shader uniforms that don't change every frame
- Limit particle count based on device capability
- Use `OffscreenCanvas` for export rendering

### Export
- Video export uses `MediaRecorder` for native performance
- GIF uses Web Workers to prevent UI blocking
- Progress updates throttled to 60fps

### Bundle Size
- Dynamic import for FFmpeg.wasm (only load if needed)
- Shader code as raw strings (not separate file requests)
- Tree-shake Three.js imports

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebGL 2 | 56+ | 51+ | 15+ | 79+ |
| MediaRecorder | 47+ | 29+ | 14.1+ | 79+ |
| OffscreenCanvas | 69+ | 105+ | 16.4+ | 79+ |
| SharedArrayBuffer | 68+ | 79+ | 15.2+ | 79+ |

Safari requires special handling for video export (no VP9 support).
