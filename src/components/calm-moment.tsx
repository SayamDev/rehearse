"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "@phosphor-icons/react";
import { BLANK_LINES } from "@/lib/calm";
import { stopSpeaking } from "@/lib/tts";
import { Breathing } from "./breathing";

/**
 * A pause in the middle of practice: three slow breaths and a reminder of what
 * you can say. A dialog, because the point is to step away from the question.
 */
export function CalmMoment({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      stopSpeaking();
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="calm-moment-title"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] border-[3px] border-[var(--die)] bg-surface p-0 text-ink shadow-[var(--sheet-shadow)] backdrop:bg-[color-mix(in_oklab,var(--floor)_70%,transparent)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="calm-moment-title" className="text-title-lg font-bold tracking-[-0.02em]">
              Take a moment
            </h2>
            <p className="text-body-sm text-muted">Your question will be right here when you&apos;re ready. There&apos;s no rush.</p>
          </div>
          <button type="button" className="btn btn-quiet size-11 shrink-0 p-0" onClick={onClose} aria-label="Close">
            <XIcon size={20} weight="bold" aria-hidden />
          </button>
        </div>
        <Breathing cycles={3} compact />
        <div className="flex flex-col gap-2 rounded-control bg-surface-2 p-4">
          <p className="font-semibold">In a real interview, you can say</p>
          <ul className="flex flex-col gap-1.5 text-body-sm">
            {BLANK_LINES.slice(0, 2).map((l) => (
              <li key={l}>
                <q>{l}</q>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="btn btn-ghost w-full" onClick={onClose}>
          I&apos;m ready to answer
        </button>
      </div>
    </dialog>
  );
}
