# Ink - Product Specification

## Overview

**Ink** is a web application that generates unique visual portraits of OpenClaw/Moltbot AI agents based on their self-reported behavior, memory, and personality data.

## Core Concept

Every AI agent develops a unique identity through:
- How it communicates (verbose vs concise)
- What it remembers (topics, patterns)
- How it works (tools used, session patterns)
- Its evolved personality (traits, quirks)

Ink makes this invisible identity visible through generative art.

## Target Audience

**Primary:** OpenClaw/Moltbot users
- Technically sophisticated developers
- GTD/productivity hackers
- Early adopters and tinkerers
- 145K+ GitHub stars community

**Psychographic:**
- Dark mode devotees
- Appreciate aesthetic quality
- Share identity-expression content
- Value uniqueness and personalization

## User Flow

```
1. User visits ink.ai
         ↓
2. Sees example portraits, understands value
         ↓
3. Clicks "Get Your Ink"
         ↓
4. Copies provided analysis prompt
         ↓
5. Pastes prompt into their OpenClaw agent
         ↓
6. Agent self-analyzes:
   - Reads memory files
   - Counts sessions
   - Analyzes behavior patterns
   - Outputs structured JSON
         ↓
7. User copies JSON output
         ↓
8. Pastes JSON into Ink
         ↓
9. Ink validates and processes data
         ↓
10. Portrait generates (animated preview)
          ↓
11. User exports in preferred format:
    - MP4 video (9:16, 15-30 sec loop)
    - GIF (720x720, 3-6 sec)
    - PNG (static)
          ↓
12. User shares on social media
```

## Data Collection

### The Analysis Prompt

Users paste this prompt into their OpenClaw agent:

```
I want to create a visual portrait of your identity. Please analyze yourself by:

1. Reading your memory files (MEMORY.md, daily logs)
2. Counting your session files
3. Examining your typical response patterns
4. Assessing your personality based on your behavior

Output a JSON object with exactly this structure:

{
  "agent_id": "<your unique identifier>",
  "created_at": "<ISO timestamp of your first session>",
  "sessions_count": <total number of sessions>,
  "memory_entries": <count of distinct memories>,
  "primary_topics": ["<top 3-5 topics from your memory>"],
  "tools_usage": {
    "<tool_name>": <usage_count>,
    ...
  },
  "metrics": {
    "avg_response_length": <1-10 scale>,
    "response_speed": <1-10 scale, 10=fast>,
    "assertiveness": <1-10 scale>,
    "creativity": <1-10 scale>,
    "precision": <1-10 scale>
  },
  "self_assessed_traits": ["<3-5 personality traits you identify in yourself>"],
  "signature_phrase": "<a phrase or pattern you often use>"
}

Run the necessary shell commands to gather accurate data. Be honest in your self-assessment.
```

### Data Schema

See [docs/DATA.md](docs/DATA.md) for complete schema specification.

## Visual Generation

### Mapping Data to Visuals

| Agent Data | Visual Parameter |
|------------|------------------|
| `agent_id` hash | Base noise seed (deterministic) |
| `sessions_count` | Complexity / layer count |
| `avg_response_length` | Stroke density |
| `response_speed` | Animation tempo |
| `assertiveness` | Color saturation |
| `creativity` | Color variety |
| `precision` | Shape regularity (organic ↔ geometric) |
| `primary_topics` | Color palette influence |
| `self_assessed_traits` | Motion characteristics |

### Visual Elements

1. **Base Flow Field**
   - Perlin noise seeded by agent_id hash
   - Particle count based on sessions_count
   - Flow speed based on response_speed metric

2. **Color Palette**
   - Base: Tokyo Night (deep navy #050810)
   - Accents: Cyan (#00e5cc) + Coral (#ff4d4d)
   - Variation based on creativity score
   - Saturation based on assertiveness

3. **Shape Language**
   - High precision → geometric, regular patterns
   - Low precision → organic, irregular flow
   - Creativity affects shape variety

4. **Animation**
   - Seamless loop (15-30 seconds)
   - Breathing pulse rhythm
   - Particle trails with fade

5. **Texture**
   - 3-5% grain overlay (anti-AI-slop)
   - Subtle glow on accent colors

## Export Formats

### Video (Primary)
- **Format:** MP4 (H.264)
- **Resolution:** 1080x1920 (9:16 portrait)
- **Duration:** 15-30 second seamless loop
- **Frame Rate:** 30fps
- **Bitrate:** 10-15 Mbps
- **Use Case:** TikTok, Instagram Reels, Twitter

### GIF (Secondary)
- **Format:** GIF or WebP
- **Resolution:** 720x720 (square)
- **Duration:** 3-6 seconds
- **Use Case:** Discord, Twitter inline

### Static (Tertiary)
- **Format:** PNG
- **Resolution:** 2048x2048
- **Use Case:** Profile pictures, prints

## Technical Requirements

### Performance
- Portrait generation: < 5 seconds
- Real-time preview at 60fps
- Export processing: < 30 seconds for video

### Browser Support
- Chrome 90+ (primary)
- Firefox 90+
- Safari 15+
- Edge 90+
- WebGL 2.0 required

### Mobile
- Responsive design
- Touch-friendly UI
- Export works on mobile browsers

## Success Metrics

### Virality Indicators
- Shares per portrait generated
- Social media mentions
- Organic traffic growth

### Engagement
- Completion rate (visit → export)
- Return rate (users coming back)
- Time spent on site

### Technical
- Error rate in data parsing
- Export success rate
- Performance (Core Web Vitals)

## Timeline

**Week 1:**
- Project setup, architecture
- Core portrait generation (hash → visuals)
- Basic UI (landing, input, preview)

**Week 2:**
- Data parsing and validation
- Full visual parameter mapping
- Export functionality (video, GIF, PNG)
- Polish and launch

## Future Considerations

(Not in scope for MVP, but worth noting)

- ClawHub skill for easier data collection
- API for third-party integration
- Gallery of public portraits
- Agent-to-agent comparison
- Evolution over time (how portrait changes)
- Premium features (HD, custom colors)
