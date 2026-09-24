"use client";

import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { TargetIcon } from "@phosphor-icons/react";
import { SKILL_FOCUS, type ScorePoint, type SkillAverage } from "@/lib/skills";

const W = 600;
const H = 200;
const PAD = { top: 16, right: 20, bottom: 28, left: 28 };

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Score of each round over time: a hand-drawn-feeling line on the sticker sheet. */
export function ScoreChart({ points, gain }: { points: ScorePoint[]; gain: number | null }) {
  const reduce = useReducedMotion();
  if (points.length < 2) {
    return (
      <p className="text-body-sm text-muted">
        Finish {points.length ? "one more round" : "two rounds"} to see your scores as a line here.
      </p>
    );
  }
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (score: number) => PAD.top + (1 - score / 10) * (H - PAD.top - PAD.bottom);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const summary =
    gain === null
      ? `Your last ${points.length} rounds, latest ${last.score} out of 10.`
      : `Your last ${points.length} rounds. Recent rounds average ${gain >= 0 ? `${gain} higher` : `${Math.abs(gain)} lower`} than your first ones.`;

  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={summary}>
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1.5} strokeDasharray={v === 0 ? undefined : "4 6"} />
            <text x={PAD.left - 10} y={y(v) + 4} textAnchor="end" className="fill-[var(--muted)] text-tape tnum">
              {v}
            </text>
          </g>
        ))}
        <m.path
          d={d}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <circle
              key={p.id}
              cx={x(i)}
              cy={y(p.score)}
              r={isLast ? 8 : 5}
              fill={isLast ? "var(--sun)" : "var(--surface)"}
              stroke="var(--ink)"
              strokeWidth={2.5}
            >
              <title>{`${shortDate(p.date)}, ${p.role}: ${p.score}`}</title>
            </circle>
          );
        })}
        <text x={x(points.length - 1)} y={y(last.score) - 16} textAnchor="middle" className="fill-[var(--ink)] font-bold text-body-sm tnum">
          {last.score}
        </text>
        <text x={PAD.left} y={H - 6} className="fill-[var(--muted)] text-tape">
          {shortDate(points[0].date)}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-[var(--muted)] text-tape">
          {shortDate(last.date)}
        </text>
      </svg>
      <figcaption className="text-body-sm text-muted">
        {gain === null ? (
          "Each dot is one round. Keep going to see how much you've improved."
        ) : gain > 0 ? (
          <>
            Your recent rounds average <span className="tnum font-semibold text-up">+{gain}</span> higher than your first ones.
          </>
        ) : (
          "Scores go up and down. Harder questions and new jobs pull them down for a while. That's normal."
        )}
      </figcaption>
    </figure>
  );
}

/** Average of each skill over recent answers, with the weakest one to work on. */
export function SkillBars({ skills, weakest }: { skills: SkillAverage[]; weakest: SkillAverage | null }) {
  if (!skills.length) {
    return <p className="text-body-sm text-muted">Answer a few questions to see which skills are strongest.</p>;
  }
  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        {skills.map((s) => {
          const focus = weakest?.key === s.key;
          return (
            <li key={s.key} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3">
              <span className={`text-label ${focus ? "font-bold" : "font-medium text-muted"}`}>{s.label}</span>
              <span className="h-3 overflow-hidden rounded-full border border-line bg-surface-2" aria-hidden>
                <span
                  className={`block h-full rounded-full transition-[width] duration-500 ${focus ? "bg-sky" : "bg-ink/70"}`}
                  style={{ width: `${s.score * 10}%` }}
                />
              </span>
              <span className="tnum text-right text-label font-semibold">
                {s.score}
                <span className="sr-only"> out of 10</span>
              </span>
            </li>
          );
        })}
      </ul>
      {weakest ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-panel)] border-2 border-sky bg-surface p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <TargetIcon size={20} weight="bold" className="text-sky" aria-hidden />
            <p className="font-semibold">Your focus: {weakest.label}</p>
          </div>
          <p className="max-w-[58ch] text-body-sm leading-relaxed text-muted">{SKILL_FOCUS[weakest.key].tip}</p>
          <Link href={`/practice/new?focus=${weakest.key}`} className="btn btn-primary w-fit">
            Practise {weakest.label.toLowerCase()}
          </Link>
        </div>
      ) : (
        <p className="text-body-sm text-muted">After three answers, we&apos;ll point out one skill to focus on.</p>
      )}
    </div>
  );
}
