"use client";

import { useEffect, useState } from "react";
import { listRecordings, type Recording } from "@/lib/recordings";
import { updateSettings, useStore } from "@/lib/store";
import { Score } from "./score";

/**
 * "Hear yourself at your best": replays the user's highest-scoring spoken answers,
 * stored only on this device. A confidence boost before the real thing.
 */
export function BestAnswers({ limit = 3 }: { limit?: number }) {
  const { hydrated, profile } = useStore();
  const [items, setItems] = useState<(Recording & { url: string })[] | null>(null);
  const on = hydrated && profile.settings.keepRecordings;

  useEffect(() => {
    let urls: string[] = [];
    let live = true;
    listRecordings().then((all) => {
      if (!live) return;
      const top = all.slice(0, limit).map((r) => ({ ...r, url: URL.createObjectURL(r.audio) }));
      urls = top.map((t) => t.url);
      setItems(top);
    });
    return () => {
      live = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [limit, on]);

  return (
    <section aria-labelledby="best" className="flex flex-col gap-3">
      <h2 id="best" className="text-title-lg font-bold tracking-[-0.02em]">
        Hear yourself at your best
      </h2>
      {items && items.length > 0 ? (
        <>
          <p className="max-w-[58ch] text-body-sm text-muted">
            Your strongest spoken answers. Listen before an interview to remind yourself you can do this.
          </p>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {items.map((r) => (
              <li key={r.takeId} className="flex flex-col gap-2 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium leading-snug">{r.question}</p>
                  <span className="sticker sticker-lime shrink-0">
                    <Score value={r.score} />
                  </span>
                </div>
                <audio controls preload="none" src={r.url} className="w-full max-w-md">
                  Your browser can&apos;t play this recording.
                </audio>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="max-w-[58ch] text-body-sm text-muted">
            {on
              ? "Answer a question out loud and your best recordings will appear here."
              : "Turn this on to keep your spoken answers on this device. Your best ones appear here to replay before an interview. They're never uploaded, and you can delete them any time in Me."}
          </p>
          {!on && hydrated && (
            <button type="button" className="btn btn-ghost" onClick={() => updateSettings({ keepRecordings: true })}>
              Keep my recordings on this device
            </button>
          )}
        </div>
      )}
    </section>
  );
}
