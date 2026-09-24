"use client";

import { useEffect, useRef } from "react";

type Anim = { destroy: () => void; play: () => void; pause: () => void; goToAndStop: (f: number, isFrame: boolean) => void };

/**
 * The hero's mic sticker with sound waves (public/lottie/hero-mic.json, authored with the
 * text-to-lottie skill and verified in Skottie). It says "practise out loud" at a glance.
 * Loads lazily, pauses when off-screen, and holds a still frame under reduced motion.
 */
export function HeroMic({ className = "" }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let anim: Anim | null = null;
    let observer: IntersectionObserver | null = null;
    let cancelled = false;
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled) return;
      anim = lottie.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: !reduce, path: "/lottie/hero-mic.json" }) as Anim;
      if (reduce) {
        // A still frame with all three waves showing.
        anim.goToAndStop(34, true);
        return;
      }
      observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? anim?.play() : anim?.pause()));
      observer.observe(el);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      anim?.destroy();
    };
  }, []);

  // Space is reserved at the animation's aspect ratio (240 x 200) so nothing shifts when it loads.
  return <div ref={box} className={`pointer-events-none aspect-[6/5] ${className}`} aria-hidden />;
}
