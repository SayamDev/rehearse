"use client";

import { useId, useState } from "react";
import { MagnifyingGlassIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { getSettings } from "@/lib/store";
import { MAX_ADVERT, scrubCv } from "@/lib/cv";
import type { Category, Competency } from "@/lib/types";
import { JobCombobox } from "./job-combobox";
import { PractiseButton } from "./practise-button";
import { StickerLoader } from "./sticker-loader";

type Likely = { text: string; category: Category; competency: Competency; difficulty: number; looking_for: string; why: string; likely: "very likely" | "likely" };
type Result = { role: string; skills: string[]; questions: Likely[]; source: "ai" | "rules" };

/**
 * Likely questions: paste the advert for a job you've applied for, and see the questions
 * it points to, most likely first, each with the words in the advert that give it away.
 */
export function LikelyQuestions() {
  const [advert, setAdvert] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const ids = { advert: useId(), role: useId() };

  async function find(e: React.FormEvent) {
    e.preventDefault();
    const clean = scrubCv(advert).trim();
    if (clean.length < 80) {
      setStatus("error");
      setError("Paste more of the advert: the part about the job and what they're looking for.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/advert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advert: clean.slice(0, MAX_ADVERT), role: role.trim().slice(0, 80), language: getSettings().language }),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok || !data.questions?.length) throw new Error(data.error ?? "We couldn't read that advert just now. Try again.");
      setResult(data);
      if (!role.trim() && data.role) setRole(data.role);
      setPicked(data.questions.map((_, i) => i).slice(0, 3));
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  const loading = status === "loading";

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={find} className="flex flex-col gap-6" aria-busy={loading}>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.advert} className="text-label font-medium">
            The job advert
          </label>
          <textarea
            id={ids.advert}
            value={advert}
            onChange={(e) => setAdvert(e.target.value)}
            maxLength={MAX_ADVERT}
            rows={10}
            placeholder="Copy the advert from the job site and paste it here: the job title, what you'll do, and what they're looking for."
            className="field resize-y text-body-sm leading-relaxed"
          />
          <span className="tnum self-end text-tape text-muted">
            {advert.length} / {MAX_ADVERT}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.role} className="text-label font-medium">
            Job title <span className="font-normal text-muted">(optional, we can find it)</span>
          </label>
          <JobCombobox id={ids.role} value={role} onChange={setRole} className="max-w-xl" />
        </div>
        <p className="flex items-start gap-2 text-label text-muted">
          <ShieldCheckIcon size={18} weight="bold" className="mt-px shrink-0 text-up" aria-hidden />
          Emails and phone numbers in the advert are removed before it&apos;s read. Nothing is saved.
        </p>
        <div className="flex flex-col gap-2">
          <button type="submit" className="btn btn-primary h-12 w-full px-6 disabled:cursor-wait sm:w-fit" disabled={loading}>
            {loading ? <StickerLoader size="sm" /> : <MagnifyingGlassIcon size={18} weight="bold" aria-hidden />}
            {loading ? "Reading the advert..." : "Find likely questions"}
          </button>
          {status === "error" && (
            <p role="alert" className="text-label text-down">
              {error}
            </p>
          )}
        </div>
      </form>

      {result && (
        <div className="flex flex-col gap-8" aria-live="polite">
          {result.skills.length > 0 && (
            <section aria-labelledby="cares" className="flex flex-col gap-3">
              <h2 id="cares" className="text-title-lg font-bold tracking-[-0.02em]">
                What they care about
              </h2>
              <ul className="flex flex-wrap gap-2">
                {result.skills.map((s) => (
                  <li key={s} className="sticker sticker-sun text-label">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="likely" className="flex flex-col gap-3">
            <div>
              <h2 id="likely" className="text-title-lg font-bold tracking-[-0.02em]">
                Questions they&apos;re likely to ask
              </h2>
              <p className="text-body-sm text-muted">Most likely first. Tick the ones to practise.</p>
            </div>
            {result.source === "rules" && (
              <p className="text-body-sm text-muted">
                <span className="sticker sticker-sky mr-2 align-middle">Quick read</span>
                The AI isn&apos;t available right now, so these come from the advert&apos;s key words and our question bank.
              </p>
            )}
            <ol className="panel flex flex-col divide-y divide-line">
              {result.questions.map((q, i) => (
                <li key={q.text} className="p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={picked.includes(i)}
                      onChange={() => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i].sort((a, b) => a - b)))}
                      className="mt-1 size-5 shrink-0 accent-[var(--ink)]"
                    />
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`sticker text-tape ${q.likely === "very likely" ? "sticker-tomato" : "sticker-empty"}`}>{q.likely === "very likely" ? "Very likely" : "Likely"}</span>
                      </span>
                      <span className="font-medium leading-snug">{q.text}</span>
                      {q.why && <span className="text-label leading-relaxed text-muted">{q.why}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ol>
            <PractiseButton
              items={picked.map((i) => result.questions[i])}
              role={(role.trim() || result.role || undefined)?.slice(0, 80)}
              label={`Practise ${picked.length} ${picked.length === 1 ? "question" : "questions"}`}
              variant="go"
            />
          </section>
        </div>
      )}
    </div>
  );
}
