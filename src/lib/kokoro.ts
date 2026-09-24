"use client";

import type { PersonaId } from "./types";
import type { WorkerIn, WorkerOut } from "./kokoro.worker";

/**
 * Optional "most human" voice: the open-source Kokoro model running entirely on
 * the user's device (no text leaves the browser, no limits, no cost).
 * It's a one-time download of about 90MB, cached by the browser afterwards.
 * The model runs in a Web Worker so the page stays responsive while it loads and speaks.
 */

/** The highest-graded Kokoro voices, one per interviewer. */
export const KOKORO_VOICES: Record<PersonaId, string> = {
  friendly: "af_heart",
  busy: "af_bella",
  tough: "bm_george",
};

export type KokoroStatus = "idle" | "loading" | "ready" | "error";

let worker: Worker | null = null;
let loading: Promise<void> | null = null;
let status: KokoroStatus = "idle";
let progress = 0;
let loadedBytes = 0;
let totalBytes = 0;
let warming = false;
let startedAt = 0;
/** The download is mostly one model file of about 92MB; used until the real sizes are known. */
const EXPECTED_BYTES = 92_000_000;
/** Give up if nothing at all arrives for this long (the worker or connection is stuck)... */
const NO_START_MS = 45_000;
/** ...or if a started download goes quiet this long. Long, because Firefox only reports the big file at the end. */
const STALL_MS = 5 * 60_000;
let lastActivity = 0;
let watchdog: ReturnType<typeof setInterval> | null = null;
let nextId = 0;
const pending = new Map<number, (blob: Blob | null) => void>();
const listeners = new Set<() => void>();
let settleLoad: { resolve: () => void; reject: (e: Error) => void } | null = null;
/** Whether the model files are already saved in this browser (null until checked). */
let cached: boolean | null = null;

export type KokoroSnapshot = {
  status: KokoroStatus;
  /** 0 to 100, from bytes received. */
  progress: number;
  cached: boolean | null;
  /** Bytes received so far, and the expected total. */
  loaded: number;
  total: number;
  /** Downloaded; the voice is warming up before its first line. */
  warming: boolean;
  /** When loading started (ms), for "time left" estimates. */
  startedAt: number;
};

/** What the server renders, before the browser can know anything. */
export const KOKORO_SERVER_STATE: KokoroSnapshot = { status: "idle", progress: 0, cached: null, loaded: 0, total: 0, warming: false, startedAt: 0 };

/** The latest state as one object, replaced on every change so React can read it directly. */
let snapshot: KokoroSnapshot = KOKORO_SERVER_STATE;

function emit() {
  snapshot = { status, progress, cached, loaded: loadedBytes, total: totalBytes, warming, startedAt };
  listeners.forEach((l) => l());
}

export function kokoroState(): KokoroSnapshot {
  return snapshot;
}

/**
 * Checks whether the voice was downloaded before. The model library keeps its files
 * in the browser's "transformers-cache", keyed by the file's address, so finding the
 * Kokoro model file there means loading it needs no download.
 */
export async function checkKokoroCache(): Promise<boolean> {
  if (cached !== null) return cached;
  try {
    const keys = await (await caches.open("transformers-cache")).keys();
    cached = keys.some((r) => r.url.includes("Kokoro-82M") && r.url.endsWith(".onnx"));
  } catch {
    cached = false;
  }
  emit();
  return cached;
}

export function onKokoroChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Whether this device can reasonably run Kokoro. Low-memory or low-core devices
 * (many budget phones) get the lighter voices instead.
 */
export function kokoroSupported(): boolean {
  if (typeof window === "undefined" || typeof WebAssembly === "undefined" || typeof Worker === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  return memory >= 4 && cores >= 4;
}

/**
 * Whether the one-time download may start by itself: a capable device on an
 * unmetered connection, or one that already has it saved. On mobile data or Data
 * Saver we wait for the user to ask.
 */
export function kokoroAutoOk(): boolean {
  if (!kokoroSupported()) return false;
  // Already saved on this device, so loading it costs no data.
  if (cached) return true;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; type?: string; effectiveType?: string } }).connection;
  if (!conn) return true;
  if (conn.saveData || conn.type === "cellular") return false;
  return !["slow-2g", "2g", "3g"].includes(conn.effectiveType ?? "");
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./kokoro.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<WorkerOut>) => {
    const msg = e.data;
    if (msg.type !== "audio") lastActivity = Date.now();
    if (msg.type === "progress") {
      loadedBytes = msg.loaded;
      totalBytes = Math.max(msg.total, EXPECTED_BYTES);
      // Held under 100 until the voice is actually ready.
      progress = Math.min(99, Math.round((loadedBytes / totalBytes) * 100));
      emit();
    } else if (msg.type === "warming") {
      warming = true;
      progress = 99;
      emit();
    } else if (msg.type === "ready") {
      status = "ready";
      warming = false;
      cached = true;
      progress = 100;
      stopWatchdog();
      emit();
      settleLoad?.resolve();
    } else if (msg.type === "error") {
      fail(msg.message);
    } else if (msg.type === "audio") {
      pending.get(msg.id)?.(msg.blob);
      pending.delete(msg.id);
    }
  };
  // The worker script itself couldn't start. The usual cause is an old copy of the script
  // saved by the offline service worker without the headers Chrome needs; clear those saved
  // copies and try once more before giving up.
  worker.onerror = (e) => {
    e.preventDefault();
    if (status !== "loading") return;
    if (retriedWorker) return fail("The voice worker couldn't start.");
    retriedWorker = true;
    worker?.terminate();
    worker = null;
    clearSavedScripts().then(() => send({ type: "load" }));
  };
  return worker;
}

let retriedWorker = false;

/** Deletes the offline service worker's saved app files (pages are kept). */
async function clearSavedScripts() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("rehearse-") && k.endsWith("-assets")).map((k) => caches.delete(k)));
  } catch {
    // Storage blocked: nothing saved to clear.
  }
}

function stopWatchdog() {
  if (watchdog) clearInterval(watchdog);
  watchdog = null;
}

/** Stops a load that failed or got stuck, so the screens can offer to try again. */
function fail(message: string) {
  stopWatchdog();
  if (status !== "loading") return;
  status = "error";
  warming = false;
  loading = null;
  // A fresh worker next time, in case this one is stuck.
  worker?.terminate();
  worker = null;
  pending.forEach((done) => done(null));
  pending.clear();
  emit();
  settleLoad?.reject(new Error(message));
}

function send(msg: WorkerIn) {
  getWorker().postMessage(msg);
}

/** Downloads (first time) and loads the model. Safe to call repeatedly. */
export function loadKokoro(): Promise<void> {
  if (status === "ready") return Promise.resolve();
  if (loading) return loading;
  status = "loading";
  progress = 0;
  loadedBytes = 0;
  totalBytes = EXPECTED_BYTES;
  warming = false;
  startedAt = Date.now();
  lastActivity = startedAt;
  emit();
  loading = new Promise<void>((resolve, reject) => {
    settleLoad = { resolve, reject };
  });
  stopWatchdog();
  watchdog = setInterval(() => {
    if (warming) return;
    const quiet = Date.now() - lastActivity;
    if (quiet > (loadedBytes > 0 ? STALL_MS : NO_START_MS)) fail("The download stopped.");
  }, 5000);
  send({ type: "load" });
  return loading;
}

/** Speaks with Kokoro if it has loaded; returns an object URL for the clip, or null. */
export function kokoroClip(text: string, persona: PersonaId, speed = 1): Promise<string | null> {
  if (status !== "ready") return Promise.resolve(null);
  const id = ++nextId;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, 20_000);
    pending.set(id, (blob) => {
      clearTimeout(timer);
      resolve(blob ? URL.createObjectURL(blob) : null);
    });
    send({ type: "generate", id, text, voice: KOKORO_VOICES[persona], speed });
  });
}

const MB = 1_000_000;

function timeLeft(seconds: number): string {
  if (seconds < 10) return "a few seconds left";
  if (seconds < 60) return `about ${Math.round(seconds / 5) * 5} sec left`;
  return `about ${Math.round(seconds / 60)} min left`;
}

function clock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * What the progress bar says while the voice loads. `known` means real byte counts are
 * arriving, so the bar can show a fill instead of a sliding stripe.
 */
export function voiceProgressText(state: KokoroSnapshot, elapsed: number, name = "the voice") {
  if (state.warming) return { label: `Almost ready: warming up ${name}...`, detail: "", known: false };
  const known = state.loaded > 0;
  if (state.cached) return { label: `Getting ${name} ready...`, detail: "", known };
  if (known) {
    const speed = state.loaded / Math.max(elapsed, 1);
    const left = (state.total - state.loaded) / Math.max(speed, 1);
    let detail = `${Math.round(state.loaded / MB)} of ${Math.round(state.total / MB)} MB (${state.progress}%)`;
    // Wait a moment before estimating, so the first guess isn't wild.
    if (elapsed >= 3 && state.progress < 99) detail += ` · ${timeLeft(left)}`;
    return { label: `Downloading ${name}...`, detail, known };
  }
  // Some browsers (Firefox) only report at the very end, so show time so far instead.
  if (elapsed >= 6) return { label: `Downloading ${name}...`, detail: `${clock(elapsed)} so far. About 90MB, usually 1 to 2 minutes on Wi-Fi.`, known };
  return { label: "Starting the download (about 90MB)...", detail: "", known };
}
