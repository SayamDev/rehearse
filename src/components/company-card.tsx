"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRightIcon, LightningIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { COMPANY_FACTS, type CompanyCard as Card } from "@/lib/kit";
import { setCompany, toggleAsk, useStore } from "@/lib/store";

const EMPTY: Card = { name: "", facts: ["", "", ""], why: "" };
const FACT_HINTS = ["What they do, or who their customers are", "Something recent: news, a new shop, an award", "Something you like: their values, a product, how they treat people"];

/**
 * "Know the company": the three things interviewers love to hear you know, why you want the
 * job, and the questions you'll ask them. Saved as you type, and quizzed in Quiz my kit.
 */
export function CompanyCard() {
  const { hydrated, profile } = useStore();
  const [own, setOwn] = useState("");
  const ids = { name: useId(), why: useId(), own: useId(), fact: useId() };

  if (!hydrated) return <div className="skeleton h-64 w-full rounded-[var(--radius-panel)]" aria-hidden />;

  const card = { ...EMPTY, ...profile.company, facts: [...(profile.company?.facts ?? []), "", "", ""].slice(0, COMPANY_FACTS) };
  const update = (patch: Partial<Card>) => setCompany({ ...card, ...patch });
  const asks = profile.askList;

  function addOwn(e: React.FormEvent) {
    e.preventDefault();
    const q = own.trim();
    if (q.length < 5 || asks.includes(q)) return;
    toggleAsk(q.endsWith("?") ? q : `${q}?`);
    setOwn("");
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Know the company</h1>
        <p className="max-w-[60ch] text-muted">
          &ldquo;What do you know about us?&rdquo; and &ldquo;Why do you want to work here?&rdquo; come up in almost every interview.
          Ten minutes on their website, the news and their social media is enough. Saved as you type.
        </p>
      </header>

      <section aria-labelledby="facts" className="flex flex-col gap-5">
        <div className="flex max-w-md flex-col gap-2">
          <label htmlFor={ids.name} className="text-label font-medium">
            Company name
          </label>
          <input id={ids.name} value={card.name} onChange={(e) => update({ name: e.target.value.slice(0, 60) })} placeholder="Tesco" className="field" />
        </div>
        <fieldset className="flex flex-col gap-3">
          <legend id="facts" className="mb-1 text-title font-bold tracking-[-0.01em]">
            3 things you know about them
          </legend>
          {card.facts.map((fact, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <label htmlFor={`${ids.fact}-${i}`} className="text-label text-muted">
                {i + 1}. {FACT_HINTS[i]}
              </label>
              <input
                id={`${ids.fact}-${i}`}
                value={fact}
                onChange={(e) => update({ facts: card.facts.map((f, j) => (j === i ? e.target.value.slice(0, 160) : f)) })}
                className="field"
              />
            </div>
          ))}
        </fieldset>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor={ids.why} className="text-title font-bold tracking-[-0.01em]">
          Why you want this job
        </label>
        <p className="text-label text-muted">Two or three sentences: something about them, and something about you.</p>
        <textarea
          id={ids.why}
          value={card.why}
          onChange={(e) => update({ why: e.target.value.slice(0, 500) })}
          rows={4}
          placeholder="I've shopped at the Hulme store for years and the staff always make time for people. I want a job where I'm on my feet helping customers, and I'd like to grow into a supervisor role."
          className="field resize-y text-body-sm leading-relaxed"
        />
      </section>

      <section aria-labelledby="ask" className="flex flex-col gap-3">
        <div>
          <h2 id="ask" className="text-title font-bold tracking-[-0.01em]">
            Questions to ask them
          </h2>
          <p className="text-label text-muted">Have 2 ready. It shows you&apos;re interested, and it&apos;s often the last thing they remember.</p>
        </div>
        {asks.length > 0 && (
          <ul className="panel flex flex-col divide-y divide-line">
            {asks.map((q) => (
              <li key={q} className="flex items-center justify-between gap-3 py-1 pl-4 pr-1">
                <span className="text-body-sm">{q}</span>
                <button type="button" className="btn btn-quiet size-11 shrink-0 p-0" onClick={() => toggleAsk(q)} aria-label={`Remove: ${q}`}>
                  <XIcon size={16} weight="bold" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addOwn} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={ids.own} className="sr-only">
            Your own question
          </label>
          <input
            id={ids.own}
            value={own}
            onChange={(e) => setOwn(e.target.value.slice(0, 160))}
            placeholder="Write your own question"
            className="field flex-1"
          />
          <button type="submit" className="btn btn-ghost shrink-0">
            <PlusIcon size={16} weight="bold" aria-hidden /> Add
          </button>
        </form>
        <Link href="/prepare/questions" className="flex w-fit items-center gap-1.5 text-label font-semibold underline underline-offset-4">
          Pick from good questions to ask <ArrowRightIcon size={14} weight="bold" aria-hidden />
        </Link>
      </section>

      <Link href="/remember/quiz" className="btn btn-go w-fit">
        <LightningIcon size={18} weight="fill" aria-hidden /> Quiz me on it
      </Link>
    </div>
  );
}
