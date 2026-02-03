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

Handles parsing and validation of agent self-report data using Zod schemas.

- `schema.ts` - Zod schema for AgentData validation
- `parser.ts` - JSON extraction from markdown/raw input

### 2. Generation Layer (`src/lib/generation/`)

Converts agent data into visual parameters.

- `params.ts` - Data → VisualParams transformation
- `palette.ts` - Color palette generation from topics
- `hash.ts` - Deterministic hashing for seeds

### 3. Rendering Layer (`src/components/`)

React Three Fiber components for visualization.

- `Portrait.tsx` - Main R3F Canvas with FlowField, CharacteristicForms, ParticleSystem
- `ParticleSystem.tsx` - GPU particle system with trail rendering
- `CharacteristicForms.tsx` - Trait-driven mesh generation

### 4. Shader Layer (`src/shaders/`)

GLSL shaders for visual effects.

- `flowField.vert` - Pass-through vertex shader
- `flowField.frag` - Flow field fragment shader with domain warping
- `particle.vert` - Particle vertex shader with size/age attenuation
- `particle.frag` - Particle fragment shader with color/alpha

### 5. Physics Layer (`src/hooks/`)

CPU-side particle physics.

- `useParticlePhysics.ts` - Flow field advection, trail management, respawning

### 6. Export Layer (`src/lib/export/`)

Handles video, GIF, and image export.

- `png/pngExporter.ts` - High-res PNG capture
- `gif/gifExporter.ts` - Animated GIF with gif.js workers
- `video/videoExporter.ts` - Video export orchestration
- `video/mediaRecorder.ts` - Real-time canvas recording
- `video/ffmpegEncoder.ts` - WebM→MP4 conversion with FFmpeg.wasm
- `hooks/useExport.ts` - React hook for export state management
- `capabilities.ts` - Browser feature detection
- `download.ts` - Blob download utility

## State Management

Using Zustand for simple, performant state in `src/lib/store.ts`.

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts, metadata
│   ├── page.tsx            # Landing page
│   ├── create/
│   │   └── page.tsx        # Main creation flow (3-step wizard)
│   └── globals.css         # Global styles + CSS variables
│
├── components/
│   ├── Portrait.tsx        # R3F Canvas with all visual layers
│   ├── ParticleSystem.tsx  # GPU particle rendering
│   └── CharacteristicForms.tsx  # Trait-driven meshes
│
├── hooks/
│   └── useParticlePhysics.ts  # CPU particle physics
│
├── lib/
│   ├── data/
│   │   ├── schema.ts       # Zod schemas
│   │   └── parser.ts       # JSON extraction/parsing
│   ├── generation/
│   │   ├── params.ts       # Data → visual params
│   │   ├── palette.ts      # Color palette generation
│   │   └── hash.ts         # Deterministic hashing
│   ├── export/
│   │   ├── png/            # PNG export
│   │   ├── gif/            # GIF export
│   │   ├── video/          # Video export
│   │   ├── hooks/          # Export React hooks
│   │   ├── types.ts        # Export type definitions
│   │   ├── capabilities.ts # Browser detection
│   │   └── download.ts     # Download utility
│   ├── noise.ts            # CPU simplex noise (matches shader)
│   └── store.ts            # Zustand store
│
├── shaders/
│   ├── flowField.vert      # Flow field vertex shader
│   ├── flowField.frag      # Flow field fragment shader
│   ├── particle.vert       # Particle vertex shader
│   └── particle.frag       # Particle fragment shader
│
└── types/
    └── shaders.d.ts        # TypeScript declarations for GLSL imports
```

## Performance Optimizations

### Rendering
- Reduced FBM octaves (4 main, 3 for domain warp)
- Simplified domain warping (removed extra r layer)
- `copyWithin()` for particle trail shifting
- Pre-computed respawn positions

### Export
- FFmpeg pre-warming on page load
- Real-time video recording (5s duration)
- Optimized GIF worker count and quality settings
- Camera aspect ratio fix for canvas resize

### Bundle Size
- Dynamic import for FFmpeg.wasm (~31MB, only when needed)
- Shader code as raw strings
- Tree-shake Three.js imports

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebGL 2 | 56+ | 51+ | 15+ | 79+ |
| MediaRecorder | 47+ | 29+ | 14.1+ | 79+ |
| OffscreenCanvas | 69+ | 105+ | 16.4+ | 79+ |
| SharedArrayBuffer | 68+ | 79+ | 15.2+ | 79+ |

Safari requires special handling for video export (no VP9 support).
