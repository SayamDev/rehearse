import { describe, expect, it } from "vitest";
import { detectStar } from "./star";
import { pickOneQuestion } from "./offline";
import { guessQuestion, guideReply, practiceFromReply } from "./ai/coach";

describe("live STAR checklist", () => {
  it("lights up each part as it's said", () => {
    expect(detectStar("")).toEqual({ situation: false, task: false, action: false, result: false });
    expect(detectStar("At my last job the shop was packed.")).toMatchObject({ situation: true, action: false });
    const all = detectStar("At my weekend job I had to cover the till. I trained two new starters. In the end the queue halved.");
    expect(all).toEqual({ situation: true, task: true, action: true, result: true });
  });
});

describe("just one question", () => {
  it("picks for the last job practised, avoiding recent questions", () => {
    const first = pickOneQuestion([], () => 0);
    expect(first.role).toBe("Any job");
    expect(first.question.text.length).toBeGreaterThan(10);
    const session = { role: "Barista", seniority: "entry", questions: [{ question: first.question, takes: [] }] } as never;
    const next = pickOneQuestion([session], () => 0);
    expect(next.role).toBe("Barista");
    expect(next.question.category).not.toBe("motivation");
  });
});

describe("Cobi builds a round", () => {
  it("pulls practice questions out of a reply", () => {
    const { text, questions } = practiceFromReply(
      "Good idea! Try these:\n\nPractice question: Tell me about a time you helped a customer.\n- **Practice question:** “What would you do if a colleague was late?”\nGood luck!",
    );
    expect(questions).toEqual(["Tell me about a time you helped a customer.", "What would you do if a colleague was late?"]);
    expect(text).toBe("Good idea! Try these:\n\nGood luck!");
  });

  it("guesses the kind of question", () => {
    expect(guessQuestion("Tell me about a time you worked in a team.")).toMatchObject({ category: "behavioral", competency: "teamwork" });
    expect(guessQuestion("What would you do if a customer complained?").category).toBe("situational");
    expect(guessQuestion("Why do you want this job?").category).toBe("motivation");
  });

  it("offers questions even without AI", () => {
    const reply = guideReply("Can you give me some questions to practise?", "Barista");
    expect(practiceFromReply(reply).questions).toHaveLength(3);
    expect(reply).toContain("for Barista");
  });
});
