import { afterEach, describe, expect, it, vi } from "vitest";
import { aiEnabled } from "./claude";

describe("paid Claude stays off by default", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("ignores a Claude key unless paid AI is explicitly allowed", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    vi.stubEnv("ALLOW_PAID_AI", "");
    expect(aiEnabled()).toBe(false);
  });

  it("runs only with a key and ALLOW_PAID_AI=yes", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    vi.stubEnv("ALLOW_PAID_AI", "yes");
    expect(aiEnabled()).toBe(true);
  });
});
