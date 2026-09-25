"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { BookmarkSimpleIcon, CaretDownIcon, CheckIcon, FileArrowUpIcon, MicrophoneStageIcon, ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react";
import { getSettings, saveStory, useStore } from "@/lib/store";
import { MAX_ADVERT, MAX_CV, scrubCv } from "@/lib/cv";
import { CV_FILE_TYPES, CvFileError, readCvFile } from "@/lib/cv-file";
import { MAX_STORIES } from "@/lib/kit";
import type { Category, Competency } from "@/lib/types";
import { JobCombobox } from "./job-combobox";
import { PractiseButton, type PractiseItem } from "./practise-button";
import { StickerLoader } from "./sticker-loader";

type Story = { title: string; summary: string; skill: Competency };
type CvQuestion = PractiseItem & { story: string; category: Category };
type Result = { stories: Story[]; questions: CvQuestion[]; source: "ai" | "rules" };

/**
 * "Upload your CV": the file is read on the device (PDF, Word or text) and its text dropped
 * into the box below, so the person can check it and take their name off before anything is sent.
 */
function CvUpload({ onText }: { onText: (text: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ tone: "busy" | "ok" | "error"; text: string } | null>(null);
  const [over, setOver] = useState(false);

  async function read(file: File | undefined) {
    if (!file) return;
    setState({ tone: "busy", text: `Reading ${file.name}...` });
    try {
      const text = await readCvFile(file);
      onText(text.slice(0, MAX_CV));
      setState({
        tone: "ok",
        text:
          text.length > MAX_CV
            ? `Read ${file.name}. It's long, so the first part is below, which is plenty. Check it, and delete your name from the top.`
            : `Read ${file.name}. Check the text below, and delete your name from the top.`,
      });
    } catch (err) {
      setState({ tone: "error", text: err instanceof CvFileError ? err.message : "That file couldn't be read. Paste the text instead." });
    }
  }

  const busy = state?.tone === "busy";

  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--radius-panel)] border-2 border-dashed p-4 transition-colors sm:flex-row sm:flex-wrap sm:items-center ${over ? "border-ink bg-surface-2" : "border-line"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void read(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={input}
        type="file"
        accept={CV_FILE_TYPES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void read(file);
        }}
      />
      <button type="button" className="btn btn-ghost w-full shrink-0 disabled:cursor-wait sm:w-fit" onClick={() => input.current?.click()} disabled={busy} aria-busy={busy}>
        {busy ? <StickerLoader size="sm" /> : <FileArrowUpIcon size={18} weight="bold" aria-hidden />}
        {busy ? "Reading..." : "Upload your CV"}
      </button>
      <p className="text-label leading-relaxed text-muted">
        PDF, Word (.docx) or text. It&apos;s read on this device, so the file itself is never sent anywhere.
      </p>
      {state && state.tone !== "busy" && (
        <p role={state.tone === "error" ? "alert" : "status"} className={`text-label sm:basis-full ${state.tone === "error" ? "text-down" : "text-up"}`}>
          {state.text}
        </p>
      )}
      <p role="status" className="sr-only">
        {busy ? state?.text : ""}
      </p>
    </div>
  );
}

/**
 * CV helper: upload or paste a CV (and the job advert), get back your best stories and the
 * questions they answer, then practise them, or go straight into a mock interview built from
 * them. Contact details are removed before anything is sent, and nothing is stored.
 */
export function CvHelper() {
  const { sessions, profile } = useStore();
  const [role, setRole] = useState(sessions[0]?.role ?? "");
  const [cv, setCv] = useState("");
  const [advert, setAdvert] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const ids = { role: useId(), cv: useId(), advert: useId() };
  const resultsRef = useRef<HTMLDivElement>(null);
  const cvBox = useRef<HTMLTextAreaElement>(null);
  const stories = profile.stories ?? [];
  const language = profile.settings.language;

  // New results land below the form, off-screen on a phone: bring them into view.
  useEffect(() => {
    if (result) resultsRef.current?.scrollIntoView({ block: "start" });
  }, [result]);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    const clean = scrubCv(cv);
    if (clean.length < 60) {
      setStatus("error");
      setError("Paste a bit more of your CV: your jobs, studies, volunteering or skills.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: clean.slice(0, MAX_CV), advert: scrubCv(advert).slice(0, MAX_ADVERT), role: role.trim().slice(0, 80), language: getSettings().language }),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok || !data.questions?.length) throw new Error(data.error ?? "We couldn't read that just now. Try again.");
      setResult(data);
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
        <div className="flex items-start gap-3 rounded-[var(--radius-panel)] border-2 border-mint bg-surface p-4">
          <ShieldCheckIcon size={22} weight="bold" className="mt-0.5 shrink-0 text-up" aria-hidden />
          <p className="text-body-sm leading-relaxed text-muted">
            Take your name off first. Emails, phone numbers, postcodes and links are removed automatically before the text is
            sent to our AI provider to read. Nothing is saved, and it isn&apos;t used to train AI.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={ids.role} className="text-label font-medium">
            Job you&apos;re applying for
          </label>
          <JobCombobox id={ids.role} value={role} onChange={setRole} className="max-w-xl" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={ids.cv} className="text-label font-medium">
            Your CV
          </label>
          <CvUpload
            onText={(text) => {
              setCv(text);
              cvBox.current?.focus({ preventScroll: true });
              cvBox.current?.setSelectionRange(0, 0);
            }}
          />
          <textarea
            ref={cvBox}
            id={ids.cv}
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            maxLength={MAX_CV}
            rows={10}
            placeholder="Or paste your CV here, or type your jobs, studies, volunteering and skills."
            className="field resize-y text-body-sm leading-relaxed"
          />
          <span className="tnum self-end text-tape text-muted">
            {cv.length} / {MAX_CV}
          </span>
        </div>

        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-label font-medium [&::-webkit-details-marker]:hidden">
            <CaretDownIcon size={16} weight="bold" className="transition-transform group-open:rotate-180" aria-hidden />
            Add the job advert (optional, gives better questions)
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <label htmlFor={ids.advert} className="sr-only">
              Job advert
            </label>
            <textarea
              id={ids.advert}
              value={advert}
              onChange={(e) => setAdvert(e.target.value)}
              maxLength={MAX_ADVERT}
              rows={6}
              className="field resize-y text-body-sm leading-relaxed"
            />
          </div>
        </details>

        <div className="flex flex-col gap-2">
          <button type="submit" className="btn btn-primary h-12 w-full px-6 disabled:cursor-wait sm:w-fit" disabled={loading}>
            {loading ? <StickerLoader size="sm" /> : <SparkleIcon size={18} weight="fill" aria-hidden />}
            {loading ? "Reading your CV..." : "Find my stories"}
          </button>
          {status === "error" && (
            <p role="alert" className="text-label text-down">
              {error}
            </p>
          )}
        </div>
      </form>

      {result && (
        <div ref={resultsRef} className="flex scroll-mt-24 flex-col gap-8" aria-live="polite">
          <section aria-labelledby="cv-mock" className="panel flex flex-col items-start gap-4 p-5 sm:p-7">
            <span className="sticker sticker-grape -rotate-2 text-label" aria-hidden>
              <MicrophoneStageIcon size={14} weight="fill" /> Made from your CV
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 id="cv-mock" className="text-title-lg font-bold tracking-[-0.02em]">
                Your CV interview is ready
              </h2>
              <p className="max-w-[56ch] text-muted">
                A full mock interview with Sam: tell me about yourself, {Math.min(4, result.questions.length)} questions about
                what&apos;s on your CV, then your questions for them. Notes after every answer.
              </p>
            </div>
            <PractiseButton
              items={result.questions.slice(0, 4)}
              role={role.trim() || undefined}
              label="Start my CV interview"
              mode="mock"
              variant="go"
              language={language}
              className="h-12 px-6"
            />
          </section>

          <section aria-labelledby="stories" className="flex flex-col gap-3">
            <h2 id="stories" className="text-title-lg font-bold tracking-[-0.02em]">
              Your best stories
            </h2>
            {result.source === "rules" && (
              <p className="text-body-sm text-muted">
                <span className="sticker sticker-sky mr-2 align-middle">Quick read</span>
                The AI isn&apos;t available right now, so these are lines from your CV that make good starting points.
              </p>
            )}
            <ol className="grid gap-3 sm:grid-cols-2">
              {result.stories.map((s) => {
                const saved = stories.some((x) => x.title.trim().toLowerCase() === s.title.trim().toLowerCase());
                const full = !saved && stories.length >= MAX_STORIES;
                return (
                  <li key={s.title} className="panel flex flex-col gap-1.5 p-4">
                    <span className="font-bold">{s.title}</span>
                    <span className="text-body-sm leading-relaxed text-muted">{s.summary}</span>
                    <button
                      type="button"
                      className="btn btn-quiet mt-1 h-10 w-fit px-3 text-label"
                      disabled={saved || full}
                      onClick={() => saveStory({ id: crypto.randomUUID(), title: s.title.slice(0, 60), summary: s.summary, types: [s.skill], createdAt: new Date().toISOString() })}
                    >
                      {saved ? <CheckIcon size={16} weight="bold" className="text-up" aria-hidden /> : <BookmarkSimpleIcon size={16} weight="bold" aria-hidden />}
                      {saved ? "In your story bank" : full ? "Story bank is full" : "Save to my stories"}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="text-label text-muted">
              Saved stories go into your{" "}
              <Link href="/remember/stories" className="font-semibold text-ink underline underline-offset-4">
                story bank
              </Link>
              , where you can practise remembering them.
            </p>
          </section>

          <section aria-labelledby="cv-questions" className="flex flex-col gap-3">
            <h2 id="cv-questions" className="text-title-lg font-bold tracking-[-0.02em]">
              Questions you can answer with them
            </h2>
            <ul className="panel flex flex-col divide-y divide-line">
              {result.questions.map((q, i) => (
                <li key={q.text} className="p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={picked.includes(i)}
                      onChange={() => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i].sort((a, b) => a - b)))}
                      className="mt-1 size-5 shrink-0 accent-[var(--ink)]"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="font-medium leading-snug">{q.text}</span>
                      {q.story && <span className="text-label text-muted">Use your story: {q.story}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <PractiseButton
              items={picked.map((i) => result.questions[i])}
              role={role.trim() || undefined}
              label={`Practise ${picked.length} ${picked.length === 1 ? "question" : "questions"}`}
              language={language}
            />
          </section>
        </div>
      )}
    </div>
  );
}
