"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { deltaStickerClass, deltaLabel } from "./delta-sticker";
import { Score } from "./score";
import { ScoreSticker } from "./score-sticker";

type Sample = { role: string; question: string; before: number; after: number; quote: string; why: string; next: string };

const SAMPLES: Sample[] = [
  {
    role: "Retail sales associate",
    question: "Tell me about a time you dealt with a difficult customer.",
    before: 5.8,
    after: 7.6,
    quote: "I called the supplier and got her a delivery date that afternoon.",
    why: "You named a specific action you took yourself.",
    next: "Finish with the result: say what changed, like whether she came back.",
  },
  {
    role: "Care assistant",
    question: "Tell me about a time you helped someone who was upset.",
    before: 5.2,
    after: 7.4,
    quote: "I sat with her and asked what would help her feel calmer.",
    why: "You showed patience and put her needs first.",
    next: "Add how it turned out, like whether she settled or smiled again.",
  },
  {
    role: "Content creator",
    question: "Tell me about a project you're proud of.",
    before: 6.1,
    after: 8.3,
    quote: "I grew the page from 200 to 2,000 followers in three months.",
    why: "A real number makes your result easy to believe.",
    next: "Say what you did yourself to get there, not just the result.",
  },
];

const EVERY_MS = 7000;

/**
 * The landing page's sample notes, alive: the new score counts up from the first take,
 * the improvement pops on, and it moves through a few different jobs. Pauses on hover or
 * focus, stays put under reduced motion, and the dots let people choose one.
 */
export function SampleNotes() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const box = useRef<HTMLElement>(null);
  const s = SAMPLES[i];

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || held || !visible) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SAMPLES.length), EVERY_MS);
    return () => clearTimeout(t);
  }, [i, reduce, held, visible]);

  const fade = reduce
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <figure
      ref={box}
      className="panel relative overflow-hidden p-4 sm:p-6"
      aria-label="Sample feedback for a practice answer"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <span className="absolute right-4 top-4 rounded-full border border-line px-2 py-0.5 text-tape text-muted">Sample</span>

      <AnimatePresence mode="wait" initial={false}>
        <m.div key={i} {...fade}>
          <p className="min-h-[2lh] pr-16 text-body-sm text-muted sm:min-h-0">
            {s.role} · {s.question}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3 pt-4 sm:mt-5">
            <div className="flex flex-col gap-1">
              <span className="text-tape font-medium text-muted">Take 1</span>
              <Score value={s.before} className="text-score-sm font-semibold text-muted line-through decoration-1" />
            </div>
            <ScoreSticker value={s.after} tab="Take 2" slap={!reduce} countFrom={s.before} />
            <m.span
              className={`${deltaStickerClass(s.after - s.before)} mb-2`}
              initial={reduce ? false : { scale: 0.4, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 16, delay: reduce ? 0 : 1.05 }}
            >
              {deltaLabel(s.after - s.before)}
            </m.span>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <dt className="text-label font-semibold">What worked</dt>
              <dd className="mt-1 text-body-sm leading-relaxed text-muted">
                <q className="text-ink">{s.quote}</q> {s.why}
              </dd>
            </div>
            <div>
              <dt className="text-label font-semibold">Next take</dt>
              <dd className="mt-1 text-body-sm leading-relaxed text-muted">{s.next}</dd>
            </div>
          </dl>
        </m.div>
      </AnimatePresence>

      <div className="mt-5 flex items-center gap-1" role="group" aria-label="Choose a sample">
        {SAMPLES.map((x, n) => (
          <button
            key={x.role}
            type="button"
            aria-label={`Show sample for ${x.role}`}
            aria-pressed={n === i}
            onClick={() => setI(n)}
            className="flex size-8 items-center justify-center rounded-full"
          >
            <span className={`block h-2 rounded-full transition-[width,background-color] duration-300 ${n === i ? "w-6 bg-ink" : "w-2 bg-line"}`} />
          </button>
        ))}
      </div>
    </figure>
  );
}
