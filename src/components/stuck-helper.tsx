"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CaretDownIcon, LifebuoyIcon, LightbulbIcon, PathIcon, TargetIcon } from "@phosphor-icons/react";
import { BUY_TIME, IDEA_SPARKS, helpKit } from "@/lib/helpers";
import { ASK_GROUPS, CLOSER, OPENER } from "@/lib/prepare";
import { useStore } from "@/lib/store";
import type { AnswerMode, Category } from "@/lib/types";

type Tab = "want" | "shape" | "ideas";

const TABS: { id: Tab; label: string; icon: typeof TargetIcon }[] = [
  { id: "want", label: "What they want", icon: TargetIcon },
  { id: "shape", label: "Answer shape", icon: PathIcon },
  { id: "ideas", label: "Ideas", icon: LightbulbIcon },
];

/**
 * "Stuck?" helpers under the answer box: what the interviewer wants to hear,
 * a step-by-step shape with starter lines, and places to find an example.
 */
export function StuckHelper({
  category,
  lookingFor,
  questionId,
  mode,
  onInsert,
}: {
  category: Category;
  lookingFor: string;
  questionId?: string;
  mode: AnswerMode;
  /** Adds a starter line to a typed answer. */
  onInsert?: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("want");
  const [step, setStep] = useState(0);
  const panelId = useId();
  const kit = helpKit(category);
  const { bank, profile } = useStore();
  const savedIntro = questionId === OPENER.id ? bank.find((a) => a.question.id === OPENER.id)?.text : undefined;
  const asks = questionId === CLOSER.id ? (profile.askList.length ? profile.askList : ASK_GROUPS.map((g) => g.questions[0])).slice(0, 4) : [];
  const current = kit.steps[step];

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="btn btn-quiet -ml-2 w-fit min-h-10"
      >
        <LifebuoyIcon size={18} weight="bold" className="text-grape-text" aria-hidden />
        {open ? "Hide help" : "Stuck? Get a hint"}
        <CaretDownIcon size={14} weight="bold" aria-hidden className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={panelId} className="flex flex-col gap-4">
          <div role="tablist" aria-label="Kinds of help" className="flex flex-wrap gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`${panelId}-${id}`}
                aria-selected={tab === id}
                aria-controls={`${panelId}-panel`}
                onClick={() => setTab(id)}
                className={`flex min-h-10 items-center gap-1.5 rounded-full border-2 px-3.5 text-label font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] ${
                  tab === id ? "border-[var(--die)] bg-grape text-on-ink" : "border-line text-ink hover:border-ink"
                }`}
              >
                <Icon size={16} weight={tab === id ? "fill" : "regular"} aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <div id={`${panelId}-panel`} role="tabpanel" aria-labelledby={`${panelId}-${tab}`} className="flex flex-col gap-3">
            {tab === "want" && (
              <>
                <p className="max-w-[62ch] leading-relaxed">{lookingFor}</p>
                {savedIntro && (
                  <div className="flex flex-col gap-2 rounded-control bg-surface-2 p-4">
                    <p className="font-semibold">Your saved intro</p>
                    <p className="max-w-[62ch] text-body-sm leading-relaxed">{savedIntro}</p>
                  </div>
                )}
                {questionId === OPENER.id && !savedIntro && (
                  <p className="text-label text-muted">
                    <Link href="/prepare/intro" className="font-semibold text-ink underline underline-offset-4">
                      Build your intro
                    </Link>{" "}
                    step by step after this round.
                  </p>
                )}
                {asks.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-control bg-surface-2 p-4">
                    <p className="font-semibold">{profile.askList.length ? "Your starred questions" : "Good questions to ask"}</p>
                    <ul className="flex flex-col gap-1.5 text-body-sm">
                      {asks.map((q) => (
                        <li key={q}>
                          <q>{q}</q>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-label text-muted">
                  This question wants {kit.kind}. Open <span className="font-semibold text-ink">Answer shape</span> for a
                  step-by-step plan.
                </p>
              </>
            )}

            {tab === "shape" && (
              <>
                <ol className="flex flex-wrap gap-2" aria-label="Steps">
                  {kit.steps.map((s, i) => (
                    <li key={s.label}>
                      <button
                        type="button"
                        aria-current={i === step ? "step" : undefined}
                        onClick={() => setStep(i)}
                        className={`flex min-h-10 items-center gap-2 rounded-control border-2 px-3 text-label font-semibold transition-colors duration-150 ${
                          i === step ? "border-[var(--die)] bg-sun text-on-ink" : "border-line text-muted hover:text-ink"
                        }`}
                      >
                        <span className="tnum" aria-hidden>
                          {i + 1}
                        </span>
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-col gap-2">
                  <p className="leading-relaxed">{current.tip}</p>
                  <p className="text-label text-muted">
                    {mode === "type" ? "Start with:" : "Try saying:"}{" "}
                    <q className="font-medium text-ink">{current.starter.trim()}...</q>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mode === "type" && onInsert && (
                      <button type="button" className="btn btn-ghost min-h-10 text-label" onClick={() => {
                          onInsert(current.starter);
                          // Move on so the next tap adds the next part of the answer.
                          if (step < kit.steps.length - 1) setStep(step + 1);
                        }}
                      >
                        Add this to my answer
                      </button>
                    )}
                    {step < kit.steps.length - 1 && (
                      <button type="button" className="btn btn-quiet min-h-10 text-label" onClick={() => setStep(step + 1)}>
                        Next step
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {tab === "ideas" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">No work example? Think about</p>
                  <ul className="flex flex-col gap-1.5 text-body-sm text-muted">
                    {IDEA_SPARKS.map((idea) => (
                      <li key={idea} className="flex gap-2">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-grape" />
                        {idea}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">Need a moment? It&apos;s fine to say</p>
                  <ul className="flex flex-col gap-1.5 text-body-sm text-muted">
                    {BUY_TIME.map((line) => (
                      <li key={line}>
                        <q>{line}</q>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
