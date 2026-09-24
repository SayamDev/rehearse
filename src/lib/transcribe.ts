"use client";

import { countWords } from "./delivery";

/**
 * Accurate transcripts for spoken answers: the recording is transcribed by Whisper
 * (via /api/transcribe) and checked against the browser's live transcript.
 */
export async function accurateTranscript(audio: Blob | null, seconds: number, browserText: string, context: string): Promise<string> {
  if (!audio || audio.size < 1000) return browserText;
  try {
    const form = new FormData();
    form.append("audio", audio, "answer.webm");
    form.append("seconds", String(Math.round(seconds)));
    form.append("context", context);
    const res = await fetch("/api/transcribe", { method: "POST", body: form, signal: AbortSignal.timeout(25_000) });
    const data = (await res.json()) as { text?: string };
    return chooseTranscript(data.text ?? "", browserText);
  } catch {
    return browserText;
  }
}

/**
 * Whisper is usually more accurate, but on silence it can invent a stock phrase
 * ("Thank you."), and very rarely it repeats itself. When its length is far off from
 * what the browser heard, trust the browser instead.
 */
export function chooseTranscript(whisper: string, browser: string): string {
  const w = whisper.replace(/\s+/g, " ").trim();
  const b = browser.replace(/\s+/g, " ").trim();
  const bw = countWords(b);
  const ww = countWords(w);
  if (!w) return b;
  if (bw === 0) return ww >= 6 ? w : "";
  if (ww < bw * 0.5 || ww > bw * 2 + 10) return b;
  return w;
}
