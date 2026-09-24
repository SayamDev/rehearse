"use client";

import { useEffect, useRef, useState } from "react";

type Light = "dark" | "bright" | "good" | null;

/**
 * Video interview practice: shows your camera (mirrored, like a video call) with an
 * eye-line guide and a lighting check. The picture never leaves the screen: nothing
 * is recorded or sent. Brightness is measured from a tiny copy of the frame.
 */
export function CameraCheck() {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"starting" | "on" | "denied" | "unsupported">("starting");
  const [light, setLight] = useState<Light>(null);

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
        timer = setInterval(() => {
          if (!ctx || !video.current || video.current.readyState < 2) return;
          ctx.drawImage(video.current, 0, 0, 32, 24);
          const px = ctx.getImageData(0, 0, 32, 24).data;
          let sum = 0;
          for (let i = 0; i < px.length; i += 4) sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          const avg = sum / (px.length / 4);
          setLight(avg < 70 ? "dark" : avg > 200 ? "bright" : "good");
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
        {light === "good" && <span className="font-semibold text-up">Lighting looks good. </span>}
        <span className="text-muted">Keep your eyes near the line, and look at the camera, not the screen, when you speak.</span>
      </p>
      <p className="text-tape text-muted">Only you can see this. Nothing is recorded or sent.</p>
    </div>
  );
}
