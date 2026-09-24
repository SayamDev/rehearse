"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { BookmarkSimpleIcon, CheckIcon } from "@phosphor-icons/react";
import { KeyPointsEditor } from "./key-points-editor";
import { suggestKeyPoints } from "@/lib/memory";
import { saveAnswer, useStore } from "@/lib/store";
import type { KeyPoint, Question, Take } from "@/lib/types";

type Source = { id: string; label: string; text: string };

/**
 * Lets the user pick one of their takes or the stronger rewrite, edit it into
 * their own words, and save it with key points for recall practice.
 */
export function SaveAnswerPanel({ role, question, takes }: { role: string; question: Question; takes: Take[] }) {
  const { bank } = useStore();
  const existing = bank.find((a) => a.role === role && a.question.text === question.text);

  const best = takes.reduce<Take | null>((a, t) => (!a || t.overall > a.overall ? t : a), null);
  const sources: Source[] = [
    ...takes.map((t) => ({ id: t.id, label: `Take ${t.number} (${t.overall.toFixed(1)})`, text: t.transcript })),
    ...(best?.grading.improvedAnswer ? [{ id: "improved", label: "Stronger version", text: best.grading.improvedAnswer }] : []),
  ];
  const defaultSource = best?.id ?? sources[0]?.id;

  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState(defaultSource);
  const [text, setText] = useState("");
  const [points, setPoints] = useState<KeyPoint[]>([]);
  const [saved, setSaved] = useState(false);
  const textId = useId();
  const sourceName = useId();

  function begin() {
    if (existing) {
      setText(existing.text);
      setPoints(existing.keyPoints);
    } else {
      const src = sources.find((s) => s.id === defaultSource);
      setText(src?.text ?? "");
      setPoints(suggestKeyPoints(src?.text ?? ""));
    }
    setSaved(false);
    setOpen(true);
  }

  function choose(id: string) {
    const src = sources.find((s) => s.id === id);
    setSourceId(id);
    setText(src?.text ?? "");
    setPoints(suggestKeyPoints(src?.text ?? ""));
  }

  function save() {
    saveAnswer({ role, question, text: text.trim(), keyPoints: points });
    setSaved(true);
    setOpen(false);
  }

  const canSave = text.trim().length > 0 && points.some((p) => p.text.trim());
  const hasBrackets = /\[[^\]]+\]/.test(text);

  if (!open) {
    return (
      <section aria-label="Remember this answer" className="flex flex-wrap items-center gap-3">
        {saved || existing ? (
          <>
            <p className="flex items-center gap-2 text-label">
              <CheckIcon size={16} weight="bold" aria-hidden />
              {saved ? "Saved to Remember. It's ready to practise." : "This answer is saved in Remember."}
            </p>
            <button type="button" className="btn btn-quiet min-h-9 text-label" onClick={begin}>
              Edit saved answer
            </button>
            <Link href="/remember" className="btn btn-quiet min-h-9 text-label">
              Go to Remember
            </Link>
          </>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={begin}>
            <BookmarkSimpleIcon size={18} aria-hidden />
            Save this answer to remember
          </button>
        )}
      </section>
    );
  }

  return (
    <section aria-labelledby={`${textId}-h`} className="panel flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={`${textId}-h`} className="text-title font-semibold tracking-[-0.01em]">
          Save an answer to remember
        </h2>
        <p className="text-label leading-relaxed text-muted">
          Pick the version closest to what you want to say, then make it yours. You&apos;ll practise saying it from memory.
        </p>
      </div>

      {!existing && sources.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-label font-semibold">Start from</legend>
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <label
                key={s.id}
                className={`btn min-h-10 cursor-pointer border text-label ${
                  sourceId === s.id ? "border-ink bg-ink text-floor" : "border-line text-ink hover:bg-surface-2"
                } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]`}
              >
                <input type="radio" name={sourceName} className="sr-only" checked={sourceId === s.id} onChange={() => choose(s.id)} />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor={textId} className="text-label font-semibold">
          Your answer
        </label>
        <textarea
          id={textId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          maxLength={4000}
          className="field resize-y leading-relaxed"
        />
        {hasBrackets && (
          <p className="text-label text-muted">Replace anything in [brackets] with your own real details before you save.</p>
        )}
      </div>

      <KeyPointsEditor points={points} onChange={setPoints} sourceText={text} />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-go" onClick={save} disabled={!canSave}>
          {existing ? "Save changes" : "Save to Remember"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </section>
  );
}
