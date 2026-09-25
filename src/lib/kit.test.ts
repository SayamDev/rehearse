import { describe, expect, it } from "vitest";
import { coverage, cueLine, shortCue, findNumbers, gapFor, gapMatches, kitCards, numberMatches, orderMarks, shuffled, storyFromAnswer, suggestTypes, type Story } from "./kit";
import type { SavedAnswer } from "./types";

const story = (over: Partial<Story> = {}): Story => ({
  id: "s1",
  title: "Busy Saturday",
  summary: "Queue out the door. I trained 2 new starters on the till. Queue time halved.",
  types: ["teamwork", "leadership"],
  createdAt: "2026-09-25T00:00:00Z",
  ...over,
});

describe("story bank", () => {
  it("suggests question types from a story's words", () => {
    expect(suggestTypes("I trained the new starters and we worked together as a team")).toEqual(expect.arrayContaining(["teamwork", "leadership"]));
    expect(suggestTypes("A customer complained and was upset")).toContain("conflict");
  });

  it("shows which kinds of question have no story yet", () => {
    const map = coverage([story()]);
    expect(map.find((c) => c.type.id === "teamwork")?.stories).toHaveLength(1);
    expect(map.find((c) => c.type.id === "conflict")?.stories).toHaveLength(0);
  });

  it("turns a saved answer into a story", () => {
    const answer = {
      id: "a",
      role: "Barista",
      question: { id: "q", text: "Tell me about a time you worked under pressure.", category: "behavioral", competency: "adaptability", difficulty: 2, lookingFor: "" },
      text: "",
      keyPoints: [
        { id: "k1", text: "Saturday rush with two people off sick" },
        { id: "k2", text: "I took the till and called orders out" },
      ],
      box: 1,
      due: "2026-09-25",
      history: [],
      createdAt: "",
      updatedAt: "",
    } as SavedAnswer;
    const s = storyFromAnswer(answer, () => "x");
    expect(s.title).toBe("Saturday rush with two");
    expect(s.types[0]).toBe("adaptability");
    expect(s.summary).toContain("I took the till");
  });
});

describe("pocket cards", () => {
  it("never ends a short cue on a little word", () => {
    expect(shortCue("Customer upset about a wrong order", 4)).toBe("Customer upset");
  });

  it("makes a short arrow line from key points", () => {
    expect(cueLine([{ text: "Busy Saturday with a queue out the door." }, { text: "Trained 2 new starters..." }])).toBe("Busy Saturday with a queue → Trained 2 new starters");
  });
});

describe("fill the gap", () => {
  it("blanks the most telling word, preferring numbers", () => {
    expect(gapFor("Trained 2 new starters on the till")).toEqual({ before: "Trained ", answer: "2", after: " new starters on the till" });
    expect(gapFor("Customers complained about waiting.")).toEqual({ before: "Customers ", answer: "complained", after: " about waiting." });
    expect(gapFor("it was ok")).toBeNull();
  });

  it("forgives case, endings and a small typo", () => {
    expect(gapMatches("customer", "Customers")).toBe(true);
    expect(gapMatches("complaned", "complained")).toBe(true);
    expect(gapMatches("manager", "customers")).toBe(false);
    expect(gapMatches("", "till")).toBe(false);
  });
});

describe("put in order", () => {
  it("never returns the original order, and marks what's in place", () => {
    const items = ["a", "b", "c"];
    for (let i = 0; i < 20; i++) expect(shuffled(items)).not.toEqual(items);
    const points = items.map((id) => ({ id, text: id }));
    expect(orderMarks(points, ["a", "c", "b"])).toEqual({ a: true, b: false, c: false });
  });
});

describe("numbers", () => {
  it("treats different ways of writing a number as the same", () => {
    expect(numberMatches("2000", "£2,000")).toBe(true);
    expect(numberMatches("2k", "£2,000")).toBe(true);
    expect(numberMatches("50 percent", "50%")).toBe(true);
    expect(numberMatches("5", "15")).toBe(false);
  });

  it("finds numbers in answers, skipping years and ones already saved", () => {
    const found = findNumbers(["In 2023 I trained 5 new starters and raised £2,000 for charity."], [{ id: "n", value: "5", label: "" }]);
    expect(found).toEqual([{ value: "£2,000", label: "for charity" }]);
  });
});

describe("quiz my kit", () => {
  it("makes cards from stories, company, questions to ask and numbers", () => {
    const cards = kitCards({
      stories: [story()],
      company: { name: "Tesco", facts: ["Biggest UK grocer", "", ""], why: "I shop there and like the team" },
      numbers: [{ id: "1", value: "5", label: "new starters I trained" }],
      askList: ["What does a good first month look like?"],
    });
    expect(cards.map((c) => c.id)).toEqual(["story:teamwork", "story:leadership", "company:facts", "company:why", "company:ask", "number:1"]);
    expect(cards[2].prompt).toBe("What do you know about Tesco?");
  });
});
