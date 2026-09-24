"use client";

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";
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
      {countFrom !== undefined ? (
        // Rendered the same on the server and in the browser; with reduced motion it jumps straight to the score.
        <CountUp from={countFrom} to={value} instant={Boolean(reduce)} className={`tnum font-display ${text} font-extrabold leading-none tracking-[-0.03em]`} />
      ) : (
        <Score value={value} className={`${text} font-extrabold leading-none tracking-[-0.03em]`} />
      )}
    </m.span>
  );
}

/** A number that counts up from the first take's score. The server and browser start on the same number. */
function CountUp({ from, to, instant, className }: { from: number; to: number; instant: boolean; className: string }) {
  const [shown, setShown] = useState(from);
  useEffect(() => {
    let raf = 0;
    // With reduced motion there's no counting: the score just appears on the next frame.
    const begin = instant ? -Infinity : performance.now() + 250;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - begin) / 900));
      // Ease out: fast at first, settling gently on the score.
      setShown(from + (to - from) * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, instant]);
  return <span className={className}>{shown.toFixed(1)}</span>;
}
