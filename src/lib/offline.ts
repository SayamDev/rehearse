import { demoGrade, demoQuestions } from "./ai/demo";
import { toGrading } from "./ai/to-grading";
import type { Grading, Question, Seniority } from "./types";

/**
 * When there's no internet connection, rounds still work: questions come from the
 * built-in bank and question packs, and answers get the rule-based notes.
 */

/** True when a fetch failed because the device is offline (not because the server said no). */
export function isOffline(error: unknown): boolean {
  return (typeof navigator !== "undefined" && navigator.onLine === false) || error instanceof TypeError;
}

export function offlineQuestions(role: string, seniority: Seniority, count: number): Question[] {
  return demoQuestions({ role, seniority, count, jobDescription: "", exclude: [], plain: false, language: "en" }).map((q) => ({
    id: crypto.randomUUID(),
    text: q.text,
    category: q.category,
    competency: q.competency,
    difficulty: q.difficulty,
    lookingFor: q.looking_for,
  }));
}

export function offlineGrading(input: { role: string; seniority: Seniority; question: Question; answer: string; mode: "voice" | "type" }): Grading {
  return toGrading(
    demoGrade({
      role: input.role,
      seniority: input.seniority,
      jobDescription: "",
      question: input.question,
      answer: input.answer,
      mode: input.mode,
      plain: false,
      language: "en",
    }),
  );
}
