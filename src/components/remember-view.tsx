"use client";

import Link from "next/link";
import { useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowRightIcon,
  BooksIcon,
  BuildingsIcon,
  CardsIcon,
  CaretRightIcon,
  HashIcon,
  HeadphonesIcon,
  LightningIcon,
} from "@phosphor-icons/react";
import { RECALL_MODES, coverage, kitCards, type RecallMode } from "@/lib/kit";
import { StrengthMeter } from "./strength-meter";
import { describeDue, isDue } from "@/lib/memory";
import { localDay, useStore } from "@/lib/store";
import type { SavedAnswer } from "@/lib/types";

export function RememberView() {
  const { hydrated, bank } = useStore();

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading saved answers">
        <div className="skeleton h-9 w-40" />
        <div className="skeleton h-5 w-56" />
        <div className="skeleton h-40 w-full rounded-[10px]" />
      </div>
    );
  }

  const today = localDay();
  const due = bank.filter((a) => isDue(a, today)).sort((a, b) => a.box - b.box);
  const later = bank.filter((a) => !isDue(a, today)).sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Remember</h1>
        {bank.length === 0 ? null : due.length > 0 ? (
          <p className="text-muted">
            <span className="tnum font-semibold text-ink">{due.length}</span> {due.length === 1 ? "answer is" : "answers are"} ready
            to practise from memory today.
          </p>
        ) : (
          <p className="text-muted">Nothing due today. Your next review is {describeDue(later[0].due, today).replace("Due ", "")}.</p>
        )}
        {bank.length > 0 && <StartRecall due={due.length} />}
      </header>

      <Kit />

      {bank.length === 0 && (
        <section className="panel flex flex-col items-start gap-3 p-6">
          <h2 className="text-title font-semibold">Save answers you want to remember</h2>
          <p className="max-w-[56ch] leading-relaxed text-muted">
            After you get notes on an answer, choose <span className="font-medium text-ink">Save this answer to remember</span>.
            Pick your best take or the stronger version, put it in your own words, and pick a few key points. Then practise
            saying it from memory here, a little each day, until it sticks.
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-label font-medium">Four ways to practise, once you&apos;ve saved one:</p>
            <ul className="flex flex-col gap-1.5">
              {RECALL_MODES.map((m) => (
                <li key={m.value} className="text-body-sm text-muted">
                  <span className="font-semibold text-ink">{m.label}.</span> {m.how}
                </li>
              ))}
            </ul>
          </div>
          <Link href="/" className="btn btn-go">
            Practise a question
          </Link>
        </section>
      )}

      {due.length > 0 && <AnswerList title="Due today" answers={due} today={today} />}
      {later.length > 0 && <AnswerList title={due.length > 0 ? "Coming up" : "Saved answers"} answers={later} today={today} />}
    </div>
  );
}

function StartRecall({ due }: { due: number }) {
  const [mode, setMode] = useState<RecallMode>("mix");
  const how = RECALL_MODES.find((m) => m.value === mode)!.how;
  const href = `/remember/drill?${due > 0 ? "" : "all=1&"}mode=${mode}`;
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">How do you want to practise?</legend>
        <div className="flex flex-wrap gap-2">
          {RECALL_MODES.map((m) => (
            <label
              key={m.value}
              className={`flex min-h-11 cursor-pointer items-center rounded-full border-2 px-4 text-label font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${
                mode === m.value ? "border-ink bg-ink text-floor" : "border-line text-muted hover:text-ink"
              }`}
            >
              <input type="radio" name="recall-mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="sr-only" />
              {m.label}
            </label>
          ))}
        </div>
        <p className="text-label text-muted">{how}</p>
      </fieldset>
      <Link href={href} className={`btn h-12 w-fit px-6 ${due > 0 ? "btn-go" : "btn-ghost"}`}>
        {due > 0 ? "Start recall" : "Practise all anyway"}
        <ArrowRightIcon size={16} weight="bold" aria-hidden />
      </Link>
    </div>
  );
}

/** Links to the rest of the kit, each with a one-line status so it's clear what's set up. */
function Kit() {
  const { profile, bank } = useStore();
  const stories = profile.stories ?? [];
  const gaps = coverage(stories).filter((c) => c.type.id !== "motivation" && c.stories.length === 0).length;
  const numbers = profile.numbers ?? [];
  const company = profile.company;
  const cards = kitCards({ stories, company, numbers, askList: profile.askList }).length;
  const tiles: { href: string; icon: Icon; ink: string; title: string; status: string }[] = [
    {
      href: "/remember/stories",
      icon: BooksIcon,
      ink: "bg-grape",
      title: "Story bank",
      status: stories.length ? `${stories.length} ${stories.length === 1 ? "story" : "stories"}${gaps ? ` · ${gaps} kinds of question still need one` : " · every kind covered"}` : "5 or 6 stories answer most questions",
    },
    { href: "/remember/company", icon: BuildingsIcon, ink: "bg-sky", title: "Know the company", status: company?.name ? company.name : "Facts, why you want it, what to ask" },
    { href: "/remember/numbers", icon: HashIcon, ink: "bg-sun", title: "Numbers to remember", status: numbers.length ? `${numbers.length} saved` : "The figures you'll quote" },
    { href: "/remember/cards", icon: CardsIcon, ink: "bg-lime", title: "Pocket cards", status: "One-line reminders, and a phone wallpaper" },
    { href: "/remember/listen", icon: HeadphonesIcon, ink: "bg-mint", title: "Listen mode", status: bank.length || stories.length ? "Hear your answers, like a podcast" : "Save answers or stories to listen" },
    { href: "/remember/quiz", icon: LightningIcon, ink: "bg-tomato", title: "Quiz my kit", status: cards ? `${cards} quick cards` : "Add stories, company facts or numbers first" },
  ];
  return (
    <section aria-labelledby="kit" className="flex flex-col gap-3">
      <div>
        <h2 id="kit" className="text-title font-semibold tracking-[-0.01em]">
          Your interview kit
        </h2>
        <p className="text-body-sm text-muted">The few things worth knowing by heart. Everything stays on this device.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {tiles.map(({ href, icon: TileIcon, ink, title, status }) => (
          <li key={href}>
            <Link href={href} className="panel group flex h-full items-center gap-4 p-4 transition-colors hover:bg-surface-2">
              <span
                className={`flex size-11 shrink-0 -rotate-3 items-center justify-center rounded-full border-[3px] border-[var(--die)] text-on-ink shadow-[var(--sticker-shadow)] ${ink}`}
                aria-hidden
              >
                <TileIcon size={20} weight="fill" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-bold">{title}</span>
                <span className="text-label text-muted">{status}</span>
              </span>
              <CaretRightIcon size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AnswerList({ title, answers, today }: { title: string; answers: SavedAnswer[]; today: string }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-title font-semibold tracking-[-0.01em]">{title}</h2>
      <ul className="panel">
        {answers.map((a) => (
          <li key={a.id} className="border-b border-line last:border-b-0">
            <Link href={`/remember/${a.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2 sm:px-6">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="font-medium leading-snug">{a.question.text}</span>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-muted">
                  <span>{a.role}</span>
                  <StrengthMeter box={a.box} />
                  {!isDue(a, today) && <span>{describeDue(a.due, today)}</span>}
                </span>
              </div>
              <CaretRightIcon size={16} className="shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
