import { describe, expect, it } from "vitest";
import { PACKS, packForRole } from "./packs";
import { countdownLabel, daysUntil, interviewIcs, planFor } from "./countdown";
import { scoreGain, scoreHistory, skillAverages, weakestSkill } from "./skills";
import { LANGUAGES, languageInstruction } from "./languages";
import { offlineGrading, offlineQuestions } from "./offline";
import { demoQuestions } from "./ai/demo";
import { questionUserPrompt, gradeUserPrompt } from "./ai/prompts";
import type { Grading, RubricKey, Session } from "./types";

function grading(scores: Partial<Record<RubricKey, number>> = {}): Grading {
  const item = (k: RubricKey) => ({ score: scores[k] ?? 7, why: "" });
  return {
    rubric: { relevance: item("relevance"), structure: item("structure"), specificity: item("specificity"), ownership: item("ownership"), clarity: item("clarity"), role_fit: item("role_fit") },
    star: { situation: true, task: true, action: true, result: true },
    strength: { quote: "", why: "" },
    fix: "",
    improvedAnswer: "",
    followUpQuestion: "",
    isGenuineAnswer: true,
  };
}

function round(day: number, overall: number, spec = 7): Session {
  const at = `2026-09-${String(day).padStart(2, "0")}T10:00:00.000Z`;
  return {
    id: `s${day}`,
    role: "Barista",
    seniority: "entry",
    jobDescription: "",
    mode: "quick",
    questions: [
      {
        question: { id: `q${day}`, text: "Q", category: "behavioral", competency: "teamwork", difficulty: 2, lookingFor: "" },
        takes: [{ id: `t${day}`, number: 1, mode: "type", transcript: "x", delivery: null, grading: grading({ specificity: spec }), deliveryScore: null, overall, xp: 10, createdAt: at }],
      },
    ],
    createdAt: at,
    completedAt: at,
    demo: true,
  };
}

describe("question packs", () => {
  it("has unique ids and six questions with guidance each", () => {
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(PACKS.length);
    for (const p of PACKS) {
      expect(p.questions).toHaveLength(6);
      for (const q of p.questions) expect(q.looking_for.length).toBeGreaterThan(10);
    }
  });

  it("matches job titles to the right pack", () => {
    expect(packForRole("Care assistant")?.id).toBe("care");
    expect(packForRole("Barista")?.id).toBe("hospitality");
    expect(packForRole("CEO")?.id).toBe("leadership");
    expect(packForRole("Content creator")?.id).toBe("creative");
    expect(packForRole("Forklift driver")?.id).toBe("warehouse");
    expect(packForRole("Astronaut")).toBeUndefined();
  });

  it("gives the built-in bank questions for the job", () => {
    const qs = demoQuestions({ role: "Nursing assistant", seniority: "entry", jobDescription: "", count: 3, exclude: [], plain: false, language: "en" });
    const care = new Set(PACKS.find((p) => p.id === "care")!.questions.map((q) => q.text));
    expect(qs.some((q) => care.has(q.text))).toBe(true);
  });
});

describe("offline", () => {
  it("writes questions and notes without the network", () => {
    const qs = offlineQuestions("Retail assistant", "entry", 3);
    expect(qs).toHaveLength(3);
    const notes = offlineGrading({ role: "Retail assistant", seniority: "entry", question: qs[0], answer: "At my weekend job I helped a customer find a gift and she came back the next week.", mode: "type" });
    expect(notes.rubric.relevance.score).toBeGreaterThanOrEqual(1);
    expect(notes.fix.length).toBeGreaterThan(0);
  });
});

describe("interview countdown", () => {
  const now = new Date(2026, 8, 24, 9, 0);

  it("counts calendar days and hours", () => {
    expect(daysUntil("2026-09-29T10:00", now)).toBe(5);
    expect(countdownLabel("2026-09-29T10:00", now)).toBe("In 5 days");
    expect(countdownLabel("2026-09-25T10:00", now)).toBe("Tomorrow");
    expect(countdownLabel("2026-09-24T11:00", now)).toBe("In 2 hours");
    expect(countdownLabel("2026-09-24T09:30", now)).toBe("In 30 minutes");
    expect(daysUntil("2026-09-20T10:00", now)).toBeLessThan(0);
  });

  it("changes the plan as the day gets closer", () => {
    expect(planFor(10, "/p").steps[0].href).toBe("/p");
    expect(planFor(4, "/p").steps[0].href).toBe("/practice/new?mode=mock");
    expect(planFor(0, "/p").steps[0].href).toBe("/practice/warmup");
  });

  it("makes a calendar file with two reminders", () => {
    const ics = interviewIcs({ role: "Chef, head", when: "2026-10-02T14:30", where: "" }, "https://x/prepare", now);
    expect(ics).toContain("DTSTART:20261002T143000");
    expect(ics).toContain("SUMMARY:Interview: Chef\\, head");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
    expect(ics).not.toContain("LOCATION");
  });
});

describe("progress", () => {
  it("draws scores oldest first and measures the gain", () => {
    const sessions = [round(5, 7), round(1, 4), round(2, 5), round(3, 6), round(4, 7)];
    const points = scoreHistory(sessions);
    expect(points.map((p) => p.score)).toEqual([4, 5, 6, 7, 7]);
    expect(scoreGain(points)).toBe(2.5);
    expect(scoreGain(points.slice(0, 3))).toBeNull();
  });

  it("finds the weakest skill after three answers", () => {
    const two = [round(1, 5, 3), round(2, 5, 3)];
    expect(weakestSkill(skillAverages(two))).toBeNull();
    const three = [...two, round(3, 6, 4)];
    const weakest = weakestSkill(skillAverages(three));
    expect(weakest?.key).toBe("specificity");
    expect(weakest?.score).toBe(3.3);
  });
});

describe("languages", () => {
  it("has an opener and closer for every language but English", () => {
    for (const l of LANGUAGES.filter((x) => x.code !== "en")) {
      expect(l.opener.length).toBeGreaterThan(5);
      expect(l.closer.length).toBeGreaterThan(5);
    }
  });

  it("asks the AI to write in the chosen language, and adds nothing for English", () => {
    expect(languageInstruction("en", "x")).toBe("");
    const q = questionUserPrompt({ role: "Nurse", seniority: "entry", jobDescription: "", count: 3, exclude: [], plain: false, language: "es", focus: "structure" });
    expect(q).toContain("Spanish (Español)");
    expect(q).toContain("STAR");
    const g = gradeUserPrompt({
      role: "Nurse",
      seniority: "entry",
      jobDescription: "",
      question: { id: "q", text: "Tell me about a time", category: "behavioral", competency: "teamwork", difficulty: 2, lookingFor: "x" },
      answer: "Hola",
      mode: "type",
      plain: false,
      language: "ar",
    });
    expect(g).toContain("Arabic");
    expect(g).toContain("copied exactly");
  });
});
