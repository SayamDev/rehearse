export const SENIORITIES = ["entry", "mid", "senior", "lead"] as const;
export type Seniority = (typeof SENIORITIES)[number];

export const CATEGORIES = [
  "behavioral",
  "situational",
  "role",
  "motivation",
  "curveball",
  "closing",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const COMPETENCIES = [
  "communication",
  "problem-solving",
  "leadership",
  "teamwork",
  "conflict",
  "ownership",
  "adaptability",
  "role-knowledge",
  "motivation",
] as const;
export type Competency = (typeof COMPETENCIES)[number];

export type Question = {
  id: string;
  text: string;
  category: Category;
  competency: Competency;
  difficulty: number;
  lookingFor: string;
  /** Set when this question is an interviewer's follow-up to the one before it. */
  followUpOf?: string;
};

export const RUBRIC_KEYS = [
  "relevance",
  "structure",
  "specificity",
  "ownership",
  "clarity",
  "role_fit",
] as const;
export type RubricKey = (typeof RUBRIC_KEYS)[number];

export type RubricItem = { score: number; why: string };

export type Grading = {
  rubric: Record<RubricKey, RubricItem>;
  star: { situation: boolean; task: boolean; action: boolean; result: boolean };
  strength: { quote: string; why: string };
  fix: string;
  improvedAnswer: string;
  followUpQuestion: string;
  isGenuineAnswer: boolean;
  /** What the interviewer was looking for, point by point. Missing on older takes. */
  criteria?: { point: string; met: boolean }[];
};

export type DeliveryMetrics = {
  durationSec: number;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillers: Record<string, number>;
};

export type AnswerMode = "voice" | "type";

/** "ai": scored by Groq (or donated Claude credits). "rules": built-in rule-based notes. */
export type NotesSource = "ai" | "rules";
export type FallbackReason = "not-configured" | "limit" | "error" | null;

export type Take = {
  id: string;
  number: number;
  mode: AnswerMode;
  transcript: string;
  delivery: DeliveryMetrics | null;
  grading: Grading;
  deliveryScore: number | null;
  overall: number;
  /** Missing on takes saved before sources were tracked; treat as "rules". */
  source?: NotesSource;
  sourceReason?: FallbackReason;
  xp: number;
  createdAt: string;
};

export type SessionQuestion = {
  question: Question;
  takes: Take[];
};

export type Session = {
  id: string;
  role: string;
  seniority: Seniority;
  jobDescription: string;
  mode: Mode;
  /** The interviewer character running this round. Older sessions have none. */
  persona?: PersonaId;
  questions: SessionQuestion[];
  createdAt: string;
  completedAt: string | null;
  /** True when the questions came from the built-in bank rather than AI. */
  demo: boolean;
  /** How the user felt before and after the round, 0 (very nervous) to 4 (calm and ready). */
  feel?: { before?: number; after?: number };
  /** Live Interview: everything said, in order. */
  conversation?: ConversationLine[];
};

export type ConversationLine = { who: "interviewer" | "you"; text: string };

export type Settings = {
  deliveryMetrics: boolean;
  defaultAnswerMode: AnswerMode;
  /** Interviewers read each question aloud. */
  readAloud: boolean;
  /** "kokoro" (default): Sam's on-device voice first, then Groq, then the device voice. "standard": skip the download. */
  voiceEngine: "standard" | "kokoro";
  /** Multiplies every interviewer's speaking pace (1 = normal). */
  voiceSpeed: number;
  /** Show the "Stuck?" helpers while answering. */
  helpers: boolean;
  /** Hide scores during a round and show them only on the summary. */
  softMode: boolean;
  /** Keep recordings of spoken answers on this device so the best ones can be replayed. */
  keepRecordings: boolean;
  /** Larger text across the app. */
  largeText: boolean;
  /** Ask the AI for simpler words in questions and notes. */
  plainWords: boolean;
};

export type Profile = {
  xp: number;
  streak: number;
  bestStreak: number;
  lastPracticeDay: string | null;
  settings: Settings;
  /** Collectible ids already celebrated, so each unlock is celebrated once. */
  seen: string[];
  /** Questions the user has starred to ask their interviewer. */
  askList: string[];
  stats: { perfectRecalls: number; coachChats: number; breathing: number };
  /** Stickers earned in sessions that were later deleted, so clearing history never takes them away. */
  keptStickers?: string[];
};

export const MODES = ["quick", "speed", "daily", "boss", "mock", "live"] as const;
export type Mode = (typeof MODES)[number];

export const PERSONAS = ["friendly", "busy", "tough"] as const;
export type PersonaId = (typeof PERSONAS)[number];

/* ---------------- Remember (answer memory) ---------------- */

export type KeyPoint = { id: string; text: string };

export type RecallAttempt = { date: string; hit: number; total: number };

export type SavedAnswer = {
  id: string;
  role: string;
  question: Question;
  /** The answer the user chose and edited, in their own words. */
  text: string;
  keyPoints: KeyPoint[];
  /** Spaced review: box 1 (new or shaky) to 5 (solid). */
  box: number;
  /** Local day (YYYY-MM-DD) this answer is next due for recall. */
  due: string;
  history: RecallAttempt[];
  createdAt: string;
  updatedAt: string;
};
