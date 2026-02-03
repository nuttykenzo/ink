# Ink

**Your agent's identity, visualized.**

Ink generates unique, beautiful visual portraits of OpenClaw/Moltbot AI agents based on their actual behavior, memory, and personality.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## What Is This?

Every OpenClaw agent develops a unique identity through its interactions, memory, and behavior patterns. Ink makes that identity visible.

1. Copy a prompt we provide
2. Paste it into your OpenClaw agent
3. Agent self-analyzes and outputs JSON
4. Paste JSON into Ink
5. Get a stunning, shareable portrait

## Project Status

**Phase:** Active Development (Week 1 of 2)

**For Claude/AI assistants:** Read [CONTEXT.md](CONTEXT.md) first - contains all research, decisions, and current implementation state needed to continue building.

## How It Works

Ink transforms your agent's self-assessed traits into a unique visual identity through a multi-layer rendering system:

### Trait-Space Mapping
Agent traits are mapped to a 4D trait-space:
- **Geometric ↔ Organic**: Sharp polygons vs flowing curves
- **Connected ↔ Isolated**: Clustered networked forms vs spread standalone shapes
- **Subtle ↔ Bold**: Form prominence and intensity
- **Slow ↔ Fast**: Animation tempo and rhythm

### Visual Layers
1. **Flow Field** (background) - Animated noise patterns derived from agent metrics
2. **Characteristic Forms** - Literal geometric/organic shapes driven by personality traits
3. **Particle System** - GPU-accelerated particle cloud with flow field advection

### Example Portraits
- **Analytical, precise, independent** → Angular polygons, cool colors, spread layout
- **Creative, collaborative, intuitive** → Flowing organic blobs, warm colors, clustered layout

## Tech Stack

- **Next.js 15** - React framework
- **React Three Fiber** - 3D rendering
- **GLSL Shaders** - Flow fields, forms, particles
- **Zustand** - State management
- **Zod** - Data validation
- **Tailwind CSS** - Styling

## Documentation

| Doc | Purpose |
|-----|---------|
| [CONTEXT.md](CONTEXT.md) | **Start here** - Full project context, research, decisions |
| [SPEC.md](SPEC.md) | Product specification |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/DESIGN.md](docs/DESIGN.md) | Design system |
| [docs/DATA.md](docs/DATA.md) | Agent data schema |

## Project Structure

```
ink/
├── CONTEXT.md               # Session continuity doc
├── SPEC.md                  # Product spec
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   │   ├── Portrait.tsx     # Main canvas orchestrator
│   │   ├── CharacteristicForms.tsx  # Trait-driven shapes
│   │   └── ParticleSystem.tsx       # GPU particles
│   ├── lib/
│   │   ├── data/            # Schema + parsing
│   │   ├── generation/      # Data → visual params
│   │   │   ├── params.ts    # Visual parameter generation
│   │   │   ├── traitVocabulary.ts   # Trait → 4D vector mapping
│   │   │   └── formGenerator.ts     # Shape geometry generation
│   │   └── store.ts         # Zustand state
│   └── shaders/             # GLSL shaders
│       ├── flowField.vert/frag      # Background noise
│       ├── form.vert/frag           # Characteristic forms
│       └── particle.vert/frag       # Particle system
└── docs/                    # Design + architecture
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## License

MIT

---

Built for the OpenClaw community.
