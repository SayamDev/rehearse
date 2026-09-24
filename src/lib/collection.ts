import { levelFromXp } from "./scoring";
import { STICKER_THRESHOLD } from "./stickers";
import type { Competency, Profile, SavedAnswer, Session } from "./types";

export type Rarity = "common" | "rare" | "legendary";
export type Ink = "tomato" | "sky" | "lime" | "sun" | "grape" | "mint";
export type Shape = "burst" | "bubble" | "ticket" | "shield" | "bolt" | "blob" | "scallop" | "banner" | "star" | "pill";
export type Character = "mic" | "tie" | "case";

export type StickerArt =
  | { type: "word"; shape: Shape; ink: Ink; words: [string] | [string, string] }
  | { type: "character"; character: Character };

export type Collectible = {
  id: string;
  name: string;
  group: "skills" | "achievements" | "legendary";
  rarity: Rarity;
  /** How to earn it, in plain words. Always visible so people know what to aim for. */
  how: string;
  art: StickerArt;
};

type Ctx = { sessions: Session[]; bank: SavedAnswer[]; profile: Profile };

const SKILLS: Record<Competency, { name: string; shape: Shape; ink: Ink; words: [string] | [string, string] }> = {
  communication: { name: "Clear talker", shape: "bubble", ink: "sky", words: ["CLEAR", "TALKER"] },
  "problem-solving": { name: "Problem solver", shape: "scallop", ink: "lime", words: ["FIXED", "IT!"] },
  leadership: { name: "Takes the lead", shape: "banner", ink: "tomato", words: ["TAKES", "THE LEAD"] },
  teamwork: { name: "Team player", shape: "blob", ink: "sun", words: ["TEAM", "PLAYER"] },
  conflict: { name: "Cool head", shape: "shield", ink: "mint", words: ["COOL", "HEAD"] },
  ownership: { name: "Owns it", shape: "burst", ink: "tomato", words: ["OWNS", "IT"] },
  adaptability: { name: "Quick learner", shape: "bolt", ink: "grape", words: ["QUICK", "LEARNER"] },
  "role-knowledge": { name: "Knows the job", shape: "ticket", ink: "sky", words: ["KNOWS", "THE JOB"] },
  motivation: { name: "Driven", shape: "pill", ink: "tomato", words: ["DRIVEN"] },
};

export const COLLECTION: Collectible[] = [
  ...(Object.entries(SKILLS) as [Competency, (typeof SKILLS)[Competency]][]).map(([c, s]) => ({
    id: `skill:${c}`,
    name: s.name,
    group: "skills" as const,
    rarity: "common" as const,
    how: `Score ${STICKER_THRESHOLD} or more on ${/^[aeiou]/.test(c) ? "an" : "a"} ${c.replace("-", " ")} question.`,
    art: { type: "word" as const, shape: s.shape, ink: s.ink, words: s.words },
  })),
  { id: "a:first", name: "First take", group: "achievements", rarity: "common", how: "Answer your first question.", art: { type: "word", shape: "pill", ink: "lime", words: ["FIRST", "TAKE"] } },
  { id: "a:star", name: "Full STAR", group: "achievements", rarity: "common", how: "Give an answer with a situation, task, action and result.", art: { type: "word", shape: "star", ink: "sky", words: ["FULL", "STAR"] } },
  { id: "a:saved", name: "Memory lane", group: "achievements", rarity: "common", how: "Save an answer to Remember.", art: { type: "word", shape: "ticket", ink: "grape", words: ["MEMORY", "LANE"] } },
  { id: "a:daily", name: "Daily habit", group: "achievements", rarity: "common", how: "Finish a Daily Challenge.", art: { type: "word", shape: "scallop", ink: "sun", words: ["DAILY", "HABIT"] } },
  { id: "a:streak3", name: "On a roll", group: "achievements", rarity: "common", how: "Practise 3 days in a row.", art: { type: "word", shape: "blob", ink: "tomato", words: ["ON A", "ROLL"] } },
  { id: "a:comeback", name: "Comeback kid", group: "achievements", rarity: "rare", how: "Improve a retake by 2 points or more.", art: { type: "word", shape: "bolt", ink: "lime", words: ["COME", "BACK KID"] } },
  { id: "a:hattrick", name: "Hat trick", group: "achievements", rarity: "rare", how: "Score 7+ on every question in one round.", art: { type: "word", shape: "burst", ink: "grape", words: ["HAT", "TRICK"] } },
  { id: "a:recall", name: "Total recall", group: "achievements", rarity: "rare", how: "Hit every key point in a recall drill.", art: { type: "word", shape: "shield", ink: "sky", words: ["TOTAL", "RECALL"] } },
  { id: "a:speed", name: "Speed demon", group: "achievements", rarity: "rare", how: "Finish a Speed Round.", art: { type: "word", shape: "bolt", ink: "tomato", words: ["SPEED", "DEMON"] } },
  { id: "a:streak7", name: "Week warrior", group: "achievements", rarity: "rare", how: "Practise 7 days in a row.", art: { type: "word", shape: "banner", ink: "mint", words: ["WEEK", "WARRIOR"] } },
  { id: "a:mock", name: "Dress rehearsal", group: "achievements", rarity: "rare", how: "Finish a full Mock Interview.", art: { type: "word", shape: "ticket", ink: "sky", words: ["DRESS", "REHEARSAL"] } },
  { id: "a:intro", name: "Intro ready", group: "achievements", rarity: "common", how: "Build and save your \"Tell me about yourself\" answer.", art: { type: "word", shape: "bubble", ink: "sun", words: ["INTRO", "READY"] } },
  { id: "a:live", name: "On air", group: "achievements", rarity: "rare", how: "Finish a hands-free Live Interview.", art: { type: "word", shape: "burst", ink: "tomato", words: ["ON", "AIR"] } },
  { id: "a:calm", name: "Cool head", group: "achievements", rarity: "common", how: "Finish a breathing exercise in the Calm corner.", art: { type: "word", shape: "blob", ink: "mint", words: ["COOL", "HEAD"] } },
  { id: "a:coach", name: "Asked Cobi", group: "achievements", rarity: "common", how: "Ask Cobi, your interview coach, a question.", art: { type: "word", shape: "bubble", ink: "mint", words: ["ASKED", "COBI"] } },
  { id: "a:level5", name: "Rising star", group: "achievements", rarity: "rare", how: "Reach level 5.", art: { type: "word", shape: "star", ink: "grape", words: ["RISING", "STAR"] } },
  { id: "l:mic", name: "Golden mic", group: "legendary", rarity: "legendary", how: "Score 9 or more on any answer.", art: { type: "character", character: "mic" } },
  { id: "l:tie", name: "Boss tamer", group: "legendary", rarity: "legendary", how: "Beat the Tough Boss in a Boss Round.", art: { type: "character", character: "tie" } },
  { id: "l:case", name: "Full briefcase", group: "legendary", rarity: "legendary", how: "Collect all 9 skill stickers.", art: { type: "character", character: "case" } },
];

export const COLLECTION_BY_ID = Object.fromEntries(COLLECTION.map((c) => [c.id, c]));

function allTakes(sessions: Session[]) {
  return sessions.flatMap((s) => s.questions.flatMap((q) => q.takes.map((t) => ({ s, q, t }))));
}

/** A Boss Round is won with every question answered and an average best score of 7 or more. */
export function bossWon(session: Session): boolean {
  if (session.mode !== "boss" || !session.completedAt) return false;
  const bests = session.questions.map((q) => Math.max(0, ...q.takes.map((t) => t.overall)));
  return bests.every((b) => b > 0) && bests.reduce((a, b) => a + b, 0) / bests.length >= STICKER_THRESHOLD;
}

/** Every collectible id the player has earned, derived from saved progress. */
export function earnedIds({ sessions, bank, profile }: Ctx): Set<string> {
  const earned = new Set<string>(profile.keptStickers ?? []);
  const takes = allTakes(sessions).filter(({ t }) => t.grading.isGenuineAnswer);

  for (const { q, t } of takes) if (t.overall >= STICKER_THRESHOLD) earned.add(`skill:${q.question.competency}`);
  if (takes.length > 0) earned.add("a:first");
  if (takes.some(({ t }) => Object.values(t.grading.star).every(Boolean))) earned.add("a:star");
  if (bank.length > 0) earned.add("a:saved");
  if (sessions.some((s) => s.mode === "daily" && s.completedAt)) earned.add("a:daily");
  if (profile.bestStreak >= 3) earned.add("a:streak3");
  if (profile.bestStreak >= 7) earned.add("a:streak7");
  for (const s of sessions)
    for (const q of s.questions)
      for (let i = 1; i < q.takes.length; i++)
        if (q.takes[i].overall - Math.max(...q.takes.slice(0, i).map((t) => t.overall)) >= 2) earned.add("a:comeback");
  if (
    sessions.some(
      (s) => s.questions.length >= 3 && s.questions.every((q) => q.takes.some((t) => t.grading.isGenuineAnswer && t.overall >= STICKER_THRESHOLD)),
    )
  )
    earned.add("a:hattrick");
  if (profile.stats.perfectRecalls > 0) earned.add("a:recall");
  if (sessions.some((s) => s.mode === "speed" && s.completedAt)) earned.add("a:speed");
  if (sessions.some((s) => s.mode === "mock" && s.completedAt)) earned.add("a:mock");
  if (profile.stats.breathing > 0) earned.add("a:calm");
  if (sessions.some((s) => s.mode === "live" && s.completedAt)) earned.add("a:live");
  if (bank.some((a) => a.question.id === "mock-opener")) earned.add("a:intro");
  if (profile.stats.coachChats > 0) earned.add("a:coach");
  if (levelFromXp(profile.xp).level >= 5) earned.add("a:level5");
  if (takes.some(({ t }) => t.overall >= 9)) earned.add("l:mic");
  if (sessions.some(bossWon)) earned.add("l:tie");
  if (COLLECTION.filter((c) => c.group === "skills").every((c) => earned.has(c.id))) earned.add("l:case");
  return earned;
}
