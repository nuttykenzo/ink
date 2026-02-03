# Ink - Design System

## Brand Identity

### Name
**Ink** - Your agent's identity, visualized.

### Tagline Options
- "Your agent's identity, visualized"
- "See your AI's soul"
- "Ink your agent"

### Logo Direction
- Minimal, typographic
- Monospace font (Fira Code or custom)
- Could incorporate a subtle ink drop / flow element
- Works on dark backgrounds

## Color System

### Primary Palette (Tokyo Night Inspired)

```css
:root {
  /* Backgrounds */
  --ink-bg-deep: #050810;      /* Deepest background */
  --ink-bg-base: #0d1117;      /* Base background */
  --ink-bg-elevated: #161b22;  /* Cards, modals */
  --ink-bg-subtle: #21262d;    /* Hover states */

  /* Accents */
  --ink-accent-cyan: #00e5cc;  /* Primary accent */
  --ink-accent-coral: #ff4d4d; /* Secondary accent */
  --ink-accent-purple: #a855f7; /* Tertiary */

  /* Text */
  --ink-text-primary: #f0f4ff;
  --ink-text-secondary: #8b949e;
  --ink-text-muted: #484f58;

  /* Borders */
  --ink-border: #30363d;
  --ink-border-active: #00e5cc;

  /* Status */
  --ink-success: #3fb950;
  --ink-error: #f85149;
  --ink-warning: #d29922;
}
```

### Portrait Color Palettes

Each portrait uses variations of the accent colors based on agent personality:

```typescript
// Base palettes (selected based on topics/traits)
const palettes = {
  technical: {
    primary: '#00e5cc',   // Cyan
    secondary: '#0ea5e9', // Blue
    accent: '#a855f7',    // Purple
  },
  creative: {
    primary: '#ff4d4d',   // Coral
    secondary: '#f97316', // Orange
    accent: '#fbbf24',    // Yellow
  },
  analytical: {
    primary: '#14b8a6',   // Teal
    secondary: '#06b6d4', // Cyan
    accent: '#8b5cf6',    // Violet
  },
  balanced: {
    primary: '#00e5cc',   // Cyan
    secondary: '#ff4d4d', // Coral
    accent: '#a855f7',    // Purple
  },
};
```

## Typography

### Font Stack

```css
:root {
  /* Display - for headlines */
  --font-display: 'Clash Display', system-ui, sans-serif;

  /* Body - for readable text */
  --font-body: 'Satoshi', system-ui, sans-serif;

  /* Mono - for code, data, technical elements */
  --font-mono: 'Fira Code', 'SF Mono', 'Consolas', monospace;
}
```

### Type Scale

```css
/* Using a 1.25 ratio */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.25rem;    /* 20px */
--text-xl: 1.5rem;     /* 24px */
--text-2xl: 1.875rem;  /* 30px */
--text-3xl: 2.25rem;   /* 36px */
--text-4xl: 3rem;      /* 48px */
```

### Usage

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Clash Display | 3xl-4xl | 600 |
| H2 | Clash Display | 2xl | 600 |
| H3 | Satoshi | xl | 600 |
| Body | Satoshi | base | 400 |
| Code/Data | Fira Code | sm | 400 |
| Labels | Satoshi | sm | 500 |
| Buttons | Satoshi | sm | 600 |

## Spacing

```css
/* 4px base unit */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
```

## Components

### Buttons

```tsx
// Primary button - cyan accent
<button className="
  px-6 py-3
  bg-ink-accent-cyan
  text-ink-bg-deep
  font-semibold
  rounded-lg
  hover:brightness-110
  transition-all
">
  Get Your Ink
</button>

// Secondary button - outlined
<button className="
  px-6 py-3
  border border-ink-border
  text-ink-text-primary
  rounded-lg
  hover:border-ink-accent-cyan
  hover:text-ink-accent-cyan
  transition-all
">
  Learn More
</button>

// Ghost button - minimal
<button className="
  px-4 py-2
  text-ink-text-secondary
  hover:text-ink-text-primary
  transition-colors
">
  Skip
</button>
```

### Input Fields

```tsx
// Text input
<input
  className="
    w-full px-4 py-3
    bg-ink-bg-elevated
    border border-ink-border
    rounded-lg
    text-ink-text-primary
    font-mono
    placeholder:text-ink-text-muted
    focus:border-ink-accent-cyan
    focus:outline-none
    focus:ring-2 focus:ring-ink-accent-cyan/20
  "
  placeholder="Paste your agent's JSON..."
/>

// Textarea for JSON input
<textarea
  className="
    w-full h-64 px-4 py-3
    bg-ink-bg-elevated
    border border-ink-border
    rounded-lg
    text-ink-text-primary
    font-mono text-sm
    placeholder:text-ink-text-muted
    focus:border-ink-accent-cyan
    focus:outline-none
    resize-none
  "
/>
```

### Cards

```tsx
// Elevated card
<div className="
  p-6
  bg-ink-bg-elevated
  border border-ink-border
  rounded-xl
">
  {/* Content */}
</div>

// Interactive card
<div className="
  p-6
  bg-ink-bg-elevated
  border border-ink-border
  rounded-xl
  cursor-pointer
  hover:border-ink-accent-cyan
  transition-colors
">
  {/* Content */}
</div>
```

## Animation

### Timing Functions

```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-slow: cubic-bezier(0.4, 0, 0.6, 1);
```

### Standard Durations

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Motion Principles

1. **Subtle by default** - UI animations should be fast and barely noticeable
2. **Portrait is the star** - The generated portrait should have the most motion
3. **Meaningful transitions** - State changes (loading, success, error) get smooth transitions
4. **No jarring cuts** - Use fades and slides, not instant switches

## Portrait Visual Language

### Flow Field Characteristics

- **Base movement:** Slow, meditative flow (0.5-2x speed based on response_speed)
- **Pulse rhythm:** Subtle breathing effect (0.2-0.8 intensity)
- **Particle behavior:** Trailing, fading, following field lines
- **Loop point:** Invisible - matched start/end frames

### Texture

- **Grain:** 3-5% noise overlay
- **Glow:** Soft bloom on accent colors
- **Depth:** Multiple layers with parallax

### Shape Language

| Precision Score | Shape Tendency |
|-----------------|----------------|
| 1-3 | Highly organic, irregular, flowing |
| 4-6 | Balanced, natural curves with structure |
| 7-10 | Geometric, regular, crystalline |

## Layout

### Page Structure

```
┌─────────────────────────────────────────┐
│              Navigation                  │
├─────────────────────────────────────────┤
│                                         │
│              Main Content               │
│           (max-width: 1200px)           │
│           (centered, padded)            │
│                                         │
├─────────────────────────────────────────┤
│              Footer                      │
└─────────────────────────────────────────┘
```

### Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Creation Flow Layout

```
Desktop (lg+):
┌────────────────┬────────────────┐
│                │                │
│   Input Panel  │  Preview Panel │
│   (40% width)  │   (60% width)  │
│                │                │
└────────────────┴────────────────┘

Mobile:
┌─────────────────────────────────┐
│          Preview Panel          │
│          (fixed top)            │
├─────────────────────────────────┤
│                                 │
│          Input Panel            │
│          (scrollable)           │
│                                 │
└─────────────────────────────────┘
```

## Iconography

Use [Lucide Icons](https://lucide.dev/) for consistency:

- Download: `<Download />`
- Share: `<Share2 />`
- Copy: `<Copy />`
- Check: `<Check />`
- Loading: `<Loader2 className="animate-spin" />`
- Error: `<AlertCircle />`

## Accessibility

### Color Contrast
- All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Interactive elements have visible focus states
- Don't rely on color alone for status

### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Enter/Space activates buttons
- Escape closes modals

### Screen Readers
- Semantic HTML elements
- ARIA labels where needed
- Status announcements for export progress
