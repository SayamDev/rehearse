"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRightIcon, CheckIcon, EyeIcon, XIcon } from "@phosphor-icons/react";
import { kitCards, numberMatches, shuffled, type KitCard } from "@/lib/kit";
import { useStore } from "@/lib/store";

/**
 * Quiz my kit: quick flashcards on stories, company facts, questions to ask and numbers.
 * Numbers are typed and checked; the rest are said in your head, then revealed and
 * marked honestly. Cards marked "not yet" come back once at the end.
 */
export function KitQuiz() {
  const { hydrated, profile } = useStore();
  if (!hydrated) return <div className="skeleton h-64 w-full rounded-[var(--radius-panel)]" aria-hidden />;
  const cards = kitCards({ stories: profile.stories ?? [], company: profile.company, numbers: profile.numbers ?? [], askList: profile.askList });
  if (!cards.length) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Quiz my kit</h1>
        <p className="max-w-[56ch] text-muted">Nothing to quiz yet. Add a story, some facts about the company, or a number first.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/remember/stories" className="btn btn-go">
            Add a story
          </Link>
          <Link href="/remember/company" className="btn btn-ghost">
            Know the company
          </Link>
          <Link href="/remember/numbers" className="btn btn-ghost">
            Add numbers
          </Link>
        </div>
      </div>
    );
  }
  return <Quiz cards={cards} />;
}

function Quiz({ cards }: { cards: KitCard[] }) {
  const [queue, setQueue] = useState(() => shuffled(cards));
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [typed, setTyped] = useState("");
  const [typedRight, setTypedRight] = useState<boolean | null>(null);
  const [firstTime, setFirstTime] = useState(0);
  const [retried, setRetried] = useState<Set<string>>(() => new Set());
  const inputId = useId();

  if (index >= queue.length) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Kit quiz done</h1>
        <p className="text-body-lg">
          <span className="tnum font-bold">{firstTime}</span> of <span className="tnum font-bold">{cards.length}</span> right first time.
        </p>
        <p className="max-w-[56ch] text-muted">
          {firstTime === cards.length ? "You know your kit. Do this again the day before the interview." : "The ones you missed came round again. Another go tomorrow will lock them in."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-go"
            onClick={() => {
              setQueue(shuffled(cards));
              setIndex(0);
              setFirstTime(0);
              setRetried(new Set());
            }}
          >
            Go again
          </button>
          <Link href="/remember" className="btn btn-ghost">
            Back to Remember
          </Link>
        </div>
      </div>
    );
  }

  const card = queue[index];
  const repeat = retried.has(card.id) && queue.indexOf(card) !== index;

  function mark(gotIt: boolean) {
    if (gotIt && !retried.has(card.id)) setFirstTime((n) => n + 1);
    if (!gotIt && !retried.has(card.id)) {
      setRetried((r) => new Set(r).add(card.id));
      setQueue((q) => [...q, card]);
    }
    setShown(false);
    setTyped("");
    setTypedRight(null);
    setIndex((i) => i + 1);
  }

  function checkNumber(e: React.FormEvent) {
    e.preventDefault();
    if (card.kind !== "number") return;
    setTypedRight(numberMatches(typed, card.value));
    setShown(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-label font-semibold text-muted">Quiz my kit</h1>
        <p className="tnum text-label text-muted" aria-live="polite">
          {index + 1} of {queue.length}
          {repeat && " · second go"}
        </p>
      </div>

      <section aria-labelledby="quiz-q" className="panel flex flex-col gap-5 p-5 sm:p-7">
        <span className={`sticker w-fit text-label ${card.kind === "story" ? "sticker-grape" : card.kind === "number" ? "sticker-sun" : "sticker-sky"}`}>
          {card.kind === "story" ? "Which story?" : card.kind === "number" ? "Number" : "The company"}
        </span>
        <h2 id="quiz-q" className="text-question font-semibold leading-[1.2] tracking-[-0.02em]">
          {card.prompt}
        </h2>
        <p className="text-muted">{card.hint}</p>

        {card.kind === "number" && !shown && (
          <form onSubmit={checkNumber} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor={inputId} className="sr-only">
              The number
            </label>
            <input id={inputId} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" inputMode="decimal" className="field sm:w-48" autoFocus />
            <button type="submit" className="btn btn-primary">
              Check
            </button>
          </form>
        )}

        {shown && (
          <div className="flex flex-col gap-2 rounded-control bg-surface-2 p-4" role="status">
            {typedRight !== null && (
              <p className={`flex items-center gap-2 font-semibold ${typedRight ? "text-up" : "text-down"}`}>
                {typedRight ? <CheckIcon size={18} weight="bold" aria-hidden /> : <XIcon size={18} weight="bold" aria-hidden />}
                {typedRight ? "Right!" : "Not quite."}
              </p>
            )}
            <ul className="flex flex-col gap-1.5">
              {card.answer.map((a) => (
                <li key={a} className="leading-relaxed">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {!shown && card.kind !== "number" && (
          <button type="button" className="btn btn-go h-12 px-6" onClick={() => setShown(true)}>
            <EyeIcon size={18} weight="bold" aria-hidden /> Show me
          </button>
        )}
        {shown && typedRight === null && (
          <>
            <button type="button" className="btn btn-go h-12 px-6" onClick={() => mark(true)}>
              <CheckIcon size={18} weight="bold" aria-hidden /> Got it
            </button>
            <button type="button" className="btn btn-ghost h-12 px-6" onClick={() => mark(false)}>
              Not yet
            </button>
          </>
        )}
        {shown && typedRight !== null && (
          <button type="button" className="btn btn-go h-12 px-6" onClick={() => mark(typedRight)}>
            Next <ArrowRightIcon size={16} weight="bold" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
