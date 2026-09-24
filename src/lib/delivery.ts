import type { DeliveryMetrics } from "./types";

const FILLER_PHRASES = ["you know", "i mean", "sort of", "kind of"];
const FILLER_WORDS = ["um", "umm", "uh", "uhh", "erm", "er", "like", "basically", "literally", "actually"];

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Counts filler words and phrases. "like" only counts when it is not
 * part of a comparison ("I like", "like a", "looks like"), to avoid
 * penalising normal speech.
 */
export function countFillers(text: string): Record<string, number> {
  const lower = ` ${text.toLowerCase().replace(/[^a-z'\s]/g, " ").replace(/\s+/g, " ")} `;
  const found: Record<string, number> = {};
  let rest = lower;
  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(` ${phrase} `, "g");
    const hits = rest.match(re)?.length ?? 0;
    if (hits) {
      found[phrase] = hits;
      rest = rest.replace(re, " ");
    }
  }
  const words = rest.trim().split(" ");
  words.forEach((w, i) => {
    if (!FILLER_WORDS.includes(w)) return;
    if (w === "like") {
      const prev = words[i - 1];
      const next = words[i + 1];
      if (["i", "we", "you", "they", "would", "looks", "look", "feel", "felt", "just"].includes(prev)) return;
      if (["a", "an", "the", "to", "that", "this"].includes(next)) return;
    }
    found[w] = (found[w] ?? 0) + 1;
  });
  return found;
}

export function measureDelivery(transcript: string, durationSec: number): DeliveryMetrics {
  const wordCount = countWords(transcript);
  const fillers = countFillers(transcript);
  const fillerCount = Object.values(fillers).reduce((a, b) => a + b, 0);
  const minutes = Math.max(durationSec, 1) / 60;
  return {
    durationSec: Math.round(durationSec),
    wordCount,
    wpm: Math.round(wordCount / minutes),
    fillerCount,
    fillers,
  };
}
