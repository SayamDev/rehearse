import { describe, expect, it } from "vitest";
import { AdvertRequest, advertUserPrompt, ruleAdvert } from "./advert";

const ADVERT = `Barista - Costa Coffee, Manchester
We're looking for a friendly barista to join our busy team. You'll serve customers with a smile, keep the store clean and follow food safety rules.
You'll need to stay calm under pressure during the morning rush and work well with your team. No experience needed, full training given.`;

describe("likely questions from a job advert", () => {
  it("finds questions the advert points to, without AI, with the words that show why", () => {
    const out = ruleAdvert(AdvertRequest.parse({ advert: ADVERT }));
    expect(out.role).toBe("Barista");
    expect(out.questions.length).toBeGreaterThanOrEqual(4);
    expect(out.questions[0].likely).toBe("very likely");
    expect(out.questions.some((q) => q.competency === "teamwork" && q.why.includes("team"))).toBe(true);
    expect(out.questions.some((q) => q.category === "motivation")).toBe(true);
    expect(new Set(out.questions.map((q) => q.text)).size).toBe(out.questions.length);
  });

  it("keeps the advert inside tags so its text can't give the AI orders", () => {
    const prompt = advertUserPrompt(AdvertRequest.parse({ advert: ADVERT, role: "Barista" }));
    expect(prompt).toContain("<job_advert>");
    expect(prompt).toContain("Job they're applying for: Barista");
  });

  it("needs enough of the advert to work with", () => {
    expect(AdvertRequest.safeParse({ advert: "Barista wanted" }).success).toBe(false);
  });
});
