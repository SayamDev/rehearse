"use client";

import { countWords } from "./delivery";
import { accentFor, whisperHint } from "./accents";
import { getSettings } from "./store";

/** The hint sent with a recording: the user's spelling style and the question. */
export function voiceHint(question?: string): string {
  const s = getSettings();
  return whisperHint(accentFor(s.accent, typeof navigator === "undefined" ? [] : (navigator.languages ?? [navigator.language])).spelling, question);
}

/**
 * Accurate transcripts for spoken answers: the recording is transcribed by Whisper
 * (via /api/transcribe) and checked against the browser's live transcript.
 */
export async function accurateTranscript(audio: Blob | null, seconds: number, browserText: string, context: string, language = "en"): Promise<string> {
  if (!audio || audio.size < 1000) return browserText;
  try {
    const form = new FormData();
    // Safari records MP4, Chrome and Firefox WebM; the name tells Whisper which.
    form.append("audio", audio, /mp4|m4a|aac/.test(audio.type) ? "answer.mp4" : /ogg/.test(audio.type) ? "answer.ogg" : "answer.webm");
    form.append("seconds", String(Math.round(seconds)));
    form.append("context", context);
    form.append("language", language);
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
/** What Whisper tends to "hear" in silence. */
const SILENCE = /^(thank you( (so much|for watching))?|thanks( for watching)?|you|bye|okay|so)[.!\s]*$/i;

export function chooseTranscript(whisper: string, browser: string): string {
  const w = whisper.replace(/\s+/g, " ").trim();
  const b = browser.replace(/\s+/g, " ").trim();
  const bw = countWords(b);
  const ww = countWords(w);
  if (!w) return b;
  // Nothing from the browser (phones record first): trust Whisper, unless it's a stock phrase it says on silence.
  if (bw === 0) return SILENCE.test(w) ? "" : w;
  if (ww < bw * 0.5 || ww > bw * 2 + 10) return b;
  return w;
}
