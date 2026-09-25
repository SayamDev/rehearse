"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, ChatCircleTextIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { InterviewerCard } from "./interviewer-card";
import { PersonaAvatar } from "./persona-avatar";
import { MODES, PERSONAS, allowsFollowUp } from "@/lib/game";
import { AnswerComposer, type SubmittedAnswer } from "./answer-composer";
import { NotesCard, NotesSkeleton } from "./notes-card";
import { SaveAnswerPanel } from "./save-answer-panel";
import { FlagSticker } from "./flag-sticker";
import { FeelCheck } from "./feel-check";
import { ReadyScreen } from "./ready-screen";
import { LiveInterview } from "./live-interview";
import { addFollowUp, addTake, completeSession, updateSettings, useSession, useStore, type AddTakeResult } from "@/lib/store";
import { useFocusScreen } from "@/lib/focus";
import { measureDelivery } from "@/lib/delivery";
import { prepareSpeech } from "@/lib/tts";
import { isOffline, offlineGrading } from "@/lib/offline";
import { saveRecording } from "@/lib/recordings";
import { isMockBookend } from "@/lib/prepare";
import { useT } from "@/lib/i18n";
import { deliveryScore, overallScore } from "@/lib/scoring";
import { nextUnanswered } from "@/lib/session";
import type { FallbackReason, Grading, NotesSource } from "@/lib/types";

type Phase = "answer" | "grading" | "notes";

export function PracticeRunner({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { hydrated, session } = useSession(sessionId);
  const { profile } = useStore();
  const t = useT();
  const [index, setIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<SubmittedAnswer | null>(null);
  const [lastResult, setLastResult] = useState<AddTakeResult | null>(null);
  const [started, setStarted] = useState(false);
  const focus = useFocusScreen();

  if (!hydrated) return <RunnerSkeleton />;
  if (!session) {
    return (
      <div className="flex flex-col items-start gap-4 pt-8">
        <h1 className="text-headline font-bold tracking-[-0.02em]">This session isn&apos;t on this device</h1>
        <p className="max-w-[52ch] text-muted">
          Practice sessions are saved in this browser. If you cleared your browser data or opened a link from another device,
          start a new round.
        </p>
        <Link href="/" className="btn btn-go">
          Start a new round
        </Link>
      </div>
    );
  }

  const qIndex = index ?? nextUnanswered(session);
  const sq = session.questions[qIndex];
  const hasTakes = sq.takes.length > 0;
  const currentPhase: Phase = phase === "notes" && !hasTakes ? "answer" : (phase ?? (hasTakes ? "notes" : "answer"));
  const latest = sq.takes[sq.takes.length - 1];
  const previous = sq.takes.length > 1 ? sq.takes[sq.takes.length - 2] : null;
  const isLast = qIndex === session.questions.length - 1;
  const allAnswered = session.questions.every((q) => q.takes.length > 0);

  async function submit(answer: SubmittedAnswer) {
    if (!session) return;
    // Pin the question: once it has a take, "next unanswered" would move on.
    setIndex(qIndex);
    setDraft(answer);
    setError("");
    setPhase("grading");
    try {
      let data: { grading?: Grading; source?: NotesSource; reason?: FallbackReason; error?: string };
      try {
        const res = await fetch("/api/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: session.role,
            seniority: session.seniority,
            jobDescription: session.jobDescription,
            question: sq.question,
            answer: answer.text,
            mode: answer.mode,
            plain: profile.settings.plainWords,
            language: session.language ?? "en",
          }),
        });
        data = await res.json();
        if (!res.ok || !data.grading) throw new Error(data.error ?? "We couldn't score that answer. Try again.");
      } catch (err) {
        if (!isOffline(err)) throw err;
        // No connection: the built-in notes still score the answer.
        data = {
          grading: offlineGrading({ role: session.role, seniority: session.seniority, question: sq.question, answer: answer.text, mode: answer.mode }),
          source: "rules",
          reason: "offline",
        };
      }
      if (!data.grading) throw new Error("We couldn't score that answer. Try again.");
      const delivery =
        answer.mode === "voice" && profile.settings.deliveryMetrics ? measureDelivery(answer.text, answer.durationSec) : null;
      const dScore = delivery ? deliveryScore(delivery) : null;
      const result = addTake(session.id, qIndex, {
        mode: answer.mode,
        transcript: answer.text,
        delivery,
        grading: data.grading,
        deliveryScore: dScore,
        overall: data.grading.isGenuineAnswer ? overallScore(data.grading, dScore) : 1,
        source: data.source ?? "rules",
        sourceReason: data.reason ?? null,
      });
      setLastResult(result);
      setDraft(null);
      // Keep the recording on this device so the best answers can be replayed later.
      if (answer.audio && profile.settings.keepRecordings && data.grading.isGenuineAnswer) {
        void saveRecording({
          takeId: result.take.id,
          question: sq.question.text,
          role: session.role,
          score: result.take.overall,
          createdAt: new Date().toISOString(),
          audio: answer.audio,
        });
      }
      // Get the interviewer's follow-up ready while the notes are read.
      if (session.persona && data.grading.followUpQuestion && allowsFollowUp(session.mode ?? "quick") && !isMockBookend(sq.question)) {
        const who = PERSONAS[session.persona];
        prepareSpeech([who.followUpLead, data.grading.followUpQuestion], who, profile.settings.voiceEngine);
      }
      setPhase("notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setPhase("answer");
    }
  }

  function goTo(i: number) {
    setIndex(i);
    setPhase(null);
    setLastResult(null);
    setError("");
    setDraft(null);
    window.scrollTo({ top: 0 });
  }

  function finish() {
    if (!session) return;
    completeSession(session.id);
    router.push(`/practice/${session.id}/summary`);
  }

  const justGraded = lastResult !== null && latest?.id === lastResult.take.id;
  const canFollowUp =
    allowsFollowUp(session.mode ?? "quick") &&
    !sq.question.followUpOf &&
    !isMockBookend(sq.question) &&
    Boolean(latest?.grading.isGenuineAnswer && latest.grading.followUpQuestion) &&
    !session.questions.some((q) => q.question.followUpOf === sq.question.id);

  // Before a fresh round: a check-in while the interviewer's voice gets ready.
  // "Just one question" skips it: the point is to start straight away.
  const fresh = !session.oneQuestion && !session.questions.some((q) => q.takes.length > 0) && session.feel?.before === undefined;
  if (fresh && !started) {
    return (
      <ReadyScreen
        session={session}
        voiceEngine={profile.settings.voiceEngine}
        readAloud={profile.settings.readAloud}
        onStart={() => setStarted(true)}
      />
    );
  }

  // Live Interview stays on screen until it finishes (notes arrive one by one at the end).
  if (session.mode === "live" && !session.completedAt && !allAnswered) {
    return <LiveInterview session={session} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-label text-muted">
            <span className="font-medium text-ink">{session.role}</span>
          </p>
          {!focus && (
            <button type="button" className="btn btn-quiet min-h-9 px-2.5 text-label" onClick={() => updateSettings({ focusMode: true })}>
              <EyeSlashIcon size={16} weight="bold" aria-hidden /> Focus
            </button>
          )}
        </div>
        <QuestionTrack
          total={session.questions.length}
          current={qIndex}
          answered={session.questions.map((q) => q.takes.length > 0)}
          onSelect={currentPhase === "grading" ? undefined : goTo}
        />
      </div>

      {!session.questions.some((q) => q.takes.length > 0) && session.feel?.before !== undefined && (
        <FeelCheck session={session} when="before" />
      )}

      {session.persona ? (
        <InterviewerCard
          personaId={session.persona}
          question={sq.question.text}
          intro={
            sq.question.followUpOf
              ? PERSONAS[session.persona].followUpLead
              : qIndex === 0 && !hasTakes
                ? PERSONAS[session.persona].greeting
                : undefined
          }
          readAloud={profile.settings.readAloud}
          voiceEngine={profile.settings.voiceEngine}
          autoRead={!hasTakes && currentPhase === "answer"}
          upNext={focus ? undefined : session.questions[qIndex + 1]?.question.text}
          headingId="question"
          srPrefix={`Question ${qIndex + 1} of ${session.questions.length}: `}
        />
      ) : (
        <section aria-labelledby="question" className="flex flex-col gap-3">
          <h1 id="question" className="text-question font-semibold leading-[1.2] tracking-[-0.02em] sm:text-headline">
            <span className="sr-only">
              Question {qIndex + 1} of {session.questions.length}:{" "}
            </span>
            {sq.question.text}
          </h1>
        </section>
      )}

      {currentPhase === "answer" && (
        <AnswerComposer
          key={`${qIndex}-${sq.takes.length}`}
          takeNumber={sq.takes.length + 1}
          defaultMode={session.mode === "phone" ? "voice" : profile.settings.defaultAnswerMode}
          initialText={draft?.text}
          initialMode={draft?.mode}
          error={error}
          onSubmit={submit}
          onCancel={hasTakes ? () => setPhase("notes") : undefined}
          timeLimit={MODES[session.mode ?? "quick"].timeLimit}
          setting={session.mode === "phone" || session.mode === "video" ? session.mode : undefined}
          interviewer={session.persona ? PERSONAS[session.persona].name : undefined}
          keepAudio={profile.settings.keepRecordings}
          question={sq.question.text}
          help={profile.settings.helpers ? { category: sq.question.category, lookingFor: sq.question.lookingFor, questionId: sq.question.id } : undefined}
        />
      )}

      {currentPhase === "grading" && <NotesSkeleton who={session.persona ? PERSONAS[session.persona].name : undefined} />}

      {currentPhase === "notes" && latest && (
        <>
          <NotesCard
            question={sq.question}
            take={latest}
            previous={previous}
            animate={justGraded}
            levelUp={justGraded ? lastResult.levelUp : false}
            xpLevel={profile.xp}
            interviewerAsksFollowUp={canFollowUp && Boolean(session.persona)}
            soft={profile.settings.softMode}
            focus={focus}
          />
          {canFollowUp && session.persona && (
            <section aria-label="Follow-up question" className="flex items-center gap-4 rounded-[var(--radius-panel)] border-2 border-dashed border-line p-4">
              <PersonaAvatar id={session.persona} size={52} tilt={4} />
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-body">
                  <span className="font-display font-bold">{PERSONAS[session.persona].name}:</span>{" "}
                  {PERSONAS[session.persona].followUpLead} <span className="font-semibold">{latest.grading.followUpQuestion}</span>
                </p>
                <button
                  type="button"
                  className="btn btn-ghost w-fit min-h-10 text-label"
                  onClick={() => {
                    const i = addFollowUp(session.id, qIndex, {
                      id: crypto.randomUUID(),
                      text: latest.grading.followUpQuestion,
                      category: sq.question.category,
                      competency: sq.question.competency,
                      difficulty: Math.min(5, sq.question.difficulty + 1),
                      lookingFor: "A specific, honest answer that builds on what you just said.",
                      followUpOf: sq.question.id,
                    });
                    goTo(i);
                  }}
                >
                  <ChatCircleTextIcon size={16} weight="fill" aria-hidden />
                  {t("run.followUp")}
                </button>
              </div>
            </section>
          )}
          <SaveAnswerPanel key={sq.question.id} role={session.role} question={sq.question} takes={sq.takes} />
          <div data-sticky-bar className="sticky bottom-[72px] z-20 -mx-4 flex gap-2 border-t border-line bg-floor/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0 [&>button]:flex-1 sm:[&>button]:flex-none">
            <button type="button" className="btn btn-go h-12 px-6" onClick={() => setPhase("answer")}>
              Take {sq.takes.length + 1}
            </button>
            {!isLast ? (
              <button type="button" className="btn btn-ghost h-12 px-6" onClick={() => goTo(qIndex + 1)}>
                {t("run.next")}
                <ArrowRightIcon size={16} weight="bold" aria-hidden />
              </button>
            ) : (
              <button type="button" className="btn btn-primary h-12 px-6" onClick={finish} disabled={!allAnswered}>
                {allAnswered ? t("run.results") : t("run.answerAll")}
                {allAnswered && <ArrowRightIcon size={16} weight="bold" aria-hidden />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function QuestionTrack({
  total,
  current,
  answered,
  onSelect,
}: {
  total: number;
  current: number;
  answered: boolean[];
  onSelect?: (i: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2.5 pt-2" aria-label="Questions">
      {Array.from({ length: total }, (_, i) => {
        const active = i === current;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect?.(i)}
              disabled={!onSelect || active}
              aria-current={active ? "step" : undefined}
              aria-label={`Question ${i + 1}${answered[i] ? ", answered" : active ? ", current" : ", not started"}`}
              className={`tnum relative flex size-10 items-center justify-center rounded-full font-display text-body font-bold transition-transform ${
                active
                  ? "rotate-3 border-[3px] border-[var(--die)] bg-sun text-on-ink shadow-[var(--sticker-shadow)]"
                  : answered[i]
                    ? "-rotate-3 border-[3px] border-[var(--die)] bg-lime text-on-ink shadow-[var(--sticker-shadow)] hover:rotate-0"
                    : "border-2 border-dashed border-muted/60 text-muted hover:border-muted"
              } disabled:cursor-default`}
            >
              {i + 1}
              {active && <FlagSticker className="absolute -right-4 -top-4 scale-75" />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function RunnerSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading practice">
      <div className="skeleton h-5 w-40" />
      <div className="skeleton h-4 w-28" />
      <div className="skeleton h-9 w-full" />
      <div className="skeleton h-9 w-3/4" />
      <div className="skeleton mt-6 h-48 w-full rounded-[10px]" />
    </div>
  );
}
