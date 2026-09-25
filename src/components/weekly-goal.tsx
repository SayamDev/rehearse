"use client";

import { useState } from "react";
import { CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { setWeeklyGoal, useStore } from "@/lib/store";
import { roundsThisWeek, weeklyGoal } from "@/lib/goal";
import { Segmented } from "./segmented";

const GOALS = ["1", "2", "3", "5", "7"];

/**
 * A gentle weekly target: a number of finished rounds, Monday to Sunday. Missing a day
 * never resets it. The goal itself is tucked behind "Change goal", since it's set once.
 */
export function WeeklyGoal() {
  const { sessions, profile } = useStore();
  const [editing, setEditing] = useState(false);
  const goal = weeklyGoal(profile);
  const done = roundsThisWeek(sessions);
  const met = done >= goal;
  const left = goal - done;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body font-semibold" aria-live="polite">
          <span className="tnum">{Math.min(done, goal)}</span> of {goal} {goal === 1 ? "round" : "rounds"} done
          {met && <span className="sticker sticker-lime ml-2 -rotate-2 align-middle">Goal reached</span>}
        </p>
        <button
          type="button"
          className="btn btn-quiet min-h-10 text-label"
          aria-expanded={editing}
          onClick={() => setEditing((e) => !e)}
        >
          <PencilSimpleIcon size={16} weight="bold" aria-hidden />
          {editing ? "Done" : "Change goal"}
        </button>
      </div>
      <ol className="flex flex-wrap gap-2" aria-hidden>
        {Array.from({ length: goal }, (_, i) => (
          <li
            key={i}
            className={`flex size-9 items-center justify-center rounded-full border-2 ${
              i < done ? "border-[var(--die)] bg-lime text-on-ink shadow-[var(--sticker-shadow)]" : "border-dashed border-line bg-surface-2"
            }`}
          >
            {i < done && <CheckIcon size={16} weight="bold" />}
          </li>
        ))}
      </ol>
      {editing && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-label text-muted">Rounds per week</span>
          <Segmented
            label="Rounds per week"
            value={GOALS.includes(String(goal)) ? String(goal) : "3"}
            options={GOALS.map((g) => ({ value: g, label: g }))}
            onChange={(v) => setWeeklyGoal(Number(v))}
          />
        </div>
      )}
      <p className="max-w-[60ch] text-label text-muted">
        {met
          ? "Nice. Anything more this week is a bonus."
          : `${left} more ${left === 1 ? "round" : "rounds"} to go, whenever you have time. Missing a day doesn't break anything.`}
      </p>
    </div>
  );
}
