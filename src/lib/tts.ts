"use client";

import { useSyncExternalStore } from "react";
import type { Persona } from "./game";
import { kokoroAutoOk, kokoroClip, kokoroState, loadKokoro } from "./kokoro";
import { getSettings } from "./store";
import type { PersonaId } from "./types";
import { isEnglish, languageFor } from "./languages";

/**
 * Interviewer voice, best first:
 * 1. Kokoro, the on-device voice (see kokoro.ts). Free, private, no limits. Downloads
 *    once by itself on Wi-Fi; on mobile data only when the user asks in Me.
 * 2. Groq Orpheus clips via /api/speak (free tier, cached on the server).
 * 3. The most natural voice the device has (Siri, Google, Microsoft "Natural").
 *
 * To keep the wait short: every chunk of a line is requested at once and played in
 * order, the first sentence is its own short chunk so audio starts quickly, clips
 * are kept in memory, and the next question can be prepared ahead of time.
 *
 * Kokoro and Orpheus only speak English, so rounds in another language use the
 * device voice for that language.
 */

/** The practice language, when it isn't English. */
function otherLanguage(): string | null {
  const code = getSettings().language;
  return isEnglish(code) ? null : code;
}

type Engine = "standard" | "kokoro";

/* ---------- Status, so the interviewer card can show what the voice is doing ---------- */

export type VoiceState = { status: "idle" | "preparing" | "speaking"; persona: PersonaId | null };
const IDLE: VoiceState = { status: "idle", persona: null };
let voiceState: VoiceState = IDLE;
const listeners = new Set<() => void>();

function setVoice(next: VoiceState) {
  if (next.status === voiceState.status && next.persona === voiceState.persona) return;
  voiceState = next;
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useVoiceState(): VoiceState {
  return useSyncExternalStore(subscribe, () => voiceState, () => IDLE);
}

/* ---------- Text chunks ---------- */

const MAX = 200;

/** Splits a line into chunks of up to 200 characters. With `quickStart`, the first sentence is kept on its own. */
function chunkText(text: string, quickStart: boolean): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    const lockFirst = quickStart && out.length === 1;
    if (last && !lockFirst && last.length + s.length + 1 <= MAX) out[out.length - 1] = `${last} ${s}`;
    else if (s.length <= MAX) out.push(s);
    else for (let i = 0; i < s.length; i += MAX) out.push(s.slice(i, i + MAX));
  }
  return out;
}

/** Each part (greeting, question) is chunked separately so shared lines like greetings stay cacheable. */
function chunkParts(parts: string[]): string[] {
  return parts.filter((p) => p.trim()).flatMap((p, i) => chunkText(p, i === 0));
}

/* ---------- Pace ---------- */

/** Interviewer pace times the user's speed setting, kept in a comfortable range. */
function paceFor(persona: Persona): number {
  const speed = getSettings().voiceSpeed || 1;
  return Math.min(1.6, Math.max(0.7, persona.voice.rate * speed));
}

/* ---------- Clips ---------- */

const wait = (ms: number) => new Promise<null>((r) => setTimeout(() => r(null), ms));

/** A ready-to-play clip. Kokoro bakes the pace in; Groq clips are sped up on playback. */
type Clip = { url: string; rate: number } | null;

let serverOffUntil = 0;
const clips = new Map<string, Promise<Clip>>();
const MAX_CLIPS = 80;
// Kokoro runs one generation at a time; later chunks queue behind earlier ones.
let kokoroQueue: Promise<unknown> = Promise.resolve();

function remember(key: string, clip: Promise<Clip>) {
  clips.set(key, clip);
  // Failed clips are forgotten so the next attempt can try again.
  clip.then((c) => {
    if (!c && clips.get(key) === clip) clips.delete(key);
  });
  if (clips.size > MAX_CLIPS) {
    const oldest = clips.keys().next().value!;
    const old = clips.get(oldest);
    clips.delete(oldest);
    old?.then((c) => c && URL.revokeObjectURL(c.url));
  }
  return clip;
}

async function serverClip(text: string, persona: Persona): Promise<string | null> {
  if (Date.now() < serverOffUntil) return null;
  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, persona: persona.id }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok || !res.headers.get("Content-Type")?.startsWith("audio/")) {
      serverOffUntil = Date.now() + 10 * 60_000;
      return null;
    }
    return URL.createObjectURL(await res.blob());
  } catch {
    // Timed out or offline: skip the human voice for a minute.
    serverOffUntil = Date.now() + 60_000;
    return null;
  }
}

/** Starts the Kokoro download when it's wanted and allowed (unmetered connection). */
function kickKokoro(requested: Engine) {
  if (requested === "kokoro" && kokoroState().status === "idle" && kokoroAutoOk()) loadKokoro().catch(() => null);
}

/** Longest we wait for Kokoro to finish loading when Groq can't speak a line. */
const KOKORO_WAIT_MS = 30_000;

/** Resolves true once Kokoro is usable, or false if it can't be (not wanted here, failed, or too slow). */
function waitForKokoro(): Promise<boolean> {
  const { status } = kokoroState();
  if (status === "ready") return Promise.resolve(true);
  if (status === "error" || (status === "idle" && !kokoroAutoOk())) return Promise.resolve(false);
  return Promise.race([loadKokoro().then(() => true, () => false), wait(KOKORO_WAIT_MS).then(() => false)]);
}

function groqClip(text: string, persona: Persona, pace: number): Promise<Clip> {
  if (Date.now() < serverOffUntil) return Promise.resolve(null);
  const key = `s|${persona.id}|${text}`;
  return (
    clips.get(key) ??
    remember(
      key,
      serverClip(text, persona).then((url) => (url ? { url, rate: pace } : null)),
    )
  );
}

/**
 * A human-sounding clip, trying in order: Kokoro (when chosen and loaded), Groq,
 * then Kokoro again once it finishes loading. Null means only the device voice is left.
 */
function clipFor(text: string, persona: Persona, requested: Engine, pace: number): Promise<Clip> {
  if (requested !== "kokoro") return groqClip(text, persona, pace);
  if (kokoroState().status !== "ready") {
    // Kokoro is still loading: Groq speaks, and if it can't, wait for Kokoro rather than use the device voice.
    return groqClip(text, persona, pace).then(
      (c) => c ?? waitForKokoro().then((ok) => (ok ? clipFor(text, persona, requested, pace) : null)),
    );
  }
  const key = `k|${persona.id}|${pace}|${text}`;
  const hit = clips.get(key);
  if (hit) return hit;
  const job = kokoroQueue.then(() => kokoroClip(text, persona.id, pace));
  kokoroQueue = job.catch(() => null);
  // If Kokoro can't say it, Groq's human voice tries next.
  return remember(
    key,
    job.then((url) => (url ? { url, rate: 1 } : groqClip(text, persona, pace))),
  );
}

/**
 * Starts preparing a line in the background so it plays instantly later.
 * Does nothing when questions aren't read aloud.
 */
export function prepareSpeech(parts: string[], persona: Persona, engine: Engine) {
  if (typeof window === "undefined" || !getSettings().readAloud || otherLanguage()) return;
  kickKokoro(engine);
  const pace = paceFor(persona);
  for (const c of chunkParts(parts)) void clipFor(c, persona, engine, pace);
}

/** Loads the chosen voice early (for example when a practice page opens). Resolves once it's usable. */
export function warmVoice(engine: Engine): Promise<void> {
  const { status } = kokoroState();
  if (engine !== "kokoro" || status === "error" || (status === "idle" && !kokoroAutoOk())) return Promise.resolve();
  return loadKokoro().catch(() => undefined);
}

/* ---------- Playback ---------- */

/** The device voice is the last resort: only used if no human voice arrives in this time. */
const FIRST_CLIP_MS = 40_000;

let run = 0;
let audioEl: HTMLAudioElement | null = null;

const NATURAL = /(natural|neural|online|premium|enhanced|siri|google)/i;
const ROBOTIC = /(compact|espeak|zarvox|trinoids|albert|bad news|bells|boing|bubbles|cellos|whisper|wobble|jester|organ|superstar)/i;

/** Device voices for a language (English by default), most natural first. */
export function rankedVoices(lang = "en"): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang) && !ROBOTIC.test(v.name))
    .sort((a, b) => Number(NATURAL.test(b.name)) - Number(NATURAL.test(a.name)) || Number(b.localService) - Number(a.localService));
}

function browserSpeak(text: string, persona: Persona, token: number): Promise<void> {
  return new Promise((resolve) => {
    if (token !== run || typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    const lang = otherLanguage();
    if (lang) u.lang = languageFor(lang).speech;
    const voices = rankedVoices(lang ?? "en");
    const pick = { friendly: 0, busy: 1, tough: 2 }[persona.id];
    if (voices.length) u.voice = voices[Math.min(pick, voices.length - 1)];
    u.rate = paceFor(persona);
    u.pitch = persona.voice.pitch;
    u.onstart = () => token === run && setVoice({ status: "speaking", persona: persona.id });
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

function playClip(url: string, token: number, persona: PersonaId, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (token !== run) return resolve();
    audioEl = new Audio(url);
    // Speeds the clip up without raising the pitch.
    audioEl.preservesPitch = true;
    audioEl.playbackRate = rate;
    audioEl.onplaying = () => token === run && setVoice({ status: "speaking", persona });
    audioEl.onended = () => resolve();
    audioEl.onerror = () => resolve();
    audioEl.play().catch(() => resolve());
  });
}

/**
 * Speaks the line in the interviewer's voice. Pass the greeting and question as
 * separate parts. Calling again (or stopSpeaking) interrupts.
 */
export async function speak(line: string | string[], persona: Persona, engine: Engine = "standard"): Promise<void> {
  stopSpeaking();
  const token = ++run;
  const lang = otherLanguage();
  if (lang) {
    // The interviewers' own set lines are English; in another language only the question is read.
    const english = new Set([persona.greeting, persona.followUpLead]);
    const text = (Array.isArray(line) ? line : [line]).filter((p) => !english.has(p)).join(" ");
    try {
      await browserSpeak(text, persona, token);
    } finally {
      if (token === run) setVoice(IDLE);
    }
    return;
  }
  setVoice({ status: "preparing", persona: persona.id });
  kickKokoro(engine);
  const pace = paceFor(persona);
  const parts = chunkParts(Array.isArray(line) ? line : [line]);
  // Ask for every chunk now; each one is usually ready before the one before it finishes.
  const pending = parts.map((c) => clipFor(c, persona, engine, pace));
  try {
    for (let i = 0; i < parts.length; i++) {
      // The interviewer card shows a loader meanwhile; the device voice only steps in if nothing arrives.
      const clip = i === 0 ? await Promise.race([pending[0], wait(FIRST_CLIP_MS)]) : await pending[i];
      if (token !== run) return;
      if (!clip) {
        // Neither human voice is available: say the rest with the best device voice.
        await browserSpeak(parts.slice(i).join(" "), persona, token);
        return;
      }
      await playClip(clip.url, token, persona.id, clip.rate);
    }
  } finally {
    if (token === run) setVoice(IDLE);
  }
}

export function stopSpeaking() {
  run++;
  audioEl?.pause();
  audioEl = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  setVoice(IDLE);
}
