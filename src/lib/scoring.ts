import type { DeliveryMetrics, Grading, RubricKey } from "./types";

/** Weights for the content rubric. They sum to 1 and are shown to the user. */
export const RUBRIC_WEIGHTS: Record<RubricKey, number> = {
  relevance: 0.2,
  structure: 0.2,
  specificity: 0.2,
  ownership: 0.1,
  clarity: 0.15,
  role_fit: 0.15,
};

/** Share of the overall score taken by delivery when a voice answer is scored. */
export const DELIVERY_WEIGHT = 0.1;

export const RUBRIC_LABELS: Record<RubricKey, string> = {
  relevance: "Relevance",
  structure: "Structure",
  specificity: "Specifics",
  ownership: "Ownership",
  clarity: "Clarity",
  role_fit: "Role fit",
};

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(10, Math.max(1, Math.round(n)));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function contentScore(grading: Grading): number {
  let total = 0;
  for (const key of Object.keys(RUBRIC_WEIGHTS) as RubricKey[]) {
    total += clampScore(grading.rubric[key].score) * RUBRIC_WEIGHTS[key];
  }
  return total;
}

/**
 * Delivery score from measured speech, 1 to 10.
 * Pace between 110 and 165 words per minute is ideal.
 * Fillers are measured per 100 words; 2 or fewer costs nothing.
 */
export function deliveryScore(m: DeliveryMetrics): number {
  if (m.wordCount < 15) return 5;
  let pace = 10;
  if (m.wpm < 110) pace -= Math.min(5, (110 - m.wpm) / 10);
  if (m.wpm > 165) pace -= Math.min(5, (m.wpm - 165) / 10);
  const fillerRate = (m.fillerCount / m.wordCount) * 100;
  const fillerPenalty = Math.min(5, Math.max(0, fillerRate - 2) * 0.8);
  return Math.max(1, Math.min(10, pace - fillerPenalty));
}

export function overallScore(grading: Grading, delivery: number | null): number {
  const content = contentScore(grading);
  if (delivery === null) return round1(content);
  return round1(content * (1 - DELIVERY_WEIGHT) + delivery * DELIVERY_WEIGHT);
}

/**
 * XP for one take. Completing earns 10, the score earns up to 20,
 * and beating your previous take on the same question earns 12 per point gained.
 */
export function takeXp(score: number, previousBest: number | null): number {
  const base = 10 + Math.round(score * 2);
  if (previousBest === null || score <= previousBest) return base;
  return base + Math.round((score - previousBest) * 12);
}

export type Level = { level: number; title: string; floor: number; next: number };

const TITLES: [number, string][] = [
  [1, "Applicant"],
  [5, "Candidate"],
  [10, "Shortlisted"],
  [20, "Finalist"],
  [30, "Offer Magnet"],
  [40, "Hiring Legend"],
];

/** XP needed to reach a level: 60 for level 2, growing by 20 per level after that. */
export function xpForLevel(level: number): number {
  const n = level - 1;
  return 60 * n + 10 * n * (n - 1);
}

export function levelFromXp(xp: number): Level {
  let level = 1;
  while (level < 50 && xp >= xpForLevel(level + 1)) level++;
  let title = TITLES[0][1];
  for (const [min, t] of TITLES) if (level >= min) title = t;
  return {
    level,
    title,
    floor: xpForLevel(level),
    next: level >= 50 ? xpForLevel(50) : xpForLevel(level + 1),
  };
}
