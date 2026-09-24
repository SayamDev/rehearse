import { CvRequest, ruleCv } from "@/lib/ai/cv";
import { GroqLimitError, groqCv, groqEnabled } from "@/lib/ai/groq";
import { scrubCv } from "@/lib/cv";
import { clientKey, takeToken } from "@/lib/rate-limit";

/** Nothing here is stored: the CV is read once to find stories and questions, then dropped. */
export async function POST(request: Request) {
  const parsed = CvRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Paste a bit more of your CV (at least a few lines)." }, { status: 400 });
  // Contact details are removed again here, in case the page's own clean-up missed any.
  const req = { ...parsed.data, cv: scrubCv(parsed.data.cv), advert: scrubCv(parsed.data.advert) };

  if (!groqEnabled()) return Response.json({ ...ruleCv(req), source: "rules" });
  if (!takeToken("cv", clientKey(request)).ok) return Response.json({ ...ruleCv(req), source: "rules", reason: "limit" });
  try {
    const out = await groqCv(req);
    if (!out.stories.length || !out.questions.length) throw new Error("empty");
    return Response.json({ stories: out.stories.slice(0, 5), questions: out.questions.slice(0, 5), source: "ai" });
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("cv route", error);
    return Response.json({ ...ruleCv(req), source: "rules", reason: error instanceof GroqLimitError ? "limit" : "error" });
  }
}
