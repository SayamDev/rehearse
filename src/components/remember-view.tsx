"use client";

import Link from "next/link";
import { ArrowRightIcon, CaretRightIcon } from "@phosphor-icons/react";
import { StrengthMeter } from "./strength-meter";
import { describeDue, isDue } from "@/lib/memory";
import { localDay, useStore } from "@/lib/store";
import type { SavedAnswer } from "@/lib/types";

export function RememberView() {
  const { hydrated, bank } = useStore();

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading saved answers">
        <div className="skeleton h-9 w-40" />
        <div className="skeleton h-5 w-56" />
        <div className="skeleton h-40 w-full rounded-[10px]" />
      </div>
    );
  }

  const today = localDay();
  const due = bank.filter((a) => isDue(a, today)).sort((a, b) => a.box - b.box);
  const later = bank.filter((a) => !isDue(a, today)).sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Remember</h1>
        {bank.length === 0 ? null : due.length > 0 ? (
          <p className="text-muted">
            <span className="tnum font-semibold text-ink">{due.length}</span> {due.length === 1 ? "answer is" : "answers are"} ready
            to practise from memory today.
          </p>
        ) : (
          <p className="text-muted">Nothing due today. Your next review is {describeDue(later[0].due, today).replace("Due ", "")}.</p>
        )}
        {bank.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {due.length > 0 ? (
              <Link href="/remember/drill" className="btn btn-go h-12 px-6">
                Start recall
                <ArrowRightIcon size={16} weight="bold" aria-hidden />
              </Link>
            ) : (
              <Link href="/remember/drill?all=1" className="btn btn-ghost h-12 px-6">
                Practise all anyway
              </Link>
            )}
          </div>
        )}
      </header>

      {bank.length === 0 && (
        <section className="panel flex flex-col items-start gap-3 p-6">
          <h2 className="text-title font-semibold">Save answers you want to remember</h2>
          <p className="max-w-[56ch] leading-relaxed text-muted">
            After you get notes on an answer, choose <span className="font-medium text-ink">Save this answer to remember</span>.
            Pick your best take or the stronger version, put it in your own words, and pick a few key points. Then practise
            saying it from memory here, a little each day, until it sticks.
          </p>
          <Link href="/" className="btn btn-go">
            Practise a question
          </Link>
        </section>
      )}

      {due.length > 0 && <AnswerList title="Due today" answers={due} today={today} />}
      {later.length > 0 && <AnswerList title={due.length > 0 ? "Coming up" : "Saved answers"} answers={later} today={today} />}
    </div>
  );
}

function AnswerList({ title, answers, today }: { title: string; answers: SavedAnswer[]; today: string }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-title font-semibold tracking-[-0.01em]">{title}</h2>
      <ul className="panel">
        {answers.map((a) => (
          <li key={a.id} className="border-b border-line last:border-b-0">
            <Link href={`/remember/${a.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2 sm:px-6">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="font-medium leading-snug">{a.question.text}</span>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-muted">
                  <span>{a.role}</span>
                  <StrengthMeter box={a.box} />
                  {!isDue(a, today) && <span>{describeDue(a.due, today)}</span>}
                </span>
              </div>
              <CaretRightIcon size={16} className="shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
