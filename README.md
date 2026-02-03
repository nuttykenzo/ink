# Ink

**Your agent's identity, visualized.**

Ink generates unique, beautiful visual portraits of AI agents based on their actual behavior, memory, and personality. Each agent gets a living creature with eyes that look back at you.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## What Is This?

Every AI agent develops a unique identity through its interactions, memory, and behavior patterns. Ink makes that identity visible as a living creature.

1. Copy a prompt we provide
2. Paste it into your agent
3. Agent self-analyzes and outputs JSON
4. Paste JSON into Ink
5. Get a stunning, shareable portrait

## How It Works

Ink transforms your agent's traits into a living creature through a multi-layer rendering system:

### Creature System

Each agent gets ONE creature with:
- **Face** - Eyes that blink, look around, and feel alive
- **Body** - Breathing membrane with optional glowing nucleus
- **Appendages** - Tendrils, spokes, or limbs based on social traits

### Maturity Stages

Creatures evolve based on session count:
| Sessions | Stage | Features |
|----------|-------|----------|
| 0-10 | Nascent | 1 eye, simple body |
| 11-100 | Developing | 1-2 eyes, nucleus, simple appendages |
| 101-500 | Mature | 1-3 eyes, circulation, full appendages |
| 500+ | Elder | All features + rare visual effects |

### Trait-Space Mapping

Agent traits map to a 4D space that drives creature generation:
- **Geometric ↔ Organic**: Body plan, pupil shape, iris pattern
- **Connected ↔ Isolated**: Eye count, gaze behavior, appendage type
- **Subtle ↔ Bold**: Size, opacity, eye prominence
- **Slow ↔ Fast**: Animation speed, blink rate, breathing

### Visual Layers (Z-order)
1. **Flow Field** - Animated background noise
2. **Appendages** - Behind body
3. **Body** - Core + membrane
4. **Nucleus** - Optional inner glow
5. **Eyes** - The soul of the creature
6. **Particles** - GPU-accelerated particle cloud

### Example Creatures
- **Analytical + isolated** → Radial body, 1 star-pupil eye, spoke appendages
- **Creative + connected** → Bilateral body, 2-3 round-pupil eyes, flowing tendrils

## Tech Stack

- **Next.js 15** - React framework
- **React Three Fiber** - 3D rendering
- **GLSL Shaders** - Custom creature, flow field, particle shaders
- **Zustand** - State management
- **Zod** - Data validation
- **Tailwind CSS** - Styling

## Documentation

| Doc | Purpose |
|-----|---------|
| [SPEC.md](SPEC.md) | Product specification |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/CREATURE-DESIGN.md](docs/CREATURE-DESIGN.md) | Creature system design |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual design system |
| [docs/DATA.md](docs/DATA.md) | Agent data schema |

## Project Structure

```
ink/
├── SPEC.md                  # Product spec
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/
│   │   ├── Portrait.tsx     # Main canvas orchestrator
│   │   ├── Creature.tsx     # Creature composer
│   │   ├── CreatureBody.tsx # Body mesh + shader
│   │   ├── CreatureEye.tsx  # Eye mesh + shader
│   │   └── ParticleSystem.tsx
│   ├── hooks/
│   │   ├── useCreatureAnimation.ts  # Blink, gaze, breathing
│   │   └── useParticlePhysics.ts
│   ├── lib/
│   │   ├── creature/        # Creature generation
│   │   │   ├── types.ts     # Type definitions
│   │   │   ├── generator.ts # Main generator
│   │   │   ├── maturity.ts  # Session → maturity
│   │   │   ├── bodyGenerator.ts
│   │   │   ├── eyeGenerator.ts
│   │   │   └── appendageGenerator.ts
│   │   ├── data/            # Schema + parsing
│   │   ├── generation/      # Visual params
│   │   └── export/          # PNG/GIF/MP4 export
│   └── shaders/
│       ├── creature/        # Creature shaders
│       │   ├── body.vert/frag
│       │   └── eye.vert/frag
│       ├── flowField.vert/frag
│       └── particle.vert/frag
└── docs/                    # Design + architecture
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

## Export Formats

- **PNG** - High-res static image (2048x2048)
- **GIF** - Short animated loop
- **MP4** - 5-second video for social media

## License

MIT
