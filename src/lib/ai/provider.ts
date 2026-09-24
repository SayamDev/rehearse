import "server-only";
import { aiEnabled as claudeEnabled, generateQuestions as claudeQuestions, gradeAnswer as claudeGrade } from "./claude";
import { GroqLimitError, groqEnabled, groqGrade, groqQuestions } from "./groq";
import { demoGrade, demoQuestions } from "./demo";
import type { GradeRequest, GradingOutput, QuestionsRequest } from "./schemas";
import type { FallbackReason, NotesSource } from "../types";

type Result<T> = { data: T; source: NotesSource; reason: FallbackReason };

function anyAi() {
  return claudeEnabled() || groqEnabled();
}

/**
 * Picks the engine for each request.
 * - "ai": Claude when donated credits are configured, otherwise Groq's free tier.
 * - "rules": the built-in rule-based notes, used when no AI key is set,
 *   when the free daily AI limit is used up, or when the AI call fails.
 */
async function withFallback<T>(ai: () => Promise<T>, rules: () => T, label: string): Promise<Result<T>> {
  if (!anyAi()) return { data: rules(), source: "rules", reason: "not-configured" };
  try {
    return { data: await ai(), source: "ai", reason: null };
  } catch (error) {
    const limit = error instanceof GroqLimitError || (error instanceof Error && /rate.?limit|429/i.test(error.message));
    if (!limit) console.error(`${label}: AI failed, using rule-based notes`, error);
    return { data: rules(), source: "rules", reason: limit ? "limit" : "error" };
  }
}

export function questions(req: QuestionsRequest) {
  return withFallback(
    () => (claudeEnabled() ? claudeQuestions(req) : groqQuestions(req)),
    () => demoQuestions(req),
    "questions",
  );
}

export function grade(req: GradeRequest): Promise<Result<GradingOutput>> {
  return withFallback(
    () => (claudeEnabled() ? claudeGrade(req) : groqGrade(req)),
    () => demoGrade(req),
    "grade",
  );
}
