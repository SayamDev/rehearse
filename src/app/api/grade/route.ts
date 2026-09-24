import { demoGrade } from "@/lib/ai/demo";
import { grade } from "@/lib/ai/provider";
import { GradeRequest } from "@/lib/ai/schemas";
import { clientKey, takeToken } from "@/lib/rate-limit";
import { toGrading } from "@/lib/ai/to-grading";

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
