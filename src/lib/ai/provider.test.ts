import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { grade, questions } from "./provider";

const req = {
  role: "Barista",
  seniority: "entry" as const,
  jobDescription: "",
  question: {
    id: "q",
    text: "Tell me about a time you dealt with a difficult customer.",
    category: "behavioral" as const,
    competency: "conflict" as const,
    difficulty: 2,
    lookingFor: "A specific example.",
  },
  answer: "Last summer at my cafe job a customer was upset about a late order, so I remade it and she came back the next week.",
  mode: "type" as const,
  plain: false,
  language: "en",
};

const item = { score: 7, why: "Good." };
const aiGrading = {
  is_genuine_answer: true,
  rubric: { relevance: item, structure: item, specificity: item, ownership: item, clarity: item, role_fit: item },
  star: { situation: true, task: false, action: true, result: true },
  strength: { quote: "I remade it", why: "Clear action." },
  fix: "Say what your task was.",
  improved_answer: "Better answer.",
  follow_up_question: "What would you do differently?",
  criteria: [{ point: "A real example", met: true }],
};

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe("provider fallback", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses rules when no AI key is configured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const r = await grade(req);
    expect(r).toMatchObject({ source: "rules", reason: "not-configured" });
  });

  it("uses Groq when it answers with valid JSON", async () => {
    const fetchMock = mockFetch(200, { choices: [{ message: { content: JSON.stringify(aiGrading) } }] });
    vi.stubGlobal("fetch", fetchMock);
    const r = await grade(req);
    expect(r.source).toBe("ai");
    expect(r.data.fix).toBe("Say what your task was.");
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.response_format.json_schema.strict).toBe(true);
    // Strict mode: every object closed with all properties required.
    const schema = body.response_format.json_schema.schema;
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual(Object.keys(schema.properties));
    expect(schema.properties.rubric.properties.relevance.additionalProperties).toBe(false);
  });

  it("falls back to rules with reason 'limit' on a 429", async () => {
    vi.stubGlobal("fetch", mockFetch(429, { error: { message: "rate limit" } }));
    const r = await grade(req);
    expect(r).toMatchObject({ source: "rules", reason: "limit" });
    expect(r.data.fix.length).toBeGreaterThan(0);
  });

  it("falls back to rules with reason 'error' on bad output", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { choices: [{ message: { content: JSON.stringify({ nope: true }) } }] }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await grade(req);
    expect(r).toMatchObject({ source: "rules", reason: "error" });
  });

  it("falls back to the question bank when Groq is down", async () => {
    vi.stubGlobal("fetch", mockFetch(503, {}));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await questions({ role: "Nurse", seniority: "mid", jobDescription: "", count: 3, exclude: [], plain: false, language: "en" });
    expect(r.source).toBe("rules");
    expect(r.data).toHaveLength(3);
  });
});
