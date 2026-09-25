"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { LightningIcon, PlusIcon, SparkleIcon, TrashIcon } from "@phosphor-icons/react";
import { MAX_NUMBERS, findNumbers, type NumberFact } from "@/lib/kit";
import { setNumbers, useStore } from "@/lib/store";

/**
 * Numbers to remember: the figures that make answers believable ("team of 5",
 * "£2,000 raised"). Found automatically in saved answers and stories, or typed in.
 */
export function NumberList() {
  const { hydrated, profile, bank } = useStore();
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const ids = { value: useId(), label: useId() };

  if (!hydrated) return <div className="skeleton h-64 w-full rounded-[var(--radius-panel)]" aria-hidden />;

  const numbers = profile.numbers ?? [];
  const full = numbers.length >= MAX_NUMBERS;
  const found = full ? [] : findNumbers([...bank.map((a) => a.text), ...(profile.stories ?? []).map((s) => s.summary)], numbers);

  function add(n: Omit<NumberFact, "id">) {
    setNumbers([...numbers, { id: crypto.randomUUID(), value: n.value.trim().slice(0, 20), label: n.label.trim().slice(0, 80) }]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/\d/.test(value)) return setError("Add the number, like 5 or £2,000.");
    if (label.trim().length < 3) return setError("Add what it's about, like “new starters I trained”.");
    setError("");
    add({ value, label });
    setValue("");
    setLabel("");
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Numbers to remember</h1>
        <p className="max-w-[60ch] text-muted">
          A number makes a story believable: how many people, how much money, how much faster. Under pressure they&apos;re the first
          thing to go, so keep a short list and quiz yourself.
        </p>
      </header>

      <section aria-labelledby="yours" className="flex flex-col gap-3">
        <h2 id="yours" className="text-title font-bold tracking-[-0.01em]">
          Your numbers
        </h2>
        {numbers.length === 0 ? (
          <p className="text-body-sm text-muted">None yet. Add one below{found.length ? ", or pick one we found in your answers" : ""}.</p>
        ) : (
          <ul className="panel flex flex-col divide-y divide-line">
            {numbers.map((n) => (
              <li key={n.id} className="flex items-center gap-4 py-2 pl-4 pr-1">
                <span className="tnum min-w-[4.5rem] font-display text-title-lg font-bold">{n.value}</span>
                <span className="min-w-0 flex-1 text-body-sm">{n.label}</span>
                <button
                  type="button"
                  className="btn btn-quiet size-11 shrink-0 p-0"
                  onClick={() => setNumbers(numbers.filter((x) => x.id !== n.id))}
                  aria-label={`Delete ${n.value} ${n.label}`}
                >
                  <TrashIcon size={18} weight="bold" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {found.length > 0 && (
        <section aria-labelledby="found" className="flex flex-col gap-3">
          <div>
            <h2 id="found" className="flex items-center gap-2 text-title font-bold tracking-[-0.01em]">
              <SparkleIcon size={20} weight="fill" className="text-sun-text" aria-hidden /> Found in your answers
            </h2>
            <p className="text-label text-muted">Tap to add. You can delete any that don&apos;t matter.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {found.map((n) => (
              <li key={n.value}>
                <button type="button" className="btn btn-ghost min-h-10 text-label" onClick={() => add(n)}>
                  <PlusIcon size={14} weight="bold" aria-hidden />
                  <span className="tnum font-bold">{n.value}</span> {n.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!full && (
        <form onSubmit={submit} aria-label="Add a number" className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.value} className="text-label font-medium">
                Number
              </label>
              <input id={ids.value} value={value} onChange={(e) => setValue(e.target.value.slice(0, 20))} placeholder="5" inputMode="text" className="field" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.label} className="text-label font-medium">
                What it&apos;s about
              </label>
              <input id={ids.label} value={label} onChange={(e) => setLabel(e.target.value.slice(0, 80))} placeholder="new starters I trained" className="field" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-fit">
            <PlusIcon size={16} weight="bold" aria-hidden /> Add number
          </button>
          {error && (
            <p role="alert" className="text-label text-down">
              {error}
            </p>
          )}
        </form>
      )}

      {numbers.length > 0 && (
        <Link href="/remember/quiz" className="btn btn-go w-fit">
          <LightningIcon size={18} weight="fill" aria-hidden /> Quiz me on them
        </Link>
      )}
    </div>
  );
}
