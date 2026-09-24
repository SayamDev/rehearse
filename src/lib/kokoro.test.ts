import { describe, expect, it } from "vitest";
import { KOKORO_SERVER_STATE, voiceProgressText, type KokoroSnapshot } from "./kokoro";

const base: KokoroSnapshot = { ...KOKORO_SERVER_STATE, status: "loading", total: 92_000_000, startedAt: 1 };

describe("voiceProgressText", () => {
  it("says the download is starting before any bytes arrive", () => {
    expect(voiceProgressText(base, 2).label).toBe("Starting the download (about 90MB)...");
  });

  it("shows megabytes and the time left once bytes arrive", () => {
    const t = voiceProgressText({ ...base, loaded: 46_000_000, progress: 50 }, 20);
    expect(t.known).toBe(true);
    expect(t.detail).toBe("46 of 92 MB (50%) · about 20 sec left");
  });

  it("waits a moment before guessing the time left", () => {
    expect(voiceProgressText({ ...base, loaded: 1_000_000, progress: 1 }, 1).detail).toBe("1 of 92 MB (1%)");
  });

  it("gives minutes for slow connections", () => {
    expect(voiceProgressText({ ...base, loaded: 9_200_000, progress: 10 }, 60).detail).toContain("about 9 min left");
  });

  it("shows time so far when the browser gives no progress", () => {
    expect(voiceProgressText(base, 75).detail).toBe("1:15 so far. About 90MB, usually 1 to 2 minutes on Wi-Fi.");
  });

  it("says almost ready while warming up", () => {
    expect(voiceProgressText({ ...base, loaded: 92_000_000, progress: 99, warming: true }, 30, "Sam's voice").label).toBe(
      "Almost ready: warming up Sam's voice...",
    );
  });

  it("never says downloading for a copy already on the device", () => {
    expect(voiceProgressText({ ...base, cached: true, loaded: 5_000_000, progress: 5 }, 2).label).toBe("Getting the voice ready...");
  });
});
