"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { KeyPointsEditor } from "./key-points-editor";
import { StrengthMeter } from "./strength-meter";
import { describeDue } from "@/lib/memory";
import { deleteAnswer, localDay, updateAnswer, useStore } from "@/lib/store";
import type { KeyPoint, SavedAnswer } from "@/lib/types";

export function SavedAnswerEditor({ id }: { id: string }) {
  const { hydrated, bank } = useStore();
  const answer = bank.find((a) => a.id === id);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading saved answer">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-48 w-full rounded-[10px]" />
      </div>
    );
  }
  if (!answer) {
    return (
      <div className="flex flex-col items-start gap-4 pt-8">
        <h1 className="text-headline font-bold tracking-[-0.02em]">We can&apos;t find that saved answer</h1>
        <p className="text-muted">It may have been deleted, or saved in a different browser.</p>
        <Link href="/remember" className="btn btn-ghost">
          Back to Remember
        </Link>
      </div>
    );
  }
  return <Editor key={answer.updatedAt} answer={answer} />;
}

function Editor({ answer }: { answer: SavedAnswer }) {
  const router = useRouter();
  const [text, setText] = useState(answer.text);
  const [points, setPoints] = useState<KeyPoint[]>(answer.keyPoints);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [confirming, setConfirming] = useState(false);
  const textId = useId();
  const today = localDay();
  const dirty = text !== answer.text || JSON.stringify(points) !== JSON.stringify(answer.keyPoints);
  const last = answer.history.at(-1);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/remember" className="btn btn-quiet -ml-2 w-fit">
        <ArrowLeftIcon size={16} aria-hidden />
        Remember
      </Link>

      <header className="flex flex-col gap-3">
        <p className="text-label text-muted">{answer.role}</p>
        <h1 className="text-question font-semibold leading-[1.2] tracking-[-0.02em] sm:text-headline">{answer.question.text}</h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-muted">
          <StrengthMeter box={answer.box} />
          <span>{describeDue(answer.due, today)}</span>
          {last && (
            <span className="tnum">
              Last recall: {last.hit} of {last.total} points
            </span>
          )}
        </div>
        <Link href={`/remember/drill?id=${answer.id}`} className="btn btn-go mt-1 w-fit">
          Practise this one now
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
        </Link>
      </header>

      <section aria-label="Edit saved answer" className="panel flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor={textId} className="text-label font-semibold">
            Your answer
          </label>
          <textarea
            id={textId}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setStatus("idle");
            }}
            rows={8}
            maxLength={4000}
            className="field resize-y leading-relaxed"
          />
        </div>
        <KeyPointsEditor
          points={points}
          onChange={(p) => {
            setPoints(p);
            setStatus("idle");
          }}
          sourceText={text}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!dirty || !text.trim() || !points.some((p) => p.text.trim())}
            onClick={() => {
              updateAnswer(answer.id, { text: text.trim(), keyPoints: points });
              setStatus("saved");
            }}
          >
            Save changes
          </button>
          {status === "saved" && (
            <span role="status" className="text-label text-muted">
              Saved.
            </span>
          )}
        </div>
      </section>

      <section aria-label="Delete saved answer" className="flex flex-col gap-3">
        {!confirming ? (
          <button type="button" className="btn btn-quiet w-fit text-label" onClick={() => setConfirming(true)}>
            Remove from Remember
          </button>
        ) : (
          <div role="alert" className="flex flex-col gap-3 rounded-control border border-down/40 p-4">
            <p className="font-medium">Remove this saved answer and its practice history?</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn bg-down text-white hover:opacity-90"
                onClick={() => {
                  deleteAnswer(answer.id);
                  router.push("/remember");
                }}
              >
                Remove
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                Keep it
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
