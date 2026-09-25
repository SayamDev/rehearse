"use client";

import Link from "next/link";
import { SessionReport } from "./session-report";
import { FeelCheck } from "./feel-check";
import { ConversationLog } from "./conversation-log";
import { useStore } from "@/lib/store";
import { sessionScore } from "@/lib/session";

/** Loads a session from this browser and renders its report. */
export function SessionView({
  sessionId,
  heading,
  showTranscripts,
  askFeeling = false,
}: {
  sessionId: string;
  heading: string;
  showTranscripts?: boolean;
  /** Ask how the user feels now that the round is over. */
  askFeeling?: boolean;
}) {
  const { hydrated, sessions } = useStore();

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading results">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-20 w-40" />
        <div className="skeleton h-56 w-full rounded-[10px]" />
      </div>
    );
  }

  const idx = sessions.findIndex((s) => s.id === sessionId);
  const session = sessions[idx];
  if (!session) {
    return (
      <div className="flex flex-col items-start gap-4 pt-8">
        <h1 className="text-headline font-bold tracking-[-0.02em]">We can&apos;t find that session</h1>
        <p className="max-w-[52ch] text-muted">Sessions are saved in the browser you practiced in. It may have been deleted or cleared.</p>
        <Link href="/archive" className="btn btn-ghost">
          Back to past rounds
        </Link>
      </div>
    );
  }

  // Sessions are stored newest first, so older ones come after this index.
  const older = sessions
    .slice(idx + 1)
    .map(sessionScore)
    .filter((s): s is number => s !== null);
  const previousAverage = older.length ? older.reduce((a, b) => a + b, 0) / older.length : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">{heading}</h1>
      {askFeeling && <FeelCheck session={session} when="after" />}
      <SessionReport session={session} previousAverage={previousAverage} showTranscripts={showTranscripts} />
      <ConversationLog session={session} />
    </div>
  );
}
