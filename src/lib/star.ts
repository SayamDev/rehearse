/**
 * Finds the parts of a STAR answer (Situation, Task, Action, Result) in plain words.
 * Used by the built-in scorer and by the live checklist while someone answers, so the
 * checklist and the notes always agree.
 */

export type StarParts = { situation: boolean; task: boolean; action: boolean; result: boolean };

const SITUATION = /\b(when i|at my|while i|last (year|summer|month)|in my (last|previous|first|second)|during|there was a time|once)\b/i;
const TASK = /\b(my (job|role|task|goal|responsibility) was|i (had|needed) to|i was (asked|responsible)|the goal was)\b/i;
export const ACTION = /\b(i (decided|built|called|asked|created|wrote|organi[sz]ed|led|started|fixed|changed|made|spoke|talked|set up|checked|found|trained|helped|offered|explained|listened|suggested|planned|stayed|handled|contacted|emailed|apologi[sz]ed|arranged|sorted|took|gave|showed))\b/i;
export const RESULT = /\b(as a result|in the end|result(ed)?|so (the|we|she|he|they)|which (meant|led|helped)|afterwards|came back|increased|reduced|saved|improved|finished|thanked|thanks to|feedback|praised|promoted|on time|was happy|were happy|worked out|turned out|\d+ ?(%|percent|per cent))\b/i;

export function detectStar(text: string): StarParts {
  const lower = text.toLowerCase();
  return {
    situation: SITUATION.test(text),
    task: TASK.test(text),
    // A clear action counts even when it's phrased differently ("I rang", "I stayed late").
    action: ACTION.test(text) || (lower.match(/\bi (\w+ed|did|went|made|took|told|spoke|found|built|led|ran|gave|got|set|kept|brought|wrote|chose)\b/g) ?? []).length >= 2,
    result: RESULT.test(text),
  };
}

/** What each part means, and a nudge for the next one missing. */
export const STAR_STEPS: { key: keyof StarParts; label: string; next: string }[] = [
  { key: "situation", label: "Situation", next: "Say where you were and what was going on." },
  { key: "task", label: "Task", next: "Say what you needed to do." },
  { key: "action", label: "Action", next: "Say what you did yourself: “I…”" },
  { key: "result", label: "Result", next: "Say how it ended, with a number if you can." },
];
