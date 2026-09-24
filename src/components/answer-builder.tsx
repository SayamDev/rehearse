"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BookmarkSimpleIcon, CheckIcon, MicrophoneIcon, SpeakerHighIcon, StopIcon } from "@phosphor-icons/react";
import { SPEAKING_WPM, STAR_PARTS, STAR_QUESTIONS, starText, type StarDraft } from "@/lib/prepare";
import { createSession, getSettings, saveAnswer, useStore } from "@/lib/store";
import { countWords } from "@/lib/delivery";
import { PERSONAS } from "@/lib/game";
import { speak, stopSpeaking, useVoiceState } from "@/lib/tts";
import type { Question } from "@/lib/types";
import { JobCombobox } from "./job-combobox";

const DRAFT_KEY = "rehearse:star-draft";
const EMPTY: StarDraft = { situation: "", task: "", action: "", result: "" };
const OTHER = "__other";

type Draft = { job: string; question: string; parts: StarDraft };

function toQuestion(text: string): Question {
  return {
    id: crypto.randomUUID(),
    text,
    category: "behavioral",
    competency: "problem-solving",
    difficulty: 2,
    lookingFor: "A real example: the situation, what you had to do, the steps you took yourself, and how it turned out.",
  };
}

/**
 * Answer builder: four small boxes (what happened, your job, what you did, the result) that
 * become one spoken answer. Made for people who freeze: fill a box at a time, then practise it.
 */
export function AnswerBuilder({ initialQuestion = "" }: { initialQuestion?: string }) {
  const router = useRouter();
  const { hydrated, bank } = useStore();
  const [job, setJob] = useState("");
  const [question, setQuestion] = useState(initialQuestion || STAR_QUESTIONS[0]);
  const [custom, setCustom] = useState(Boolean(initialQuestion) && !STAR_QUESTIONS.includes(initialQuestion));
  const [parts, setParts] = useState<StarDraft>(EMPTY);
  const [saved, setSaved] = useState(false);
  const ids = { job: useId(), q: useId(), custom: useId() };
  const voice = useVoiceState();
  const reading = voice.persona === "friendly" && voice.status !== "idle";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      const d = raw ? (JSON.parse(raw) as Draft) : null;
      if (d) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setJob(d.job ?? "");
        setParts({ ...EMPTY, ...d.parts });
        if (!initialQuestion && d.question) {
          setQuestion(d.question);
          setCustom(!STAR_QUESTIONS.includes(d.question));
        }
      }
    } catch {
      // No saved draft.
    }
  }, [initialQuestion]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ job, question, parts }));
    } catch {
      // Storage blocked.
    }
  }, [job, question, parts]);

  useEffect(() => () => stopSpeaking(), []);

  const script = starText(parts);
  const words = countWords(script);
  const seconds = Math.round((words / SPEAKING_WPM) * 60);
  const filled = STAR_PARTS.filter((p) => parts[p.id].trim().length > 8).length;
  const verdict =
    words === 0 ? null : seconds < 45 ? "A bit short. Add more to “What you did”." : seconds > 150 ? "A bit long. Keep the first two parts to one sentence each." : "Good length.";
  const q = question.trim();
  const alreadySaved = hydrated && bank.some((a) => a.question.text === q && a.text === script);

  function update(id: keyof StarDraft, value: string) {
    setSaved(false);
    setParts((p) => ({ ...p, [id]: value }));
  }

  function addStarter(id: keyof StarDraft, starter: string) {
    const current = parts[id].trimEnd();
    update(id, `${current}${current ? (/[.!?]$/.test(current) ? " " : ". ") : ""}${starter}`);
    requestAnimationFrame(() => {
      const el = document.getElementById(`star-${id}`) as HTMLTextAreaElement | null;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function save() {
    // Each box becomes a key point to recall later.
    const keyPoints = STAR_PARTS.map((p) => parts[p.id].trim())
      .filter(Boolean)
      .map((t) => ({ id: crypto.randomUUID(), text: t.length > 90 ? `${t.slice(0, 87).trimEnd()}...` : t }));
    saveAnswer({ role: job.trim() || "Any job", question: toQuestion(q), text: script, keyPoints });
    setSaved(true);
  }

  function practise() {
    if (!alreadySaved) save();
    stopSpeaking();
    const session = createSession({
      role: job.trim() || "Any job",
      seniority: "entry",
      jobDescription: "",
      questions: [toQuestion(q)],
      demo: true,
      mode: "quick",
      persona: "friendly",
    });
    router.push(`/practice/${session.id}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Answer builder</h1>
        <p className="max-w-[58ch] text-muted">
          Freeze on &ldquo;tell me about a time&rdquo; questions? Build your answer one small box at a time. Together they make a
          clear story, then you practise saying it.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={ids.q} className="text-label font-medium">
          The question
        </label>
        <select
          id={ids.q}
          className="field max-w-xl"
          value={custom ? OTHER : question}
          onChange={(e) => {
            const v = e.target.value;
            setCustom(v === OTHER);
            if (v !== OTHER) setQuestion(v);
            else setQuestion("");
          }}
        >
          {STAR_QUESTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={OTHER}>My own question...</option>
        </select>
        {custom && (
          <>
            <label htmlFor={ids.custom} className="sr-only">
              Your question
            </label>
            <input
              id={ids.custom}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              placeholder="Type the question you want to answer"
              className="field max-w-xl"
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={ids.job} className="text-label font-medium">
          Job you&apos;re applying for (optional)
        </label>
        <JobCombobox id={ids.job} value={job} onChange={setJob} className="max-w-xl" />
      </div>

      <ol className="flex flex-col gap-6">
        {STAR_PARTS.map((p, i) => {
          const done = parts[p.id].trim().length > 8;
          return (
            <li key={p.id} className="flex gap-4">
              <span aria-hidden className={`sticker tnum size-9 shrink-0 justify-center p-0 text-body ${done ? "sticker-lime" : ""}`}>
                {done ? <CheckIcon size={16} weight="bold" /> : i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label htmlFor={`star-${p.id}`} className="text-title font-bold">
                  {p.title}
                </label>
                <p className="text-body-sm text-muted">{p.prompt}</p>
                <textarea
                  id={`star-${p.id}`}
                  value={parts[p.id]}
                  onChange={(e) => update(p.id, e.target.value)}
                  rows={p.id === "action" ? 4 : 2}
                  maxLength={700}
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

      <section aria-labelledby="answer" className="panel flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="answer" className="text-title font-bold">
            Your answer
          </h2>
          {words > 0 && (
            <span className={`sticker tnum ${verdict === "Good length." ? "sticker-lime" : "sticker-sun"}`}>
              About {seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)} min ${seconds % 60} sec`}
            </span>
          )}
        </div>
        {q && <p className="text-label font-semibold text-muted">{q}</p>}
        {script ? (
          <p className="max-w-[62ch] leading-relaxed">{script}</p>
        ) : (
          <p className="text-muted">Fill in the boxes above and your answer appears here.</p>
        )}
        {verdict && (
          <p className="text-label text-muted" aria-live="polite">
            <span className="tnum">{words}</span> words. {verdict} One to two minutes is about right.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-go" disabled={filled < 3 || q.length < 5} onClick={practise}>
            <MicrophoneIcon size={18} weight="fill" aria-hidden />
            Practise saying it
          </button>
          <button type="button" className="btn btn-ghost" disabled={!script || q.length < 5 || alreadySaved} onClick={save}>
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
        {filled < 3 && script && <p className="text-label text-muted">Fill in at least three boxes to practise with Sam.</p>}
      </section>
    </div>
  );
}
