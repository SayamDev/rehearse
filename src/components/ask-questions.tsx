"use client";

import Link from "next/link";
import { StarIcon } from "@phosphor-icons/react";
import { ASK_GROUPS, ASK_TIPS } from "@/lib/prepare";
import { toggleAsk, useStore } from "@/lib/store";

/** Questions to ask at the end of an interview, with a starred shortlist kept in this browser. */
export function AskQuestions() {
  const { hydrated, profile } = useStore();
  const starred = hydrated ? profile.askList : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Questions to ask them</h1>
        <p className="max-w-[58ch] text-muted">
          Most interviews end with &ldquo;Do you have any questions for me?&rdquo; Having one or two ready shows you&apos;re
          keen. Star the ones you like and they&apos;ll show up as a hint when you practise.
        </p>
      </div>

      <section aria-labelledby="my-list" className="panel flex flex-col gap-3 p-5 sm:p-6">
        <h2 id="my-list" className="text-title font-bold">
          Your questions <span className="tnum text-muted">{starred.length}</span>
        </h2>
        {starred.length === 0 ? (
          <p className="text-body-sm text-muted">Nothing starred yet. Tap the star next to any question below.</p>
        ) : (
          <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-semibold marker:text-muted">
            {starred.map((q) => (
              <li key={q} className="leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        )}
        {starred.length > 0 && (
          <Link href="/practice/new?mode=mock" className="btn btn-go mt-1 w-fit">
            Try them in a mock interview
          </Link>
        )}
      </section>

      {ASK_GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`ask-${g.id}`} className="flex flex-col gap-2">
          <h2 id={`ask-${g.id}`} className="text-title font-bold">
            {g.title}
          </h2>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {g.questions.map((q) => {
              const on = starred.includes(q);
              return (
                <li key={q} className="flex items-center justify-between gap-4 py-3">
                  <span className="leading-relaxed">{q}</span>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={on ? `Unstar: ${q}` : `Star: ${q}`}
                    onClick={() => toggleAsk(q)}
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-150 active:scale-[0.92] ${
                      on ? "border-[var(--die)] bg-sun text-on-ink" : "border-line text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    <StarIcon size={20} weight={on ? "fill" : "bold"} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section aria-labelledby="ask-tips" className="flex flex-col gap-2">
        <h2 id="ask-tips" className="font-semibold">
          Tips
        </h2>
        <ul className="flex max-w-[62ch] flex-col gap-1.5 text-body-sm leading-relaxed text-muted">
          {ASK_TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
