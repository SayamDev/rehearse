import { round1 } from "./scoring";
import type { Session, SessionQuestion, Take } from "./types";

export function bestTake(q: SessionQuestion): Take | null {
  if (q.takes.length === 0) return null;
  return q.takes.reduce((a, b) => (b.overall > a.overall ? b : a));
}

export function firstTake(q: SessionQuestion): Take | null {
  return q.takes[0] ?? null;
}

/** Session score: mean of each answered question's best take. */
export function sessionScore(s: Session): number | null {
  const bests = s.questions.map(bestTake).filter((t): t is Take => t !== null);
  if (bests.length === 0) return null;
  return round1(bests.reduce((a, t) => a + t.overall, 0) / bests.length);
}

export function sessionXp(s: Session): number {
  return s.questions.reduce((a, q) => a + q.takes.reduce((b, t) => b + t.xp, 0), 0);
}

export function nextUnanswered(s: Session): number {
  const i = s.questions.findIndex((q) => q.takes.length === 0);
  return i === -1 ? s.questions.length - 1 : i;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export const SENIORITY_LABELS = {
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  lead: "Lead or manager",
} as const;
