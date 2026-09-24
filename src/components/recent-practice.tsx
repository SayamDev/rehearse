"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { FlagSticker } from "./flag-sticker";
import { sessionScore } from "@/lib/session";

/** Shows the latest session for returning visitors; renders nothing for first-timers. */
export function RecentPractice() {
  const { hydrated, sessions } = useStore();
  if (!hydrated || sessions.length === 0) return null;
  const last = sessions[0];
  const unfinished = !last.completedAt;
  const score = sessionScore(last);
  const answered = last.questions.filter((q) => q.takes.length > 0).length;

  return (
    <section aria-labelledby="recent" className="panel relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      {unfinished && (
        <FlagSticker
          label={`Question ${Math.min(answered + 1, last.questions.length)}`}
          className="absolute -top-3 right-4"
        />
      )}
      <div>
        <h2 id="recent" className="text-body font-semibold">
          {unfinished ? "Pick up where you left off" : "Your last session"}
        </h2>
        <p className="mt-1 text-label text-muted">
          {last.role} · {answered} of {last.questions.length} answered
          {score !== null && <span> · score {score.toFixed(1)}</span>}
        </p>
      </div>
      <Link
        href={unfinished ? `/practice/${last.id}` : `/practice/new?role=${encodeURIComponent(last.role)}`}
        className="btn btn-ghost w-fit"
      >
        {unfinished ? "Continue" : "Practice again"}
        <ArrowRightIcon size={16} weight="bold" aria-hidden />
      </Link>
    </section>
  );
}
