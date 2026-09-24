"use client";

import { useSyncExternalStore } from "react";
import { levelFromXp, takeXp } from "./scoring";
import { MAX_POINTS, recallXp, scheduleAfterRecall } from "./memory";
import { earnedIds } from "./collection";
import { deleteRecordingsFor } from "./recordings";
import type { ConversationLine, KeyPoint, Mode, PersonaId, Profile, Question, SavedAnswer, Session, Seniority, Settings, Take } from "./types";

/**
 * Phase 1 keeps guest progress in this browser (localStorage).
 * Phase 2 moves it to Supabase when the visitor creates an account.
 */
const KEY = "rehearse:v1";

type State = { hydrated: boolean; sessions: Session[]; profile: Profile; bank: SavedAnswer[] };

const DEFAULT_PROFILE: Profile = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastPracticeDay: null,
  settings: { deliveryMetrics: true, defaultAnswerMode: "voice", readAloud: true, voiceEngine: "kokoro", voiceSpeed: 1, helpers: true, softMode: false, keepRecordings: false, largeText: false, plainWords: false },
  seen: [],
  askList: [],
  stats: { perfectRecalls: 0, coachChats: 0, breathing: 0 },
};

const SERVER_STATE: State = { hydrated: false, sessions: [], profile: DEFAULT_PROFILE, bank: [] };

let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      return {
        hydrated: true,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        bank: Array.isArray(parsed.bank) ? parsed.bank : [],
        profile: {
          ...DEFAULT_PROFILE,
          ...parsed.profile,
          settings: { ...DEFAULT_PROFILE.settings, ...parsed.profile?.settings },
          seen: Array.isArray(parsed.profile?.seen) ? parsed.profile.seen : [],
          askList: Array.isArray(parsed.profile?.askList) ? parsed.profile.askList : [],
          stats: { ...DEFAULT_PROFILE.stats, ...parsed.profile?.stats },
        },
      };
    }
  } catch {
    // Storage blocked or corrupted: start fresh in memory.
  }
  return { hydrated: true, sessions: [], profile: DEFAULT_PROFILE, bank: [] };
}

/** Current settings, for non-React code such as the voice player. */
export function getSettings(): Settings {
  return typeof window === "undefined" ? DEFAULT_PROFILE.settings : current().profile.settings;
}

function current(): State {
  state ??= load();
  return state;
}

function commit(patch: Partial<Omit<State, "hydrated">>) {
  const next = { ...current(), ...patch, hydrated: true };
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ sessions: next.sessions, profile: next.profile, bank: next.bank }));
  } catch {
    // Quota or private mode: progress lives for this tab only.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, current, () => SERVER_STATE);
}

export function useSession(id: string): { hydrated: boolean; session: Session | undefined } {
  const s = useStore();
  return { hydrated: s.hydrated, session: s.sessions.find((x) => x.id === id) };
}

/* ---------------- Mutations ---------------- */

export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Streak still counts if the last practice was today or yesterday. */
export function liveStreak(profile: Profile, today = localDay()): number {
  if (!profile.lastPracticeDay) return 0;
  return dayDiff(profile.lastPracticeDay, today) <= 1 ? profile.streak : 0;
}

/** Adds XP and counts today toward the streak. */
function practiced(p: Profile, xp: number, today = localDay()): Profile {
  let streak = p.streak;
  if (p.lastPracticeDay !== today) {
    streak = p.lastPracticeDay && dayDiff(p.lastPracticeDay, today) === 1 ? p.streak + 1 : 1;
  }
  return { ...p, xp: p.xp + xp, streak, bestStreak: Math.max(p.bestStreak, streak), lastPracticeDay: today };
}

export function createSession(input: {
  role: string;
  seniority: Seniority;
  jobDescription: string;
  questions: Question[];
  demo: boolean;
  mode?: Mode;
  persona?: PersonaId;
}): Session {
  const s = current();
  const session: Session = {
    id: crypto.randomUUID(),
    role: input.role,
    seniority: input.seniority,
    jobDescription: input.jobDescription,
    mode: input.mode ?? "quick",
    persona: input.persona,
    questions: input.questions.map((question) => ({ question, takes: [] })),
    createdAt: new Date().toISOString(),
    completedAt: null,
    demo: input.demo,
  };
  commit({ sessions: [session, ...s.sessions], profile: s.profile });
  return session;
}

export type AddTakeResult = { take: Take; previousBest: number | null; levelUp: boolean };

export function addTake(
  sessionId: string,
  questionIndex: number,
  input: Omit<Take, "id" | "number" | "xp" | "createdAt">,
): AddTakeResult {
  const s = current();
  const session = s.sessions.find((x) => x.id === sessionId);
  if (!session) throw new Error("Session not found");
  const sq = session.questions[questionIndex];
  const previousBest = sq.takes.length ? Math.max(...sq.takes.map((t) => t.overall)) : null;
  const take: Take = {
    ...input,
    id: crypto.randomUUID(),
    number: sq.takes.length + 1,
    xp: takeXp(input.overall, previousBest),
    createdAt: new Date().toISOString(),
  };
  const nextSession: Session = {
    ...session,
    questions: session.questions.map((q, i) => (i === questionIndex ? { ...q, takes: [...q.takes, take] } : q)),
  };

  const p = s.profile;
  const profile = practiced(p, take.xp);
  const levelUp = levelFromXp(profile.xp).level > levelFromXp(p.xp).level;

  commit({ sessions: s.sessions.map((x) => (x.id === sessionId ? nextSession : x)), profile });
  return { take, previousBest, levelUp };
}

export function completeSession(sessionId: string) {
  const s = current();
  commit({
    sessions: s.sessions.map((x) =>
      x.id === sessionId && !x.completedAt ? { ...x, completedAt: new Date().toISOString() } : x,
    ),
    profile: s.profile,
  });
}

/** Records how nervous the user felt before or after a round. */
export function setFeel(sessionId: string, when: "before" | "after", value: number) {
  const s = current();
  commit({
    sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, feel: { ...x.feel, [when]: value } } : x)),
    profile: s.profile,
  });
}

/** Saves the Live Interview conversation with its session. */
export function setConversation(sessionId: string, conversation: ConversationLine[]) {
  const s = current();
  commit({ sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, conversation } : x)), profile: s.profile });
}

/** Counts a finished breathing exercise. */
export function countBreathing() {
  const s = current();
  commit({ profile: { ...s.profile, stats: { ...s.profile.stats, breathing: s.profile.stats.breathing + 1 } } });
}

/**
 * Deletes practice sessions. XP stays, and any stickers they earned are kept, so
 * clearing history never takes rewards away. Their saved recordings are removed too.
 */
export function deleteSessions(sessionIds: string[]) {
  const s = current();
  const gone = new Set(sessionIds);
  const kept = earnedIds({ sessions: s.sessions, bank: s.bank, profile: s.profile });
  const takeIds = s.sessions.filter((x) => gone.has(x.id)).flatMap((x) => x.questions.flatMap((q) => q.takes.map((t) => t.id)));
  commit({
    sessions: s.sessions.filter((x) => !gone.has(x.id)),
    profile: { ...s.profile, keptStickers: [...kept] },
  });
  void deleteRecordingsFor(takeIds);
}

export function deleteSession(sessionId: string) {
  deleteSessions([sessionId]);
}

export function updateSettings(patch: Partial<Settings>) {
  const s = current();
  commit({ sessions: s.sessions, profile: { ...s.profile, settings: { ...s.profile.settings, ...patch } } });
}

export function resetAll() {
  commit({ sessions: [], profile: DEFAULT_PROFILE, bank: [] });
}

/* ---------------- Remember ---------------- */

export function saveAnswer(input: { role: string; question: Question; text: string; keyPoints: KeyPoint[] }): SavedAnswer {
  const s = current();
  const now = new Date().toISOString();
  const existing = s.bank.find((a) => a.question.text === input.question.text && a.role === input.role);
  const keyPoints = input.keyPoints.filter((k) => k.text.trim()).slice(0, MAX_POINTS);
  if (existing) {
    const updated: SavedAnswer = { ...existing, text: input.text, keyPoints, updatedAt: now };
    commit({ bank: s.bank.map((a) => (a.id === existing.id ? updated : a)) });
    return updated;
  }
  const saved: SavedAnswer = {
    id: crypto.randomUUID(),
    role: input.role,
    question: input.question,
    text: input.text,
    keyPoints,
    box: 1,
    due: localDay(),
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  commit({ bank: [saved, ...s.bank] });
  return saved;
}

export function updateAnswer(id: string, patch: Pick<SavedAnswer, "text" | "keyPoints">) {
  const s = current();
  commit({
    bank: s.bank.map((a) =>
      a.id === id
        ? { ...a, ...patch, keyPoints: patch.keyPoints.filter((k) => k.text.trim()).slice(0, MAX_POINTS), updatedAt: new Date().toISOString() }
        : a,
    ),
  });
}

export function deleteAnswer(id: string) {
  const s = current();
  commit({ bank: s.bank.filter((a) => a.id !== id) });
}

export type RecallResult = { xp: number; box: number; due: string; levelUp: boolean };

export function recordRecall(id: string, hit: number, total: number): RecallResult {
  const s = current();
  const answer = s.bank.find((a) => a.id === id);
  if (!answer) throw new Error("Saved answer not found");
  const today = localDay();
  const { box, due } = scheduleAfterRecall(answer, hit, total, today);
  const xp = recallXp(hit, total);
  const practicedProfile = practiced(s.profile, xp, today);
  const profile =
    total > 0 && hit === total
      ? { ...practicedProfile, stats: { ...practicedProfile.stats, perfectRecalls: practicedProfile.stats.perfectRecalls + 1 } }
      : practicedProfile;
  const levelUp = levelFromXp(profile.xp).level > levelFromXp(s.profile.xp).level;
  commit({
    profile,
    bank: s.bank.map((a) =>
      a.id === id ? { ...a, box, due, history: [...a.history, { date: today, hit, total }].slice(-30) } : a,
    ),
  });
  return { xp, box, due, levelUp };
}

/* ---------------- Collection ---------------- */

/** Stars or unstars a question to ask the interviewer. */
export function toggleAsk(question: string) {
  const s = current();
  const list = s.profile.askList;
  const askList = list.includes(question) ? list.filter((q) => q !== question) : [...list, question];
  commit({ profile: { ...s.profile, askList } });
}

export function markSeen(ids: string[]) {
  const s = current();
  const seen = new Set(s.profile.seen);
  ids.forEach((id) => seen.add(id));
  commit({ profile: { ...s.profile, seen: [...seen] } });
}

export function countCoachChat() {
  const s = current();
  commit({ profile: { ...s.profile, stats: { ...s.profile.stats, coachChats: s.profile.stats.coachChats + 1 } } });
}

/** Adds the interviewer's follow-up as a new question right after the one it follows. */
export function addFollowUp(sessionId: string, afterIndex: number, question: Question): number {
  const s = current();
  const session = s.sessions.find((x) => x.id === sessionId);
  if (!session) throw new Error("Session not found");
  const questions = [...session.questions];
  questions.splice(afterIndex + 1, 0, { question, takes: [] });
  commit({ sessions: s.sessions.map((x) => (x.id === sessionId ? { ...session, questions } : x)) });
  return afterIndex + 1;
}
