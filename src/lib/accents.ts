/**
 * English accents for speech recognition. The browser's recognizer (Google's in Chrome and
 * Edge) has a model per variety of English, and picking the right one makes a real
 * difference to accuracy. Whisper hears every accent on its own but can be told the spelling
 * style, so each accent also says whether answers are written in British or American spelling.
 */

export type Spelling = "british" | "american";
export type Accent = { code: string; label: string; spelling: Spelling };

export const ACCENTS: Accent[] = [
  { code: "en-GB", label: "UK (England, Scotland, Wales, Northern Ireland)", spelling: "british" },
  { code: "en-IE", label: "Ireland", spelling: "british" },
  { code: "en-US", label: "United States", spelling: "american" },
  { code: "en-CA", label: "Canada", spelling: "american" },
  { code: "en-AU", label: "Australia", spelling: "british" },
  { code: "en-NZ", label: "New Zealand", spelling: "british" },
  { code: "en-IN", label: "India", spelling: "british" },
  { code: "en-PK", label: "Pakistan", spelling: "british" },
  { code: "en-NG", label: "Nigeria", spelling: "british" },
  { code: "en-GH", label: "Ghana", spelling: "british" },
  { code: "en-KE", label: "Kenya", spelling: "british" },
  { code: "en-TZ", label: "Tanzania", spelling: "british" },
  { code: "en-ZA", label: "South Africa", spelling: "british" },
  { code: "en-SG", label: "Singapore", spelling: "british" },
  { code: "en-PH", label: "Philippines", spelling: "american" },
];

export const AUTO = "auto";

/** The accent to use: the one chosen, or the first English variety the device lists (UK if it just says "English"). */
export function accentFor(setting: string | undefined, deviceLanguages: readonly string[] = []): Accent {
  const chosen = setting && setting !== AUTO ? ACCENTS.find((a) => a.code === setting) : undefined;
  if (chosen) return chosen;
  for (const lang of deviceLanguages) {
    const hit = ACCENTS.find((a) => a.code.toLowerCase() === lang.toLowerCase());
    if (hit) return hit;
  }
  return ACCENTS[0];
}

/**
 * A short hint for Whisper: it copies the style of the hint, so writing it in the right
 * spelling nudges "organised" or "organized", and the question gives it the words to expect.
 */
export function whisperHint(spelling: Spelling, question?: string): string {
  const style =
    spelling === "british"
      ? "A job interview answer in British English. I organised the rota, prioritised customers and apologised."
      : "A job interview answer in American English. I organized the schedule, prioritized customers and apologized.";
  return question ? `${style} Question: ${question.slice(0, 300)}` : style;
}
