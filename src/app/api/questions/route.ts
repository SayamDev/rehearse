import { demoQuestions } from "@/lib/ai/demo";
import { questions } from "@/lib/ai/provider";
import { QuestionsRequest } from "@/lib/ai/schemas";
import { clientKey, takeToken } from "@/lib/rate-limit";
import type { Question } from "@/lib/types";

type Generated = ReturnType<typeof demoQuestions>;

/** Reuse AI-written sets per role and level so the free AI quota goes to scoring. */
const bankCache = new Map<string, { at: number; items: Generated }>();
const CACHE_MS = 1000 * 60 * 60 * 24 * 7;

function toQuestions(items: Generated): Question[] {
  return items.map((q) => ({
    id: crypto.randomUUID(),
    text: q.text.trim(),
    category: q.category,
    competency: q.competency,
    difficulty: Math.min(5, Math.max(1, Math.round(q.difficulty))),
    lookingFor: q.looking_for.trim(),
  }));
}

export async function POST(request: Request) {
  const parsed = QuestionsRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Check the job title and try again." }, { status: 400 });
  }
  const req = parsed.data;

  const cacheKey =
    !req.jobDescription.trim() && req.exclude.length === 0
      ? `${req.role.toLowerCase()}|${req.seniority}|${req.count}|${req.persona ?? ""}`
      : null;
  const cached = cacheKey ? bankCache.get(cacheKey) : undefined;
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return Response.json({ questions: toQuestions(cached.items), source: "ai" });
  }

  // Past this visitor's fair share of the free AI quota: use the built-in bank.
  if (!takeToken("questions", clientKey(request)).ok) {
    return Response.json({ questions: toQuestions(demoQuestions(req)), source: "rules", reason: "limit" });
  }

  const result = await questions(req);
  const items = result.data.slice(0, req.count);
  if (result.source === "ai" && items.length > 0 && cacheKey) {
    bankCache.set(cacheKey, { at: Date.now(), items });
  }
  const final = items.length > 0 ? items : demoQuestions(req);
  return Response.json({ questions: toQuestions(final), source: items.length > 0 ? result.source : "rules", reason: result.reason });
}
