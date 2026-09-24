"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIcon } from "@phosphor-icons/react";
import { BLANK_LINES, DAY_CHECKLIST, GROUNDING, REFRAMES } from "@/lib/calm";
import { Breathing } from "./breathing";
import { BestAnswers } from "./best-answers";

const CHECK_KEY = "rehearse:day-checklist";

/** The Calm corner: breathing, grounding, what to say when you freeze, and a checklist for the day. */
export function CalmView() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Calm corner</h1>
        <p className="max-w-[58ch] text-muted">
          Feeling nervous before an interview is normal, and it gets easier with practice. Use these any time: before you
          practise, before the real thing, or right now. To ease in gently, try the{" "}
          <Link href="/practice/warmup" className="font-semibold text-ink underline underline-offset-4">
            warm-up round
          </Link>
          .
        </p>
      </div>

      <section aria-labelledby="breathe" className="panel flex flex-col items-center gap-4 px-5 py-8 sm:py-10">
        <h2 id="breathe" className="text-title-lg font-bold tracking-[-0.02em]">
          Breathe with the circle
        </h2>
        <Breathing />
      </section>

      <Grounding />

      <BestAnswers />

      <section aria-labelledby="blank" className="flex flex-col gap-3">
        <h2 id="blank" className="text-title-lg font-bold tracking-[-0.02em]">
          If your mind goes blank
        </h2>
        <p className="max-w-[58ch] text-body-sm text-muted">
          It happens to everyone. Saying one of these out loud is completely fine, and it buys you time to think.
        </p>
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {BLANK_LINES.map((l) => (
            <li key={l} className="py-3 text-body-lg font-medium">
              <q>{l}</q>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reframe" className="flex flex-col gap-4">
        <h2 id="reframe" className="text-title-lg font-bold tracking-[-0.02em]">
          Another way to see it
        </h2>
        <dl className="grid gap-x-10 gap-y-5 md:grid-cols-2">
          {REFRAMES.map((r) => (
            <div key={r.title} className="flex flex-col gap-1">
              <dt className="font-semibold">{r.title}</dt>
              <dd className="max-w-[48ch] text-body-sm leading-relaxed text-muted">{r.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <DayChecklist />

      <p className="max-w-[62ch] border-t border-line pt-6 text-body-sm leading-relaxed text-muted">
        If panic happens a lot, or gets in the way of everyday life, please talk to a doctor or someone you trust. You
        don&apos;t have to handle it alone. You can also{" "}
        <Link href="/coach" className="font-semibold text-ink underline underline-offset-4">
          talk it through with Cobi
        </Link>
        .
      </p>
    </div>
  );
}

function Grounding() {
  const [step, setStep] = useState(-1);
  const current = GROUNDING[step];

  return (
    <section aria-labelledby="ground" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="ground" className="text-title-lg font-bold tracking-[-0.02em]">
          5, 4, 3, 2, 1
        </h2>
        <p className="max-w-[58ch] text-body-sm text-muted">
          When your thoughts are spinning, this brings you back into the room. Take your time with each step.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-5" aria-live="polite">
        {current ? (
          <>
            <span className="sticker sticker-sky tnum size-16 justify-center p-0 font-display text-score-sm" aria-hidden>
              {current.count}
            </span>
            <p className="min-w-0 flex-1 text-body-lg font-medium">
              {current.count === 1 ? "Take 1 " : `Notice ${current.count} `}
              {current.sense}.
            </p>
          </>
        ) : (
          <p className="text-body-lg font-medium">{step === -1 ? "Ready when you are." : "Done. You're here, and you're okay."}</p>
        )}
      </div>
      <div className="flex gap-2">
        {step < GROUNDING.length - 1 ? (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step + 1)}>
            {step === -1 ? "Start" : "Next"}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step === GROUNDING.length - 1 ? GROUNDING.length : -1)}>
            {step === GROUNDING.length - 1 ? "Finish" : "Start again"}
          </button>
        )}
      </div>
    </section>
  );
}

function DayChecklist() {
  const [ticked, setTicked] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHECK_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setTicked(JSON.parse(raw) as string[]);
    } catch {
      // Storage blocked: the list just starts empty.
    }
  }, []);

  function toggle(item: string) {
    const next = ticked.includes(item) ? ticked.filter((t) => t !== item) : [...ticked, item];
    setTicked(next);
    try {
      window.localStorage.setItem(CHECK_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: ticks last until the page closes.
    }
  }

  return (
    <section aria-labelledby="day" className="flex flex-col gap-3">
      <h2 id="day" className="text-title-lg font-bold tracking-[-0.02em]">
        Before you go in
      </h2>
      <p className="text-body-sm text-muted">
        Less to worry about on the day means more calm. <span className="tnum">{ticked.length}</span> of {DAY_CHECKLIST.length} done.
      </p>
      <ul className="flex flex-col gap-2">
        {DAY_CHECKLIST.map((item) => {
          const on = ticked.includes(item);
          return (
            <li key={item}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(item)} />
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border-[3px] transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] ${
                    on ? "border-[var(--die)] bg-lime text-on-ink" : "border-line"
                  }`}
                >
                  {on && <CheckIcon size={14} weight="bold" />}
                </span>
                <span className={on ? "text-muted line-through" : ""}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
