"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSettings } from "./store";
import { isEnglish, languageFor } from "./languages";
import { accentFor } from "./accents";

/* Minimal typings for the Web Speech API, which TypeScript's DOM lib omits. */
type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; 0: SpeechAlternative; length: number };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type SpeechErrorEvent = { error: string };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechStatus = "idle" | "starting" | "recording" | "denied" | "error";

/**
 * How spoken answers become text:
 * - "browser": the browser's own recognizer, with words appearing live (desktop Chrome, Edge, Safari).
 * - "whisper": record, then transcribe when you stop (via /api/transcribe). Used on phones, where the
 *   browser recognizer and the app can't both use the microphone and often hear nothing, and in
 *   browsers without a recognizer (Firefox).
 */
export type SpeechEngine = "browser" | "whisper";

function isPhone(): boolean {
  const ua = navigator.userAgent;
  return /android|iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

function canRecord(): boolean {
  return !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

export function speechEngine(): SpeechEngine | null {
  if (typeof window === "undefined") return null;
  if (getCtor() && !isPhone()) return "browser";
  return canRecord() ? "whisper" : getCtor() ? "browser" : null;
}

export function useSpeechSupported(opts: { needsLive?: boolean } = {}): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);
  const needsLive = opts.needsLive;
  useEffect(() => {
    // Detection has to wait for the browser; this runs once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(needsLive ? getCtor() !== null && !!navigator.mediaDevices?.getUserMedia : speechEngine() !== null);
  }, [needsLive]);
  return supported;
}

/**
 * Records speech with the browser's recognizer and exposes a live
 * transcript. `levelRef` receives a 0..1 mic level every frame so a
 * meter can animate without re-rendering React.
 */
export function useSpeech(
  opts: {
    onLevel?: (level: number) => void;
    /** Also keep the audio (kept on this device only). */
    record?: boolean;
    /** Live Interview needs words as they're spoken, so it always uses the browser's recognizer. */
    live?: boolean;
  } = {},
) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [engine, setEngine] = useState<SpeechEngine>("browser");
  /** The browser's recognizer stopped hearing (lost the mic, no network): the recording is transcribed instead. */
  const browserFailed = useRef(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const rec = useRef<Recognition | null>(null);
  const wantRunning = useRef(false);
  const startedAt = useRef(0);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recording = useRef<Promise<Blob | null>>(Promise.resolve(null));
  const onLevel = useRef(opts.onLevel);
  useEffect(() => {
    onLevel.current = opts.onLevel;
  });

  const teardownAudio = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    onLevel.current?.(0);
  }, []);

  const stop = useCallback((): number => {
    wantRunning.current = false;
    rec.current?.stop();
    // Stop the recorder before the mic tracks so the last audio is flushed.
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    recorder.current = null;
    teardownAudio();
    const secs = startedAt.current ? (performance.now() - startedAt.current) / 1000 : 0;
    setElapsed(secs);
    setInterim("");
    setStatus((s) => (s === "recording" || s === "starting" ? "idle" : s));
    return secs;
  }, [teardownAudio]);

  const start = useCallback(async () => {
    const Ctor = getCtor();
    const mode: SpeechEngine = opts.live ? "browser" : (speechEngine() ?? "browser");
    if (mode === "browser" && !Ctor) {
      setStatus("error");
      return;
    }
    setEngine(mode);
    browserFailed.current = false;
    setStatus("starting");
    // On phones only one thing can listen to the microphone at a time. When the browser's
    // recognizer is listening (Live Interview), leave the mic to it: no meter, no recording.
    const shareMic = !(mode === "browser" && isPhone());
    if (shareMic) {
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setStatus("denied");
        return;
      }
    }

    // The recording, finished when stop() is called. Always made (in memory) so it can be
    // transcribed if the browser hears nothing; only kept if the user turned recordings on.
    recording.current = Promise.resolve(null);
    if (stream.current && typeof MediaRecorder !== "undefined") {
      try {
        const mr = new MediaRecorder(stream.current);
        const chunks: Blob[] = [];
        mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recording.current = new Promise((resolve) => {
          mr.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: mr.mimeType || "audio/webm" }) : null);
          mr.onerror = () => resolve(null);
        });
        mr.start();
        recorder.current = mr;
      } catch {
        recording.current = Promise.resolve(null);
      }
    }

    // Mic level meter.
    try {
      if (!stream.current) throw new Error("No stream");
      const ctx = new AudioContext();
      // Browsers can start an audio context paused when it isn't created by a tap (Live Interview listens on its own).
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const src = ctx.createMediaStreamSource(stream.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      audioCtx.current = ctx;
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += (v - 128) ** 2;
        onLevel.current?.(Math.min(1, Math.sqrt(sum / data.length) / 40));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // The meter is optional.
    }

    setFinalText("");
    setInterim("");
    setElapsed(0);
    startedAt.current = performance.now();
    timer.current = setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 250);

    // Phones and browsers without a recognizer: just record; the words come when you stop.
    if (mode === "whisper" || !Ctor) {
      wantRunning.current = true;
      setStatus("recording");
      return;
    }

    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    const code = getSettings().language;
    // English uses the chosen accent (or the device's); other languages use their locale.
    r.lang = isEnglish(code) ? accentFor(getSettings().accent, navigator.languages ?? [navigator.language]).code : languageFor(code).speech;
    r.onresult = (e) => {
      let fin = "";
      let tmp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += res[0].transcript;
        else tmp += res[0].transcript;
      }
      if (fin) setFinalText((prev) => `${prev} ${fin}`.replace(/\s+/g, " ").trim());
      setInterim(tmp);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") {
        wantRunning.current = false;
        teardownAudio();
        setStatus("denied");
      } else if (e.error === "service-not-allowed" || e.error === "audio-capture" || e.error === "network" || e.error === "language-not-supported") {
        // The recognizer can't work here, but the recording still can: keep recording and transcribe it at the end.
        browserFailed.current = true;
        wantRunning.current = false;
      }
      // "no-speech" and "aborted" are recoverable; onend restarts.
    };
    r.onend = () => {
      // Browsers end recognition after silence; keep going until the user stops.
      if (wantRunning.current) {
        try {
          r.start();
        } catch {
          // Already restarting.
        }
      }
    };
    rec.current = r;
    wantRunning.current = true;
    try {
      r.start();
    } catch {
      // Recording carries on; the words come from the recording instead.
      browserFailed.current = true;
    }
    setStatus("recording");
  }, [teardownAudio, opts.live]);

  useEffect(
    () => () => {
      wantRunning.current = false;
      rec.current?.abort();
      teardownAudio();
    },
    [teardownAudio],
  );

  const reset = useCallback(() => {
    setFinalText("");
    setInterim("");
    setElapsed(0);
    setStatus("idle");
  }, []);

  /** The audio from the last recording, once stop() has finished it (null when not recording audio). */
  const lastRecording = useCallback(() => recording.current, []);

  /** Whether the words must come from the recording (no live words were possible). */
  const needsTranscribing = useCallback(() => engine === "whisper" || browserFailed.current, [engine]);

  return { status, engine, transcript: finalText, interim, elapsed, start, stop, reset, setTranscript: setFinalText, lastRecording, needsTranscribing };
}
