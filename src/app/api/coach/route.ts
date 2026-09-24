import { z } from "zod";
import { COACH_SYSTEM, guideReply } from "@/lib/ai/coach";
import { GroqLimitError, groqChat, groqEnabled } from "@/lib/ai/groq";
import { clientKey, takeToken } from "@/lib/rate-limit";

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(12),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Type a question for the coach (up to about 250 words)." }, { status: 400 });
  const messages = parsed.data.messages;
  const last = messages[messages.length - 1];
  if (last.role !== "user") return Response.json({ error: "Ask the coach a question." }, { status: 400 });

  if (!groqEnabled()) return Response.json({ reply: guideReply(last.content), source: "rules", reason: "not-configured" });
  if (!takeToken("coach", clientKey(request)).ok) return Response.json({ reply: guideReply(last.content), source: "rules", reason: "limit" });

  try {
    return Response.json({ reply: await groqChat(COACH_SYSTEM, messages), source: "ai" });
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("coach route", error);
    return Response.json({ reply: guideReply(last.content), source: "rules", reason: error instanceof GroqLimitError ? "limit" : "error" });
  }
}
