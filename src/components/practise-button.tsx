"use client";

import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createSession, getSettings, useStore } from "@/lib/store";
import { PERSONAS } from "@/lib/game";
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
}: {
  items: PractiseItem[];
  /** Job title for the round; defaults to the last one practised. */
  role?: string;
  label: string;
  mode?: Mode;
  persona?: PersonaId;
  variant?: "go" | "ghost" | "primary";
  className?: string;
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
    const session = createSession({
      role: (role ?? sessions[0]?.role ?? "Any job").slice(0, 80),
      seniority: sessions[0]?.seniority ?? "entry",
      jobDescription: "",
      questions,
      demo: true,
      mode,
      persona,
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
