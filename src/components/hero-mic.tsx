"use client";

import { useEffect, useRef } from "react";

type Anim = {
  destroy: () => void;
  play: () => void;
  pause: () => void;
  addEventListener?: (e: string, f: () => void) => void;
};

/**
 * The hero's mic sticker with sound waves (public/lottie/hero-mic.json, authored with the
 * text-to-lottie skill and verified in Skottie). It says "practise out loud" at a glance.
 * A still frame (hero-mic.svg, 5KB) shows straight away; the animation loads once the page
 * is idle, and not at all with reduced motion, Data Saver or a slow connection.
 */

function lightweight(): boolean {
  const c = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  return Boolean(c?.saveData) || /(^|-)2g|3g/.test(c?.effectiveType ?? "");
}

export function HeroMic({ className = "" }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // The still frame is enough here.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || lightweight()) return;
    let anim: Anim | null = null;
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    const idle = (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 300))) as (f: () => void) => number;
    idle(() =>
      import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
        if (cancelled) return;
        anim = lottie.loadAnimation({
          container: el,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "/lottie/hero-mic.json",
        }) as Anim;
        // Swap the still frame out once the animation has drawn.
        anim.addEventListener?.("DOMLoaded", () => el.querySelector("img")?.remove());
        // Plays only while at least half of it is on screen; stops as soon as you scroll on.
        observer = new IntersectionObserver(([entry]) => (entry.intersectionRatio >= 0.5 ? anim?.play() : anim?.pause()), {
          threshold: [0, 0.5, 1],
        });
        observer.observe(el);
      }),
    );
    return () => {
      cancelled = true;
      observer?.disconnect();
      anim?.destroy();
    };
  }, []);

  // Space is reserved at the animation's aspect ratio (240 x 200) so nothing shifts when it loads.
  return (
    <div ref={box} className={`pointer-events-none relative aspect-[6/5] [&>svg]:absolute [&>svg]:inset-0 ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/lottie/hero-mic.svg" alt="" width={240} height={200} className="absolute inset-0 size-full" fetchPriority="high" />
    </div>
  );
}
