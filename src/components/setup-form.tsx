"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ArrowRightIcon, CaretDownIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { createSession, getSettings, useStore } from "@/lib/store";
import { prepareSpeech, warmVoice } from "@/lib/tts";
import { StickerLoader } from "./sticker-loader";
import { MODES, PERSONAS } from "@/lib/game";
import { CLOSER, OPENER } from "@/lib/prepare";
import { levelFromXp } from "@/lib/scoring";
import { PersonaAvatar } from "./persona-avatar";
import { JobCombobox } from "./job-combobox";
import { SENIORITY_LABELS } from "@/lib/session";
import { SENIORITIES, type Mode, type PersonaId, type Question, type RubricKey, type Seniority } from "@/lib/types";
import { isEnglish, languageFor } from "@/lib/languages";
import { isOffline, offlineQuestions } from "@/lib/offline";
import { SKILL_FOCUS } from "@/lib/skills";
import { RUBRIC_LABELS } from "@/lib/scoring";
import { useT } from "@/lib/i18n";

const MAX_JD = 6000;

export function SetupForm({
  initialRole,
  initialMode = "quick",
  initialFocus,
}: {
  initialRole: string;
  initialMode?: Mode;
  initialFocus?: RubricKey;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [seniority, setSeniority] = useState<Seniority>("entry");
  const [jd, setJd] = useState("");
  const { hydrated, profile } = useStore();
  const level = levelFromXp(profile.xp).level;
  const [mode, setMode] = useState<Mode>(initialMode === "daily" ? "quick" : initialMode);
  const [persona, setPersona] = useState<PersonaId>("friendly");
  const info = MODES[mode];
  const chosenPersona: PersonaId = info.persona ?? persona;
  const [focus, setFocus] = useState<RubricKey | undefined>(initialFocus);
  const language = languageFor(profile.settings.language);
  const english = isEnglish(language.code);
  const t = useT();

  // Load the voice and prepare the chosen interviewer's greeting while the form is filled in.
  useEffect(() => {
    let live = true;
    const engine = getSettings().voiceEngine;
    warmVoice(engine).then(() => {
      if (live) prepareSpeech([PERSONAS[chosenPersona].greeting], PERSONAS[chosenPersona], engine);
    });
    return () => {
      live = false;
    };
  }, [chosenPersona]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const roleId = useId();
  const jdId = useId();
  const errorId = useId();

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = role.trim();
    if (trimmed.length < 2) {
      setStatus("error");
      setError("Type a job title to practice for.");
      return;
    }
    if (mode === "live" && !english) {
      setStatus("error");
      setError("Live Interview is English only for now. Pick another mode, or switch to English in Me.");
      return;
    }
    if (level < info.unlockLevel) {
      setStatus("error");
      setError(`${info.name} unlocks at level ${info.unlockLevel}. Keep practising to get there.`);
      return;
    }
    setStatus("loading");
    setError("");
    const who = PERSONAS[chosenPersona];
    const engine = getSettings().voiceEngine;
    // The greeting is prepared while the questions are written, so it plays straight away.
    prepareSpeech([who.greeting], who, engine);
    try {
      let data: { questions?: Question[]; source?: "ai" | "rules"; error?: string };
      try {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: trimmed,
            seniority,
            jobDescription: jd.slice(0, MAX_JD),
            count: info.questions,
            persona: chosenPersona,
            plain: getSettings().plainWords,
            language: language.code,
            focus,
          }),
        });
        data = await res.json();
        if (!res.ok || !data.questions?.length) throw new Error(data.error ?? "We couldn't write questions just now. Try again.");
      } catch (err) {
        if (!isOffline(err)) throw err;
        // No connection: practise with the built-in questions instead.
        data = { questions: offlineQuestions(trimmed, seniority, info.questions), source: "rules" };
      }
      const written = data.questions ?? [];
      // A mock interview opens and closes like a real one, in the round's language.
      const opener = english ? OPENER : { ...OPENER, text: language.opener };
      const closer = english ? CLOSER : { ...CLOSER, text: language.closer };
      const session = createSession({
        role: trimmed,
        seniority,
        jobDescription: jd.slice(0, MAX_JD),
        // A mock interview opens and closes like a real one.
        questions: mode === "mock" || mode === "live" ? [opener, ...written, closer] : written,
        demo: data.source !== "ai",
        mode,
        persona: chosenPersona,
        language: language.code,
      });
      prepareSpeech([mode === "mock" || mode === "live" ? opener.text : written[0].text], who, engine);
      router.push(`/practice/${session.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  const loading = status === "loading";

  return (
    <form onSubmit={start} className="flex flex-col gap-8" aria-busy={loading}>
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">{t("setup.title")}</h1>
        <p className="text-muted">
          Pick how you want to practise and who interviews you. Interview soon?{" "}
          <Link href="/prepare" className="font-semibold text-ink underline underline-offset-4">
            Get ready
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={roleId} className="text-label font-medium">
          {t("form.job")}
        </label>
        <JobCombobox id={roleId} value={role} onChange={setRole} className="max-w-xl" />
        <p className="text-label text-muted">
          Practising in <span lang={language.code} className="font-semibold text-ink">{language.native}</span>.{" "}
          <Link href="/me#language" className="font-semibold text-ink underline underline-offset-4">
            Change language
          </Link>
        </p>
      </div>

      {focus && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-panel)] border-2 border-sky bg-surface p-4 sm:flex-row sm:items-start sm:gap-4">
          <span className="sticker sticker-sky w-fit shrink-0 -rotate-2">Focus: {RUBRIC_LABELS[focus]}</span>
          <p className="min-w-0 flex-1 text-body-sm leading-relaxed text-muted">
            Your questions will give you room to practise this. {SKILL_FOCUS[focus].tip}
          </p>
          <button type="button" className="btn btn-quiet min-h-9 w-fit shrink-0 text-label" onClick={() => setFocus(undefined)}>
            Remove focus
          </button>
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">{t("setup.level")}</legend>
        <div className="flex flex-wrap gap-2">
          {SENIORITIES.map((s) => (
            <label
              key={s}
              className={`btn cursor-pointer border ${
                seniority === s ? "border-ink bg-ink text-floor" : "border-line bg-surface text-ink hover:bg-surface-2"
              } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]`}
            >
              <input
                type="radio"
                name="seniority"
                value={s}
                checked={seniority === s}
                onChange={() => setSeniority(s)}
                className="sr-only"
              />
              {SENIORITY_LABELS[s]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">{t("setup.mode")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["quick", "live", "mock", "phone", "video", "speed", "boss"] as Mode[]).map((m) => {
            const mi = MODES[m];
            const englishOnly = m === "live" && !english;
            const locked = (hydrated && level < mi.unlockLevel) || englishOnly;
            const on = mode === m;
            return (
              <label
                key={m}
                className={`relative flex cursor-pointer flex-col gap-1 rounded-[var(--radius-panel)] border-2 p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                  on ? "border-ink bg-surface" : "border-line bg-surface hover:border-muted"
                } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input type="radio" name="mode" className="sr-only" checked={on} disabled={locked} onChange={() => setMode(m)} />
                <span className="flex items-center gap-2 font-display text-title font-bold">
                  {mi.name}
                  {on && <span className="sticker sticker-lime">Picked</span>}
                </span>
                <span className="text-body-sm text-muted">{mi.blurb}</span>
                {locked && (
                  <span className="mt-1 flex items-center gap-1.5 text-label font-semibold text-muted">
                    <LockSimpleIcon size={14} weight="bold" aria-hidden />{" "}
                    {englishOnly ? "English only for now" : `Unlocks at level ${mi.unlockLevel}`}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {!info.persona ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-label font-medium">{t("setup.interviewer")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["friendly", "busy"] as PersonaId[]).map((p) => {
              const pi = PERSONAS[p];
              const locked = hydrated && level < pi.unlockLevel;
              const on = persona === p;
              return (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center gap-4 rounded-[var(--radius-panel)] border-2 p-3 pr-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                    on ? "border-ink bg-surface" : "border-line bg-surface hover:border-muted"
                  } ${locked ? "cursor-not-allowed" : ""}`}
                >
                  <input type="radio" name="persona" className="sr-only" checked={on} disabled={locked} onChange={() => setPersona(p)} />
                  <PersonaAvatar id={p} size={64} locked={locked} />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-title font-bold">{pi.name}</span>
                    <span className="text-body-sm text-muted">{pi.role}</span>
                    {locked && (
                      <span className="flex items-center gap-1.5 text-label font-semibold text-muted">
                        <LockSimpleIcon size={14} weight="bold" aria-hidden /> Level {pi.unlockLevel}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <div className="flex items-center gap-4 rounded-[var(--radius-panel)] border-2 border-tomato bg-surface p-4">
          <PersonaAvatar id={info.persona} size={72} />
          <p className="text-body">
            <span className="font-display font-bold">{PERSONAS[info.persona].name}</span> is waiting.{" "}
            <span className="text-muted">{PERSONAS[info.persona].greeting}</span>
          </p>
        </div>
      )}

      <details className="group max-w-xl">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-label font-medium [&::-webkit-details-marker]:hidden">
          <CaretDownIcon size={16} weight="bold" className="transition-transform group-open:rotate-180" aria-hidden />
          Paste a job description (optional)
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor={jdId} className="text-label text-muted">
            Questions and feedback will match the skills it asks for.
          </label>
          <textarea
            id={jdId}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            maxLength={MAX_JD}
            rows={6}
            className="field resize-y text-body-sm leading-relaxed"
          />
          <span className="tnum self-end text-tape text-muted">
            {jd.length} / {MAX_JD}
          </span>
        </div>
      </details>

      <div className="flex flex-col gap-3">
        <button type="submit" className="btn btn-go h-12 w-full px-6 disabled:cursor-wait disabled:opacity-100 sm:w-fit" disabled={loading}>
          {loading && <StickerLoader size="sm" />}
          {loading ? `${PERSONAS[chosenPersona].name} is writing your questions...` : `Start ${info.name}`}
          {!loading && <ArrowRightIcon size={18} weight="bold" aria-hidden />}
        </button>
        {status === "error" && (
          <p id={errorId} role="alert" className="text-label text-down">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
