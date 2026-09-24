"use client";

import { motion, useReducedMotion } from "motion/react";
import { ScoreSticker } from "./score-sticker";
import { StickerLoader } from "./sticker-loader";
import { CaretDownIcon, CheckIcon, MinusIcon } from "@phosphor-icons/react";
import {
  DELIVERY_WEIGHT,
  RUBRIC_LABELS,
  RUBRIC_WEIGHTS,
  levelFromXp,
  round1,
} from "@/lib/scoring";
import { RUBRIC_KEYS, type Question, type Take } from "@/lib/types";
import { deltaLabel, deltaStickerClass } from "./delta-sticker";
import { Score } from "./score";

const STAR_PARTS = [
  ["situation", "Situation"],
  ["task", "Task"],
  ["action", "Action"],
  ["result", "Result"],
] as const;

export function NotesCard({
  question,
  take,
  previous,
  animate,
  levelUp,
  xpLevel,
  interviewerAsksFollowUp = false,
  soft = false,
}: {
  question: Question;
  take: Take;
  previous: Take | null;
  animate: boolean;
  levelUp: boolean;
  xpLevel: number;
  /** The interviewer asks the follow-up themselves, so the notes don't repeat it. */
  interviewerAsksFollowUp?: boolean;
  /** Soft mode: scores stay hidden until the round's summary. */
  soft?: boolean;
}) {
  const g = take.grading;
  const level = levelFromXp(xpLevel);

  return (
    <article aria-label={`Notes for take ${take.number}`} className="panel flex flex-col">
      <header className="flex flex-col gap-4 p-5 sm:p-6">
        {soft ? (
          <p className="text-body-sm text-muted">
            <span className="font-semibold text-ink">Soft mode is on.</span> Your scores wait until the end of the round. For
            now, here&apos;s what went well and what to try next.
          </p>
        ) : (
          <ScoreSwap take={take} previous={previous} animate={animate} />
        )}
        {take.source !== "ai" && <QuickNotesLine reason={take.sourceReason ?? "not-configured"} />}
        <p className="text-label text-muted">
          <span className="tnum font-semibold text-ink">+{take.xp} XP</span>
          {previous && take.overall > previous.overall && " including a bonus for improving"}
        </p>
        {levelUp && (
          <p role="status" className="flex items-center gap-2 text-label font-medium">
            <span className="sticker tnum">Level {level.level}</span>
            {levelFromXp(xpLevel - take.xp).title !== level.title
              ? `New title: ${level.title}.`
              : `You leveled up. ${level.next - xpLevel} XP to level ${level.level + 1}.`}
          </p>
        )}
      </header>

      {!g.isGenuineAnswer ? (
        <div className="border-t border-line p-5 sm:p-6">
          <h2 className="font-semibold">We couldn&apos;t score this one</h2>
          <p className="mt-1 text-muted">{g.fix}</p>
        </div>
      ) : (
        <>
          <dl className="grid gap-5 border-t border-line p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <dt className="text-label font-semibold">What worked</dt>
              <dd className="mt-1.5 leading-relaxed text-muted">
                {g.strength.quote && (
                  <>
                    <q className="text-ink">{g.strength.quote}</q>{" "}
                  </>
                )}
                {g.strength.why}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-label font-semibold">
                <span className="sticker">Next take</span>
              </dt>
              <dd className="mt-2 text-body-lg font-medium leading-snug">{g.fix}</dd>
            </div>
          </dl>

          {!soft && (
          <section aria-labelledby={`rubric-${take.id}`} className="border-t border-line p-5 sm:p-6">
            <h2 id={`rubric-${take.id}`} className="text-label font-semibold">
              Scores
            </h2>
            <ul className="mt-3">
              {RUBRIC_KEYS.map((k) => {
                const now = g.rubric[k].score;
                const before = previous?.grading.rubric[k].score;
                const diff = before === undefined ? 0 : now - before;
                return (
                  <RubricRow
                    key={k}
                    label={RUBRIC_LABELS[k]}
                    score={now}
                    diff={diff}
                    why={g.rubric[k].why}
                  />
                );
              })}
              {take.delivery && take.deliveryScore !== null && (
                <RubricRow
                  label="Delivery"
                  score={Math.round(take.deliveryScore)}
                  diff={0}
                  why={`${take.delivery.wpm} words a minute${
                    take.delivery.wpm < 110 ? " (a little slow)" : take.delivery.wpm > 165 ? " (a little fast)" : " (a good pace)"
                  }, ${take.delivery.fillerCount} filler ${take.delivery.fillerCount === 1 ? "word" : "words"}${
                    take.delivery.fillerCount > 0
                      ? ` (${Object.entries(take.delivery.fillers)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([w, n]) => `"${w}" ${n}`)
                          .join(", ")})`
                      : ""
                  }`}
                />
              )}
            </ul>

            {question.category === "behavioral" && (
              <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="STAR structure">
                <span className="mr-1 text-label text-muted">STAR</span>
                {STAR_PARTS.map(([k, label]) => (
                  <span
                    key={k}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-tape font-medium ${
                      g.star[k] ? "border-ink text-ink" : "border-dashed border-line text-muted"
                    }`}
                  >
                    {g.star[k] ? <CheckIcon size={12} weight="bold" aria-hidden /> : <MinusIcon size={12} aria-hidden />}
                    {label}
                    <span className="sr-only">{g.star[k] ? " present" : " missing"}</span>
                  </span>
                ))}
              </div>
            )}

            <details className="group mt-4">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-label text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
                <CaretDownIcon size={14} className="transition-transform group-open:rotate-180" aria-hidden />
                How the score is worked out
              </summary>
              <p className="mt-2 max-w-[62ch] text-label leading-relaxed text-muted">
                Your score is a weighted average:{" "}
                {RUBRIC_KEYS.map((k) => `${RUBRIC_LABELS[k]} ${Math.round(RUBRIC_WEIGHTS[k] * 100)}%`).join(", ")}.
                {take.delivery
                  ? ` For spoken answers, delivery counts for ${DELIVERY_WEIGHT * 100}% and the rest is scaled to fit.`
                  : " Typed answers are not scored on delivery."}{" "}
                Delivery is measured from your words and timing, not by AI.
              </p>
            </details>
          </section>
          )}

          {g.criteria && g.criteria.length > 0 ? (
            <section aria-labelledby={`looking-${take.id}`} className="border-t border-line p-5 sm:p-6">
              <h2 id={`looking-${take.id}`} className="text-label font-semibold">
                What the interviewer was looking for{" "}
                <span className="tnum font-normal text-muted">
                  {g.criteria.filter((c) => c.met).length} of {g.criteria.length} shown
                </span>
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {g.criteria.map((c) => (
                  <li key={c.point} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${c.met ? "bg-lime text-on-ink" : "border-2 border-dashed border-muted/60"}`}
                      aria-hidden
                    >
                      {c.met && <CheckIcon size={12} weight="bold" />}
                    </span>
                    <span className={`text-body-sm leading-snug ${c.met ? "text-ink" : "text-muted"}`}>
                      {c.point}
                      <span className="sr-only">{c.met ? ": shown" : ": not shown yet"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <Disclosure title="What they were looking for">
              <p>{question.lookingFor}</p>
            </Disclosure>
          )}
          {g.improvedAnswer && (
            <Disclosure title="A stronger version of your answer">
              <p className="whitespace-pre-line">{g.improvedAnswer}</p>
              <p className="mt-2 text-label">Anything in [brackets] is a detail only you know. Fill it in when you practice.</p>
            </Disclosure>
          )}
          <Disclosure title="Your answer">
            <p className="whitespace-pre-line">{take.transcript}</p>
          </Disclosure>
          {g.followUpQuestion && !interviewerAsksFollowUp && (
            <div className="border-t border-line p-5 sm:p-6">
              <h2 className="text-label font-semibold">They might ask next</h2>
              <p className="mt-1.5 leading-relaxed">{g.followUpQuestion}</p>
            </div>
          )}
        </>
      )}
    </article>
  );
}

const QUICK_NOTES: Record<"not-configured" | "limit" | "error" | "offline", string> = {
  "not-configured": "Built-in rules checked your structure, detail, and length. They can't follow meaning the way AI notes can.",
  limit: "Today's free AI notes are used up, so built-in rules scored this one. AI notes are back tomorrow.",
  error: "AI notes aren't available right now, so built-in rules scored this one. Try another take later.",
  offline: "You're offline, so built-in rules scored this one. Take it again when you're back online for AI notes.",
};

function QuickNotesLine({ reason }: { reason: keyof typeof QUICK_NOTES }) {
  return (
    <p className="max-w-[62ch] text-label leading-relaxed text-muted">
      <span className="sticker sticker-sky mr-2 align-middle">Quick notes</span>
      {QUICK_NOTES[reason]}
    </p>
  );
}

function RubricRow({ label, score, diff, why }: { label: string; score: number; diff: number; why: string }) {
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[8rem_4.5rem_1fr]">
      <span className="text-body-sm font-medium">{label}</span>
      <span className="tnum flex items-baseline justify-end gap-1 text-body-sm font-semibold sm:justify-start">
        <span className="w-5 text-right">{score}</span>
        <span className={`w-6 text-tape font-medium ${diff > 0 ? "text-up" : diff < 0 ? "text-down" : ""}`}>
          {diff > 0 ? `+${diff}` : diff < 0 ? diff : ""}
        </span>
        <span className="sr-only">out of 10{diff !== 0 ? `, ${diff > 0 ? "up" : "down"} ${Math.abs(diff)} from your last take` : ""}</span>
      </span>
      <span className="col-span-2 text-body-sm leading-relaxed text-muted sm:col-span-1">{why}</span>
    </li>
  );
}

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-line">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 text-label font-semibold sm:px-6 [&::-webkit-details-marker]:hidden">
        {title}
        <CaretDownIcon size={16} className="text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="max-w-[68ch] px-5 pb-5 leading-relaxed text-muted sm:px-6">{children}</div>
    </details>
  );
}

/**
 * Signature moment: the new score arrives as a sticker that slaps onto the sheet,
 * then the improvement sticker lands beside it.
 */
function ScoreSwap({ take, previous, animate }: { take: Take; previous: Take | null; animate: boolean }) {
  const reduce = useReducedMotion();
  const delta = previous ? round1(take.overall - previous.overall) : null;
  const slap = animate && !reduce;

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 pt-4">
      {previous && (
        <div className="flex flex-col gap-1">
          <span className="text-tape font-medium text-muted">Take {previous.number}</span>
          <Score value={previous.overall} className="text-score-sm font-semibold text-muted line-through decoration-1" />
        </div>
      )}
      <ScoreSticker key={take.id} value={take.overall} tab={`Take ${take.number}`} slap={slap} />
      {delta !== null && (
        <motion.span
          key={`delta-${take.id}`}
          initial={slap ? { opacity: 0, rotate: -22, scale: 1.7 } : false}
          animate={{ opacity: 1, rotate: -3, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 16, delay: slap ? 0.12 : 0 }}
          className={`mb-2 ${deltaStickerClass(delta)}`}
        >
          {deltaLabel(delta)}
        </motion.span>
      )}
    </div>
  );
}

export function NotesSkeleton({ who }: { who?: string }) {
  return (
    <div className="panel flex flex-col gap-5 p-5 sm:p-6" aria-busy="true" aria-label="Scoring your answer">
      <StickerLoader label={who ? `${who} is reading your answer...` : "Reading your answer and writing notes..."} />
      <div className="flex items-end gap-4">
        <div className="skeleton h-14 w-28" />
        <div className="skeleton h-6 w-10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-8" />
          <div className="skeleton h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
