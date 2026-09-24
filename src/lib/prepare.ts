import type { Question } from "./types";

/**
 * Content for getting ready: the mock interview's fixed opening and closing
 * questions, the "Tell me about yourself" builder, and questions to ask them.
 */

export const OPENER: Question = {
  id: "mock-opener",
  text: "To start, tell me a bit about yourself.",
  category: "motivation",
  competency: "communication",
  difficulty: 2,
  lookingFor:
    "A short, confident summary in about a minute: who you are now, what you've done that fits this job, and why you want it. Not your life story.",
};

export const CLOSER: Question = {
  id: "mock-closer",
  text: "That's everything from me. Do you have any questions for me?",
  category: "closing",
  competency: "motivation",
  difficulty: 1,
  lookingFor:
    "One or two real questions about the job, the team, or what happens next. It shows you're interested and thinking ahead. Saying \"No, I think you've covered everything\" misses the chance.",
};

export function isMockBookend(q: Question): boolean {
  return q.id === OPENER.id || q.id === CLOSER.id;
}

/* ---------------- "Tell me about yourself" builder ---------------- */

export type IntroPart = {
  id: "now" | "before" | "next";
  title: string;
  prompt: string;
  tip: string;
  starters: string[];
};

export const INTRO_PARTS: IntroPart[] = [
  {
    id: "now",
    title: "Who you are now",
    prompt: "One or two sentences about where you are today.",
    tip: "Your current job, studies, or what you've been doing lately. Keep it short.",
    starters: ["I'm currently ", "I've just finished ", "Right now I'm ", "For the last year I've been "],
  },
  {
    id: "before",
    title: "What you've done that fits",
    prompt: "A skill or two that matter for this job, with one quick example.",
    tip: "Pick the things this job needs most. Work, school, volunteering, and family all count.",
    starters: ["I'm good at ", "In my last job I ", "At school I ", "When I volunteered at "],
  },
  {
    id: "next",
    title: "Why this job",
    prompt: "Why you want this job, and what you'd bring.",
    tip: "Say something specific about the job or the place. End on a confident note.",
    starters: ["I'm applying for this role because ", "I'd love to ", "What excites me about this job is ", "I think I'd bring "],
  },
];

export type IntroDraft = Record<IntroPart["id"], string>;

export function introText(d: IntroDraft): string {
  return INTRO_PARTS.map((p) => d[p.id].trim())
    .filter(Boolean)
    .map((t) => (/[.!?]$/.test(t) ? t : `${t}.`))
    .join(" ");
}

/** Speaking pace used to estimate how long the intro takes to say. */
export const SPEAKING_WPM = 140;

/* ---------------- Questions to ask them ---------------- */

export type AskGroup = { id: string; title: string; questions: string[] };

export const ASK_GROUPS: AskGroup[] = [
  {
    id: "job",
    title: "About the job",
    questions: [
      "What does a typical day or week look like in this role?",
      "What would you like the new person to achieve in the first few months?",
      "What's the most challenging part of this job?",
      "What do the best people in this role do well?",
    ],
  },
  {
    id: "team",
    title: "About the team",
    questions: [
      "Who would I be working with most closely?",
      "How does the team help new starters settle in?",
      "What do you enjoy most about working here?",
    ],
  },
  {
    id: "grow",
    title: "Learning and growing",
    questions: [
      "What training or support is there when I start?",
      "Are there chances to learn new skills or move up over time?",
      "How will I know if I'm doing well?",
    ],
  },
  {
    id: "practical",
    title: "Hours, pay and next steps",
    questions: [
      "Could you tell me about the hours and the pay for this role?",
      "What are the next steps after today, and when might I hear back?",
      "Is there anything about my experience you'd like me to explain more?",
    ],
  },
];

export const ASK_TIPS = [
  "Pick one or two. You don't need a long list.",
  "Hours and pay are fair to ask. If they haven't come up, ask near the end.",
  "Skip questions a quick look at their website would answer, like \"What do you do?\"",
  "Asking about next steps shows you're keen, and tells you when to follow up.",
];

/* ---------------- Answer builder (STAR) ---------------- */

export type StarPart = { id: "situation" | "task" | "action" | "result"; title: string; prompt: string; tip: string; starters: string[] };

export const STAR_PARTS: StarPart[] = [
  {
    id: "situation",
    title: "What happened",
    prompt: "Where were you, and what was going on? One or two sentences.",
    tip: "Just enough to set the scene. School, home, volunteering and hobbies all count.",
    starters: ["At my last job, ", "Last summer, ", "At college, ", "When I was volunteering at "],
  },
  {
    id: "task",
    title: "Your job in it",
    prompt: "What did you need to do, or what was the problem you had to solve?",
    tip: "Make it clear this was yours to sort out.",
    starters: ["I had to ", "My job was to ", "The problem was ", "I was asked to "],
  },
  {
    id: "action",
    title: "What you did",
    prompt: "The steps you took, in order. This is the most important part.",
    tip: "Say “I”, not only “we”. Two or three clear steps beat a long list.",
    starters: ["First I ", "I decided to ", "So I ", "Then I "],
  },
  {
    id: "result",
    title: "How it turned out",
    prompt: "What changed because of what you did? Add a number if you can.",
    tip: "End on the result, and what you learned if there's time.",
    starters: ["In the end, ", "As a result, ", "Because of that, ", "I learned "],
  },
];

export type StarDraft = Record<StarPart["id"], string>;

export function starText(d: StarDraft): string {
  return STAR_PARTS.map((p) => d[p.id].trim())
    .filter(Boolean)
    .map((t) => (/[.!?]$/.test(t) ? t : `${t}.`))
    .join(" ");
}

/** Common "tell me about a time" questions for the answer builder. */
export const STAR_QUESTIONS = [
  "Tell me about a time you solved a problem.",
  "Tell me about a time you worked well in a team.",
  "Tell me about a time you dealt with a difficult customer or person.",
  "Tell me about a time you made a mistake and what you did about it.",
  "Tell me about a time you had to learn something new quickly.",
  "Tell me about a time you went above and beyond.",
  "Tell me about a time you managed lots of tasks at once.",
  "Tell me about a time you disagreed with someone.",
  "Tell me about a time you took the lead.",
  "Tell me about a time you worked under pressure.",
];
