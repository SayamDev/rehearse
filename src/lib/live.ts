import type { PersonaId } from "./types";

/**
 * Spoken lines for Live Interview mode. Short and varied so the conversation
 * never sounds scripted. Everything here works without AI.
 */

/** Said the instant the candidate stops talking, while the real reaction is prepared. */
export const BACKCHANNELS: Record<PersonaId, string[]> = {
  friendly: ["Okay, thank you.", "Thanks for sharing that.", "Okay, lovely.", "Thank you."],
  busy: ["Okay.", "Right.", "Got it.", "Okay, thanks."],
  tough: ["Right.", "Okay.", "I see.", "Mm, okay."],
};

/** Used when the AI reaction isn't available. */
export const FALLBACK_REACTIONS: Record<PersonaId, string[]> = {
  friendly: [
    "That's a helpful example to hear.",
    "I can tell that mattered to you.",
    "That gives me a good picture of how you work.",
    "That's useful to know about you.",
  ],
  busy: ["That's clear.", "Good, that's useful.", "Understood.", "That helps."],
  tough: ["Noted.", "I'll keep that in mind.", "Fair enough.", "Alright."],
};

/** Said before the next question. */
export const TRANSITIONS: Record<PersonaId, string[]> = {
  friendly: ["Let's go on to the next one.", "Here's my next question.", "Okay, next one.", "Let's move on."],
  busy: ["Next question.", "Moving on.", "Next one."],
  tough: ["Next.", "Moving on.", "Let's continue."],
};

/** The goodbye. The closing question already says "that's everything from me", so this doesn't. */
export const CLOSING: Record<PersonaId, string> = {
  friendly: "Thank you so much for your time today, it was lovely to meet you. I'll put your notes together now.",
  busy: "Thanks for your time today. I'll get your notes ready.",
  tough: "Thank you for your time. Your notes are next.",
};

/** When someone hasn't started talking yet. */
export const TAKE_YOUR_TIME = "Take your time. Start whenever you're ready.";

/** Said out loud after a long silence before any answer: first a check-in, then reassurance. */
export const STILL_THERE: Record<PersonaId, [string, string]> = {
  friendly: ["Take your time. Are you still with me?", "No rush at all. Just start talking whenever you're ready."],
  busy: ["Are you still there?", "Whenever you're ready, go ahead."],
  tough: ["Are you still there?", "I'm ready for your answer when you are."],
};

/** A stable but varied pick, so the same question always gets the same line. */
export function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length];
}

const RESULT_WORDS = /\b(result|in the end|so that|which meant|outcome|finally|as a result|ended up|turned out|\d+ ?(%|percent|per cent))\b/i;

/** Rule-based follow-up when the AI isn't available: ask for the missing piece. */
export function fallbackProbe(answer: string): string {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (words < 15) return "Could you tell me a little more about what you did?";
  if (!RESULT_WORDS.test(answer)) return "And how did it turn out in the end?";
  return "";
}
