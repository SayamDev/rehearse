import { describe, expect, it } from "vitest";
import { ruleReaction, tidyReaction, type ReactRequest } from "./react";
import { fallbackProbe } from "../live";

const base: ReactRequest = {
  role: "Cashier",
  persona: "friendly",
  question: "Tell me about a time you helped a customer.",
  answer: "A customer's order was wrong, so I said sorry and fixed it for her straight away at the till.",
  canProbe: true,
  closing: false,
  plain: false,
};

describe("Live Interview reactions", () => {
  it("swaps a reply that is really a question for a plain acknowledgement", () => {
    const out = tidyReaction({ reply: "What happened next?", probe: "What happened next?" }, base);
    expect(out.reply.endsWith("?")).toBe(false);
  });

  it("drops a follow-up when probing isn't allowed or on the closing question", () => {
    expect(tidyReaction({ reply: "That shows real care.", probe: "How did it end?" }, { ...base, canProbe: false }).probe).toBe("");
    expect(tidyReaction({ reply: "Good questions.", probe: "Anything else?" }, { ...base, closing: true }).probe).toBe("");
  });

  it("drops a follow-up that repeats the reply", () => {
    const out = tidyReaction({ reply: "How did it turn out for the customer in the end, I wonder.", probe: "How did it turn out for the customer?" }, base);
    expect(out.probe).toBe("");
  });

  it("keeps the interview going without AI", () => {
    expect(ruleReaction(base).reply.length).toBeGreaterThan(5);
    expect(ruleReaction({ ...base, answer: "um" }).probe).toBe("");
    expect(ruleReaction({ ...base, closing: true }).probe).toBe("");
  });

  it("asks for the missing result, but not when the answer already has one", () => {
    expect(fallbackProbe(base.answer)).toMatch(/turn out/);
    expect(fallbackProbe(`${base.answer} In the end she came back every week.`)).toBe("");
    expect(fallbackProbe("I helped.")).toMatch(/more/);
  });
});
