"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { MODES, PERSONAS } from "@/lib/game";
import { kokoroState, onKokoroChange } from "@/lib/kokoro";
import { prepareSpeech, warmVoice } from "@/lib/tts";
import type { Session } from "@/lib/types";
import { FeelCheck } from "./feel-check";
import { PersonaAvatar } from "./persona-avatar";
import { VoiceProgress } from "./voice-progress";

const SERVER_STATE = { status: "idle" as const, progress: 0, cached: null };

/**
 * Shown before the first question: a one-tap check-in on how you feel, while the
 * interviewer's voice gets ready in the background so it plays straight away.
 */
export function ReadyScreen({
  session,
  voiceEngine,
  readAloud,
  onStart,
}: {
  session: Session;
  voiceEngine: "standard" | "kokoro";
  readAloud: boolean;
  onStart: () => void;
}) {
  const persona = PERSONAS[session.persona ?? "friendly"];
  const first = session.questions[0]?.question.text ?? "";
  const kokoro = useSyncExternalStore(onKokoroChange, kokoroState, () => SERVER_STATE);

  // Get the greeting and first question ready while the user picks.
  useEffect(() => {
    let live = true;
    warmVoice(voiceEngine).then(() => {
      if (live) prepareSpeech([persona.greeting, first], persona, voiceEngine);
    });
    prepareSpeech([persona.greeting, first], persona, voiceEngine);
    return () => {
      live = false;
    };
  }, [persona, first, voiceEngine]);

  const loadingVoice = readAloud && voiceEngine === "kokoro" && kokoro.status === "loading";

  return (
    <section aria-labelledby="ready" className="panel flex flex-col items-center gap-6 px-5 py-8 text-center sm:px-10 sm:py-12">
      <PersonaAvatar id={persona.id} size={96} />
      <div className="flex flex-col gap-2">
        <h1 id="ready" className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">
          {persona.name} is ready when you are
        </h1>
        <p className="text-muted">
          {MODES[session.mode ?? "quick"].name} · {session.role} · {session.questions.length}{" "}
          {session.questions.length === 1 ? "question" : "questions"}
        </p>
      </div>

      {session.mode === "live" && (
        <p className="max-w-[48ch] text-body-sm text-muted">
          Hands-free: {persona.name} asks each question out loud, listens, and replies when you pause. Your notes come at the
          end, with a full transcript. Headphones help if you have them.
        </p>
      )}

      <FeelCheck session={session} when="before" onPicked={onStart} centered />

      {readAloud && (
        <div className="flex min-h-6 w-full max-w-sm justify-center text-label text-muted" aria-live="polite">
          {loadingVoice ? (
            <VoiceProgress progress={kokoro.progress} cached={kokoro.cached} name={`${persona.name}'s voice`} />
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon size={16} weight="fill" className="text-up" aria-hidden />
              {persona.name}&apos;s voice is ready
            </span>
          )}
        </div>
      )}

      <button type="button" className="btn btn-quiet text-label" onClick={onStart}>
        Skip and start <ArrowRightIcon size={16} weight="bold" aria-hidden />
      </button>
    </section>
  );
}
