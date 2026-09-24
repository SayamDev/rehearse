"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MicrophoneIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { PERSONAS } from "@/lib/game";
import { BACKCHANNELS, CLOSING, STILL_THERE, TAKE_YOUR_TIME, TRANSITIONS, pick } from "@/lib/live";
import { isMockBookend } from "@/lib/prepare";
import { prepareSpeech, speak, stopSpeaking, useVoiceState } from "@/lib/tts";
import { useSpeech, useSpeechSupported } from "@/lib/use-speech";
import { countWords, measureDelivery } from "@/lib/delivery";
import { deliveryScore, overallScore } from "@/lib/scoring";
import { saveRecording } from "@/lib/recordings";
import { addTake, completeSession, setConversation, useStore } from "@/lib/store";
import { accurateTranscript } from "@/lib/transcribe";
import type { ConversationLine, Grading, NotesSource, Session } from "@/lib/types";
import { PersonaAvatar } from "./persona-avatar";
import { StickerLoader, VoiceBars } from "./sticker-loader";

type Phase = "speaking" | "listening" | "wrapping" | "thinking" | "paused" | "grading" | "failed";
/** A spoken answer. `final` resolves to the accurate (Whisper-checked) transcript. */
type Answer = { text: string; secs: number; audio: Blob | null; final: Promise<string> };
type Line = ConversationLine & { id: number; checking?: boolean };

/** Silence before any words, before the interviewer checks in. Two check-ins, then a pause. */
const STILL_THERE_MS = 12_000;
type Reaction = { reply: string; probe: string };

/** At most this many follow-ups per interview, so it never feels like an interrogation. */
const MAX_PROBES = 2;

/**
 * Live Interview: hands-free, like a real call. The interviewer asks out loud, the
 * mic listens, a natural pause ends the answer, and the interviewer reacts before
 * the next question. Notes come at the end, like after a real interview.
 */
export function LiveInterview({ session }: { session: Session }) {
  const router = useRouter();
  const { profile } = useStore();
  const settings = profile.settings;
  const persona = PERSONAS[session.persona ?? "friendly"];
  const engine = settings.voiceEngine;
  const questions = session.questions.map((q) => q.question);
  const supported = useSpeechSupported();
  const voice = useVoiceState();

  const [phase, setPhase] = useState<Phase>("speaking");
  const [qIndex, setQIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [nudge, setNudge] = useState(false);
  const [error, setError] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const conversationRef = useRef<Line[]>([]);
  useEffect(() => {
    conversationRef.current = lines;
  }, [lines]);
  const [autoPaused, setAutoPaused] = useState(false);

  const orb = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const micBadge = useRef<HTMLSpanElement>(null);
  const reduceMotion = useRef(false);
  const speech = useSpeech({
    // Always recorded (in memory) so each answer can be transcribed accurately; only kept if the user opts in.
    record: true,
    onLevel: (l) => {
      // Normal speech only reaches about 0.1 to 0.4 on the raw meter; this curve makes it clearly visible.
      const v = Math.min(1, Math.sqrt(l) * 1.4);
      if (v > 0.45) lastActivity.current = performance.now();
      if (orb.current && !reduceMotion.current) orb.current.style.transform = `scale(${1 + v * 0.12})`;
      if (micBadge.current) micBadge.current.style.transform = `scale(${1 + v * 0.3})`;
      // Sound bars follow the voice, each a little different, so talking visibly moves them.
      meter.current?.querySelectorAll<HTMLSpanElement>("span").forEach((bar, n) => {
        const shape = [0.45, 0.7, 0.9, 1, 0.9, 0.7, 0.45][n] ?? 0.7;
        bar.style.transform = `scaleY(${Math.max(0.15, v * shape)})`;
      });
    },
  });

  const flow = useRef(0);
  const answers = useRef<(Answer | null)[]>(questions.map(() => null));
  const probes = useRef(0);
  const resolveListen = useRef<((a: Answer) => void) | null>(null);
  const lastActivity = useRef(0);
  const listenStart = useRef(0);
  const wrapStart = useRef(0);
  const phaseRef = useRef<Phase>("speaking");
  const checkIns = useRef(0);
  const checking = useRef(false);
  const lineId = useRef(0);
  const currentQuestion = useRef("");
  const latest = useRef({ speech });
  useEffect(() => {
    latest.current = { speech };
  });

  const setP = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Any new words count as activity, so a thinking pause mid-answer doesn't end it.
  const heard = `${speech.transcript} ${speech.interim}`.trim();
  useEffect(() => {
    lastActivity.current = performance.now();
  }, [heard]);

  /* ---------- Transcript ---------- */

  function addLine(who: Line["who"], text: string, checking = false): number {
    const id = ++lineId.current;
    if (text) setLines((l) => [...l, { id, who, text, checking }]);
    return id;
  }

  function settleLine(id: number, text: string) {
    setLines((l) => l.map((x) => (x.id === id ? { ...x, text: text || x.text, checking: false } : x)));
  }

  /* ---------- Speaking ---------- */

  const say = useCallback(
    async (parts: string[], token: number) => {
      if (token !== flow.current) return;
      const text = parts.filter(Boolean).join(" ");
      setCaption(text);
      addLine("interviewer", text);
      setP("speaking");
      await speak(parts.filter(Boolean), persona, engine);
    },
    [persona, engine, setP],
  );

  /* ---------- Listening ---------- */

  const finishListening = useCallback(async () => {
    const resolve = resolveListen.current;
    if (!resolve) return;
    resolveListen.current = null;
    const sp = latest.current.speech;
    const secs = sp.stop();
    const text = `${sp.transcript} ${sp.interim}`.replace(/\s+/g, " ").trim();
    const audio = await sp.lastRecording();
    // Shown straight away from the browser's transcript, then corrected by Whisper.
    const id = addLine("you", text || "(no answer)", Boolean(text));
    const final = text
      ? accurateTranscript(audio, secs, text, `Job interview for a ${session.role} role. Question: ${currentQuestion.current}`).then((t) => {
          settleLine(id, t);
          return t;
        })
      : Promise.resolve("");
    resolve({ text, secs, audio, final });
  }, [session.role]);

  const listen = useCallback(
    async (token: number): Promise<Answer | null> => {
      if (token !== flow.current) return null;
      setNudge(false);
      setAutoPaused(false);
      checkIns.current = 0;
      setP("listening");
      const answer = new Promise<Answer>((resolve) => {
        resolveListen.current = resolve;
      });
      listenStart.current = performance.now();
      lastActivity.current = performance.now();
      await latest.current.speech.start();
      const a = await answer;
      return token === flow.current ? a : null;
    },
    [setP],
  );

  // End-of-answer detection: a natural pause (longer for short answers), then a brief
  // "wrapping up" moment that any new speech cancels.
  useEffect(() => {
    if (phase !== "listening" && phase !== "wrapping") return;
    const id = setInterval(() => {
      const now = performance.now();
      const sp = latest.current.speech;
      const words = countWords(`${sp.transcript} ${sp.interim}`);
      const quiet = now - lastActivity.current;
      // Short answers get a longer pause before Sam replies, in case the person is still thinking.
      const needed = words < 20 ? 2600 : 1600;
      if (words === 0 && now - listenStart.current > STILL_THERE_MS && !checking.current) void checkInRef.current();
      if (now - listenStart.current > 180_000) return void finishListening();
      if (phaseRef.current === "listening" && words >= 3 && quiet > needed) {
        wrapStart.current = now;
        setP("wrapping");
      } else if (phaseRef.current === "wrapping") {
        if (lastActivity.current > wrapStart.current) setP("listening");
        else if (now - wrapStart.current > 700) void finishListening();
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase, finishListening, setP]);

  /** Long silence before any answer: the interviewer checks in out loud, then pauses kindly. */
  async function checkIn() {
    checking.current = true;
    const n = checkIns.current++;
    const sp = latest.current.speech;
    if (n >= 2) {
      checking.current = false;
      pause();
      setAutoPaused(true);
      return;
    }
    sp.stop();
    const line = STILL_THERE[persona.id][n];
    setCaption(line);
    addLine("interviewer", line);
    setNudge(true);
    setP("speaking");
    await speak([line], persona, engine);
    if (!resolveListen.current) {
      checking.current = false;
      return;
    }
    setP("listening");
    listenStart.current = performance.now();
    lastActivity.current = performance.now();
    await sp.start();
    checking.current = false;
  }

  const checkInRef = useRef(checkIn);
  useEffect(() => {
    checkInRef.current = checkIn;
  });

  /* ---------- Reacting ---------- */

  async function react(i: number, answer: string, canProbe: boolean): Promise<Reaction> {
    try {
      const res = await fetch("/api/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: session.role,
          persona: persona.id,
          question: questions[i].text,
          answer: answer.slice(0, 4000),
          canProbe,
          closing: questions[i].category === "closing",
          plain: settings.plainWords,
        }),
        signal: AbortSignal.timeout(7000),
      });
      const data = (await res.json()) as Partial<Reaction>;
      return { reply: data.reply ?? "", probe: data.probe ?? "" };
    } catch {
      return { reply: "", probe: "" };
    }
  }

  /* ---------- The interview ---------- */

  const run = useCallback(
    async (from: number, resumed: boolean) => {
      const token = ++flow.current;
      const alive = () => token === flow.current;
      setQIndex(from);
      await say(resumed ? ["Okay, let's pick up where we left off.", questions[from].text] : [persona.greeting, questions[from].text], token);

      for (let i = from; i < questions.length; i++) {
        if (!alive()) return;
        setQIndex(i);
        const q = questions[i];
        currentQuestion.current = q.text;
        const next = questions[i + 1];
        const transition = pick(TRANSITIONS[persona.id], i + session.id.length);
        // Get the next question ready while this one is answered.
        if (next) prepareSpeech([transition, next.text], persona, engine);

        const first = await listen(token);
        if (!first || !alive()) return;

        // An instant acknowledgement covers the moment it takes to prepare the reaction.
        setP("thinking");
        const canProbe =
          probes.current < MAX_PROBES && !isMockBookend(q) && (q.category === "behavioral" || q.category === "situational");
        const ackLine = pick(BACKCHANNELS[persona.id], i * 7 + first.text.length);
        addLine("interviewer", ackLine);
        const ack = speak([ackLine], persona, engine);
        const reaction = await react(i, first.text, canProbe);
        await ack;
        if (!alive()) return;

        let answer = first;
        let lead: string[] = [reaction.reply];
        if (reaction.probe) {
          probes.current++;
          await say([reaction.reply, reaction.probe], token);
          const more = await listen(token);
          if (!more || !alive()) return;
          answer = {
            text: `${first.text} ${more.text}`.trim(),
            secs: first.secs + more.secs,
            audio: first.audio,
            final: Promise.all([first.final, more.final]).then(([a, b]) => `${a} ${b}`.trim()),
          };
          lead = [pick(BACKCHANNELS[persona.id], i + 3)];
        }
        answers.current[i] = answer;

        if (!next) {
          await say([...lead, CLOSING[persona.id]], token);
          if (alive()) void gradeAll();
          return;
        }
        setQIndex(i + 1);
        await say([...lead, transition, next.text], token);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persona, engine, questions.length],
  );

  // Start as soon as the screen opens (the user just tapped Start, so audio is allowed).
  const begun = useRef(false);
  useEffect(() => {
    if (begun.current || supported !== true) return;
    begun.current = true;
    prepareSpeech(BACKCHANNELS[persona.id], persona, engine);
    void run(0, false);
  }, [supported, run, persona, engine]);

  useEffect(
    () => () => {
      flow.current++;
      stopSpeaking();
    },
    [],
  );

  function pause() {
    flow.current++;
    stopSpeaking();
    resolveListen.current = null;
    latest.current.speech.stop();
    setP("paused");
  }

  /* ---------- Notes at the end ---------- */

  async function gradeAll() {
    flow.current++;
    setP("grading");
    setCaption("");
    setError("");
    const jobs = questions.map(async (q, i) => {
      const a = answers.current[i];
      if (!a || session.questions[i].takes.length > 0) return true;
      // Grade the accurate transcript, not the browser's rough one.
      const text = (await a.final) || a.text || "I didn't answer this question.";
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("/api/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: session.role,
              seniority: session.seniority,
              jobDescription: session.jobDescription,
              question: q,
              answer: text,
              mode: "voice",
              plain: settings.plainWords,
            }),
          });
          const data = (await res.json()) as { grading?: Grading; source?: NotesSource };
          if (!res.ok || !data.grading) continue;
          const delivery = settings.deliveryMetrics ? measureDelivery(text, a.secs) : null;
          const dScore = delivery ? deliveryScore(delivery) : null;
          const result = addTake(session.id, i, {
            mode: "voice",
            transcript: text,
            delivery,
            grading: data.grading,
            deliveryScore: dScore,
            overall: data.grading.isGenuineAnswer ? overallScore(data.grading, dScore) : 1,
            source: data.source ?? "rules",
            sourceReason: null,
          });
          if (a.audio && settings.keepRecordings && data.grading.isGenuineAnswer) {
            void saveRecording({
              takeId: result.take.id,
              question: q.text,
              role: session.role,
              score: result.take.overall,
              createdAt: new Date().toISOString(),
              audio: a.audio,
            });
          }
          return true;
        } catch {
          // Try once more.
        }
      }
      return false;
    });
    const results = await Promise.all(jobs);
    await Promise.all(answers.current.map((a) => a?.final));
    // Let the corrected lines render before saving them.
    await new Promise((r) => setTimeout(r, 50));
    setConversation(
      session.id,
      conversationRef.current.map(({ who, text }) => ({ who, text })),
    );
    if (results.some((ok) => !ok)) {
      setError("Some notes couldn't be written. Check your connection and try again.");
      setP("failed");
      return;
    }
    completeSession(session.id);
    router.push(`/practice/${session.id}/summary`);
  }

  function endNow() {
    if (answers.current.some(Boolean)) void gradeAll();
    else router.push("/practice/new");
  }

  /* ---------- Screen ---------- */

  if (supported === false) {
    return (
      <div className="panel flex flex-col items-start gap-3 p-6">
        <h1 className="text-title-lg font-bold">Live Interview needs a different browser</h1>
        <p className="max-w-[56ch] text-muted">
          Hands-free listening works in Chrome, Edge, and Safari. In this browser, try a Quick Round or Mock Interview, where you
          can type your answers.
        </p>
        <button type="button" className="btn btn-go" onClick={() => router.push("/practice/new?mode=mock")}>
          Try a Mock Interview
        </button>
      </div>
    );
  }

  if (speech.status === "denied") {
    return (
      <div role="alert" className="panel flex flex-col items-start gap-3 p-6">
        <h1 className="text-title-lg font-bold">The microphone is blocked</h1>
        <p className="max-w-[56ch] text-muted">
          Allow the microphone in your browser&apos;s address bar, then try again. Or practise by typing in a Mock Interview.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-go"
            onClick={() => {
              latest.current.speech.reset();
              void run(qIndex, true);
            }}
          >
            Try again
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/practice/new?mode=mock")}>
            Type instead
          </button>
        </div>
      </div>
    );
  }

  const listening = phase === "listening" || phase === "wrapping";
  // While the next line is being prepared, show thinking rather than "talking" over silence.
  const shown: Phase = phase === "speaking" && voice.status === "preparing" ? "thinking" : phase;
  const ring =
    shown === "speaking" ? "border-tomato" : listening ? "border-mint" : "border-line";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-label">
        <span className="font-medium">
          {session.role} <span className="text-muted">· Live Interview</span>
        </span>
        <span className="tnum text-muted">
          Question {Math.min(qIndex + 1, questions.length)} of {questions.length}
        </span>
      </div>

      <section aria-label="Live interview" className="panel flex flex-col items-center gap-6 px-5 py-8 text-center sm:px-10 sm:py-10">
        <div className="relative flex size-44 items-center justify-center">
          <div
            ref={orb}
            aria-hidden
            className={`absolute inset-0 rounded-full border-[6px] bg-surface-2 transition-[border-color,transform] duration-150 ${ring}`}
          />
          <div className="relative">
            <PersonaAvatar id={persona.id} size={112} />
          </div>
          {listening && (
            <span
              ref={micBadge}
              aria-hidden
              className="absolute bottom-1 right-1 flex size-12 items-center justify-center rounded-full border-[3px] border-[var(--die)] bg-mint text-on-ink shadow-[var(--sticker-shadow)] transition-transform duration-75"
            >
              <MicrophoneIcon size={22} weight="fill" />
            </span>
          )}
        </div>

        {/* Voice meter: moves with your voice so you can see you're being heard. */}
        <span ref={meter} aria-hidden className={`flex h-12 items-center gap-1.5 ${listening ? "" : "invisible"}`}>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <span key={n} className="h-full w-2 origin-center rounded-full bg-mint transition-transform duration-75 [transform:scaleY(0.15)]" />
          ))}
        </span>

        <p className="-mt-3 flex min-h-6 items-center justify-center gap-2 text-label font-semibold" aria-live="polite">
          {shown === "speaking" && (
            <>
              <VoiceBars className="text-tomato" /> {persona.name} is talking
            </>
          )}
          {phase === "listening" && (
            <>
              <MicrophoneIcon size={16} weight="fill" className="text-mint" aria-hidden />
              Your turn. {persona.name} is listening
            </>
          )}
          {phase === "wrapping" && <span className="text-muted">Got it...</span>}
          {shown === "thinking" && <StickerLoader size="sm" label={`${persona.name} is thinking...`} />}
          {phase === "paused" && (
            <span>{autoPaused ? `Paused. ${persona.name} will wait until you're ready.` : "Paused"}</span>
          )}
          {phase === "grading" && <StickerLoader label={`${persona.name} is writing your notes...`} />}
        </p>

        {phase !== "grading" && phase !== "failed" && (
          <h1 className="max-w-[26ch] text-question font-semibold leading-[1.2] tracking-[-0.02em] sm:text-headline">
            <span className="sr-only">
              Question {qIndex + 1} of {questions.length}:{" "}
            </span>
            {questions[qIndex]?.text}
          </h1>
        )}

        {caption && phase === "speaking" && !caption.endsWith(questions[qIndex]?.text ?? "") && (
          <p className="max-w-[56ch] text-body text-muted">{caption}</p>
        )}

        {listening && (
          <p className="min-h-[3lh] w-full max-w-[60ch] text-body leading-relaxed text-muted" aria-live="off">
            {heard || (nudge ? TAKE_YOUR_TIME : "Start talking whenever you're ready.")}
          </p>
        )}

        {error && (
          <p role="alert" className="text-label text-down">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {listening && (
            <button type="button" className="btn btn-go" onClick={() => void finishListening()}>
              I&apos;m done answering
            </button>
          )}
          {(listening || phase === "speaking" || phase === "thinking") && (
            <button type="button" className="btn btn-ghost" onClick={pause}>
              <PauseIcon size={18} weight="fill" aria-hidden /> Pause
            </button>
          )}
          {phase === "paused" && (
            <>
              <button type="button" className="btn btn-go" onClick={() => void run(qIndex, true)}>
                <PlayIcon size={18} weight="fill" aria-hidden /> Resume
              </button>
              <button type="button" className="btn btn-ghost" onClick={endNow}>
                End and get my notes
              </button>
            </>
          )}
          {phase === "failed" && (
            <button type="button" className="btn btn-go" onClick={() => void gradeAll()}>
              Try again
            </button>
          )}
        </div>
      </section>

      <p className="text-center text-label text-muted">
        {persona.name} replies when you pause. Headphones help, so the mic doesn&apos;t hear {persona.name}.
      </p>

      <Transcript lines={lines} interviewer={persona.name} />
    </div>
  );
}

/** The conversation so far. Your answers are first shown from the browser, then corrected by Whisper. */
function Transcript({ lines, interviewer }: { lines: Line[]; interviewer: string }) {
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [lines.length]);
  if (lines.length === 0) return null;
  return (
    <section aria-labelledby="live-transcript" className="flex flex-col gap-3">
      <h2 id="live-transcript" className="text-title font-bold">
        Transcript
      </h2>
      <ol className="flex max-h-96 flex-col gap-3 overflow-y-auto border-y border-line py-4 pr-1">
        {lines.map((l) => (
          <li key={l.id} className="flex flex-col gap-0.5">
            <span className={`text-label font-semibold ${l.who === "you" ? "text-ink" : "text-muted"}`}>
              {l.who === "you" ? "You" : interviewer}
            </span>
            <p className={`max-w-[62ch] leading-relaxed ${l.who === "you" ? "" : "text-muted"}`}>{l.text}</p>
            {l.checking && <StickerLoader size="sm" label="Checking the words..." />}
          </li>
        ))}
        <li ref={end} aria-hidden />
      </ol>
    </section>
  );
}
