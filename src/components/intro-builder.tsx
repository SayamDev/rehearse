"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BookmarkSimpleIcon, CheckIcon, MicrophoneIcon, SpeakerHighIcon, StopIcon } from "@phosphor-icons/react";
import { INTRO_PARTS, OPENER, SPEAKING_WPM, introText, type IntroDraft } from "@/lib/prepare";
import { createSession, getSettings, saveAnswer, useStore } from "@/lib/store";
import { suggestKeyPoints } from "@/lib/memory";
import { countWords } from "@/lib/delivery";
import { PERSONAS } from "@/lib/game";
import { speak, stopSpeaking, useVoiceState } from "@/lib/tts";
import { JobCombobox } from "./job-combobox";

const DRAFT_KEY = "rehearse:intro-draft";
const EMPTY: IntroDraft = { now: "", before: "", next: "" };

type Draft = { job: string; parts: IntroDraft };

function readDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

/** Guided "Tell me about yourself": three short parts, a live script, and ways to practise it. */
export function IntroBuilder() {
  const router = useRouter();
  const { hydrated, bank } = useStore();
  const [job, setJob] = useState("");
  const [parts, setParts] = useState<IntroDraft>(EMPTY);
  const [saved, setSaved] = useState(false);
  const jobId = useId();
  const voice = useVoiceState();
  const reading = voice.persona === "friendly" && voice.status !== "idle";

  // Pick up where the user left off (drafts stay in this browser only).
  useEffect(() => {
    const d = readDraft();
    if (d) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJob(d.job ?? "");
      setParts({ ...EMPTY, ...d.parts });
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ job, parts }));
    } catch {
      // Storage blocked: the draft just won't survive a reload.
    }
  }, [job, parts]);

  useEffect(() => () => stopSpeaking(), []);

  const script = introText(parts);
  const words = countWords(script);
  const seconds = Math.round((words / SPEAKING_WPM) * 60);
  const filled = INTRO_PARTS.filter((p) => parts[p.id].trim().length > 10).length;
  const verdict =
    words === 0 ? null : seconds < 40 ? "A bit short. Add a detail or an example." : seconds > 100 ? "A bit long. Try cutting it to the key points." : "Good length.";
  const alreadySaved = hydrated && bank.some((a) => a.question.id === OPENER.id && a.text === script);

  function update(id: keyof IntroDraft, value: string) {
    setSaved(false);
    setParts((p) => ({ ...p, [id]: value }));
  }

  function addStarter(id: keyof IntroDraft, starter: string) {
    const current = parts[id].trimEnd();
    update(id, `${current}${current ? (/[.!?]$/.test(current) ? " " : ". ") : ""}${starter}`);
    requestAnimationFrame(() => {
      const el = document.getElementById(`intro-${id}`) as HTMLTextAreaElement | null;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function save() {
    saveAnswer({ role: job.trim() || "Any job", question: OPENER, text: script, keyPoints: suggestKeyPoints(script) });
    setSaved(true);
  }

  function practise() {
    if (!alreadySaved) save();
    stopSpeaking();
    const session = createSession({
      role: job.trim() || "Any job",
      seniority: "entry",
      jobDescription: "",
      questions: [OPENER],
      demo: true,
      mode: "quick",
      persona: "friendly",
    });
    router.push(`/practice/${session.id}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Tell me about yourself</h1>
        <p className="max-w-[58ch] text-muted">
          Most interviews start with this. Build a one-minute answer in three short parts. You can say it in your own words
          on the day. This is your plan, not a script to learn by heart.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={jobId} className="text-label font-medium">
          Job you&apos;re applying for (optional)
        </label>
        <JobCombobox id={jobId} value={job} onChange={setJob} className="max-w-xl" />
      </div>

      <ol className="flex flex-col gap-6">
        {INTRO_PARTS.map((p, i) => {
          const done = parts[p.id].trim().length > 10;
          return (
            <li key={p.id} className="flex gap-4">
              <span
                aria-hidden
                className={`sticker tnum size-9 shrink-0 justify-center p-0 text-body ${done ? "sticker-lime" : ""}`}
              >
                {done ? <CheckIcon size={16} weight="bold" /> : i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label htmlFor={`intro-${p.id}`} className="text-title font-bold">
                  {p.title}
                </label>
                <p className="text-body-sm text-muted">{p.prompt}</p>
                <textarea
                  id={`intro-${p.id}`}
                  value={parts[p.id]}
                  onChange={(e) => update(p.id, e.target.value)}
                  rows={3}
                  maxLength={600}
                  className="field resize-y leading-relaxed"
                />
                <div className="flex flex-wrap items-center gap-2" aria-label={`Ways to start "${p.title}"`}>
                  {p.starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addStarter(p.id, s)}
                      className="min-h-9 rounded-full border-2 border-line px-3 text-label font-medium text-muted transition-[border-color,color,transform] duration-150 hover:border-ink hover:text-ink active:scale-[0.97]"
                    >
                      {s.trim()}...
                    </button>
                  ))}
                </div>
                <p className="text-label text-muted">{p.tip}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="script" className="panel flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="script" className="text-title font-bold">
            Your intro
          </h2>
          {words > 0 && (
            <span className={`sticker tnum ${verdict === "Good length." ? "sticker-lime" : "sticker-sun"}`}>
              About {seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)} min ${seconds % 60} sec`}
            </span>
          )}
        </div>
        {script ? (
          <p className="max-w-[62ch] leading-relaxed">{script}</p>
        ) : (
          <p className="text-muted">Fill in the three parts above and your intro appears here.</p>
        )}
        {verdict && (
          <p className="text-label text-muted" aria-live="polite">
            <span className="tnum">{words}</span> words. {verdict} Aim for about a minute.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-go" disabled={filled < 2} onClick={practise}>
            <MicrophoneIcon size={18} weight="fill" aria-hidden />
            Practise saying it
          </button>
          <button type="button" className="btn btn-ghost" disabled={!script || alreadySaved} onClick={save}>
            <BookmarkSimpleIcon size={18} weight={saved || alreadySaved ? "fill" : "regular"} aria-hidden />
            {saved || alreadySaved ? "Saved to Remember" : "Save to Remember"}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={!script}
            onClick={() => (reading ? stopSpeaking() : speak(script, PERSONAS.friendly, getSettings().voiceEngine))}
          >
            {reading ? <StopIcon size={18} weight="fill" aria-hidden /> : <SpeakerHighIcon size={18} weight="fill" aria-hidden />}
            {reading ? "Stop" : "Hear it read aloud"}
          </button>
        </div>
        {filled < 2 && script && <p className="text-label text-muted">Fill in at least two parts to practise with Sam.</p>}
      </section>
    </div>
  );
}
