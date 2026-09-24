"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import { createSession, getSettings, useStore } from "@/lib/store";
import { packById } from "@/lib/packs";
import { PERSONAS } from "@/lib/game";
import { prepareSpeech } from "@/lib/tts";
import { isEnglish } from "@/lib/languages";
import { JobCombobox } from "./job-combobox";

const MAX = 5;

/** Read a pack's questions, tick the ones to practise, and start a round with them. */
export function PackPractice({ packId }: { packId: string }) {
  const pack = packById(packId)!;
  const router = useRouter();
  const { profile } = useStore();
  const [role, setRole] = useState(pack.role);
  const [picked, setPicked] = useState<number[]>([0, 1, 2]);
  const [error, setError] = useState("");
  const roleId = useId();

  function toggle(i: number) {
    setError("");
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length >= MAX ? p : [...p, i].sort((a, b) => a - b)));
  }

  function start() {
    const title = role.trim();
    if (title.length < 2) return setError("Type a job title to practise for.");
    if (!picked.length) return setError("Tick at least one question.");
    const questions = picked.map((i) => {
      const q = pack.questions[i];
      return { id: crypto.randomUUID(), text: q.text, category: q.category, competency: q.competency, difficulty: q.difficulty, lookingFor: q.looking_for };
    });
    const session = createSession({ role: title, seniority: "entry", jobDescription: "", questions, demo: true, mode: "quick", persona: "friendly" });
    prepareSpeech([PERSONAS.friendly.greeting], PERSONAS.friendly, getSettings().voiceEngine);
    router.push(`/practice/${session.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {!isEnglish(profile.settings.language) && (
        <p className="text-body-sm text-muted">These questions are in English. Your notes will be in English too.</p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 flex w-full flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold">Pick up to {MAX} to practise</span>
          <span className="tnum text-label text-muted" aria-live="polite">
            {picked.length} picked
          </span>
        </legend>
        <ol className="panel flex flex-col divide-y divide-line">
          {pack.questions.map((q, i) => {
            const on = picked.includes(i);
            const full = !on && picked.length >= MAX;
            return (
              <li key={q.text} className="flex flex-col gap-2 p-4 sm:p-5">
                <label className={`flex items-start gap-3 ${full ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={full}
                    onChange={() => toggle(i)}
                    className="mt-1 size-5 shrink-0 accent-[var(--ink)]"
                  />
                  <span className="font-medium leading-snug">{q.text}</span>
                </label>
                <details className="group ml-8">
                  <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-label font-semibold text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
                    <CaretDownIcon size={14} weight="bold" className="transition-transform group-open:rotate-180" aria-hidden />
                    What they&apos;re looking for
                  </summary>
                  <p className="mt-2 max-w-[60ch] text-body-sm leading-relaxed text-muted">{q.looking_for}</p>
                </details>
              </li>
            );
          })}
        </ol>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={roleId} className="text-label font-medium">
          Job title
        </label>
        <JobCombobox id={roleId} value={role} onChange={setRole} className="max-w-md" />
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" className="btn btn-go h-12 w-full px-6 sm:w-fit" onClick={start}>
          Practise {picked.length || ""} {picked.length === 1 ? "question" : "questions"} with Sam
          <ArrowRightIcon size={18} weight="bold" aria-hidden />
        </button>
        {error && (
          <p role="alert" className="text-label text-down">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
