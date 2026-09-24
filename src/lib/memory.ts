import type { KeyPoint, SavedAnswer } from "./types";

/** Days until the next review for each box. */
export const BOX_INTERVALS = [1, 2, 4, 7, 14] as const;
export const MAX_BOX = BOX_INTERVALS.length;
export const MIN_POINTS = 1;
export const MAX_POINTS = 5;

const STOPWORDS = new Set(
  "a an the and or but so to of in on at for with from by as is was were be been being am are it its this that these those i me my we our you your he she they them their his her there then than too very just also really about into out up down over after before when while because if would could should will can did do does had has have not no yes".split(
    " ",
  ),
);

function stem(word: string): string {
  let w = word;
  for (const suffix of ["ing", "ed", "es", "ly", "s"]) {
    if (w.length > suffix.length + 3 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  return w.slice(0, 6);
}

export function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .map(stem);
}

/**
 * A key point counts as remembered when at least 40% of its meaningful words
 * (rounded up) appear in the recall, allowing for word endings. People
 * paraphrase when speaking, so this leans generous; the user can correct any
 * result on screen.
 */
export function matchKeyPoints(points: KeyPoint[], recall: string): Record<string, boolean> {
  const said = new Set(contentWords(recall));
  const result: Record<string, boolean> = {};
  for (const p of points) {
    const words = [...new Set(contentWords(p.text))];
    if (words.length === 0) {
      result[p.id] = false;
      continue;
    }
    const hits = words.filter((w) => said.has(w)).length;
    result[p.id] = hits >= Math.ceil(words.length * 0.4);
  }
  return result;
}

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 3);
}

function shorten(sentence: string, maxWords = 12): string {
  const cleaned = sentence.replace(/^(so|and|then|but|also|well)[, ]+/i, "").replace(/[.!?]+$/, "");
  const words = cleaned.split(" ");
  const short = words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}...` : cleaned;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

const TASK = /\b(my (job|role|task|goal|responsibility) was|i (had|needed) to|i was (asked|responsible)|the goal was)\b/i;
const ACTION = /\bi (decided|built|called|asked|created|wrote|organi[sz]ed|led|started|fixed|changed|made|spoke|talked|set up|checked|found|sat|listened|told|remade|explained|offered|helped)\b/i;
const RESULT = /\b(as a result|in the end|result(ed)?|which (meant|led)|afterwards|came back|increased|reduced|saved|improved|finished|since then)\b/i;

/**
 * Suggests up to four short key points from a saved answer, in STAR order
 * where it can find them. The user edits these before saving.
 */
export function suggestKeyPoints(text: string, makeId: () => string = () => crypto.randomUUID()): KeyPoint[] {
  const all = sentences(text);
  if (all.length === 0) return [];
  const picked: string[] = [];
  const take = (s: string | undefined) => {
    if (s && !picked.includes(s)) picked.push(s);
  };
  // Priority: situation, result, task, first action. A second action only if there is room.
  const actions = all.filter((s) => ACTION.test(s));
  take(all[0]);
  take(all.find((s) => RESULT.test(s)));
  take(all.find((s) => TASK.test(s)));
  take(actions[0]);
  if (picked.length < 4) take(actions[1]);
  for (const s of all) if (picked.length < 3) take(s);
  const ordered = all.filter((s) => picked.includes(s)).slice(0, 4);
  return ordered.map((s) => ({ id: makeId(), text: shorten(s) }));
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** New box after a recall: all points moves up, half or more holds, less drops to 1. */
export function nextBox(box: number, hit: number, total: number): number {
  if (total === 0) return box;
  const ratio = hit / total;
  if (ratio === 1) return Math.min(MAX_BOX, box + 1);
  if (ratio >= 0.5) return box;
  return 1;
}

export function scheduleAfterRecall(answer: SavedAnswer, hit: number, total: number, today: string): Pick<SavedAnswer, "box" | "due"> {
  const box = nextBox(answer.box, hit, total);
  return { box, due: addDays(today, BOX_INTERVALS[box - 1]) };
}

export function isDue(answer: SavedAnswer, today: string): boolean {
  return answer.due <= today;
}

export function recallXp(hit: number, total: number): number {
  return 5 + hit * 2 + (total > 0 && hit === total ? 5 : 0);
}

export function describeDue(due: string, today: string): string {
  if (due <= today) return "Due today";
  const tomorrow = addDays(today, 1);
  if (due === tomorrow) return "Due tomorrow";
  const [y, m, d] = due.split("-").map(Number);
  return `Due ${new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}
