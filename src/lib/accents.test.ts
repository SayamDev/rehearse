import { describe, expect, it } from "vitest";
import { AUTO, accentFor, whisperHint } from "./accents";

describe("English accents", () => {
  it("uses the chosen accent, or the device's English, or UK", () => {
    expect(accentFor("en-NG").label).toBe("Nigeria");
    expect(accentFor(AUTO, ["fr-FR", "en-IN"]).code).toBe("en-IN");
    expect(accentFor(AUTO, ["en"]).code).toBe("en-GB");
    expect(accentFor(undefined, []).code).toBe("en-GB");
    expect(accentFor("xx-YY", ["en-US"]).code).toBe("en-US");
  });

  it("hints Whisper towards the right spelling", () => {
    expect(whisperHint("british", "Why this job?")).toContain("organised");
    expect(whisperHint("british", "Why this job?")).toContain("Question: Why this job?");
    expect(whisperHint("american")).toContain("organized");
  });
});
