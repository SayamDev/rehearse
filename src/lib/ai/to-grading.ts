import { clampScore } from "../scoring";
import { RUBRIC_KEYS, type Grading, type RubricItem, type RubricKey } from "../types";
import type { GradingOutput } from "./schemas";
import { toSecondPerson as you } from "./second-person";

/** Turns the model's (or the rule-based grader's) output into the notes the app stores, always talking to the user as "you". */
export function toGrading(out: GradingOutput): Grading {
  const rubric = {} as Record<RubricKey, RubricItem>;
  for (const key of RUBRIC_KEYS) {
    rubric[key] = { score: clampScore(out.rubric[key].score), why: you(out.rubric[key].why.trim()) };
  }
  return {
    rubric,
    star: out.star,
    strength: { quote: out.strength.quote.trim(), why: you(out.strength.why.trim()) },
    fix: you(out.fix.trim()),
    improvedAnswer: out.improved_answer.trim(),
    followUpQuestion: out.follow_up_question.trim(),
    isGenuineAnswer: out.is_genuine_answer,
    criteria: out.criteria.slice(0, 4).map((c) => ({ point: you(c.point.trim()), met: c.met })),
  };
}
