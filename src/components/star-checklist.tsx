"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { STAR_STEPS, detectStar } from "@/lib/star";

/**
 * Live STAR checklist: the four parts light up as you cover them, while you speak or
 * type, so you don't lose your place mid-answer. It uses the same checks as the notes.
 */
export function StarChecklist({ text }: { text: string }) {
  const parts = detectStar(text);
  const done = STAR_STEPS.filter((s) => parts[s.key]).length;
  const next = STAR_STEPS.find((s) => !parts[s.key]);
  // Only nudge once they've started talking, so it doesn't nag an empty answer.
  const started = text.trim().split(/\s+/).length >= 8;

  return (
    <div className="flex flex-col gap-2" data-star-checklist>
      <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" aria-label="STAR checklist">
        {STAR_STEPS.map((s) => {
          const on = parts[s.key];
          return (
            <li
              key={s.key}
              className={`flex min-h-10 items-center justify-center gap-1 rounded-full border-2 px-1 text-label font-semibold transition-colors duration-300 ${
                on ? "border-[var(--die)] bg-lime text-on-ink" : "border-dashed border-line text-muted"
              }`}
            >
              {on && <CheckIcon size={14} weight="bold" className="shrink-0" aria-hidden />}
              <span>{s.label}</span>
              <span className="sr-only">{on ? ", covered" : ", not yet"}</span>
            </li>
          );
        })}
      </ol>
      <p className="min-h-5 text-center text-label text-muted" aria-live="polite">
        {done === 4 ? "All four parts covered. Wrap up when you're ready." : started && next ? `Next: ${next.next}` : ""}
      </p>
    </div>
  );
}
