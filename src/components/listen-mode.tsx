"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, SpeakerHighIcon } from "@phosphor-icons/react";
import { PERSONAS } from "@/lib/game";
import { OPENER } from "@/lib/prepare";
import { getSettings, useStore } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/tts";

type Track = { id: string; kind: "answer" | "story"; title: string; body: string };
/** Seconds of quiet after a question, to answer it in your head first. */
const THINK_SECONDS = 5;

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Listen mode: Sam reads your saved answers and stories one after another, like a podcast
 * for the commute. With "Answer first", each question is followed by a pause so you try it
 * in your head before you hear your answer. Read on the device only: answers never leave it.
 */
export function ListenMode() {
  const { hydrated, bank, profile } = useStore();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [thinkFirst, setThinkFirst] = useState(true);
  const [thinking, setThinking] = useState(0);
  const run = useRef(0);
  const toggleId = useId();

  // Stop talking when leaving the page.
  useEffect(
    () => () => {
      run.current++;
      stopSpeaking();
    },
    [],
  );

  if (!hydrated) return <div className="skeleton h-64 w-full rounded-[var(--radius-panel)]" aria-hidden />;

  const tracks: Track[] = [
    ...bank.map((a) => ({ id: a.id, kind: "answer" as const, title: a.question.id === OPENER.id ? "Tell me about yourself." : a.question.text, body: a.text })),
    ...(profile.stories ?? []).map((s) => ({ id: s.id, kind: "story" as const, title: `Your story: ${s.title}.`, body: s.summary })),
  ].filter((t) => t.body.trim());

  if (!tracks.length) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Listen mode</h1>
        <p className="max-w-[56ch] text-muted">Save an answer or add a story, and Sam will read them to you here.</p>
        <Link href="/remember/stories" className="btn btn-go">
          Add a story
        </Link>
      </div>
    );
  }

  async function wait(seconds: number, token: number) {
    for (let s = seconds; s > 0; s--) {
      if (token !== run.current) return;
      setThinking(s);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setThinking(0);
  }

  async function playFrom(start: number) {
    const token = ++run.current;
    setPlaying(true);
    const engine = getSettings().voiceEngine;
    for (let i = start; i < tracks.length; i++) {
      if (token !== run.current) return;
      setIndex(i);
      const t = tracks[i];
      await speak([t.title], PERSONAS.friendly, engine, true);
      if (token !== run.current) return;
      if (thinkFirst && t.kind === "answer") await wait(THINK_SECONDS, token);
      if (token !== run.current) return;
      await speak(sentences(t.body), PERSONAS.friendly, engine, true);
      if (token !== run.current) return;
      await new Promise((r) => setTimeout(r, 1200));
    }
    if (token === run.current) {
      setPlaying(false);
      setIndex(0);
    }
  }

  function stop() {
    run.current++;
    stopSpeaking();
    setThinking(0);
    setPlaying(false);
  }

  function jump(to: number) {
    const i = Math.max(0, Math.min(tracks.length - 1, to));
    setIndex(i);
    if (playing) {
      stopSpeaking();
      void playFrom(i);
    }
  }

  const current = tracks[index];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Listen mode</h1>
        <p className="max-w-[60ch] text-muted">
          Sam reads your saved answers and stories, one after another. Put your headphones in on the bus or while you walk. Keep
          this page open while it plays.
        </p>
      </header>

      <section aria-labelledby="now" className="panel flex flex-col gap-5 p-5 sm:p-7">
        <p className="flex items-center gap-2 text-label text-muted">
          <SpeakerHighIcon size={16} weight="bold" aria-hidden />
          <span className="tnum">
            {index + 1} of {tracks.length}
          </span>
          <span aria-hidden>·</span>
          {current.kind === "story" ? "Story" : "Saved answer"}
        </p>
        <h2 id="now" className="text-title-lg font-bold leading-snug tracking-[-0.02em]">
          {current.title}
        </h2>
        <p className="min-h-6 text-body-sm text-muted" aria-live="polite">
          {thinking ? `Your turn: answer it in your head. ${thinking}…` : playing ? "Playing" : "Paused"}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-quiet size-12 p-0" onClick={() => jump(index - 1)} disabled={index === 0} aria-label="Previous">
            <SkipBackIcon size={22} weight="fill" aria-hidden />
          </button>
          <button
            type="button"
            className="btn btn-go h-14 min-w-36 px-6 text-body"
            onClick={() => (playing ? stop() : void playFrom(index))}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <PauseIcon size={22} weight="fill" aria-hidden /> : <PlayIcon size={22} weight="fill" aria-hidden />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="btn btn-quiet size-12 p-0"
            onClick={() => jump(index + 1)}
            disabled={index === tracks.length - 1}
            aria-label="Next"
          >
            <SkipForwardIcon size={22} weight="fill" aria-hidden />
          </button>
        </div>
        <label htmlFor={toggleId} className="flex min-h-11 cursor-pointer items-center gap-3 text-body-sm">
          <input id={toggleId} type="checkbox" checked={thinkFirst} onChange={(e) => setThinkFirst(e.target.checked)} className="size-5 accent-[var(--ink)]" />
          Answer first: pause {THINK_SECONDS} seconds after each question so I can try it
        </label>
      </section>

      <section aria-labelledby="playlist" className="flex flex-col gap-3">
        <h2 id="playlist" className="text-title font-bold tracking-[-0.01em]">
          Playlist
        </h2>
        <ol className="panel flex flex-col divide-y divide-line">
          {tracks.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => jump(i)}
                aria-current={i === index ? "true" : undefined}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 ${i === index ? "bg-surface-2" : ""}`}
              >
                <span className="tnum w-6 shrink-0 text-label text-muted">{i + 1}</span>
                <span className={`min-w-0 flex-1 text-body-sm leading-snug ${i === index ? "font-semibold" : ""}`}>{t.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
