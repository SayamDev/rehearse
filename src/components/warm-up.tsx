"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { WARMUPS, warmupNote } from "@/lib/calm";
import { countWords } from "@/lib/delivery";
import { useStore } from "@/lib/store";
import { AnswerComposer, type SubmittedAnswer } from "./answer-composer";
import { InterviewerCard } from "./interviewer-card";

const COUNT = 3;

/**
 * Warm-up round: three easy, everyday questions with Sam, nothing scored and
 * nothing saved. Gets people talking before the real questions.
 */
export function WarmUp() {
  const { hydrated, profile } = useStore();
  // A fresh set each visit, picked once.
  const [questions] = useState(() => [...WARMUPS].sort(() => Math.random() - 0.5).slice(0, COUNT));
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading warm-up">
        <div className="skeleton h-28 w-full rounded-[var(--radius-panel)]" />
        <div className="skeleton h-56 w-full rounded-[var(--radius-panel)]" />
      </div>
    );
  }

  const done = index >= COUNT;

  function submit(a: SubmittedAnswer) {
    setNote(warmupNote(countWords(a.text), a.durationSec, a.mode === "voice"));
  }

  function next() {
    setNote(null);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-5 pt-4">
        <span className="sticker sticker-lime">Warmed up</span>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">You&apos;re ready for the real questions</h1>
        <p className="max-w-[56ch] text-muted">
          Talking about easy things first helps your voice and your nerves settle. Keep that feeling going.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/practice/new" className="btn btn-go">
            Start practising <ArrowRightIcon size={18} weight="bold" aria-hidden />
          </Link>
          <Link href="/practice/new?mode=mock" className="btn btn-ghost">
            Try a mock interview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-label text-muted">
        <span className="font-semibold text-ink">Warm-up</span> · question {index + 1} of {COUNT} · nothing is scored
      </p>
      <InterviewerCard
        personaId="friendly"
        question={questions[index]}
        intro={index === 0 ? "Let's just chat for a minute before we start. No right or wrong answers." : undefined}
        readAloud={profile.settings.readAloud}
        voiceEngine={profile.settings.voiceEngine}
        autoRead={note === null}
        upNext={questions[index + 1]}
        headingId="warmup-question"
        srPrefix={`Warm-up question ${index + 1} of ${COUNT}: `}
      />
      {note === null ? (
        <AnswerComposer
          key={index}
          takeNumber={index + 1}
          label={`Warm-up ${index + 1}`}
          submitLabel="Done"
          defaultMode={profile.settings.defaultAnswerMode}
          onSubmit={submit}
          interviewer="Sam"
          placeholder="Just answer like you're chatting with a friend."
        />
      ) : (
        <section aria-label="How that went" className="panel flex flex-col items-start gap-4 p-5 sm:p-6">
          <p className="text-body-lg font-medium leading-snug" role="status">
            {note}
          </p>
          <button type="button" className="btn btn-go" onClick={next}>
            {index === COUNT - 1 ? "Finish warm-up" : "Next question"} <ArrowRightIcon size={18} weight="bold" aria-hidden />
          </button>
        </section>
      )}
    </div>
  );
}
