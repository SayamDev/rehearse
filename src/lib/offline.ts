import { demoGrade, demoQuestions } from "./ai/demo";
import { toGrading } from "./ai/to-grading";
import type { Grading, Question, Seniority, Session } from "./types";

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

/**
 * One question for "Just one question": for the job they practised last, one they
 * haven't been asked recently when possible. From the built-in bank, so it's instant.
 */
export function pickOneQuestion(sessions: Session[], random = Math.random): { role: string; seniority: Seniority; question: Question } {
  const role = sessions[0]?.role ?? "Any job";
  const seniority = sessions[0]?.seniority ?? "entry";
  const asked = new Set(sessions.slice(0, 20).flatMap((s) => s.questions.map((q) => q.question.text.toLowerCase())));
  const pool = offlineQuestions(role, seniority, 8);
  const fresh = pool.filter((q) => !asked.has(q.text.toLowerCase()) && q.category !== "motivation");
  const from = fresh.length ? fresh : pool;
  return { role, seniority, question: from[Math.floor(random() * from.length)] };
}
