import { GroqLimitError, groqAudioEnabled, groqTranscribe } from "@/lib/ai/groq";
import { clientKey, takeToken } from "@/lib/rate-limit";
import { LANGUAGE_CODES } from "@/lib/languages";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * An accurate transcript of one spoken answer: for Live Interview, for phones (which record
 * first), and whenever the browser's own recognizer heard nothing. The audio is sent to
 * Groq (zero data retention) and not stored anywhere. If this isn't available, the
 * browser's own transcript is used instead.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_BYTES) {
    return Response.json({ fallback: true }, { status: 400 });
  }
  const seconds = Math.min(600, Math.max(0, Number(form?.get("seconds")) || 60));
  const context = String(form?.get("context") ?? "").slice(0, 600);
  const asked = String(form?.get("language") ?? "en");
  const language = LANGUAGE_CODES.includes(asked) ? asked : "en";

  if (!groqAudioEnabled() || !takeToken("transcribe", clientKey(request)).ok) return Response.json({ fallback: true });
  try {
    return Response.json({ text: await groqTranscribe(audio, seconds, context, language) });
  } catch (error) {
    if (!(error instanceof GroqLimitError)) console.error("transcribe route", error);
    return Response.json({ fallback: true });
  }
}
