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

## Tech Stack

- **Next.js 15** - React framework
- **React Three Fiber** - 3D rendering
- **GLSL Shaders** - Flow fields, particles
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
│   ├── lib/
│   │   ├── data/            # Schema + parsing
│   │   ├── generation/      # Data → visual params
│   │   └── store.ts         # Zustand state
│   └── shaders/             # GLSL flow fields
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
