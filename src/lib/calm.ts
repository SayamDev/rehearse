/**
 * Calm tools for people who get nervous or panicky in interviews.
 * All built in: no AI, no cost, works offline.
 */

export type Phase = { label: string; seconds: number; /** Circle size at the end of this phase, 0 to 1. */ to: number };
export type Pattern = { id: string; name: string; blurb: string; phases: Phase[] };

export const PATTERNS: Pattern[] = [
  {
    id: "long-exhale",
    name: "Long breath out",
    blurb: "In for 4, out for 6. The longer breath out tells your body it's safe. Best when you feel panicky.",
    phases: [
      { label: "Breathe in", seconds: 4, to: 1 },
      { label: "Breathe out", seconds: 6, to: 0 },
    ],
  },
  {
    id: "box",
    name: "Box breathing",
    blurb: "In, hold, out, hold, 4 counts each. Steadies you when your thoughts are racing.",
    phases: [
      { label: "Breathe in", seconds: 4, to: 1 },
      { label: "Hold", seconds: 4, to: 1 },
      { label: "Breathe out", seconds: 4, to: 0 },
      { label: "Hold", seconds: 4, to: 0 },
    ],
  },
];

/** 5-4-3-2-1 grounding: brings attention back to the room. */
export const GROUNDING = [
  { count: 5, sense: "things you can see" },
  { count: 4, sense: "things you can feel, like your feet on the floor" },
  { count: 3, sense: "things you can hear" },
  { count: 2, sense: "things you can smell" },
  { count: 1, sense: "slow breath, all the way out" },
];

/** Honest things to say when your mind goes blank. Interviewers hear these all the time. */
export const BLANK_LINES = [
  "Sorry, my mind has gone blank. Can I have a moment to think?",
  "Could you say the question again, please?",
  "Can I come back to that one at the end?",
  "I'm a bit nervous, because this job really matters to me.",
];

/** Ways to see nerves differently. */
export const REFRAMES = [
  { title: "Nerves mean you care", body: "Your heart racing is the same feeling as excitement. Try telling yourself \"I'm excited\" instead of \"I'm nervous\"." },
  { title: "They want you to do well", body: "Interviewers are hoping you're the right person. They're not trying to catch you out." },
  { title: "Pauses feel longer to you", body: "A few seconds of thinking looks calm and thoughtful from the other side of the table." },
  { title: "It's a conversation", body: "You're finding out if the job suits you too. You're allowed to ask questions and take your time." },
];

/** Things that lower stress on the day. */
export const DAY_CHECKLIST = [
  "Know how to get there, and plan to arrive 10 minutes early",
  "Clothes ready the night before",
  "Bring a copy of your CV and any documents they asked for",
  "Read your saved answers in Remember once, not over and over",
  "Eat something and bring water",
  "Do one round of breathing before you go in",
];

/** Before and after each round: how nervous do you feel? */
export const FEELINGS = ["Very nervous", "A bit nervous", "Okay", "Fairly calm", "Calm and ready"] as const;

/** Easy, everyday questions for the warm-up round. Nothing is scored. */
export const WARMUPS = [
  "What did you do last weekend?",
  "What's your favourite way to spend a day off?",
  "Tell me about a place you like to go.",
  "What's something you've learned recently, big or small?",
  "What kind of music or shows do you enjoy?",
  "Describe your ideal lunch.",
  "What's a small thing that made you smile this week?",
  "If you could learn any skill, what would it be?",
];

/** Friendly notes after a warm-up answer, by how much was said. */
export function warmupNote(words: number, seconds: number, spoken: boolean): string {
  const s = Math.max(1, Math.round(seconds));
  const time = s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} sec` : `${s} ${s === 1 ? "second" : "seconds"}`;
  if (words < 12) return "Good start. Next time, try adding one more detail, like who you were with or why you liked it.";
  if (!spoken) return words < 40 ? `Nice, ${words} words. That's the easy part done.` : `Great, ${words} words. You're warmed up and writing easily.`;
  if (words < 40) return `Nice. You talked for about ${time}. That's how it feels to warm up your voice.`;
  return `Great, ${words} words in about ${time}. You're warmed up and talking easily.`;
}
