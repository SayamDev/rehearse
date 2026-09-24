"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { setWeeklyGoal, useStore } from "@/lib/store";
import { roundsThisWeek, weeklyGoal } from "@/lib/goal";
import { Segmented } from "./segmented";

const GOALS = ["1", "2", "3", "5", "7"];

/** A gentle weekly target: a number of finished rounds, Monday to Sunday. Missing a day never resets it. */
export function WeeklyGoal() {
  const { sessions, profile } = useStore();
  const goal = weeklyGoal(profile);
  const done = roundsThisWeek(sessions);
  const met = done >= goal;

  return (
    <section aria-labelledby="week" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="week" className="text-title font-bold tracking-[-0.01em]">
          This week
        </h2>
        <p className="text-body-sm text-muted" aria-live="polite">
          <span className="tnum font-semibold text-ink">{Math.min(done, goal)}</span> of {goal} {goal === 1 ? "round" : "rounds"}
          {met && <span className="sticker sticker-lime ml-2 -rotate-2 align-middle">Goal reached</span>}
        </p>
      </div>
      <ol className="flex flex-wrap gap-2" aria-hidden>
        {Array.from({ length: goal }, (_, i) => (
          <li
            key={i}
            className={`flex size-9 items-center justify-center rounded-full border-2 ${
              i < done ? "border-[var(--die)] bg-lime text-on-ink shadow-[var(--sticker-shadow)]" : "border-dashed border-line"
            }`}
          >
            {i < done && <CheckIcon size={16} weight="bold" />}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-label text-muted">Weekly goal</span>
        <Segmented
          label="Rounds per week"
          value={GOALS.includes(String(goal)) ? String(goal) : "3"}
          options={GOALS.map((g) => ({ value: g, label: g }))}
          onChange={(v) => setWeeklyGoal(Number(v))}
        />
      </div>
      <p className="max-w-[60ch] text-label text-muted">
        Unlike a streak, missing a day doesn&apos;t break anything. Any finished round counts, whenever you have time this week.
      </p>
    </section>
  );
}
