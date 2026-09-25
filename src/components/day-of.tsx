"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, CheckIcon, CoffeeIcon, PrinterIcon } from "@phosphor-icons/react";
import { toggleDayTick, useStore } from "@/lib/store";
import { countdownLabel, daysUntil, interviewDate } from "@/lib/countdown";
import { DAY_CHECKLIST } from "@/lib/calm";
import { OPENER } from "@/lib/prepare";
import { Breathing } from "./breathing";
import { PocketList, pocketCards } from "./pocket-cards";

const CHEERS = [
  "You've practised. You're more ready than you feel.",
  "Nerves mean you care. Interviewers expect them.",
  "They invited you because they already like what they've seen.",
  "You don't need to be perfect. Be clear, be kind, be you.",
];

/** Interview-morning mode: everything for the day on one calm screen. */
export function DayOf() {
  const { hydrated, profile, bank } = useStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!hydrated) return <div className="skeleton h-64 w-full rounded-[var(--radius-panel)]" aria-hidden />;

  const interview = profile.interview;
  const key = interview?.when ?? "no-date";
  const ticks = profile.dayTicks?.when === key ? profile.dayTicks.done : [];
  const intro = bank.find((a) => a.question.id === OPENER.id);
  const asks = profile.askList.slice(0, 3);
  const cheer = CHEERS[now.getDate() % CHEERS.length];
  const days = interview ? daysUntil(interview.when, now) : null;
  // Stories and numbers first: they cover the most questions.
  const pockets = pocketCards(profile, bank).sort((a, b) => ["story", "numbers", "company", "answer"].indexOf(a.kind) - ["story", "numbers", "company", "answer"].indexOf(b.kind));

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span className="sticker sticker-sun w-fit -rotate-2">Interview day</span>
        <h1 className="text-display font-extrabold leading-[1.05] tracking-[-0.03em]">You&apos;ve got this.</h1>
        <p className="max-w-[52ch] text-body-lg text-muted">{cheer}</p>
        {interview && days !== null && days >= 0 ? (
          <p className="text-body">
            <span className="font-semibold">{countdownLabel(interview.when, now)}</span>
            <span className="text-muted">
              {" "}
              · {interview.role} ·{" "}
              {interviewDate(interview.when).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              {interview.where && ` · ${interview.where}`}
            </span>
          </p>
        ) : (
          <Link href="/prepare" className="w-fit text-label font-semibold underline underline-offset-4">
            Add your interview date for a countdown
          </Link>
        )}
      </header>

      <section aria-labelledby="checklist" className="flex flex-col gap-3">
        <h2 id="checklist" className="text-title-lg font-bold tracking-[-0.02em]">
          Before you go
        </h2>
        <ul className="flex flex-col gap-2">
          {DAY_CHECKLIST.map((item, i) => {
            const done = ticks.includes(i);
            return (
              <li key={item}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  onClick={() => toggleDayTick(key, i)}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-control)] py-2 text-left"
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      done ? "border-[var(--die)] bg-lime text-on-ink" : "border-line"
                    }`}
                    aria-hidden
                  >
                    {done && <CheckIcon size={14} weight="bold" />}
                  </span>
                  <span className={done ? "text-muted line-through" : ""}>{item}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="warm" className="grid gap-3 sm:grid-cols-2">
        <h2 id="warm" className="sr-only">
          Warm up
        </h2>
        <Link href="/practice/warmup" className="panel group flex items-center gap-4 p-5">
          <span className="sticker sticker-lime size-11 shrink-0 justify-center p-0" aria-hidden>
            <CoffeeIcon size={22} weight="bold" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-bold">Warm-up round</span>
            <span className="text-body-sm text-muted">Three easy questions to get talking</span>
          </span>
          <ArrowRightIcon size={18} weight="bold" className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
        <Link href="/prepare/card" className="panel group flex items-center gap-4 p-5">
          <span className="sticker sticker-sun size-11 shrink-0 justify-center p-0" aria-hidden>
            <PrinterIcon size={22} weight="bold" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-bold">Your interview card</span>
            <span className="text-body-sm text-muted">Intro, stories and questions</span>
          </span>
          <ArrowRightIcon size={18} weight="bold" className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </section>

      {(intro || asks.length > 0) && (
        <section aria-labelledby="glance" className="flex flex-col gap-4">
          <h2 id="glance" className="text-title-lg font-bold tracking-[-0.02em]">
            One last look
          </h2>
          {intro && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label font-semibold text-muted">Your intro</h3>
              <p className="max-w-[62ch] leading-relaxed">{intro.text}</p>
            </div>
          )}
          {asks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label font-semibold text-muted">Questions to ask them</h3>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {asks.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {pockets.length > 0 && (
        <section aria-labelledby="pockets" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="pockets" className="text-title-lg font-bold tracking-[-0.02em]">
              Your pocket cards
            </h2>
            <Link href="/remember/cards" className="text-label font-semibold underline underline-offset-4">
              Make a lock-screen image
            </Link>
          </div>
          <PocketList cards={pockets.slice(0, 6)} compact />
        </section>
      )}

      <section aria-labelledby="breathe" className="flex flex-col gap-3">
        <h2 id="breathe" className="text-title-lg font-bold tracking-[-0.02em]">
          One minute of breathing
        </h2>
        <p className="text-body-sm text-muted">Do this just before you go in, or while you wait.</p>
        <Breathing cycles={3} compact />
      </section>
    </div>
  );
}
