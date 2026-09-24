import type { Mode, PersonaId } from "./types";

export type Persona = {
  id: PersonaId;
  name: string;
  role: string;
  /** Level needed to practise with this interviewer. */
  unlockLevel: number;
  greeting: string;
  /** How this interviewer introduces a follow-up. */
  followUpLead: string;
  /** Instruction for the AI question writer. */
  style: string;
  /** Browser-voice fallback settings. */
  voice: { rate: number; pitch: number };
  /** Groq Orpheus voice (human-sounding) used when available. */
  humanVoice: string;
};

export const PERSONAS: Record<PersonaId, Persona> = {
  friendly: {
    id: "friendly",
    name: "Sam",
    role: "Friendly recruiter",
    unlockLevel: 1,
    greeting: "Hi, I'm Sam. No pressure today. Take your time and answer in your own words.",
    followUpLead: "That's great. Can I ask a bit more?",
    style: "a warm, encouraging recruiter. Friendly, plain wording, and questions that help nervous candidates open up.",
    voice: { rate: 1.15, pitch: 1.05 },
    humanVoice: "hannah",
  },
  busy: {
    id: "busy",
    name: "Priya",
    role: "Busy manager",
    unlockLevel: 3,
    greeting: "Hi, I'm Priya. I've got a packed day, so let's keep answers focused.",
    followUpLead: "Okay. Quickly though:",
    style: "a busy hiring manager. Short, direct questions focused on results and getting the job done.",
    voice: { rate: 1.1, pitch: 1 },
    humanVoice: "diana",
  },
  tough: {
    id: "tough",
    name: "Mr. Grant",
    role: "Tough boss",
    unlockLevel: 5,
    greeting: "I'm Mr. Grant. I've heard every rehearsed answer there is. Convince me.",
    followUpLead: "Hmm. I'm not convinced yet.",
    style: "a tough, sceptical senior interviewer. Probing, challenging questions that test for specifics and real evidence. Always fair and never rude or discriminatory.",
    voice: { rate: 0.95, pitch: 0.9 },
    humanVoice: "troy",
  },
};

export type ModeInfo = {
  id: Mode;
  name: string;
  blurb: string;
  questions: number;
  /** Seconds per answer, or null for no limit. */
  timeLimit: number | null;
  unlockLevel: number;
  /** Interviewer fixed by the mode, if any. */
  persona?: PersonaId;
};

export const MODES: Record<Mode, ModeInfo> = {
  quick: { id: "quick", name: "Quick Round", blurb: "3 questions with notes and retakes.", questions: 3, timeLimit: null, unlockLevel: 1 },
  live: {
    id: "live",
    name: "Live Interview",
    blurb: "Hands-free, like a real call. Sam asks, listens, and talks back. Notes at the end.",
    // Questions written for the job; the opener and closer are added around them.
    questions: 3,
    timeLimit: null,
    unlockLevel: 1,
  },
  mock: {
    id: "mock",
    name: "Mock Interview",
    blurb: "The whole thing, start to finish: tell me about yourself, 4 questions, then your questions for them.",
    // Questions written for the job; the opener and closer are added around them.
    questions: 4,
    timeLimit: null,
    unlockLevel: 1,
  },
  daily: { id: "daily", name: "Daily Challenge", blurb: "One new question every day. Keep your streak going.", questions: 1, timeLimit: null, unlockLevel: 1 },
  speed: { id: "speed", name: "Speed Round", blurb: "5 questions, 60 seconds each. Think fast.", questions: 5, timeLimit: 60, unlockLevel: 2 },
  boss: {
    id: "boss",
    name: "Boss Round",
    blurb: "Face Mr. Grant. Average 7+ across 3 questions to win a legendary sticker.",
    questions: 3,
    timeLimit: null,
    unlockLevel: 5,
    persona: "tough",
  },
};

export const MODE_ORDER: Mode[] = ["quick", "live", "mock", "daily", "speed", "boss"];

/** Follow-ups: every interview mode except Speed gets one follow-up per question. */
export function allowsFollowUp(mode: Mode): boolean {
  // Live Interview asks its follow-ups out loud as part of the conversation.
  return mode !== "speed" && mode !== "live";
}
