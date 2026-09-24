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
let nextId = 0;
const pending = new Map<number, (blob: Blob | null) => void>();
const listeners = new Set<() => void>();
let settleLoad: { resolve: () => void; reject: (e: Error) => void } | null = null;
/** Whether the model files are already saved in this browser (null until checked). */
let cached: boolean | null = null;

function emit() {
  listeners.forEach((l) => l());
}

export function kokoroState() {
  return { status, progress, cached };
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
    if (msg.type === "progress") {
      progress = msg.progress;
      emit();
    } else if (msg.type === "ready") {
      status = "ready";
      cached = true;
      progress = 100;
      emit();
      settleLoad?.resolve();
    } else if (msg.type === "error") {
      status = "error";
      loading = null;
      emit();
      settleLoad?.reject(new Error(msg.message));
    } else if (msg.type === "audio") {
      pending.get(msg.id)?.(msg.blob);
      pending.delete(msg.id);
    }
  };
  return worker;
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
  emit();
  loading = new Promise<void>((resolve, reject) => {
    settleLoad = { resolve, reject };
  });
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
