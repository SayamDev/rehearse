import { z } from "zod";
import { GroqLimitError, groqEnabled, groqSpeech } from "@/lib/ai/groq";
import { PERSONAS } from "@/lib/game";
import { clientKey, takeToken } from "@/lib/rate-limit";
import { PERSONAS as PERSONA_IDS } from "@/lib/types";

const Body = z.object({ text: z.string().trim().min(1).max(200), persona: z.enum(PERSONA_IDS) });

/**
 * Cache of spoken clips. Interview questions repeat a lot (question bank, daily
 * challenge, greetings), so each clip is generated once and reused, which keeps
 * us inside Groq's small free speech allowance.
 */
const cache = new Map<string, ArrayBuffer>();
const MAX_CACHE = 300;

function audio(buf: ArrayBuffer) {
  return new Response(buf, { headers: { "Content-Type": "audio/wav", "Cache-Control": "public, max-age=604800, immutable" } });
}

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ fallback: true }, { status: 400 });
  const { text, persona } = parsed.data;
  const voice = PERSONAS[persona].humanVoice;
  const key = `${voice}|${text}`;

  const hit = cache.get(key);
  if (hit) return audio(hit);
  // No key, or this visitor has used their share: the browser voice takes over.
  if (!groqEnabled() || !takeToken("speak", clientKey(request)).ok) return Response.json({ fallback: true }, { status: 503 });

  try {
    const buf = await groqSpeech(text, voice);
    cache.set(key, buf);
    if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value!);
    return audio(buf);
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("speak route", error);
    return Response.json({ fallback: true }, { status: 503 });
  }
}
