import { describe, expect, it } from "vitest";
import { COLLECTION, bossWon, earnedIds } from "./collection";
import { dailyQuestion } from "./daily";
import { guideReply } from "./ai/coach";
import { MODES, PERSONAS, allowsFollowUp } from "./game";
import type { Grading, Profile, Session, Take } from "./types";

const profile: Profile = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastPracticeDay: null,
  settings: { deliveryMetrics: true, defaultAnswerMode: "type", readAloud: true, voiceEngine: "standard", voiceSpeed: 1, helpers: true, softMode: false, keepRecordings: false, largeText: false, plainWords: false, language: "en" },
  seen: [],
  askList: [],
  stats: { perfectRecalls: 0, coachChats: 0, breathing: 0 },
};

function grading(allStar = false): Grading {
  const item = { score: 7, why: "" };
  return {
    rubric: { relevance: item, structure: item, specificity: item, ownership: item, clarity: item, role_fit: item },
    star: { situation: true, task: allStar, action: true, result: true },
    strength: { quote: "", why: "" },
    fix: "",
    improvedAnswer: "",
    followUpQuestion: "What next?",
    isGenuineAnswer: true,
  };
}

function take(overall: number, n = 1, allStar = false): Take {
  return { id: `t${overall}-${n}`, number: n, mode: "type", transcript: "x", delivery: null, grading: grading(allStar), deliveryScore: null, overall, xp: 10, createdAt: "" };
}

function session(mode: Session["mode"], scores: number[][], completed = true): Session {
  return {
    id: mode,
    role: "Barista",
    seniority: "entry",
    jobDescription: "",
    mode,
    questions: scores.map((takes, i) => ({
      question: { id: `q${i}`, text: "Q", category: "behavioral", competency: i === 0 ? "teamwork" : "ownership", difficulty: 2, lookingFor: "" },
      takes: takes.map((s, j) => take(s, j + 1)),
    })),
    createdAt: "",
    completedAt: completed ? "x" : null,
    demo: true,
  };
}

describe("collection", () => {
  it("has unique ids and a how-to-earn line for every sticker", () => {
    expect(new Set(COLLECTION.map((c) => c.id)).size).toBe(COLLECTION.length);
    for (const c of COLLECTION) expect(c.how.length).toBeGreaterThan(5);
  });

  it("awards first take, skill stickers, comeback and hat trick", () => {
    const earned = earnedIds({ sessions: [session("quick", [[5, 7.5], [8], [7]])], bank: [], profile });
    expect(earned.has("a:first")).toBe(true);
    expect(earned.has("skill:teamwork")).toBe(true);
    expect(earned.has("skill:ownership")).toBe(true);
    expect(earned.has("a:comeback")).toBe(true);
    expect(earned.has("a:hattrick")).toBe(true);
    expect(earned.has("l:mic")).toBe(false);
  });

  it("awards the golden mic for a 9", () => {
    expect(earnedIds({ sessions: [session("quick", [[9.1]])], bank: [], profile }).has("l:mic")).toBe(true);
  });

  it("awards mode and streak achievements", () => {
    const earned = earnedIds({
      sessions: [session("daily", [[6]]), session("speed", [[5], [5], [5], [5], [5]])],
      bank: [],
      profile: { ...profile, bestStreak: 7, stats: { perfectRecalls: 1, coachChats: 2, breathing: 1 } },
    });
    for (const id of ["a:daily", "a:speed", "a:streak3", "a:streak7", "a:recall", "a:coach", "a:calm"]) expect(earned.has(id)).toBe(true);
  });

  it("wins a boss round only with an average of 7+ and every question answered", () => {
    expect(bossWon(session("boss", [[7], [8], [7]]))).toBe(true);
    expect(bossWon(session("boss", [[9], [9], []]))).toBe(false);
    expect(bossWon(session("boss", [[6], [6], [7]]))).toBe(false);
    expect(bossWon(session("quick", [[9], [9], [9]]))).toBe(false);
  });
});

describe("game setup", () => {
  it("unlocks harder things at higher levels", () => {
    expect(MODES.quick.unlockLevel).toBe(1);
    expect(MODES.speed.unlockLevel).toBeGreaterThan(1);
    expect(MODES.boss.persona).toBe("tough");
    expect(PERSONAS.tough.unlockLevel).toBeGreaterThan(PERSONAS.busy.unlockLevel);
    expect(allowsFollowUp("speed")).toBe(false);
    expect(allowsFollowUp("boss")).toBe(true);
  });

  it("gives everyone the same daily question on a given day, and changes it the next day", () => {
    expect(dailyQuestion("2026-09-24")).toEqual(dailyQuestion("2026-09-24"));
    expect(dailyQuestion("2026-09-24").text).not.toBe(dailyQuestion("2026-09-25").text);
  });
});

describe("coach guide", () => {
  it("answers common topics without AI", () => {
    expect(guideReply("How do I answer tell me about yourself?")).toMatch(/^Tell me about yourself/);
    expect(guideReply("im so nervous")).toMatch(/^Feeling nervous/);
    expect(guideReply("what's the weather")).toMatch(/I can help with things like/);
  });
});

describe("clearing history", () => {
  it("keeps stickers earned in sessions that were deleted", () => {
    const earned = earnedIds({ sessions: [], bank: [], profile: { ...profile, keptStickers: ["a:first", "l:mic"] } });
    expect(earned.has("a:first")).toBe(true);
    expect(earned.has("l:mic")).toBe(true);
  });
});
