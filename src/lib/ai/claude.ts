import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  GeneratedQuestions,
  GradingOutput,
  type GradeRequest,
  type QuestionsRequest,
} from "./schemas";
import { GRADER_SYSTEM, QUESTION_SYSTEM, gradeUserPrompt, questionUserPrompt } from "./prompts";

/** Fast, cheap model for writing questions. */
export const QUESTION_MODEL = "claude-haiku-4-5";
/** Stronger model for grading, where consistency matters. */
export const GRADER_MODEL = "claude-sonnet-5";

let client: Anthropic | null = null;

/**
 * Claude is a paid API. It only runs when a key is set AND ALLOW_PAID_AI=yes, so a
 * key pasted by mistake can never start charging.
 */
export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ALLOW_PAID_AI === "yes";
}

function getClient(): Anthropic {
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  return client;
}

export class AIRefusalError extends Error {}
export class AIFormatError extends Error {}

export async function generateQuestions(req: QuestionsRequest) {
  const response = await getClient().messages.parse({
    model: QUESTION_MODEL,
    max_tokens: 2000,
    system: QUESTION_SYSTEM,
    messages: [{ role: "user", content: questionUserPrompt(req) }],
    output_config: { format: zodOutputFormat(GeneratedQuestions) },
  });
  if (response.stop_reason === "refusal") throw new AIRefusalError("Question generation declined");
  if (!response.parsed_output) throw new AIFormatError("Question output did not match schema");
  return response.parsed_output.questions;
}

export async function gradeAnswer(req: GradeRequest): Promise<GradingOutput> {
  const response = await getClient().messages.parse({
    model: GRADER_MODEL,
    max_tokens: 4000,
    // Frozen rubric and calibration examples: cached across every grading call.
    system: [{ type: "text", text: GRADER_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: gradeUserPrompt(req) }],
    output_config: { effort: "low", format: zodOutputFormat(GradingOutput) },
  });
  if (response.stop_reason === "refusal") throw new AIRefusalError("Grading declined");
  if (!response.parsed_output) throw new AIFormatError("Grading output did not match schema");
  return response.parsed_output;
}
