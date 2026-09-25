"use client";

import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createSession, getSettings, useStore } from "@/lib/store";
import { PERSONAS } from "@/lib/game";
import { isEnglish, languageFor } from "@/lib/languages";
import { CLOSER, OPENER } from "@/lib/prepare";
import { prepareSpeech } from "@/lib/tts";
import type { Category, Competency, Mode, PersonaId } from "@/lib/types";

export type PractiseItem = { text: string; category: Category; competency: Competency; difficulty: number; looking_for: string };

/** Starts a round from ready-made questions (no AI needed to write them). */
export function PractiseButton({
  items,
  role,
  label,
  mode = "quick",
  persona = "friendly",
  variant = "ghost",
  className = "",
  language,
}: {
  items: PractiseItem[];
  /** Job title for the round; defaults to the last one practised. */
  role?: string;
  label: string;
  mode?: Mode;
  persona?: PersonaId;
  variant?: "go" | "ghost" | "primary";
  className?: string;
  /** The questions' language, when the AI wrote them in the user's chosen one. */
  language?: string;
}) {
  const router = useRouter();
  const { sessions } = useStore();

  function start() {
    const questions = items.map((q) => ({
      id: crypto.randomUUID(),
      text: q.text,
      category: q.category,
      competency: q.competency,
      difficulty: q.difficulty,
      lookingFor: q.looking_for,
    }));
    // A mock interview opens and closes like a real one.
    const lang = languageFor(language);
    const english = isEnglish(lang.code);
    const bookended =
      mode === "mock"
        ? [english ? OPENER : { ...OPENER, text: lang.opener }, ...questions, english ? CLOSER : { ...CLOSER, text: lang.closer }]
        : questions;
    const session = createSession({
      role: (role ?? sessions[0]?.role ?? "Any job").slice(0, 80),
      seniority: sessions[0]?.seniority ?? "entry",
      jobDescription: "",
      questions: bookended,
      demo: true,
      mode,
      persona,
      language: language,
    });
    prepareSpeech([PERSONAS[persona].greeting], PERSONAS[persona], getSettings().voiceEngine);
    router.push(`/practice/${session.id}`);
  }

  return (
    <button type="button" className={`btn btn-${variant} w-fit ${className}`} onClick={start} disabled={!items.length}>
      {label} <ArrowRightIcon size={18} weight="bold" aria-hidden />
    </button>
  );
}
