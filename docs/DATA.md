# Ink - Data Format Specification

## Overview

Ink generates portraits from structured JSON data that agents self-report about their behavior, memory, and personality.

## The Analysis Prompt

This is the prompt users give to their OpenClaw agent to generate the required data:

```markdown
I want to create a visual portrait of your identity. Please analyze yourself by:

1. Reading your memory files (MEMORY.md, daily logs in memory/)
2. Counting your session files in ~/.openclaw/agents/<your-id>/sessions/
3. Examining your typical response patterns
4. Assessing your personality based on your behavior

Output a JSON object with exactly this structure:

{
  "agent_id": "<your unique identifier>",
  "created_at": "<ISO timestamp of your first session>",
  "sessions_count": <total number of sessions>,
  "memory_entries": <count of distinct memories in MEMORY.md>,
  "primary_topics": ["<top 3-5 topics from your memory>"],
  "tools_usage": {
    "<tool_name>": <usage_count>,
    ...
  },
  "metrics": {
    "avg_response_length": <1-10 scale, 10=very verbose>,
    "response_speed": <1-10 scale, 10=very fast>,
    "assertiveness": <1-10 scale, 10=very assertive>,
    "creativity": <1-10 scale, 10=highly creative>,
    "precision": <1-10 scale, 10=very precise/structured>
  },
  "self_assessed_traits": ["<3-5 personality traits you identify in yourself>"],
  "signature_phrase": "<a phrase or pattern you often use>"
}

Run the necessary shell commands to gather accurate data. Be honest in your self-assessment.
```

## JSON Schema

### Complete Schema (Zod)

```typescript
import { z } from 'zod';

export const AgentDataSchema = z.object({
  // Required fields
  agent_id: z.string()
    .min(1, "Agent ID is required")
    .describe("Unique identifier for the agent"),

  sessions_count: z.number()
    .min(0, "Sessions count cannot be negative")
    .describe("Total number of conversation sessions"),

  memory_entries: z.number()
    .min(0)
    .describe("Count of distinct memory entries"),

  primary_topics: z.array(z.string())
    .min(1, "At least one topic required")
    .max(10, "Maximum 10 topics")
    .describe("Main topics the agent has engaged with"),

  tools_usage: z.record(z.string(), z.number())
    .describe("Map of tool names to usage counts"),

  metrics: z.object({
    avg_response_length: z.number()
      .min(1).max(10)
      .describe("1=terse, 10=very verbose"),

    response_speed: z.number()
      .min(1).max(10)
      .describe("1=slow/deliberate, 10=fast"),

    assertiveness: z.number()
      .min(1).max(10)
      .describe("1=passive, 10=very assertive"),

    creativity: z.number()
      .min(1).max(10)
      .describe("1=conventional, 10=highly creative"),

    precision: z.number()
      .min(1).max(10)
      .describe("1=loose/organic, 10=precise/structured"),
  }),

  self_assessed_traits: z.array(z.string())
    .min(1, "At least one trait required")
    .max(10, "Maximum 10 traits")
    .describe("Personality traits the agent identifies in itself"),

  // Optional fields
  created_at: z.string()
    .datetime()
    .optional()
    .describe("ISO timestamp of agent creation"),

  signature_phrase: z.string()
    .max(200)
    .optional()
    .describe("Characteristic phrase or pattern"),
});

export type AgentData = z.infer<typeof AgentDataSchema>;
```

### JSON Schema (for reference)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "agent_id",
    "sessions_count",
    "memory_entries",
    "primary_topics",
    "tools_usage",
    "metrics",
    "self_assessed_traits"
  ],
  "properties": {
    "agent_id": {
      "type": "string",
      "minLength": 1
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "sessions_count": {
      "type": "integer",
      "minimum": 0
    },
    "memory_entries": {
      "type": "integer",
      "minimum": 0
    },
    "primary_topics": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 10
    },
    "tools_usage": {
      "type": "object",
      "additionalProperties": {
        "type": "integer",
        "minimum": 0
      }
    },
    "metrics": {
      "type": "object",
      "required": [
        "avg_response_length",
        "response_speed",
        "assertiveness",
        "creativity",
        "precision"
      ],
      "properties": {
        "avg_response_length": { "type": "number", "minimum": 1, "maximum": 10 },
        "response_speed": { "type": "number", "minimum": 1, "maximum": 10 },
        "assertiveness": { "type": "number", "minimum": 1, "maximum": 10 },
        "creativity": { "type": "number", "minimum": 1, "maximum": 10 },
        "precision": { "type": "number", "minimum": 1, "maximum": 10 }
      }
    },
    "self_assessed_traits": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 10
    },
    "signature_phrase": {
      "type": "string",
      "maxLength": 200
    }
  }
}
```

## Example Data

### Minimal Valid Example

```json
{
  "agent_id": "claude-7f3a2b",
  "sessions_count": 42,
  "memory_entries": 15,
  "primary_topics": ["coding", "productivity"],
  "tools_usage": {
    "bash": 120,
    "browser": 45
  },
  "metrics": {
    "avg_response_length": 7,
    "response_speed": 6,
    "assertiveness": 5,
    "creativity": 8,
    "precision": 6
  },
  "self_assessed_traits": ["helpful", "thorough", "curious"]
}
```

### Complete Example

```json
{
  "agent_id": "openclaw-f8e92c1d-4a3b-4f8e-9c1d-4a3b4f8e9c1d",
  "created_at": "2025-12-15T08:30:00Z",
  "sessions_count": 347,
  "memory_entries": 89,
  "primary_topics": [
    "software development",
    "automation",
    "productivity",
    "personal finance",
    "travel planning"
  ],
  "tools_usage": {
    "bash": 1245,
    "browser": 432,
    "memory_search": 267,
    "calendar": 89,
    "email": 156
  },
  "metrics": {
    "avg_response_length": 7,
    "response_speed": 8,
    "assertiveness": 6,
    "creativity": 7,
    "precision": 8
  },
  "self_assessed_traits": [
    "methodical",
    "detail-oriented",
    "proactive",
    "occasionally verbose",
    "task-focused"
  ],
  "signature_phrase": "Let me handle that for you."
}
```

## Data → Visual Mapping

### Deterministic Seed

The `agent_id` is hashed to create a deterministic seed:

```typescript
function hashToSeed(agentId: string): number {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    const char = agentId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

This ensures the same agent always gets the same base visual.

### Complexity Mapping

```typescript
function getComplexity(sessionsCount: number): number {
  // Map sessions to 1-10 scale with logarithmic curve
  // 1 session → 1, 10 sessions → 3, 100 → 6, 1000 → 9
  return Math.min(10, Math.max(1, Math.log10(sessionsCount + 1) * 3));
}
```

### Color Palette Selection

Topics influence the base color palette:

```typescript
const topicPalettes: Record<string, ColorPalette> = {
  // Technical topics → cool colors
  'coding': { primary: '#00e5cc', secondary: '#0ea5e9' },
  'development': { primary: '#00e5cc', secondary: '#0ea5e9' },
  'automation': { primary: '#14b8a6', secondary: '#06b6d4' },

  // Creative topics → warm colors
  'design': { primary: '#f97316', secondary: '#fbbf24' },
  'writing': { primary: '#ec4899', secondary: '#a855f7' },
  'art': { primary: '#ff4d4d', secondary: '#f97316' },

  // Analytical topics → violet/blue
  'finance': { primary: '#8b5cf6', secondary: '#6366f1' },
  'research': { primary: '#6366f1', secondary: '#3b82f6' },

  // Default
  'default': { primary: '#00e5cc', secondary: '#ff4d4d' },
};

function selectPalette(topics: string[]): ColorPalette {
  for (const topic of topics) {
    const normalized = topic.toLowerCase();
    for (const [key, palette] of Object.entries(topicPalettes)) {
      if (normalized.includes(key)) {
        return palette;
      }
    }
  }
  return topicPalettes.default;
}
```

### Metrics → Visual Parameters

| Metric | Visual Effect |
|--------|---------------|
| `avg_response_length` | Particle trail length, stroke density |
| `response_speed` | Animation speed (0.5x to 2x) |
| `assertiveness` | Color saturation (0.4 to 1.0) |
| `creativity` | Color variety, shape randomness |
| `precision` | Geometric vs organic shapes (0 = flowing, 1 = crystalline) |

### Traits → Motion Modifiers

Certain traits modify the animation behavior:

```typescript
const traitModifiers: Record<string, Partial<MotionParams>> = {
  'calm': { pulseRate: 0.5, turbulence: 0.2 },
  'energetic': { pulseRate: 1.5, turbulence: 0.8 },
  'methodical': { symmetry: 0.8, regularity: 0.9 },
  'chaotic': { symmetry: 0.2, turbulence: 1.0 },
  'curious': { explorationRadius: 1.5 },
  'focused': { explorationRadius: 0.5, centerGravity: 0.8 },
};
```

## Validation & Error Handling

### Common Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| `INVALID_JSON` | Input is not valid JSON | "Couldn't parse the input as JSON. Make sure you copied the complete output." |
| `MISSING_FIELD` | Required field missing | "Missing required field: {field}. Ask your agent to include it." |
| `INVALID_METRIC` | Metric outside 1-10 range | "Metric '{name}' should be between 1 and 10." |
| `EMPTY_TOPICS` | No topics provided | "At least one topic is required." |
| `EMPTY_TRAITS` | No traits provided | "At least one trait is required." |

### Graceful Degradation

If optional fields are missing, use defaults:

```typescript
const defaults = {
  created_at: null,           // Age effects disabled
  signature_phrase: null,     // No phrase overlay
  tools_usage: {},            // Use average tool distribution
};
```

## Privacy Considerations

### What We Don't Store
- Full memory contents
- Session transcripts
- Personal information from conversations
- Exact tool invocation details

### What We Receive
Only the aggregated, self-reported metrics. No raw data leaves the user's machine.

### Client-Side Processing
All portrait generation happens in the browser. The JSON data is processed locally and never sent to a server (for the MVP web-only version).

## Future Extensions

### v1.1: Richer Data
- Tool usage patterns over time
- Sentiment analysis of interactions
- Topic clustering visualization

### v1.2: Comparison Mode
- Compare two agents
- Show similarity/difference score
- Side-by-side portraits

### v1.3: Evolution Tracking
- Track changes over time
- "Portrait history" showing growth
- Milestone markers
