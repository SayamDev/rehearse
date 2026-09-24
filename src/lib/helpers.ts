import type { Category } from "./types";

/**
 * "Stuck?" helpers shown while answering. Built in, so they work offline and
 * cost nothing. Each question type gets its own answer shape and starter lines.
 */

export type Step = { label: string; tip: string; starter: string };

export type HelpKit = {
  /** What kind of answer this is, in plain words. */
  kind: string;
  steps: Step[];
};

const STAR: Step[] = [
  { label: "Where", tip: "Set the scene in one or two sentences.", starter: "One time when I was " },
  { label: "Goal", tip: "What needed to happen, and why it mattered.", starter: "I needed to " },
  { label: "What I did", tip: "The biggest part. Say \"I\", not \"we\".", starter: "So I decided to " },
  { label: "Result", tip: "How it ended, with a number if you can.", starter: "In the end, " },
];

const KITS: Record<Category, HelpKit> = {
  behavioral: { kind: "a real story from your past", steps: STAR },
  situational: {
    kind: "what you would do, step by step",
    steps: [
      { label: "First", tip: "Show you understand the problem.", starter: "First, I'd make sure I understood " },
      { label: "Then", tip: "Your main action, and who you'd involve.", starter: "Then I would " },
      { label: "Why", tip: "Explain your reasoning briefly.", starter: "I'd do it that way because " },
      { label: "Proof", tip: "Back it up with a time you did something similar.", starter: "I did something similar when " },
    ],
  },
  role: {
    kind: "what you know and can do for this job",
    steps: [
      { label: "Skill", tip: "Name the skill or knowledge.", starter: "I'm confident with " },
      { label: "Example", tip: "Where you used it.", starter: "For example, when I " },
      { label: "Result", tip: "What happened because of it.", starter: "That meant " },
      { label: "Here", tip: "How it helps in this job.", starter: "In this role, that would help me " },
    ],
  },
  motivation: {
    kind: "why you want this, honestly",
    steps: [
      { label: "Spark", tip: "What first drew you to this work.", starter: "I first got interested when " },
      { label: "Fit", tip: "Something specific about this job or place.", starter: "What I like about this role is " },
      { label: "Bring", tip: "What you'd add.", starter: "I think I'd bring " },
      { label: "Future", tip: "Where you want to grow.", starter: "Over the next year, I want to " },
    ],
  },
  curveball: {
    kind: "a calm, honest answer to an odd question",
    steps: [
      { label: "Pause", tip: "It's fine to take a moment first.", starter: "That's a good question. Let me think. " },
      { label: "Answer", tip: "Give a clear, simple answer.", starter: "I'd say " },
      { label: "Because", tip: "One reason or example.", starter: "because " },
      { label: "Link", tip: "Tie it back to the job if you can.", starter: "That's useful at work because " },
    ],
  },
  closing: {
    kind: "a short, confident wrap-up",
    steps: [
      { label: "Thanks", tip: "Thank them for their time.", starter: "Thank you for talking with me today. " },
      { label: "Question", tip: "Ask one real question about the job or team.", starter: "Could you tell me more about " },
      { label: "Interest", tip: "Say you want the job.", starter: "I'm really keen on this role because " },
    ],
  },
};

export function helpKit(category: Category): HelpKit {
  return KITS[category] ?? KITS.behavioral;
}

/** Places people forget they can take examples from, especially without much work history. */
export const IDEA_SPARKS = [
  "A part-time or weekend job",
  "School, college, or a group project",
  "Volunteering or helping at a place of worship",
  "Sports, a club, or a team",
  "Caring for family or a younger sibling",
  "Something you taught yourself",
];

/** Honest lines that buy a few seconds of thinking time. */
export const BUY_TIME = [
  "That's a good question. Can I take a moment to think?",
  "Let me think of the best example.",
  "Could you say the question again, please?",
];

/**
 * While recording, a quiet moment gets a gentle nudge toward the next part of the
 * answer, judged by how much has been said so far.
 */
export function nextStep(category: Category, wordsSoFar: number): Step {
  const { steps } = helpKit(category);
  const at = wordsSoFar < 15 ? 0 : wordsSoFar < 45 ? 1 : wordsSoFar < 110 ? 2 : steps.length - 1;
  return steps[Math.min(at, steps.length - 1)];
}
