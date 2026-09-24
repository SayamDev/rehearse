import { describe, expect, it } from "vitest";
import { countFillers, measureDelivery } from "./delivery";
import { demoGrade, demoQuestions } from "./ai/demo";
import {
  RUBRIC_WEIGHTS,
  deliveryScore,
  levelFromXp,
  overallScore,
  takeXp,
  xpForLevel,
} from "./scoring";
import type { Grading } from "./types";

function grading(score: number): Grading {
  const item = { score, why: "" };
  return {
    rubric: { relevance: item, structure: item, specificity: item, ownership: item, clarity: item, role_fit: item },
    star: { situation: true, task: true, action: true, result: true },
    strength: { quote: "", why: "" },
    fix: "",
    improvedAnswer: "",
    followUpQuestion: "",
    isGenuineAnswer: true,
  };
}

describe("scoring", () => {
  it("rubric weights sum to 1", () => {
    const sum = Object.values(RUBRIC_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("overall equals the rubric score when every item matches", () => {
    expect(overallScore(grading(7), null)).toBe(7);
  });

  it("delivery takes 10% for spoken answers", () => {
    expect(overallScore(grading(8), 4)).toBe(7.6);
  });

  it("clamps out-of-range rubric scores", () => {
    expect(overallScore(grading(14), null)).toBe(10);
    expect(overallScore(grading(-3), null)).toBe(1);
  });

  it("improving on a retake earns a bonus, repeating does not", () => {
    expect(takeXp(6, null)).toBe(22);
    expect(takeXp(6, 6)).toBe(22);
    expect(takeXp(7.5, 6)).toBe(25 + 18);
  });

  it("levels follow the XP curve", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(60);
    expect(levelFromXp(0)).toMatchObject({ level: 1, title: "Applicant" });
    expect(levelFromXp(59).level).toBe(1);
    expect(levelFromXp(60).level).toBe(2);
    expect(levelFromXp(xpForLevel(5)).title).toBe("Candidate");
    expect(levelFromXp(10_000_000).level).toBe(50);
  });
});

describe("delivery", () => {
  it("counts fillers but not 'like' used as a comparison", () => {
    const f = countFillers("Um, I like working with people, like, you know, it was like a family. Uh yes.");
    expect(f.um).toBe(1);
    expect(f.uh).toBe(1);
    expect(f["you know"]).toBe(1);
    expect(f.like).toBe(1);
  });

  it("measures pace", () => {
    const words = Array.from({ length: 140 }, () => "word").join(" ");
    const m = measureDelivery(words, 60);
    expect(m.wpm).toBe(140);
    expect(deliveryScore(m)).toBe(10);
  });

  it("penalises very fast speech and heavy fillers", () => {
    const fast = measureDelivery(Array.from({ length: 220 }, () => "word").join(" "), 60);
    expect(deliveryScore(fast)).toBeLessThan(10);
    const filler = measureDelivery(Array.from({ length: 50 }, (_, i) => (i % 5 === 0 ? "um" : "word")).join(" "), 22);
    expect(deliveryScore(filler)).toBeLessThan(8);
  });
});

describe("demo mode", () => {
  const base = { role: "Barista", seniority: "entry" as const, jobDescription: "", count: 3, exclude: [], plain: false, language: "en" };

  it("fills a 5-question Speed Round with distinct questions", () => {
    const qs = demoQuestions({ ...base, count: 5 });
    expect(qs).toHaveLength(5);
    expect(new Set(qs.map((q) => q.text)).size).toBe(5);
  });

  it("returns distinct questions", () => {
    const qs = demoQuestions(base);
    expect(qs).toHaveLength(3);
    expect(new Set(qs.map((q) => q.text)).size).toBe(3);
  });

  it("scores a STAR answer higher than a vague one", () => {
    const question = { id: "q", text: "Tell me about a time you dealt with a difficult customer.", category: "behavioral" as const, competency: "conflict" as const, difficulty: 2, lookingFor: "" };
    const vague = demoGrade({ ...base, question, answer: "I am good with customers and I always stay calm with them.", mode: "type" });
    const star = demoGrade({
      ...base,
      question,
      answer:
        "Last summer at my cafe job, a customer was angry because her order took 20 minutes. My job was to keep the queue moving and keep her happy. I apologised, I decided to remake her drink first, and I offered a free pastry. As a result she calmed down, came back the next week, and my manager added the idea to our training.",
      mode: "type",
    });
    const avg = (g: typeof vague) => Object.values(g.rubric).reduce((a, r) => a + r.score, 0) / 6;
    expect(avg(star)).toBeGreaterThan(avg(vague));
    expect(star.star).toEqual({ situation: true, task: true, action: true, result: true });
  });

  it("caps hypothetical answers to 'tell me about a time' and asks for a real example", () => {
    const question = { id: "q", text: "Tell me about a time you dealt with a difficult customer.", category: "behavioral" as const, competency: "conflict" as const, difficulty: 2, lookingFor: "A real example, what you did, and how it turned out." };
    const g = demoGrade({
      ...base,
      question,
      answer: "I would stay calm and I would listen to the customer. Then I would try to help them and I would tell my manager if I could not fix it. I think communication is very important in this job.",
      mode: "type",
    });
    expect(g.rubric.relevance.score).toBeLessThanOrEqual(4);
    expect(g.fix).toMatch(/real example/);
    expect(g.criteria.length).toBeGreaterThanOrEqual(2);
    expect(g.criteria.every((c) => !c.met)).toBe(true);
  });

  it("flags claims without evidence", () => {
    const question = { id: "q", text: "What is your greatest strength?", category: "motivation" as const, competency: "motivation" as const, difficulty: 1, lookingFor: "One real strength with a specific example that proves it." };
    const g = demoGrade({ ...base, question, answer: "I am a hard worker and a people person and I am very passionate about everything I do in life.", mode: "type" });
    expect(g.rubric.specificity.score).toBeLessThanOrEqual(4);
    expect(g.fix).toMatch(/proof/);
  });

  it("flags non-answers", () => {
    const question = { id: "q", text: "Why this job?", category: "motivation" as const, competency: "motivation" as const, difficulty: 1, lookingFor: "" };
    expect(demoGrade({ ...base, question, answer: "asdf", mode: "type" }).is_genuine_answer).toBe(false);
  });
});
