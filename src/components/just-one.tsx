"use client";

import { useRouter } from "next/navigation";
import { LightningIcon } from "@phosphor-icons/react";
import { createSession, getSettings, useStore } from "@/lib/store";
import { pickOneQuestion } from "@/lib/offline";
import { PERSONAS } from "@/lib/game";
import { prepareSpeech } from "@/lib/tts";

/**
 * "Just one question": one tap, one question, about two minutes, no round to finish.
 * Starting is often the hardest part, so there's nothing to choose first.
 */
export function JustOneQuestion({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { hydrated, sessions } = useStore();

  function start() {
    const { role, seniority, question } = pickOneQuestion(sessions);
    const session = createSession({ role, seniority, jobDescription: "", questions: [question], demo: true, mode: "quick", persona: "friendly", oneQuestion: true });
    prepareSpeech([PERSONAS.friendly.greeting, question.text], PERSONAS.friendly, getSettings().voiceEngine);
    router.push(`/practice/${session.id}`);
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <button type="button" className="btn btn-ghost" onClick={start} disabled={!hydrated}>
        <LightningIcon size={18} weight="fill" className="text-sun-text" aria-hidden />
        Just one question
      </button>
      <span className="text-label text-muted">About 2 minutes. Nothing to set up.</span>
    </div>
  );
}
