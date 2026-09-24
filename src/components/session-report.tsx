"use client";

import Link from "next/link";
import { ArrowRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import { RUBRIC_LABELS, round1 } from "@/lib/scoring";
import { SaveAnswerPanel } from "./save-answer-panel";
import { ScoreSticker } from "./score-sticker";
import { StickerArt } from "./sticker-art";
import { COLLECTION_BY_ID, bossWon } from "@/lib/collection";
import { MODES } from "@/lib/game";
import { PersonaAvatar } from "./persona-avatar";
import { deltaStickerClass } from "./delta-sticker";
import { STICKER_THRESHOLD } from "@/lib/stickers";
import { SENIORITY_LABELS, bestTake, firstTake, formatDate, sessionScore, sessionXp } from "@/lib/session";
import { RUBRIC_KEYS, type Session, type Take } from "@/lib/types";
import { Score } from "./score";

export function SessionReport({
  session,
  previousAverage,
  showTranscripts = false,
}: {
  session: Session;
  previousAverage: number | null;
  showTranscripts?: boolean;
}) {
  const score = sessionScore(session);
  const bests = session.questions.map(bestTake).filter((t): t is Take => t !== null);
  const genuine = bests.filter((t) => t.grading.isGenuineAnswer);
  const xp = sessionXp(session);
  const retries = session.questions.reduce((a, q) => a + Math.max(0, q.takes.length - 1), 0);

  const rubricAvg = RUBRIC_KEYS.map((k) => ({
    key: k,
    avg: genuine.length ? round1(genuine.reduce((a, t) => a + t.grading.rubric[k].score, 0) / genuine.length) : 0,
  }));
  const sortedRubric = [...rubricAvg].sort((a, b) => b.avg - a.avg);
  const strongest = sortedRubric.slice(0, 2);
  const weakest = sortedRubric.slice(-2).reverse();

  const strengths = genuine
    .filter((t) => t.grading.strength.quote)
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 3);
  const fixes = [...genuine]
    .sort((a, b) => a.overall - b.overall)
    .filter((t, i, all) => all.findIndex((x) => x.grading.fix === t.grading.fix) === i)
    .slice(0, 3);
  const roundStickers = [
    ...new Set(
      session.questions
        .filter((q) => q.takes.some((t) => t.grading.isGenuineAnswer && t.overall >= STICKER_THRESHOLD))
        .map((q) => q.question.competency),
    ),
  ];
  const diff = score !== null && previousAverage !== null ? round1(score - previousAverage) : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-label text-muted">
          {MODES[session.mode ?? "quick"].name} · {session.role} · {SENIORITY_LABELS[session.seniority]} · {formatDate(session.createdAt)}
        </p>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 pt-5">
          {score !== null ? (
            <ScoreSticker value={score} tab="Your round" size="lg" slap tilt={-2} />
          ) : (
            <span className="text-score-lg font-bold leading-none">--</span>
          )}
          <span className="mb-3 text-label text-muted">out of 10</span>
          {diff !== null && (
            <span className={`mb-3 ${deltaStickerClass(diff)} text-label`}>
              {diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? diff.toFixed(1) : "Same"} vs your average
            </span>
          )}
        </div>
        <p className="text-muted">
          {xp} XP earned · {retries} {retries === 1 ? "retake" : "retakes"}
        </p>
      </header>

      {session.mode === "boss" && (
        <section
          aria-label="Boss Round result"
          className={`flex items-center gap-4 rounded-[var(--radius-panel)] border-[3px] p-4 ${bossWon(session) ? "border-lime bg-surface" : "border-dashed border-line"}`}
        >
          <PersonaAvatar id="tough" size={72} tilt={bossWon(session) ? -8 : 3} />
          <p className="text-body">
            {bossWon(session) ? (
              <>
                <span className="font-display text-title-lg font-extrabold">You beat Mr. Grant!</span>{" "}
                <span className="text-muted">The legendary Boss tamer sticker is yours.</span>
              </>
            ) : (
              <>
                <span className="font-display text-title-lg font-extrabold">Mr. Grant wasn&apos;t convinced this time.</span>{" "}
                <span className="text-muted">Average 7 or more across the round to beat him. Try another Boss Round.</span>
              </>
            )}
          </p>
        </section>
      )}

      <section aria-labelledby="round-stickers" className="flex flex-col gap-3">
        <h2 id="round-stickers" className="text-title font-bold tracking-[-0.01em]">
          Stickers this round
        </h2>
        {roundStickers.length > 0 ? (
          <ul className="flex flex-wrap gap-4">
            {roundStickers.map((c) => (
              <li key={c}>
                <StickerArt item={COLLECTION_BY_ID[`skill:${c}`]} earned size={84} tilt={-4} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-3 text-body-sm text-muted">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted/60" aria-hidden />
            None yet. Score 7 or more on a question to earn its skill sticker.
          </p>
        )}
      </section>

      <section aria-labelledby="per-question" className="panel">
        <h2 id="per-question" className="px-5 pt-5 text-label font-semibold sm:px-6">
          Each question
        </h2>
        <ol className="mt-2">
          {session.questions.map((q, i) => {
            const best = bestTake(q);
            const first = firstTake(q);
            return (
              <li key={q.question.id} className="border-b border-line px-5 py-4 last:border-b-0 sm:px-6">
                <div className="flex items-start gap-4">
                  <span className="tnum mt-0.5 text-label text-muted">{i + 1}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="leading-snug">{q.question.text}</p>
                    <p className="text-label text-muted">
                      {best === null
                        ? "Not answered"
                        : q.takes.length > 1 && first
                          ? `Take 1 scored ${first.overall.toFixed(1)}, best was take ${best.number} at ${best.overall.toFixed(1)}`
                          : `One take, ${best.overall.toFixed(1)}`}
                    </p>
                  </div>
                  {best ? <Score value={best.overall} className="text-title-lg font-semibold" /> : <span className="text-title-lg font-semibold">--</span>}
                </div>
                {showTranscripts && q.takes.length > 0 && (
                  <details className="group ml-7 mt-3">
                    <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-label text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
                      <CaretDownIcon size={14} className="transition-transform group-open:rotate-180" aria-hidden />
                      {q.takes.length === 1 ? "Your answer and notes" : `All ${q.takes.length} takes`}
                    </summary>
                    <ol className="mt-3 flex flex-col gap-4">
                      {q.takes.map((t) => (
                        <li key={t.id} className="flex flex-col gap-1.5 text-body-sm">
                          <p className="flex items-center gap-2 text-label font-semibold">
                            <span className="sticker sticker-sky">Take {t.number}</span>
                            <Score value={t.overall} />
                            <span className="font-normal text-muted">{t.mode === "voice" ? "spoken" : "typed"}</span>
                          </p>
                          <p className="max-w-[68ch] whitespace-pre-line leading-relaxed text-muted">{t.transcript}</p>
                          <p className="max-w-[68ch] leading-relaxed">
                            <span className="font-semibold">Fix: </span>
                            {t.grading.fix}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
                {showTranscripts && q.takes.length > 0 && (
                  <div className="ml-7 mt-3">
                    <SaveAnswerPanel role={session.role} question={q.question} takes={q.takes} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {genuine.length > 0 && (
        <section aria-labelledby="areas" className="flex flex-col gap-3">
          <h2 id="areas" className="text-title font-semibold tracking-[-0.01em]">
            Where you stand
          </h2>
          <p className="max-w-[60ch] text-muted">
            Strongest in {strongest.map((r) => RUBRIC_LABELS[r.key].toLowerCase()).join(" and ")}. Most room to grow in{" "}
            {weakest.map((r) => RUBRIC_LABELS[r.key].toLowerCase()).join(" and ")}.
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {rubricAvg.map((r) => (
              <div key={r.key} className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <dt className="text-body-sm">{RUBRIC_LABELS[r.key]}</dt>
                <dd className="font-semibold"><Score value={r.avg} /></dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {(strengths.length > 0 || fixes.length > 0) && (
        <section className="grid gap-8 md:grid-cols-2">
          {strengths.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-title font-semibold tracking-[-0.01em]">Keep doing</h2>
              <ul className="flex flex-col gap-3">
                {strengths.map((t, i) => (
                  <li key={t.id} className="leading-relaxed text-muted">
                    <q className="text-ink">{t.grading.strength.quote}</q>{" "}
                    {t.grading.strength.why !== strengths[i - 1]?.grading.strength.why && t.grading.strength.why}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fixes.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-title font-semibold tracking-[-0.01em]">
                <span className="sticker">Work on</span>
              </h2>
              <ul className="flex flex-col gap-3">
                {fixes.map((t) => (
                  <li key={t.id} className="font-medium leading-relaxed">
                    {t.grading.fix}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`/practice/new?role=${encodeURIComponent(session.role)}`} className="btn btn-go h-12 px-6">
          Practice another round
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
        </Link>
        <Link href="/archive" className="btn btn-ghost h-12 px-6">
          See all sessions
        </Link>
      </div>
    </div>
  );
}
