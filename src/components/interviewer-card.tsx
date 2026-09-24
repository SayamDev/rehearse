"use client";

import { useEffect } from "react";
import { SpeakerHighIcon, SpeakerSlashIcon, StopIcon } from "@phosphor-icons/react";
import { PersonaAvatar } from "./persona-avatar";
import { StickerLoader, VoiceBars } from "./sticker-loader";
import { PERSONAS } from "@/lib/game";
import { prepareSpeech, speak, stopSpeaking, useVoiceState, warmVoice } from "@/lib/tts";
import { updateSettings } from "@/lib/store";
import type { PersonaId } from "@/lib/types";

/**
 * The interviewer asking the question: their sticker portrait, and the question
 * in a speech bubble. Reads the question aloud when the setting is on.
 */
export function InterviewerCard({
  personaId,
  question,
  intro,
  readAloud,
  voiceEngine = "standard",
  autoRead,
  headingId,
  srPrefix,
  upNext,
}: {
  personaId: PersonaId;
  question: string;
  /** A line said before the question (greeting or follow-up lead). */
  intro?: string;
  readAloud: boolean;
  voiceEngine?: "standard" | "kokoro";
  /** Speak automatically when the question appears (only before any answer). */
  autoRead: boolean;
  headingId: string;
  srPrefix: string;
  /** The next question, prepared in the background so it plays without a wait. */
  upNext?: string;
}) {
  const persona = PERSONAS[personaId];
  const voice = useVoiceState();
  const mine = voice.persona === personaId;
  const preparing = mine && voice.status === "preparing";
  const speaking = mine && voice.status === "speaking";
  const line = intro ? [intro, question] : [question];

  useEffect(() => {
    warmVoice(voiceEngine);
  }, [voiceEngine]);

  useEffect(() => {
    if (!readAloud || !autoRead) return;
    // A beat for the page to settle before the voice starts.
    const t = setTimeout(() => speak(intro ? [intro, question] : [question], persona, voiceEngine), 80);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [question, intro, readAloud, autoRead, persona, voiceEngine]);

  useEffect(() => {
    if (!upNext || !readAloud) return;
    // After the current line has had a head start.
    const t = setTimeout(() => prepareSpeech([upNext], persona, voiceEngine), 1500);
    return () => clearTimeout(t);
  }, [upNext, readAloud, persona, voiceEngine]);

  return (
    <section aria-labelledby={headingId} className="flex items-start gap-3 sm:gap-4">
      <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
        <PersonaAvatar id={personaId} size={64} />
        <span className="flex items-center gap-1.5 text-label font-semibold">
          {persona.name}
          {speaking && <VoiceBars className="text-tomato" />}
        </span>
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col gap-3 rounded-[var(--radius-panel)] border-[3px] border-[var(--die)] bg-surface p-4 shadow-[var(--sticker-shadow)] sm:p-5">
        {/* Speech-bubble tail pointing at the interviewer. */}
        <span
          aria-hidden
          className="absolute -left-[11px] top-7 size-5 rotate-45 border-b-[3px] border-l-[3px] border-[var(--die)] bg-surface"
        />
        {preparing && <StickerLoader delayed label={`${persona.name} is getting ready to speak...`} />}
        {intro && <p className="text-body text-muted">{intro}</p>}
        <h1 id={headingId} className="text-question font-semibold leading-[1.2] tracking-[-0.02em] sm:text-headline">
          <span className="sr-only">{srPrefix}</span>
          {question}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-quiet min-h-9 -ml-2 text-label"
            onClick={() => (preparing || speaking ? stopSpeaking() : speak(line, persona, voiceEngine))}
          >
            {preparing || speaking ? <StopIcon size={16} weight="fill" aria-hidden /> : <SpeakerHighIcon size={16} weight="fill" aria-hidden />}
            {preparing || speaking ? "Stop" : "Hear it"}
          </button>
          <button
            type="button"
            className="btn btn-quiet min-h-9 text-label"
            aria-pressed={readAloud}
            onClick={() => {
              if (readAloud) stopSpeaking();
              updateSettings({ readAloud: !readAloud });
            }}
          >
            {readAloud ? <SpeakerSlashIcon size={16} aria-hidden /> : <SpeakerHighIcon size={16} aria-hidden />}
            {readAloud ? "Stop reading aloud" : "Read questions aloud"}
          </button>
        </div>
      </div>
    </section>
  );
}
