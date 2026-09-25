import { contentWords } from "./memory";
import type { Competency, KeyPoint, SavedAnswer } from "./types";

/**
 * The interview kit: the handful of things worth knowing by heart. A few stories that
 * answer most questions, facts about the company, and the numbers you'll quote.
 * Everything here runs on the device, with no AI and no cost.
 */

export type Story = {
  id: string;
  /** A short name to remember it by, like "Busy Saturday". */
  title: string;
  /** What happened, what you did, how it ended. A line or three. */
  summary: string;
  /** The kinds of question it answers. */
  types: Competency[];
  createdAt: string;
};

export type CompanyCard = { name: string; facts: string[]; why: string };

export type NumberFact = { id: string; value: string; label: string };

export const MAX_STORIES = 8;
export const MAX_NUMBERS = 8;
export const COMPANY_FACTS = 3;

/** The kinds of question a story can answer, in plain words, with the question people hear. */
export const STORY_TYPES: { id: Competency; label: string; asks: string; words: RegExp }[] = [
  { id: "teamwork", label: "Working in a team", asks: "Tell me about a time you worked well in a team.", words: /\b(team|together|colleague|helped|shift|group|we)\b/i },
  { id: "conflict", label: "A disagreement", asks: "Tell me about a time you disagreed with someone.", words: /\b(disagree|argu|conflict|complain|upset|angry|rude|difficult|tension)/i },
  { id: "problem-solving", label: "Solving a problem", asks: "Tell me about a problem you solved.", words: /\b(problem|fix|broke|issue|solv|sorted|figured|idea|improv)/i },
  { id: "leadership", label: "Taking the lead", asks: "Tell me about a time you took the lead.", words: /\b(led|lead|organi[sz]|trained|showed|in charge|captain|mentor|new starters?)\b/i },
  { id: "communication", label: "Explaining clearly", asks: "Tell me about a time you had to explain something.", words: /\b(explain|told|present|wrote|spoke|talk|listen|message|call)/i },
  { id: "ownership", label: "A mistake you owned", asks: "Tell me about a mistake you made.", words: /\b(mistake|wrong|forgot|missed|late|sorry|apologi[sz]|learn)/i },
  { id: "adaptability", label: "Change or pressure", asks: "Tell me about a time you worked under pressure.", words: /\b(pressure|busy|rush|deadline|last minute|changed?|new|quick|stress)/i },
  { id: "role-knowledge", label: "Doing the job well", asks: "Tell me about a time you gave great service.", words: /\b(customer|client|service|patient|quality|safety|accurate|care)/i },
  { id: "motivation", label: "What drives you", asks: "What makes you want this job?", words: /\b(proud|love|enjoy|want|goal|volunteer|passion|care about)/i },
];

export function storyTypeLabel(id: Competency): string {
  return STORY_TYPES.find((t) => t.id === id)?.label ?? id;
}

/** Suggests which kinds of question a story answers, from its words. The user can change them. */
export function suggestTypes(text: string): Competency[] {
  return STORY_TYPES.filter((t) => t.words.test(text))
    .map((t) => t.id)
    .slice(0, 3);
}

/** For each kind of question, the stories that answer it (empty when there's a gap). */
export function coverage(stories: Story[]): { type: (typeof STORY_TYPES)[number]; stories: Story[] }[] {
  return STORY_TYPES.map((type) => ({ type, stories: stories.filter((s) => s.types.includes(type.id)) }));
}

/** A new story from a saved answer: its key points become the summary. */
export function storyFromAnswer(answer: SavedAnswer, makeId = () => crypto.randomUUID()): Story {
  const summary = answer.keyPoints.length ? answer.keyPoints.map((k) => k.text).join(". ") : answer.text.slice(0, 280);
  const title = shortCue(answer.keyPoints[0]?.text ?? answer.question.text, 4);
  const types = [...new Set<Competency>([answer.question.competency, ...suggestTypes(summary)])].slice(0, 3);
  return { id: makeId(), title, summary, types, createdAt: new Date().toISOString() };
}

/* ---------------- Pocket cards ---------------- */

/** The first few words of a line, without trailing punctuation or "..." */
const DANGLING = new Set("a an the and or but so to of in on at for with from by about as my our your their his her its was were is i".split(" "));

export function shortCue(text: string, words = 5): string {
  const clean = text.replace(/\.\.\.$/, "").replace(/[.,;:!?]+$/, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length <= words) return clean;
  const cut = parts.slice(0, words);
  // Don't end on a little word ("Customer upset about a").
  while (cut.length > 2 && DANGLING.has(cut[cut.length - 1].toLowerCase())) cut.pop();
  return cut.join(" ").replace(/[,;:]$/, "");
}

/** One glanceable line: each key point cut to a few words, joined by arrows. */
export function cueLine(points: { text: string }[], words = 5): string {
  return points
    .map((p) => shortCue(p.text, words))
    .filter(Boolean)
    .join(" → ");
}

/** A story's summary as a cue line, split on sentences. */
export function storyCue(story: Story): string {
  return cueLine(story.summary.split(/(?<=[.!?])\s+|\n+/).map((text) => ({ text })));
}

/* ---------------- Recall modes ---------------- */

export type RecallMode = "mix" | "say" | "gap" | "order";
export const RECALL_MODES: { value: RecallMode; label: string; how: string }[] = [
  { value: "mix", label: "Mix it up", how: "A different way each time. Best for remembering." },
  { value: "say", label: "Say it back", how: "Answer from memory and see which key points you hit." },
  { value: "gap", label: "Fill the gap", how: "One word is missing from each key point." },
  { value: "order", label: "Put in order", how: "Your key points are shuffled. Put them back." },
];

/* ---------------- Fill the gap ---------------- */

export type Gap = { before: string; answer: string; after: string };

/**
 * Blanks out the most telling word in a key point: the longest word that isn't a
 * filler word. Null when there's nothing worth blanking.
 */
export function gapFor(point: string): Gap | null {
  const tokens = point.split(/(\s+)/);
  let best = -1;
  let bestLen = 0;
  tokens.forEach((t, i) => {
    const word = t.replace(/[^\p{L}\p{N}'-]/gu, "");
    // Numbers are the most useful thing to recall, so they win.
    const number = /\d/.test(word);
    if (!number && (word.length < 4 || contentWords(word).length === 0)) return;
    const weight = number ? 100 : word.length;
    if (weight > bestLen) {
      best = i;
      bestLen = weight;
    }
  });
  if (best < 0) return null;
  const token = tokens[best];
  const m = token.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u)!;
  return {
    before: tokens.slice(0, best).join("") + m[1],
    answer: m[2],
    after: m[3] + tokens.slice(best + 1).join(""),
  };
}

function edits(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Forgiving check for a filled gap: ignores case and endings, and allows a small typo in longer words. */
export function gapMatches(guess: string, answer: string): boolean {
  const g = guess.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const a = answer.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  if (!g) return false;
  if (g === a) return true;
  if (/\d/.test(a)) return digits(g) === digits(a);
  const [gs] = contentWords(g);
  const [as] = contentWords(a);
  if (gs && as && gs === as) return true;
  return a.length >= 5 && edits(g, a) <= 1;
}

/* ---------------- Put in order ---------------- */

/** A shuffled copy that is never the original order (when there's more than one). */
export function shuffled<T>(items: T[], random = Math.random): T[] {
  if (items.length < 2) return [...items];
  for (let tries = 0; tries < 10; tries++) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (copy.some((x, i) => x !== items[i])) return copy;
  }
  return [...items.slice(1), items[0]];
}

/** Which points are in the right place. */
export function orderMarks(points: KeyPoint[], order: string[]): Record<string, boolean> {
  return Object.fromEntries(points.map((p, i) => [p.id, order[i] === p.id]));
}

/* ---------------- Numbers ---------------- */

function digits(s: string): string {
  return s.replace(/[^0-9.]/g, "").replace(/\.$/, "");
}

/** "£2,000", "2000" and "2k" all count as the same number. */
export function numberMatches(guess: string, value: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\s,£$€]/g, "")
      .replace(/(\d+(?:\.\d+)?)k\b/, (_, n) => String(Math.round(Number(n) * 1000)))
      .replace(/percent/, "%");
  const g = norm(guess);
  const v = norm(value);
  if (!g) return false;
  return g === v || (digits(g) !== "" && digits(g) === digits(v));
}

const YEAR = /^(19|20)\d{2}$/;

/**
 * Finds numbers worth remembering in saved answers and stories, with the few words
 * after each one as its label: "5 new starters", "£2,000 for charity". Years are skipped.
 */
export function findNumbers(texts: string[], known: NumberFact[] = []): { value: string; label: string }[] {
  const seen = new Set(known.map((n) => n.value.toLowerCase()));
  const found: { value: string; label: string }[] = [];
  for (const text of texts) {
    const re = /(£|\$|€)?\d[\d,.]*(k|%)?/gi;
    for (const m of text.matchAll(re)) {
      const value = m[0].replace(/[.,]$/, "");
      if (YEAR.test(value) || seen.has(value.toLowerCase())) continue;
      const after = text
        .slice((m.index ?? 0) + m[0].length)
        .split(/[.;!?\n]/)[0]
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join(" ")
        .replace(/[,:]$/, "");
      if (!after) continue;
      seen.add(value.toLowerCase());
      found.push({ value, label: after });
      if (found.length >= 6) return found;
    }
  }
  return found;
}

/* ---------------- Quiz my kit ---------------- */

export type KitCard =
  | { id: string; kind: "story"; prompt: string; hint: string; answer: string[] }
  | { id: string; kind: "company"; prompt: string; hint: string; answer: string[] }
  | { id: string; kind: "number"; prompt: string; hint: string; answer: string[]; value: string };

/** Flashcards from the kit: which story fits a question, company facts, questions to ask, and numbers to type. */
export function kitCards(kit: { stories: Story[]; company?: CompanyCard | null; numbers: NumberFact[]; askList: string[] }): KitCard[] {
  const cards: KitCard[] = [];
  for (const { type, stories } of coverage(kit.stories)) {
    if (!stories.length) continue;
    cards.push({ id: `story:${type.id}`, kind: "story", prompt: type.asks, hint: "Which of your stories would you tell?", answer: stories.map((s) => `${s.title}: ${storyCue(s)}`) });
  }
  const c = kit.company;
  const facts = c?.facts.filter((f) => f.trim()) ?? [];
  if (c?.name.trim() && facts.length) {
    cards.push({ id: "company:facts", kind: "company", prompt: `What do you know about ${c.name.trim()}?`, hint: `Say ${facts.length} ${facts.length === 1 ? "thing" : "things"}.`, answer: facts });
  }
  if (c?.why.trim()) {
    cards.push({ id: "company:why", kind: "company", prompt: `Why do you want to work${c.name.trim() ? ` at ${c.name.trim()}` : " here"}?`, hint: "Say it the way you would in the room.", answer: [c.why.trim()] });
  }
  if (kit.askList.length) {
    cards.push({ id: "company:ask", kind: "company", prompt: "Do you have any questions for us?", hint: `You planned ${Math.min(2, kit.askList.length)}.`, answer: kit.askList.slice(0, 2) });
  }
  for (const n of kit.numbers) {
    if (!n.value.trim() || !n.label.trim()) continue;
    cards.push({ id: `number:${n.id}`, kind: "number", prompt: n.label.trim(), hint: "Type the number.", answer: [`${n.value.trim()} ${n.label.trim()}`], value: n.value.trim() });
  }
  return cards;
}
