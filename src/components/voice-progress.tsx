"use client";

import { useEffect, useState } from "react";
import { voiceProgressText, type KokoroSnapshot } from "@/lib/kokoro";
import { StickerLoader } from "./sticker-loader";

/**
 * Shows the human voice getting ready, and always moving so it never looks stuck:
 * megabytes so far and the time left once bytes arrive, "Almost ready" while the voice
 * warms up after downloading, and a running clock when the browser gives no progress.
 * The numbers sit on their own line, outside the loader's live region, so screen readers
 * aren't read a new figure every second.
 */
export function VoiceProgress({ state, name = "the voice" }: { state: KokoroSnapshot; name?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = state.startedAt ? Math.max(0, (now - state.startedAt) / 1000) : 0;
  const { label, detail, known } = voiceProgressText(state, elapsed, name);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={known ? state.progress : undefined}
      >
        {known ? (
          <div
            className="progress-stripes h-full rounded-full bg-sky transition-[width] duration-300"
            style={{ width: `${Math.max(state.progress, 4)}%` }}
          />
        ) : (
          <div className="progress-slide absolute inset-y-0 w-1/3 rounded-full bg-sky" />
        )}
      </div>
      <StickerLoader size="sm" label={label} />
      {detail && <span className="tnum text-label text-muted">{detail}</span>}
    </div>
  );
}
