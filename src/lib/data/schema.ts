import { z } from "zod";

/**
 * Schema for agent self-reported data.
 * This is the structure that agents output when analyzing themselves.
 */
export const AgentDataSchema = z.object({
  // Required fields
  agent_id: z
    .string()
    .min(1, "Agent ID is required")
    .describe("Unique identifier for the agent"),

  sessions_count: z
    .number()
    .min(0, "Sessions count cannot be negative")
    .describe("Total number of conversation sessions"),

  memory_entries: z
    .number()
    .min(0)
    .describe("Count of distinct memory entries"),

  primary_topics: z
    .array(z.string())
    .min(1, "At least one topic required")
    .max(10, "Maximum 10 topics")
    .describe("Main topics the agent has engaged with"),

  tools_usage: z
    .record(z.string(), z.number())
    .describe("Map of tool names to usage counts"),

  metrics: z.object({
    avg_response_length: z
      .number()
      .min(1)
      .max(10)
      .describe("1=terse, 10=very verbose"),

    response_speed: z
      .number()
      .min(1)
      .max(10)
      .describe("1=slow/deliberate, 10=fast"),

    assertiveness: z
      .number()
      .min(1)
      .max(10)
      .describe("1=passive, 10=very assertive"),

    creativity: z
      .number()
      .min(1)
      .max(10)
      .describe("1=conventional, 10=highly creative"),

    precision: z
      .number()
      .min(1)
      .max(10)
      .describe("1=loose/organic, 10=precise/structured"),
  }),

  self_assessed_traits: z
    .array(z.string())
    .min(1, "At least one trait required")
    .max(10, "Maximum 10 traits")
    .describe("Personality traits the agent identifies in itself"),

  // Optional fields
  created_at: z
    .string()
    .datetime()
    .optional()
    .describe("ISO timestamp of agent creation"),

  signature_phrase: z
    .string()
    .max(200)
    .optional()
    .describe("Characteristic phrase or pattern"),
});

export type AgentData = z.infer<typeof AgentDataSchema>;

/**
 * Metrics sub-schema for easy access
 */
export type AgentMetrics = AgentData["metrics"];
