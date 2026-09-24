"use client";

import { useEffect, useRef, useState } from "react";

type Light = "dark" | "bright" | "backlit" | "good" | null;
type Frame = "centre" | "left" | "right" | "high" | "low" | "far" | "close" | "none" | null;

/** Chrome on some devices can find faces on the device (no upload). Elsewhere framing tips are skipped. */
type FaceDetectorCtor = new (o?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect(source: CanvasImageSource): Promise<{ boundingBox: DOMRectReadOnly }[]>;
};

/**
 * Video interview practice: shows your camera (mirrored, like a video call) with an
 * eye-line guide and a lighting check. The picture never leaves the screen: nothing
 * is recorded or sent. Brightness is measured from a tiny copy of the frame.
 */
const FRAME_TIPS: Record<Exclude<Frame, "centre" | null>, string> = {
  left: "Move a little to your left, into the middle.",
  right: "Move a little to your right, into the middle.",
  high: "Tilt the camera up a little, or sit a bit lower.",
  low: "Raise your camera to eye level (a few books under a laptop works).",
  far: "Come a little closer so they can see your face.",
  close: "Sit back a little: head and shoulders is the right size.",
  none: "We can't see your face. Check the camera is pointing at you.",
};

export function CameraCheck() {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"starting" | "on" | "denied" | "unsupported">("starting");
  const [light, setLight] = useState<Light>(null);
  const [busy, setBusy] = useState(false);
  const [frame, setFrame] = useState<Frame>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let live = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("unsupported");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 640 } }, audio: false })
      .then((s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video.current) video.current.srcObject = s;
        setState("on");
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 24;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const Detector = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector;
        const faces = Detector ? new Detector({ fastMode: true, maxDetectedFaces: 1 }) : null;
        timer = setInterval(() => {
          const v = video.current;
          if (!ctx || !v || v.readyState < 2) return;
          ctx.drawImage(v, 0, 0, 32, 24);
          const px = ctx.getImageData(0, 0, 32, 24).data;
          const lum = (i: number) => 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          let sum = 0;
          let middle = 0;
          let middleN = 0;
          let edge = 0;
          let edgeN = 0;
          let detail = 0;
          for (let y = 0; y < 24; y++) {
            for (let x = 0; x < 32; x++) {
              const i = (y * 32 + x) * 4;
              const l = lum(i);
              sum += l;
              const inMiddle = x >= 10 && x < 22 && y >= 5 && y < 19;
              if (inMiddle) {
                middle += l;
                middleN++;
              } else {
                edge += l;
                edgeN++;
                // Sharp changes between neighbouring pixels at the edges mean a busy background.
                if (x < 31) detail += Math.abs(l - lum(i + 4));
              }
            }
          }
          const avg = sum / 768;
          const m = middle / middleN;
          const e = edge / edgeN;
          setLight(avg < 70 ? "dark" : avg > 200 ? "bright" : e - m > 45 ? "backlit" : "good");
          setBusy(detail / edgeN > 22);
          faces
            ?.detect(v)
            .then((found) => {
              if (!found.length) return setFrame("none");
              const b = found[0].boundingBox;
              const w = v.videoWidth || 640;
              const h = v.videoHeight || 480;
              const cx = (b.x + b.width / 2) / w;
              const cy = (b.y + b.height / 2) / h;
              const size = b.width / w;
              // The raw camera picture is not mirrored: a face on its left means the user sits too far to their right.
              setFrame(size < 0.18 ? "far" : size > 0.55 ? "close" : cx < 0.35 ? "left" : cx > 0.65 ? "right" : cy < 0.25 ? "high" : cy > 0.6 ? "low" : "centre");
            })
            .catch(() => undefined);
        }, 1200);
      })
      .catch(() => live && setState("denied"));
    return () => {
      live = false;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (state === "denied" || state === "unsupported") {
    return (
      <p role="alert" className="text-label text-muted">
        {state === "denied"
          ? "The camera is blocked. Allow it in your browser's address bar to use the camera check."
          : "This browser can't show the camera."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-[var(--radius-control)] border-[3px] border-[var(--die)] bg-surface-2">
        <video ref={video} autoPlay muted playsInline className="size-full -scale-x-100 object-cover" aria-label="Your camera, shown only on this screen" />
        {/* Eye line: in a well-framed shot, your eyes sit about a third of the way down. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-3 top-[33%] border-t-2 border-dashed border-white/70" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-[33%] -translate-y-full pb-1 text-tape font-semibold text-white drop-shadow">
          eyes here
        </span>
        {state === "starting" && <div className="skeleton absolute inset-0 rounded-none" />}
      </div>
      <p className="text-label" role="status" aria-live="polite">
        {light === "dark" && <span className="font-semibold text-sun-text">A bit dark. Face a window or a lamp. </span>}
        {light === "bright" && <span className="font-semibold text-sun-text">Very bright. Move out of direct light. </span>}
        {light === "backlit" && <span className="font-semibold text-sun-text">The light is behind you, so your face is in shadow. Turn to face the window or lamp. </span>}
        {light === "good" && <span className="font-semibold text-up">Lighting looks good. </span>}
        <span className="text-muted">Keep your eyes near the line, and look at the camera, not the screen, when you speak.</span>
      </p>
      {(frame && frame !== "centre") || busy ? (
        <ul className="flex flex-col gap-1 text-label text-muted" aria-live="polite">
          {frame && frame !== "centre" && <li className="font-semibold text-sun-text">{FRAME_TIPS[frame]}</li>}
          {busy && <li>Your background might be busy. A plain wall or tidy shelf looks calmer.</li>}
        </ul>
      ) : frame === "centre" ? (
        <p className="text-label font-semibold text-up">You&apos;re nicely framed.</p>
      ) : null}
      <p className="text-tape text-muted">Only you can see this. Nothing is recorded or sent.</p>
    </div>
  );
}
