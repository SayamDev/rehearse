import { z } from "zod";
import { coachSystem, guideReply } from "@/lib/ai/coach";
import { GroqLimitError, groqChat, groqEnabled } from "@/lib/ai/groq";
import { clientKey, takeToken } from "@/lib/rate-limit";
import { LANGUAGE_CODES, languageInstruction } from "@/lib/languages";

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1500) }))
    .min(1)
    .max(12),
  language: z.enum(LANGUAGE_CODES).default("en"),
  context: z
    .object({
      role: z.string().max(80).optional(),
      focus: z.string().max(40).optional(),
      interviewInDays: z.number().int().min(-1).max(3650).optional(),
      roundsThisWeek: z.number().int().min(0).max(100).optional(),
      weeklyGoal: z.number().int().min(1).max(14).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Type a question for the coach (up to about 250 words)." }, { status: 400 });
  const messages = parsed.data.messages;
  const last = messages[messages.length - 1];
  if (last.role !== "user") return Response.json({ error: "Ask the coach a question." }, { status: 400 });

  if (!groqEnabled()) return Response.json({ reply: guideReply(last.content, parsed.data.context?.role), source: "rules", reason: "not-configured" });
  if (!takeToken("coach", clientKey(request)).ok) return Response.json({ reply: guideReply(last.content, parsed.data.context?.role), source: "rules", reason: "limit" });

  try {
    return Response.json({ reply: await groqChat(coachSystem(parsed.data.context, languageInstruction(parsed.data.language, "your replies")), messages), source: "ai" });
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("coach route", error);
    return Response.json({ reply: guideReply(last.content, parsed.data.context?.role), source: "rules", reason: error instanceof GroqLimitError ? "limit" : "error" });
  }
}
