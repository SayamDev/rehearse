import { demoGrade } from "@/lib/ai/demo";
import { grade } from "@/lib/ai/provider";
import { GradeRequest, type GradingOutput } from "@/lib/ai/schemas";
import { clientKey, takeToken } from "@/lib/rate-limit";
import { clampScore } from "@/lib/scoring";
import { RUBRIC_KEYS, type Grading, type RubricItem, type RubricKey } from "@/lib/types";

function toGrading(out: GradingOutput): Grading {
  const rubric = {} as Record<RubricKey, RubricItem>;
  for (const key of RUBRIC_KEYS) {
    rubric[key] = { score: clampScore(out.rubric[key].score), why: out.rubric[key].why.trim() };
  }
  return {
    rubric,
    star: out.star,
    strength: { quote: out.strength.quote.trim(), why: out.strength.why.trim() },
    fix: out.fix.trim(),
    improvedAnswer: out.improved_answer.trim(),
    followUpQuestion: out.follow_up_question.trim(),
    isGenuineAnswer: out.is_genuine_answer,
    criteria: out.criteria.slice(0, 4).map((c) => ({ point: c.point.trim(), met: c.met })),
  };
}

export async function POST(request: Request) {
  const parsed = GradeRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((i) => i.path[0] === "answer" && i.code === "too_big");
    return Response.json(
      { error: tooLong ? "That answer is too long to score. Keep it under about 600 words." : "Something was missing from that answer. Try again." },
      { status: 400 },
    );
  }
  const req = parsed.data;

  // Past this visitor's fair share of the free AI quota: rule-based notes, never a block.
  if (!takeToken("grade", clientKey(request)).ok) {
    return Response.json({ grading: toGrading(demoGrade(req)), source: "rules", reason: "limit" });
  }

  const result = await grade(req);
  return Response.json({ grading: toGrading(result.data), source: result.source, reason: result.reason });
}
