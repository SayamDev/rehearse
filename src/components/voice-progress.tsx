"use client";

import { StickerLoader } from "./sticker-loader";

/**
 * Shows the human voice getting ready. Always moving, so it never looks stuck: a sliding
 * stripe until there's a percentage (the start of a download, or loading a saved copy,
 * which reports no progress), then a striped fill that grows.
 */
export function VoiceProgress({ progress, cached, name = "the voice" }: { progress: number; cached: boolean | null; name?: string }) {
  const known = !cached && progress > 0;
  const label = cached
    ? `Getting ${name} ready...`
    : known
      ? `Downloading ${name}... ${progress}%`
      : `Starting the download...`;
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={known ? progress : undefined}
      >
        {known ? (
          <div className="progress-stripes h-full rounded-full bg-sky transition-[width] duration-300" style={{ width: `${Math.max(progress, 4)}%` }} />
        ) : (
          <div className="progress-slide absolute inset-y-0 w-1/3 rounded-full bg-sky" />
        )}
      </div>
      <StickerLoader size="sm" label={label} />
    </div>
  );
}
