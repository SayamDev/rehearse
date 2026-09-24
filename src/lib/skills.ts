import { RUBRIC_LABELS, round1 } from "./scoring";
import { bestTake, sessionScore } from "./session";
import { RUBRIC_KEYS, type RubricKey, type Session } from "./types";

/** What each rubric skill means, how to get better at it, and how questions can train it. */
export const SKILL_FOCUS: Record<RubricKey, { tip: string; prompt: string }> = {
  relevance: {
    tip: "Answer the exact question asked. Repeat its key words in your first sentence so you stay on track.",
    prompt: "Choose questions with a clear, specific ask (for example a particular kind of situation), so the candidate can practise answering exactly what was asked.",
  },
  structure: {
    tip: "Use STAR: the situation, your task, what you did, and the result. One or two sentences each.",
    prompt: "Make most of them 'Tell me about a time...' behavioural questions, so the candidate can practise STAR structure.",
  },
  specificity: {
    tip: "Swap general claims for one real example with details: names of tools, numbers, times and outcomes.",
    prompt: "Choose questions that ask for concrete examples, numbers and outcomes, so the candidate can practise being specific.",
  },
  ownership: {
    tip: "Say “I” for what you did, not only “we”. Then say what changed because of you.",
    prompt: "Choose questions about the candidate's own decisions, mistakes and results, so they can practise saying what they personally did.",
  },
  clarity: {
    tip: "Make your point first, give one example, then stop. About one to two minutes is enough.",
    prompt: "Choose questions that are easy to ramble on (like explaining something or describing yourself), so the candidate can practise short, clear answers.",
  },
  role_fit: {
    tip: "Link your answer to this job: name a skill the job needs and show it in your example.",
    prompt: "Make the questions closely about the day-to-day skills of this exact role, so the candidate can practise showing they fit it.",
  },
};

export type SkillAverage = { key: RubricKey; label: string; score: number; count: number };

/** Average rubric score per skill over the best take of the most recent answered questions. */
export function skillAverages(sessions: Session[], recent = 12): SkillAverage[] {
  const takes = sessions
    .flatMap((s) => s.questions.map(bestTake))
    .filter((t): t is NonNullable<typeof t> => t !== null && t.grading.isGenuineAnswer)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, recent);
  if (!takes.length) return [];
  return RUBRIC_KEYS.map((key) => ({
    key,
    label: RUBRIC_LABELS[key],
    score: round1(takes.reduce((a, t) => a + t.grading.rubric[key].score, 0) / takes.length),
    count: takes.length,
  }));
}

/** The skill with the lowest average, once there's enough to go on (3 answers). */
export function weakestSkill(averages: SkillAverage[]): SkillAverage | null {
  if (!averages.length || averages[0].count < 3) return null;
  return averages.reduce((low, s) => (s.score < low.score ? s : low));
}

export type ScorePoint = { id: string; date: string; score: number; role: string };

/** Score of each finished round, oldest first. */
export function scoreHistory(sessions: Session[], limit = 12): ScorePoint[] {
  return sessions
    .map((s) => ({ s, score: sessionScore(s) }))
    .filter((x): x is { s: Session; score: number } => x.score !== null)
    .sort((a, b) => a.s.createdAt.localeCompare(b.s.createdAt))
    .slice(-limit)
    .map(({ s, score }) => ({ id: s.id, date: s.createdAt, score, role: s.role }));
}

/** How much the average of the latest rounds beats the first ones (null until there are 4 rounds). */
export function scoreGain(points: ScorePoint[]): number | null {
  if (points.length < 4) return null;
  const n = Math.min(3, Math.floor(points.length / 2));
  const avg = (xs: ScorePoint[]) => xs.reduce((a, p) => a + p.score, 0) / xs.length;
  return round1(avg(points.slice(-n)) - avg(points.slice(0, n)));
}
