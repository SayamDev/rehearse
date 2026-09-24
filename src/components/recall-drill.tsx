"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, CaretDownIcon, CheckIcon, MinusIcon } from "@phosphor-icons/react";
import { AnswerComposer, type SubmittedAnswer } from "./answer-composer";
import { StrengthMeter } from "./strength-meter";
import { describeDue, isDue, matchKeyPoints } from "@/lib/memory";
import { levelFromXp } from "@/lib/scoring";
import { localDay, recordRecall, useStore, type RecallResult } from "@/lib/store";
import type { SavedAnswer } from "@/lib/types";

type Outcome = { answer: SavedAnswer; hit: number; total: number; result: RecallResult };

export function RecallDrill({ onlyId, all }: { onlyId?: string; all?: boolean }) {
  const { hydrated, bank, profile } = useStore();
  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading recall practice">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-9 w-full" />
        <div className="skeleton h-48 w-full rounded-[10px]" />
      </div>
    );
  }
  const today = localDay();
  const queue = onlyId
    ? bank.filter((a) => a.id === onlyId)
    : bank.filter((a) => all || isDue(a, today)).sort((a, b) => a.box - b.box);
  // The queue is fixed when the drill starts, so recording a result doesn't reshuffle it.
  return <Drill queue={queue} defaultMode={profile.settings.defaultAnswerMode} />;
}

function Drill({ queue: initial, defaultMode }: { queue: SavedAnswer[]; defaultMode: "voice" | "type" }) {
  const [queue] = useState(initial);
  const [index, setIndex] = useState(0);
  const [recall, setRecall] = useState<SubmittedAnswer | null>(null);
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const { profile } = useStore();

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 pt-4">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Nothing to practise right now</h1>
        <p className="max-w-[52ch] text-muted">Save an answer from your notes first, or come back when one is due.</p>
        <Link href="/remember" className="btn btn-ghost">
          Back to Remember
        </Link>
      </div>
    );
  }

  if (index >= queue.length) return <Finished outcomes={outcomes} xpNow={profile.xp} />;

  const current = queue[index];

  function check(a: SubmittedAnswer) {
    setRecall(a);
    setMarks(matchKeyPoints(current.keyPoints, a.text));
    window.scrollTo({ top: 0 });
  }

  function next() {
    const total = current.keyPoints.length;
    const hit = current.keyPoints.filter((p) => marks[p.id]).length;
    const result = recordRecall(current.id, hit, total);
    setOutcomes((o) => [...o, { answer: current, hit, total, result }]);
    setRecall(null);
    setMarks({});
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }

  const hitCount = current.keyPoints.filter((p) => marks[p.id]).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label text-muted">
          <span className="font-medium text-ink">{current.role}</span>
        </p>
        <p className="tnum text-label text-muted" aria-live="polite">
          {index + 1} of {queue.length}
        </p>
      </div>

      <section aria-labelledby="recall-q" className="flex flex-col gap-3">
        <h1 id="recall-q" className="text-question font-semibold leading-[1.2] tracking-[-0.02em] sm:text-headline">
          <span className="sr-only">
            Recall {index + 1} of {queue.length}:{" "}
          </span>
          {current.question.text}
        </h1>
        {!recall && (
          <p className="text-muted">
            Answer from memory, the way you would in the interview. You have{" "}
            <span className="tnum font-medium text-ink">{current.keyPoints.length}</span> key{" "}
            {current.keyPoints.length === 1 ? "point" : "points"} to hit.
          </p>
        )}
      </section>

      {!recall ? (
        <AnswerComposer
          key={current.id}
          takeNumber={1}
          label="From memory"
          submitLabel="Check my recall"
          defaultMode={defaultMode}
          onSubmit={check}
        />
      ) : (
        <>
          <section aria-labelledby="recall-result" className="panel flex flex-col">
            <header className="flex flex-col gap-2 p-5 sm:p-6">
              <h2 id="recall-result" className="flex flex-wrap items-baseline gap-3">
                <span className="tnum text-headline-lg font-bold leading-none tracking-[-0.03em]">
                  {hitCount} of {current.keyPoints.length}
                </span>
                <span className="text-muted">key points</span>
              </h2>
              <p className="text-label leading-relaxed text-muted">
                {hitCount === current.keyPoints.length
                  ? "You hit every point. This one moves up and comes back later."
                  : hitCount * 2 >= current.keyPoints.length
                    ? "Most of it is there. You'll see this one again soon."
                    : "Still learning this one. It will come back tomorrow."}
              </p>
            </header>

            <div className="border-t border-line p-5 sm:p-6">
              <h3 className="text-label font-semibold">Your key points</h3>
              <p className="mt-1 text-label text-muted">We match your words roughly. Tap a point to correct it.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {current.keyPoints.map((p) => {
                  const hit = Boolean(marks[p.id]);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={hit}
                        onClick={() => setMarks((m) => ({ ...m, [p.id]: !m[p.id] }))}
                        className={`flex w-full items-start gap-3 rounded-control border px-3 py-3 text-left transition-colors ${
                          hit ? "border-ink" : "border-dashed border-line text-muted hover:border-muted"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                            hit ? "bg-lime text-on-ink" : "bg-surface-2"
                          }`}
                          aria-hidden
                        >
                          {hit ? <CheckIcon size={13} weight="bold" /> : <MinusIcon size={12} />}
                        </span>
                        <span className="leading-snug">
                          {p.text}
                          <span className="sr-only">{hit ? ", remembered" : ", missed"}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Disclosure title="Your saved answer">{current.text}</Disclosure>
            <Disclosure title="What you just said">{recall.text}</Disclosure>
          </section>

          <div className="sticky bottom-[72px] z-20 -mx-4 flex gap-2 border-t border-line bg-floor/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0 [&>button]:flex-1 sm:[&>button]:flex-none">
            <button type="button" className="btn btn-go h-12 px-6" onClick={next}>
              {index + 1 < queue.length ? "Next answer" : "Finish"}
              <ArrowRightIcon size={16} weight="bold" aria-hidden />
            </button>
            <button type="button" className="btn btn-ghost h-12 px-6" onClick={() => setRecall(null)}>
              Try again
            </button>
          </div>
        </>
      )}

    </div>
  );
}

function Finished({ outcomes, xpNow }: { outcomes: Outcome[]; xpNow: number }) {
  const today = localDay();
  const xp = outcomes.reduce((a, o) => a + o.result.xp, 0);
  const levelUp = outcomes.some((o) => o.result.levelUp);
  const level = levelFromXp(xpNow);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Recall done</h1>
        <p className="tnum text-muted">
          +{xp} XP{levelUp && ` · Level ${level.level} reached`}
        </p>
      </header>
      <ul className="panel">
        {outcomes.map((o) => (
          <li key={o.answer.id} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:px-6">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="leading-snug">{o.answer.question.text}</span>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-muted">
                <StrengthMeter box={o.result.box} />
                <span>{describeDue(o.result.due, today)}</span>
              </span>
            </div>
            <span className="tnum shrink-0 font-semibold">
              {o.hit}/{o.total}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/remember" className="btn btn-go h-12 w-fit px-6">
        Back to Remember
      </Link>
    </div>
  );
}

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-line">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 text-label font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
        {title}
        <CaretDownIcon size={16} className="text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <p className="max-w-[68ch] whitespace-pre-line px-5 pb-5 leading-relaxed text-muted sm:px-6">{children}</p>
    </details>
  );
}
