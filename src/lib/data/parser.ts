import { AgentDataSchema, type AgentData } from "./schema";

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ParseError };

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Attempts to extract JSON from various input formats.
 * Handles:
 * - Raw JSON
 * - JSON in markdown code blocks
 * - JSON with surrounding text
 */
function extractJson(input: string): string | null {
  const trimmed = input.trim();

  // Try 1: Raw JSON (starts with { or [)
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  // Try 2: Markdown code block with json/JSON label
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try 3: Find JSON object anywhere in the text
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return null;
}

/**
 * Parse and validate agent data from user input.
 */
export function parseAgentData(input: string): ParseResult<AgentData> {
  // Step 1: Extract JSON from input
  const jsonString = extractJson(input);
  if (!jsonString) {
    return {
      ok: false,
      error: new ParseError(
        "Couldn't find JSON in the input. Make sure you copied the complete output from your agent.",
        "NO_JSON_FOUND"
      ),
    };
  }

  // Step 2: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      ok: false,
      error: new ParseError(
        "Invalid JSON format. Make sure the output wasn't truncated.",
        "INVALID_JSON",
        e
      ),
    };
  }

  // Step 3: Validate against schema
  const result = AgentDataSchema.safeParse(parsed);
  if (!result.success) {
    const firstError = result.error.errors[0];
    const path = firstError.path.join(".");
    return {
      ok: false,
      error: new ParseError(
        `Validation error at "${path}": ${firstError.message}`,
        "VALIDATION_ERROR",
        result.error.errors
      ),
    };
  }

  return { ok: true, value: result.data };
}

/**
 * Check if input looks like it might contain agent data.
 * Used for early feedback before full parsing.
 */
export function looksLikeAgentData(input: string): boolean {
  const lower = input.toLowerCase();
  return (
    lower.includes("agent_id") ||
    lower.includes("sessions_count") ||
    lower.includes("metrics")
  );
}
