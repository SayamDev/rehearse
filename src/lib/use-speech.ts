"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

export function useSpeechSupported(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    // Detection has to wait for the browser; this runs once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getCtor() !== null && !!navigator.mediaDevices?.getUserMedia);
  }, []);
  return supported;
}

/**
 * Records speech with the browser's recognizer and exposes a live
 * transcript. `levelRef` receives a 0..1 mic level every frame so a
 * meter can animate without re-rendering React.
 */
export function useSpeech(opts: { onLevel?: (level: number) => void; /** Also keep the audio (kept on this device only). */ record?: boolean } = {}) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
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
  const record = useRef(opts.record);
  useEffect(() => {
    record.current = opts.record;
  });
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
    if (!Ctor) {
      setStatus("error");
      return;
    }
    setStatus("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("denied");
      return;
    }

    // Optional recording, finished when stop() is called.
    recording.current = Promise.resolve(null);
    if (record.current && typeof MediaRecorder !== "undefined") {
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

    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
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
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRunning.current = false;
        teardownAudio();
        setStatus("denied");
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
    setFinalText("");
    setInterim("");
    setElapsed(0);
    startedAt.current = performance.now();
    timer.current = setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 250);
    try {
      r.start();
      setStatus("recording");
    } catch {
      teardownAudio();
      setStatus("error");
    }
  }, [teardownAudio]);

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

  return { status, transcript: finalText, interim, elapsed, start, stop, reset, setTranscript: setFinalText, lastRecording };
}
