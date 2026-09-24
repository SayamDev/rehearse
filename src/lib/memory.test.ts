import { describe, expect, it } from "vitest";
import { addDays, describeDue, matchKeyPoints, nextBox, recallXp, scheduleAfterRecall, suggestKeyPoints } from "./memory";
import type { SavedAnswer } from "./types";
import { chooseTranscript } from "./transcribe";

let n = 0;
const id = () => `k${n++}`;

const ANSWER =
  "Last summer at my cafe job I misread a large office order of 24 drinks. My job was to have them ready by 9am. I decided to tell my manager straight away and I called the customer to explain. I remade the drinks in 15 minutes. As a result the order was only 10 minutes late and the customer kept ordering every week.";

describe("suggestKeyPoints", () => {
  it("picks short points in STAR order", () => {
    const points = suggestKeyPoints(ANSWER, id);
    expect(points.length).toBeGreaterThanOrEqual(3);
    expect(points.length).toBeLessThanOrEqual(4);
    expect(points[0].text).toMatch(/^Last summer/);
    expect(points.at(-1)!.text).toMatch(/result/i);
    for (const p of points) expect(p.text.split(" ").length).toBeLessThanOrEqual(13);
  });

  it("returns nothing for empty text", () => {
    expect(suggestKeyPoints("", id)).toEqual([]);
  });
});

describe("matchKeyPoints", () => {
  const points = [
    { id: "a", text: "Misread an office order of 24 drinks" },
    { id: "b", text: "Told my manager and called the customer" },
    { id: "c", text: "Customer kept ordering every week" },
  ];

  it("credits points recalled in different words and word endings", () => {
    const recall = "I misread an order for an office, 24 drinks. I told the manager and called them. We fixed it fast.";
    expect(matchKeyPoints(points, recall)).toEqual({ a: true, b: true, c: false });
  });

  it("credits a paraphrase that keeps the key words", () => {
    const p = [{ id: "d", text: "I sat with her, listened, and called her daughter" }];
    expect(matchKeyPoints(p, "I listened to her and phoned her daughter.")).toEqual({ d: true });
  });

  it("misses everything for an unrelated answer", () => {
    expect(Object.values(matchKeyPoints(points, "I like working in teams."))).toEqual([false, false, false]);
  });
});

describe("scheduling", () => {
  const base = { box: 2, due: "2026-09-24" } as SavedAnswer;

  it("moves up on a perfect recall, holds on half, resets below half", () => {
    expect(nextBox(2, 3, 3)).toBe(3);
    expect(nextBox(2, 2, 4)).toBe(2);
    expect(nextBox(4, 1, 4)).toBe(1);
    expect(nextBox(5, 3, 3)).toBe(5);
  });

  it("sets the next due date from the new box", () => {
    expect(scheduleAfterRecall(base, 3, 3, "2026-09-24")).toEqual({ box: 3, due: "2026-09-28" });
    expect(scheduleAfterRecall(base, 0, 3, "2026-09-24")).toEqual({ box: 1, due: "2026-09-25" });
  });

  it("handles month ends", () => {
    expect(addDays("2026-09-30", 2)).toBe("2026-10-02");
  });

  it("describes due dates", () => {
    expect(describeDue("2026-09-20", "2026-09-24")).toBe("Due today");
    expect(describeDue("2026-09-25", "2026-09-24")).toBe("Due tomorrow");
  });

  it("gives a bonus for a perfect recall", () => {
    expect(recallXp(2, 4)).toBe(9);
    expect(recallXp(3, 3)).toBe(16);
  });
});

describe("chooseTranscript", () => {
  it("prefers Whisper when it roughly agrees with the browser", () => {
    expect(chooseTranscript("I served 200 customers a day at Tesco.", "I served two hundred customers a day at tesco")).toBe(
      "I served 200 customers a day at Tesco.",
    );
  });
  it("ignores Whisper's stock phrase on silence", () => {
    expect(chooseTranscript("Thank you.", "")).toBe("");
  });
  it("falls back to the browser when Whisper drops or repeats a lot", () => {
    const browser = "I stayed calm and helped the customer find a replacement and she came back the next week";
    expect(chooseTranscript("I stayed calm.", browser)).toBe(browser);
  });
});
