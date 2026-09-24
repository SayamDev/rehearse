"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRightIcon, CalendarCheckIcon } from "@phosphor-icons/react";
import { dailyQuestion } from "@/lib/daily";
import { createSession, localDay, useStore } from "@/lib/store";

function todaysSession(sessions: ReturnType<typeof useStore>["sessions"], today: string) {
  return sessions.find((s) => s.mode === "daily" && s.questions[0]?.question.id === `daily-${today}`);
}

/** Landing card for today's shared question. */
export function DailyCard() {
  const { hydrated, sessions } = useStore();
  const today = localDay();
  const q = dailyQuestion(today);
  const done = hydrated ? todaysSession(sessions, today) : undefined;
  const finished = Boolean(done?.questions[0]?.takes.length);

  return (
    <section aria-labelledby="daily" className="panel relative flex flex-col gap-3 p-5 sm:p-6">
      <span className="sticker sticker-sun absolute -top-3 left-5">Daily Challenge</span>
      <h2 id="daily" className="pt-2 text-title-lg font-bold leading-snug">
        {q.text}
      </h2>
      <p className="text-body-sm text-muted">One new question every day, the same for everyone. Keep your streak going.</p>
      {finished ? (
        <p className="flex items-center gap-2 font-semibold text-up">
          <CalendarCheckIcon size={20} weight="fill" aria-hidden /> Done for today. Come back tomorrow for a new one.
        </p>
      ) : (
        <Link href="/practice/daily" className="btn btn-ghost w-fit">
          {done ? "Finish today's challenge" : "Take today's challenge"}
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
        </Link>
      )}
    </section>
  );
}

/** Creates (or resumes) today's Daily Challenge session and opens it. */
export function DailyStart() {
  const router = useRouter();
  const { hydrated, sessions } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    const today = localDay();
    const existing = todaysSession(sessions, today);
    const role = sessions.find((s) => s.mode !== "daily")?.role ?? "Any job";
    const session =
      existing ??
      createSession({ role, seniority: "entry", jobDescription: "", questions: [dailyQuestion(today)], demo: true, mode: "daily", persona: "friendly" });
    router.replace(`/practice/${session.id}`);
  }, [hydrated, sessions, router]);

  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Opening today's challenge">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-48 w-full rounded-[var(--radius-panel)]" />
    </div>
  );
}
