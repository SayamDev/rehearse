"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { PATTERNS } from "@/lib/calm";
import { PERSONAS } from "@/lib/game";
import { countBreathing, getSettings } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/tts";
import { Segmented } from "./segmented";

const MIN_SCALE = 0.5;

/**
 * Guided breathing: a big sticker circle grows as you breathe in and shrinks as you
 * breathe out, with a count in the middle. Under reduced motion the circle stays
 * still and a bar fills instead.
 */
export function Breathing({ cycles = 4, compact = false, onDone }: { cycles?: number; compact?: boolean; onDone?: () => void }) {
  const [patternId, setPatternId] = useState(PATTERNS[0].id);
  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0];
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [left, setLeft] = useState(pattern.phases[0].seconds);
  const [voiceOn, setVoiceOn] = useState(false);
  const counted = useRef(false);

  const current = pattern.phases[phase];

  // One tick per second; moves through phases and cycles.
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      if (left > 1) return setLeft(left - 1);
      const nextPhase = (phase + 1) % pattern.phases.length;
      const nextCycle = nextPhase === 0 ? cycle + 1 : cycle;
      if (nextCycle >= cycles) {
        setRunning(false);
        setDone(true);
        setPhase(0);
        setLeft(pattern.phases[0].seconds);
        if (!counted.current) {
          counted.current = true;
          countBreathing();
        }
        onDone?.();
        return;
      }
      setPhase(nextPhase);
      setCycle(nextCycle);
      setLeft(pattern.phases[nextPhase].seconds);
    }, 1000);
    return () => clearTimeout(t);
  }, [running, left, phase, cycle, cycles, pattern, onDone]);

  // Optional spoken cue at the start of each phase, in Sam's voice.
  useEffect(() => {
    if (running && voiceOn && left === current.seconds) speak(current.label, PERSONAS.friendly, getSettings().voiceEngine);
  }, [running, voiceOn, phase, left, current]);

  useEffect(() => () => stopSpeaking(), []);

  function start() {
    if (done) {
      setCycle(0);
      setPhase(0);
      setLeft(pattern.phases[0].seconds);
    }
    setDone(false);
    counted.current = false;
    setRunning(true);
  }

  function reset(id: string) {
    const p = PATTERNS.find((x) => x.id === id) ?? PATTERNS[0];
    setPatternId(p.id);
    setRunning(false);
    setDone(false);
    setPhase(0);
    setCycle(0);
    setLeft(p.phases[0].seconds);
  }

  // The circle animates toward this phase's size over the phase's length.
  const paused = !running && !done && (cycle > 0 || phase > 0);
  const scale = MIN_SCALE + (1 - MIN_SCALE) * (running || paused ? current.to : 0);
  const phaseProgress = running ? (current.seconds - left + 1) / current.seconds : 0;
  const size = compact ? "size-44" : "size-56 sm:size-64";

  return (
    <div className="flex flex-col items-center gap-5">
      {!compact && (
        <div className="flex flex-col items-center gap-2">
          <Segmented label="Breathing pattern" value={patternId} onChange={reset} options={PATTERNS.map((p) => ({ value: p.id, label: p.name }))} />
          <p className="max-w-[48ch] text-center text-body-sm text-muted">{pattern.blurb}</p>
        </div>
      )}

      <div className={`relative flex ${size} items-center justify-center`}>
        <span
          aria-hidden
          className="breath-circle absolute inset-0 rounded-full border-[5px] border-[var(--die)] bg-mint shadow-[var(--sticker-shadow)]"
          style={{ transform: `scale(${scale})`, transitionDuration: running ? `${current.seconds}s` : "600ms" }}
        />
        <div className="relative flex flex-col items-center text-on-ink">
          {/* Only the phase is announced, not every second. */}
          <span className="font-display text-title font-bold" aria-live="polite">{running ? current.label : done ? "Well done" : "Ready"}</span>
          {running && (
            <span className="tnum font-display text-score-sm font-extrabold leading-none" aria-hidden>
              {left}
            </span>
          )}
        </div>
      </div>

      {/* Reduced motion: a bar shows the phase instead of the moving circle. */}
      <div className="breath-bar hidden h-2 w-48 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className="h-full bg-mint" style={{ width: `${Math.round(phaseProgress * 100)}%` }} />
      </div>

      <p className="tnum text-label text-muted" aria-live="polite">
        {done ? `${cycles} rounds done. Notice how you feel now.` : running ? `Round ${cycle + 1} of ${cycles}` : `${cycles} slow rounds, about ${Math.round((pattern.phases.reduce((a, p) => a + p.seconds, 0) * cycles) / 60)} min`}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {running ? (
          <button type="button" className="btn btn-ghost" onClick={() => setRunning(false)}>
            <PauseIcon size={18} weight="fill" aria-hidden /> Pause
          </button>
        ) : (
          <button type="button" className="btn btn-go" onClick={start}>
            <PlayIcon size={18} weight="fill" aria-hidden /> {done ? "Go again" : cycle > 0 || phase > 0 ? "Keep going" : "Start breathing"}
          </button>
        )}
        <label className="flex min-h-10 cursor-pointer items-center gap-2 px-2 text-label text-muted">
          <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="size-4 accent-[var(--mint)]" />
          Say it out loud
        </label>
      </div>
    </div>
  );
}
