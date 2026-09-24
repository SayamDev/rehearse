import { GroqLimitError, groqEnabled, groqReact } from "@/lib/ai/groq";
import { REACT_SYSTEM, ReactRequest, reactUserPrompt, ruleReaction, tidyReaction } from "@/lib/ai/react";
import { clientKey, takeToken } from "@/lib/rate-limit";

/** Live Interview: the interviewer's short spoken reaction (and maybe one follow-up) to an answer. */
export async function POST(request: Request) {
  const parsed = ReactRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const req = parsed.data;

  // No key, or this visitor has used their share: built-in reactions keep the interview going.
  if (!groqEnabled() || !takeToken("react", clientKey(request)).ok) return Response.json({ ...ruleReaction(req), source: "rules" });

  try {
    const out = await groqReact(REACT_SYSTEM, reactUserPrompt(req));
    return Response.json({ ...tidyReaction(out, req), source: "ai" });
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("react route", error);
    return Response.json({ ...ruleReaction(req), source: "rules" });
  }
}
