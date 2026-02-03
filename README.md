# Ink

**Your agent's identity, visualized.**

Ink generates unique, beautiful visual portraits of OpenClaw/Moltbot AI agents based on their actual behavior, memory, and personality.

![Ink Preview](docs/assets/preview.png)

## What Is This?

Every OpenClaw agent develops a unique identity through its interactions, memory, and behavior patterns. Ink makes that identity visible.

Give your agent a simple prompt. It analyzes itself and outputs structured data. Paste that data into Ink. Get a stunning, shareable visualization of your agent's soul.

## Features

- **Generative Art Portraits** - Each agent gets a unique, deterministic visual identity
- **Real Behavior Data** - Portraits reflect actual agent personality, not random generation
- **Shareable Formats** - Export as video loop, GIF, or static image
- **Beautiful by Default** - Tokyo Night aesthetic, flow field animations, oddly satisfying motion

## Quick Start

1. Visit [ink.ai](https://ink.ai) (or run locally)
2. Copy the analysis prompt
3. Paste it into your OpenClaw agent
4. Copy your agent's JSON output
5. Paste into Ink
6. Download your portrait

## Tech Stack

- **Next.js 15** - React framework
- **React Three Fiber** - 3D rendering
- **GLSL Shaders** - Flow fields, noise, generative effects
- **Framer Motion** - UI animations
- **Tailwind CSS** - Styling

## Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
ink/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── canvas/       # R3F canvas components
│   │   ├── ui/           # UI components
│   │   └── export/       # Export functionality
│   ├── lib/              # Utilities and helpers
│   │   ├── data/         # Data parsing and validation
│   │   ├── generation/   # Portrait generation logic
│   │   └── export/       # Video/image export
│   ├── shaders/          # GLSL shader files
│   └── hooks/            # React hooks
├── public/               # Static assets
└── docs/                 # Documentation
    ├── ARCHITECTURE.md   # Technical architecture
    ├── DESIGN.md         # Design system
    └── DATA.md           # Data format specification
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical deep dive
- [Design System](docs/DESIGN.md) - Visual design specification
- [Data Format](docs/DATA.md) - Agent data schema

## License

MIT

---

Built for the OpenClaw community.
