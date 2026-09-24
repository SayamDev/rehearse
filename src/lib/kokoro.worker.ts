/// <reference lib="webworker" />

/**
 * Runs the Kokoro voice model off the main thread, so loading and speaking never
 * freeze the page.
 */

type Tts = {
  generate: (text: string, opts: { voice: string; speed?: number }) => Promise<{ toBlob: () => Blob }>;
};

export type WorkerIn =
  | { type: "load" }
  | { type: "generate"; id: number; text: string; voice: string; speed: number };

export type WorkerOut =
  | { type: "progress"; progress: number }
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "audio"; id: number; blob: Blob | null };

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let tts: Tts | null = null;
let loading: Promise<Tts> | null = null;

function post(msg: WorkerOut) {
  ctx.postMessage(msg);
}

function load() {
  if (tts) return Promise.resolve(tts);
  if (loading) return loading;
  const perFile = new Map<string, number>();
  loading = import("kokoro-js")
    .then(({ KokoroTTS }) =>
      KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: "q8",
        device: "wasm",
        progress_callback: (info: { status: string; file?: string; progress?: number }) => {
          if (info.status === "progress" && info.file && typeof info.progress === "number") {
            perFile.set(info.file, info.progress);
            // The model file dominates the download, so the largest file's progress is a fair overall figure.
            post({ type: "progress", progress: Math.round(Math.max(...perFile.values())) });
          }
        },
      }),
    )
    .then(async (model) => {
      const ready = model as unknown as Tts;
      // The first generation is slow while the engine warms up, so do it now rather than on a real line.
      await ready.generate("Hi.", { voice: "af_heart" }).catch(() => null);
      tts = ready;
      return tts;
    })
    .catch((err) => {
      loading = null;
      throw err;
    });
  return loading;
}

// One generation at a time, in the order they were asked for.
let queue: Promise<unknown> = Promise.resolve();

ctx.onmessage = (e: MessageEvent<WorkerIn>) => {
  const msg = e.data;
  if (msg.type === "load") {
    load().then(
      () => post({ type: "ready" }),
      (err) => post({ type: "error", message: String(err) }),
    );
    return;
  }
  queue = queue.then(async () => {
    try {
      const model = await load();
      const audio = await model.generate(msg.text, { voice: msg.voice, speed: msg.speed });
      post({ type: "audio", id: msg.id, blob: audio.toBlob() });
    } catch {
      post({ type: "audio", id: msg.id, blob: null });
    }
  });
};
