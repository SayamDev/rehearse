import { AdvertRequest, ruleAdvert } from "@/lib/ai/advert";
import { GroqLimitError, groqAdvert, groqEnabled } from "@/lib/ai/groq";
import { scrubCv } from "@/lib/cv";
import { clientKey, takeToken } from "@/lib/rate-limit";

/** Likely questions from a job advert. Nothing is stored: the advert is read once, then dropped. */
export async function POST(request: Request) {
  const parsed = AdvertRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Paste more of the job advert: the part about the role and what they're looking for." }, { status: 400 });
  // Contact details in adverts (a recruiter's email or phone) aren't needed.
  const req = { ...parsed.data, advert: scrubCv(parsed.data.advert) };

  if (!groqEnabled()) return Response.json({ ...ruleAdvert(req), source: "rules" });
  if (!takeToken("advert", clientKey(request)).ok) return Response.json({ ...ruleAdvert(req), source: "rules", reason: "limit" });
  try {
    const out = await groqAdvert(req);
    if (out.questions.length < 3) throw new Error("too few");
    // Ranked by the model; "very likely" is simply the top 3, whatever it labelled them.
    const questions = out.questions.slice(0, 8).map((q, i) => ({ ...q, likely: i < 3 ? "very likely" : "likely" }));
    return Response.json({ ...out, skills: out.skills.slice(0, 6), questions, source: "ai" });
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("advert route", error);
    return Response.json({ ...ruleAdvert(req), source: "rules", reason: error instanceof GroqLimitError ? "limit" : "error" });
  }
}
