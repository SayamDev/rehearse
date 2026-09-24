"use client";

import { useEffect } from "react";
import { animate, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Score } from "./score";

/**
 * A score printed on a white die-cut sticker, with a sky tab naming the take.
 * With `slap`, it drops in from larger and tilted and springs onto the sheet.
 */
export function ScoreSticker({
  value,
  tab,
  size = "md",
  slap = false,
  tilt = -3,
  countFrom,
}: {
  value: number;
  tab?: string;
  size?: "md" | "lg";
  slap?: boolean;
  tilt?: number;
  /** Counts up from this score to `value` (the landing page sample). */
  countFrom?: number;
}) {
  const reduce = useReducedMotion();
  const text = size === "lg" ? "text-score-lg" : "text-score";
  return (
    <m.span
      initial={slap && !reduce ? { scale: 1.35, rotate: tilt - 10, opacity: 0 } : false}
      animate={{ scale: 1, rotate: tilt, opacity: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 17 }}
      className="relative inline-flex flex-col items-start rounded-[22px] border-4 border-[var(--die)] bg-surface px-4 pb-2 pt-3 shadow-[var(--sticker-shadow)]"
      aria-label={`${tab ? `${tab}: ` : ""}score ${value.toFixed(1)} out of 10`}
      role="img"
    >
      {tab && <span className="sticker sticker-sky absolute -left-2 -top-4">{tab}</span>}
      {countFrom !== undefined && !reduce ? (
        <CountUp from={countFrom} to={value} className={`tnum font-display ${text} font-extrabold leading-none tracking-[-0.03em]`} />
      ) : (
        <Score value={value} className={`${text} font-extrabold leading-none tracking-[-0.03em]`} />
      )}
    </m.span>
  );
}

/** A number that counts up without re-rendering React on every frame. */
function CountUp({ from, to, className }: { from: number; to: number; className: string }) {
  const mv = useMotionValue(from);
  const shown = useTransform(mv, (v) => v.toFixed(1));
  useEffect(() => {
    const c = animate(mv, to, { duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [mv, to]);
  return <m.span className={className}>{shown}</m.span>;
}
