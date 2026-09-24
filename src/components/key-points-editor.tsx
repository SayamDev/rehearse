"use client";

import { useId } from "react";
import { LightbulbIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { MAX_POINTS, suggestKeyPoints } from "@/lib/memory";
import type { KeyPoint } from "@/lib/types";

/** Editable list of 1 to 5 short prompts the user memorises instead of a script. */
export function KeyPointsEditor({
  points,
  onChange,
  sourceText,
}: {
  points: KeyPoint[];
  onChange: (points: KeyPoint[]) => void;
  sourceText: string;
}) {
  const headingId = useId();

  function update(id: string, text: string) {
    onChange(points.map((p) => (p.id === id ? { ...p, text } : p)));
  }

  return (
    <fieldset className="flex flex-col gap-3" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <legend id={headingId} className="text-label font-semibold">
          Key points to remember
        </legend>
        <button
          type="button"
          className="btn btn-quiet min-h-9 text-label"
          onClick={() => onChange(suggestKeyPoints(sourceText))}
          disabled={!sourceText.trim()}
        >
          <LightbulbIcon size={16} aria-hidden />
          Suggest from my answer
        </button>
      </div>
      <p className="-mt-1 text-label leading-relaxed text-muted">
        Short prompts, not the full script. Remembering the points keeps you sounding natural.
      </p>
      <ol className="flex flex-col gap-2">
        {points.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="tnum w-5 shrink-0 text-right text-label text-muted" aria-hidden>
              {i + 1}
            </span>
            <label htmlFor={`kp-${p.id}`} className="sr-only">
              Key point {i + 1}
            </label>
            <input
              id={`kp-${p.id}`}
              value={p.text}
              onChange={(e) => update(p.id, e.target.value)}
              maxLength={120}
              className="field py-2.5 text-body-sm"
              placeholder="e.g. Misread a 24-drink order"
            />
            <button
              type="button"
              onClick={() => onChange(points.filter((x) => x.id !== p.id))}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label={`Remove key point ${i + 1}`}
            >
              <XIcon size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      {points.length < MAX_POINTS && (
        <button
          type="button"
          className="btn btn-ghost w-fit min-h-10 text-label"
          onClick={() => onChange([...points, { id: crypto.randomUUID(), text: "" }])}
        >
          <PlusIcon size={16} aria-hidden />
          Add a point
        </button>
      )}
    </fieldset>
  );
}
