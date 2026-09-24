import { z } from "zod";
import { GroqLimitError, groqAudioEnabled, groqSpeech } from "@/lib/ai/groq";
import { PERSONAS } from "@/lib/game";
import { clientKey, takeToken } from "@/lib/rate-limit";
import { PERSONAS as PERSONA_IDS } from "@/lib/types";

const Body = z.object({ text: z.string().trim().min(1).max(200), persona: z.enum(PERSONA_IDS), lang: z.enum(["en", "ar"]).default("en") });

/**
 * Arabic rounds use Groq's free Saudi Arabic Orpheus voices (the terms must be accepted once
 * in the Groq console). Voice names can be changed with ARABIC_VOICES="friendly:x,busy:y,tough:z".
 */
function arabicVoice(persona: (typeof PERSONA_IDS)[number]): string {
  const custom = Object.fromEntries((process.env.ARABIC_VOICES ?? "").split(",").map((p) => p.split(":").map((x) => x.trim())));
  return custom[persona] || { friendly: "noura", busy: "lulwa", tough: "fahad" }[persona];
}

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
  const { text, persona, lang } = parsed.data;
  const voice = lang === "ar" ? arabicVoice(persona) : PERSONAS[persona].humanVoice;
  const model = lang === "ar" ? "canopylabs/orpheus-arabic-saudi" : undefined;
  const key = `${lang}|${voice}|${text}`;

  const hit = cache.get(key);
  if (hit) return audio(hit);
  // No key, or this visitor has used their share: the browser voice takes over.
  if (!groqAudioEnabled() || !takeToken("speak", clientKey(request)).ok) return Response.json({ fallback: true }, { status: 503 });

  try {
    const buf = await groqSpeech(text, voice, model);
    cache.set(key, buf);
    if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value!);
    return audio(buf);
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("speak route", error);
    return Response.json({ fallback: true }, { status: 503 });
  }
}
