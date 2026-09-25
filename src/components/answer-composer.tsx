"use client";

import { useEffect, useId, useRef, useState } from "react";
import { KeyboardIcon, MicrophoneIcon, MicrophoneSlashIcon, StopIcon, TimerIcon, VideoCameraIcon, WindIcon } from "@phosphor-icons/react";
import { useSpeech, useSpeechSupported } from "@/lib/use-speech";
import { countWords } from "@/lib/delivery";
import { nextStep } from "@/lib/helpers";
import { StuckHelper } from "./stuck-helper";
import { StarChecklist } from "./star-checklist";
import { CalmMoment } from "./calm-moment";
import { CameraCheck } from "./camera-check";
import { useT } from "@/lib/i18n";
import { useFocusScreen } from "@/lib/focus";
import type { AnswerMode, Category } from "@/lib/types";

export type SubmittedAnswer = { text: string; mode: AnswerMode; durationSec: number; /** Spoken answers, when recordings are kept. */ audio?: Blob | null };

const MAX_CHARS = 4000;
const TARGET_SECONDS = 120;

function clock(secs: number) {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function AnswerComposer({
  takeNumber,
  label,
  submitLabel,
  defaultMode,
  initialText,
  initialMode,
  error,
  onSubmit,
  onCancel,
  timeLimit = null,
  interviewer,
  help,
  keepAudio = false,
  placeholder = "Start with the situation, then what you did and how it turned out.",
  setting,
}: {
  takeNumber: number;
  /** Tape label; defaults to "Take N". */
  label?: string;
  submitLabel?: string;
  defaultMode: AnswerMode;
  initialText?: string;
  initialMode?: AnswerMode;
  error?: string;
  onSubmit: (a: SubmittedAnswer) => void;
  onCancel?: () => void;
  /** Seconds allowed for this answer (Speed Round). Time running out submits what you have. */
  timeLimit?: number | null;
  /** Interviewer's name, used in the "your turn" prompt. */
  interviewer?: string;
  /** Question details for the "Stuck?" helpers. Leave out to hide them. */
  help?: { category: Category; lookingFor: string; questionId: string };
  /** Record spoken answers so the best can be replayed (stays on this device). */
  keepAudio?: boolean;
  placeholder?: string;
  /** Phone rounds hide the camera; video rounds keep it on. */
  setting?: "phone" | "video";
}) {
  const supported = useSpeechSupported();
  const t = useT();
  const focus = useFocusScreen();
  const submitText = submitLabel ?? t("answer.getNotes");
  const [chosenMode, setMode] = useState<AnswerMode>(initialMode ?? defaultMode);
  const mode: AnswerMode = supported === false ? "type" : chosenMode;
  const [typed, setTyped] = useState(initialMode === "type" ? (initialText ?? "") : "");
  const typedStart = useRef<number | null>(null);
  const meter = useRef<HTMLDivElement>(null);
  const speech = useSpeech({
    record: keepAudio,
    onLevel: (l) => {
      if (meter.current) meter.current.style.transform = `scaleY(${0.15 + l * 0.85})`;
    },
  });
  const [voiceText, setVoiceText] = useState(initialMode === "voice" ? (initialText ?? "") : "");
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceAudio, setVoiceAudio] = useState<Blob | null>(null);
  const [reviewing, setReviewing] = useState(initialMode === "voice" && Boolean(initialText));
  const typedRef = useRef<HTMLTextAreaElement>(null);
  const [calmOpen, setCalmOpen] = useState(false);
  const [camera, setCamera] = useState(setting === "video");
  const textareaId = useId();
  const reviewId = useId();
  const errorId = useId();

  const recording = speech.status === "recording" || speech.status === "starting";

  /* ---------- Speed Round countdown ---------- */
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const fired = useRef(false);
  const started = deadline !== null;
  // Typed answers start the clock on the first keystroke; spoken answers when recording starts.
  function startClock() {
    if (timeLimit && deadline === null) {
      const t = performance.now();
      setNow(t);
      setDeadline(t + timeLimit * 1000);
    }
  }
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(id);
  }, [started]);
  const remaining = deadline === null ? timeLimit : Math.max(0, Math.ceil((deadline - now) / 1000));
  const latest = useRef({ speech, typed, mode, onSubmit });
  useEffect(() => {
    latest.current = { speech, typed, mode, onSubmit };
  });
  useEffect(() => {
    if (!timeLimit || deadline === null || remaining !== 0 || fired.current) return;
    fired.current = true;
    const { speech: sp, typed: ty, mode: md, onSubmit: submit } = latest.current;
    if (md === "voice") {
      const secs = sp.stop();
      const text = `${sp.transcript} ${sp.interim}`.replace(/\s+/g, " ").trim();
      submit({ text: text || "I ran out of time before answering.", mode: "voice", durationSec: secs });
    } else {
      submit({ text: ty.trim() || "I ran out of time before answering.", mode: "type", durationSec: timeLimit });
    }
  }, [remaining, deadline, timeLimit]);

  async function toggleRecording() {
    if (recording) {
      const secs = speech.stop();
      const text = `${speech.transcript} ${speech.interim}`.replace(/\s+/g, " ").trim();
      setVoiceText(text);
      setVoiceDuration(secs);
      setReviewing(true);
      speech.lastRecording().then(setVoiceAudio);
    } else {
      setReviewing(false);
      setVoiceText("");
      await speech.start();
      startClock();
    }
  }

  function submitVoice() {
    const text = voiceText.trim();
    if (!text) return;
    onSubmit({ text: text.slice(0, MAX_CHARS), mode: "voice", durationSec: voiceDuration, audio: voiceAudio });
  }

  function submitTyped() {
    const text = typed.trim();
    if (!text) return;
    const secs = typedStart.current ? (performance.now() - typedStart.current) / 1000 : 0;
    onSubmit({ text: text.slice(0, MAX_CHARS), mode: "type", durationSec: secs });
  }

  const liveText = `${speech.transcript} ${speech.interim}`.trim();
  // STAR fits "tell me about a time" and "what would you do" questions, not "why this job".
  const starOn = Boolean(help && (help.category === "behavioral" || help.category === "situational"));
  const overTime = speech.elapsed >= TARGET_SECONDS;

  /* ---------- Gentle nudge after a quiet moment while speaking ---------- */
  const [quiet, setQuiet] = useState(false);
  const lastChange = useRef(0);
  useEffect(() => {
    lastChange.current = performance.now();
    // A new word ends the quiet moment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuiet(false);
  }, [liveText, recording]);
  useEffect(() => {
    if (!recording || !help) return;
    const id = setInterval(() => {
      if (performance.now() - lastChange.current > 6000) setQuiet(true);
    }, 1000);
    return () => clearInterval(id);
  }, [recording, help]);
  const nudge = help && quiet && recording ? nextStep(help.category, countWords(liveText)) : null;

  function insertStarter(starter: string) {
    setTyped((t) => {
      const base = t.trimEnd();
      return `${base}${base ? (/[.!?]$/.test(base) ? " " : ". ") : ""}${starter}`;
    });
    if (typedStart.current === null) typedStart.current = performance.now();
    startClock();
    requestAnimationFrame(() => {
      const el = typedRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }

  return (
    <section aria-label={label ? `Your answer, ${label.toLowerCase()}` : `Your answer, take ${takeNumber}`} className="panel flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="sticker sticker-sky">{label ?? `Take ${takeNumber}`}</span>
          {timeLimit !== null && remaining !== null && (
            <span
              className={`sticker tabular ${remaining <= 10 && started ? "sticker-tomato" : "sticker-empty"}`}
              role="timer"
              aria-label={`${remaining} seconds left`}
            >
              <TimerIcon size={14} weight="bold" aria-hidden />
              {clock(remaining)}
            </span>
          )}
          {/* Not in Speed Round, where the clock can't stop. */}
          {!timeLimit && (
            <button type="button" className="btn btn-quiet min-h-9 px-2.5 text-label" onClick={() => setCalmOpen(true)} disabled={recording}>
              <WindIcon size={16} weight="bold" aria-hidden />
              {t("answer.moment")}
            </button>
          )}
          {setting !== "phone" && (setting === "video" || !focus) && (
            <button
              type="button"
              className="btn btn-quiet min-h-9 px-2.5 text-label"
              aria-pressed={camera}
              onClick={() => setCamera((c) => !c)}
            >
              <VideoCameraIcon size={16} weight={camera ? "fill" : "bold"} aria-hidden />
              {camera ? t("answer.hideCamera") : t("answer.camera")}
            </button>
          )}
        </span>
        {supported !== false && (
          <div role="radiogroup" aria-label="Answer by" className="flex rounded-full border border-line p-1">
            {(["voice", "type"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                disabled={recording}
                onClick={() => setMode(m)}
                className={`flex min-h-9 items-center gap-1.5 rounded-full px-3 text-label font-medium transition-colors ${
                  mode === m ? "bg-ink text-floor" : "text-muted hover:text-ink"
                }`}
              >
                {m === "voice" ? <MicrophoneIcon size={16} aria-hidden /> : <KeyboardIcon size={16} aria-hidden />}
                {m === "voice" ? t("answer.speak") : t("answer.type")}
              </button>
            ))}
          </div>
        )}
      </div>

      {camera && <CameraCheck />}

      {setting === "phone" && (
        <p className="text-label leading-relaxed text-muted">
          On the phone they can&apos;t see you, so your voice does all the work. Smile as you speak (it really can be heard),
          keep your notes in front of you, and stop once you&apos;ve made your point.
        </p>
      )}

      {supported === false && (
        <p className="text-label text-muted">
          Voice answers need Chrome, Edge, or Safari. Typing works everywhere and is scored the same way.
        </p>
      )}

      {mode === "voice" && speech.status === "denied" && (
        <div role="alert" className="flex flex-col gap-3 rounded-control border border-line bg-surface-2 p-4">
          <p className="flex items-center gap-2 font-medium">
            <MicrophoneSlashIcon size={18} aria-hidden /> Microphone is blocked
          </p>
          <p className="text-label text-muted">
            Allow microphone access in your browser&apos;s address bar, then try again. Or type your answer instead.
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => speech.reset()}>
              Try again
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setMode("type")}>
              Type instead
            </button>
          </div>
        </div>
      )}

      {mode === "voice" && speech.status !== "denied" && !reviewing && (
        <div className={`flex flex-col items-center gap-5 py-4 ${recording ? "cue-live" : ""}`}>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={supported === null || speech.status === "starting"}
            aria-pressed={recording}
            className={`cue-ring relative flex size-24 -rotate-3 items-center justify-center rounded-full border-4 transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] ${
              recording
                ? "border-ink bg-tomato text-on-ink"
                : "border-[var(--die)] bg-tomato text-on-ink hover:rotate-0 hover:scale-[1.04]"
            }`}
          >
            {recording ? <StopIcon size={34} weight="fill" aria-hidden /> : <MicrophoneIcon size={36} weight="fill" aria-hidden />}
            <span className="sr-only">{recording ? "Stop recording" : "Start recording"}</span>
          </button>

          <div className="flex items-center gap-3 text-label" aria-live="polite">
            {recording ? (
              <>
                <span className="flex h-5 w-1.5 items-end overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  <span ref={meter} className="block h-full w-full origin-bottom rounded-full bg-cue transition-transform duration-75" />
                </span>
                <span className="font-medium text-cue">Recording</span>
                <span className={`tabular ${overTime ? "font-semibold text-down" : "text-muted"}`}>
                  {clock(speech.elapsed)} / {clock(TARGET_SECONDS)}
                </span>
              </>
            ) : (
              <span className="text-muted">
                {interviewer ? `Your turn. Tap the mic and answer ${interviewer} out loud.` : "Tap to start."} Aim for about one to two minutes.
              </span>
            )}
          </div>
          {overTime && recording && <p className="text-label text-muted">Time to wrap up with your result.</p>}

          {nudge && !overTime && (
            <p role="status" className="flex max-w-[60ch] flex-wrap items-baseline justify-center gap-x-1.5 text-center text-label">
              <span className="font-semibold text-grape-text">Keep going.</span>
              <span className="text-muted">
                {nudge.tip} Try: <q className="font-medium text-ink">{nudge.starter.trim()}...</q>
              </span>
            </p>
          )}

          {recording && (
            <p className="min-h-[3lh] w-full max-w-[60ch] text-center leading-relaxed text-muted" aria-live="off">
              {liveText || "Listening..."}
            </p>
          )}
        </div>
      )}

      {mode === "voice" && reviewing && (
        <div className="flex flex-col gap-3">
          <label htmlFor={reviewId} className="text-label font-medium">
            Your answer, transcribed. Fix any words it got wrong.
          </label>
          <textarea
            id={reviewId}
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            maxLength={MAX_CHARS}
            rows={7}
            className="field resize-y leading-relaxed"
          />
          {!voiceText.trim() && (
            <p className="text-label text-muted">We didn&apos;t catch any words. Record again, closer to the microphone, or type it.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-go" onClick={submitVoice} disabled={!voiceText.trim()}>
              {submitText}
            </button>
            <button type="button" className="btn btn-ghost" onClick={toggleRecording}>
              Record again
            </button>
            <span className="tnum ml-auto text-label text-muted">
              {countWords(voiceText)} words · {clock(voiceDuration)}
            </span>
          </div>
        </div>
      )}

      {mode === "type" && (
        <div className="flex flex-col gap-3">
          <label htmlFor={textareaId} className="text-label font-medium">
            Type your answer as you would say it
          </label>
          <textarea
            ref={typedRef}
            id={textareaId}
            value={typed}
            onChange={(e) => {
              if (typedStart.current === null) typedStart.current = performance.now();
              startClock();
              setTyped(e.target.value);
            }}
            maxLength={MAX_CHARS}
            rows={8}
            placeholder={placeholder}
            aria-describedby={error ? errorId : undefined}
            className="field resize-y leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-go" onClick={submitTyped} disabled={!typed.trim()}>
              {submitText}
            </button>
            <span className="tnum ml-auto text-label text-muted">{countWords(typed)} words</span>
          </div>
        </div>
      )}

      {starOn && (mode === "type" || recording || reviewing) && <StarChecklist text={mode === "type" ? typed : reviewing ? voiceText : liveText} />}

      {help && !reviewing && (
        <StuckHelper category={help.category} lookingFor={help.lookingFor} questionId={help.questionId} mode={mode} onInsert={insertStarter} />
      )}

      <CalmMoment open={calmOpen} onClose={() => setCalmOpen(false)} />

      {error && (
        <p id={errorId} role="alert" className="text-label text-down">
          {error}
        </p>
      )}

      {onCancel && !recording && (
        <button type="button" className="btn btn-quiet w-fit" onClick={onCancel}>
          Back to notes
        </button>
      )}
    </section>
  );
}
