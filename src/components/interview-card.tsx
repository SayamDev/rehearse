"use client";

import Link from "next/link";
import { useState } from "react";
import { PrinterIcon } from "@phosphor-icons/react";
import { ASK_GROUPS, OPENER } from "@/lib/prepare";
import { useStore } from "@/lib/store";

/**
 * One printable page for the day: your intro, key points from your saved answers,
 * your questions to ask, and a calm reminder. Uses what's already saved in Rehearse.
 */
export function InterviewCard() {
  const { hydrated, bank, profile } = useStore();
  const [job, setJob] = useState("");
  const [when, setWhen] = useState("");

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading your card">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-96 w-full rounded-[var(--radius-panel)]" />
      </div>
    );
  }

  const intro = bank.find((a) => a.question.id === OPENER.id);
  const answers = bank
    .filter((a) => a.question.id !== OPENER.id && a.keyPoints.length > 0)
    .sort((a, b) => b.box - a.box || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);
  const asks = (profile.askList.length ? profile.askList : ASK_GROUPS.map((g) => g.questions[0])).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Your interview-day card</h1>
          <p className="max-w-[58ch] text-muted">
            Everything you&apos;ve prepared, on one page. Print it, or save it as a PDF to read on your phone before you go in.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-label font-medium">
            Job (optional)
            <input value={job} onChange={(e) => setJob(e.target.value)} maxLength={80} className="field" />
          </label>
          <label className="flex flex-col gap-2 text-label font-medium">
            When and where (optional)
            <input value={when} onChange={(e) => setWhen(e.target.value)} maxLength={120} className="field" placeholder="Tuesday 10am, High Street office" />
          </label>
        </div>
        <button type="button" className="btn btn-go w-fit" onClick={() => window.print()}>
          <PrinterIcon size={18} weight="bold" aria-hidden />
          Print or save as PDF
        </button>
      </div>

      <article aria-label="Interview-day card" className="panel print-card flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-1 border-b border-line pb-4">
          <h2 className="text-title-lg font-bold tracking-[-0.02em]">{job.trim() ? `Interview: ${job.trim()}` : "My interview"}</h2>
          {when.trim() && <p className="text-muted">{when.trim()}</p>}
        </header>

        <section className="flex flex-col gap-2">
          <h3 className="font-bold">Tell me about yourself</h3>
          {intro ? (
            <p className="leading-relaxed">{intro.text}</p>
          ) : (
            <p className="no-print text-body-sm text-muted">
              Not written yet.{" "}
              <Link href="/prepare/intro" className="font-semibold text-ink underline underline-offset-4">
                Build your intro
              </Link>
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-bold">My key stories</h3>
          {answers.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {answers.map((a) => (
                <li key={a.id} className="flex flex-col gap-1">
                  <p className="text-body-sm font-semibold">{a.question.text}</p>
                  <ul className="flex list-disc flex-col gap-0.5 pl-5 text-body-sm">
                    {a.keyPoints.map((k) => (
                      <li key={k.id}>{k.text}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-print text-body-sm text-muted">
              Save answers in{" "}
              <Link href="/remember" className="font-semibold text-ink underline underline-offset-4">
                Remember
              </Link>{" "}
              and their key points appear here.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-bold">Questions I&apos;ll ask</h3>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-body-sm">
            {asks.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-1 border-t border-line pt-4 text-body-sm">
          <h3 className="font-bold">If I feel nervous</h3>
          <p>Breathe in for 4, out for 6, three times. It&apos;s fine to say: &ldquo;Can I have a moment to think?&rdquo;</p>
          <p>They want me to do well. I&apos;ve practised, and I&apos;m ready.</p>
        </section>
      </article>
    </div>
  );
}
