"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Plays the sticker-unlock burst once (public/lottie/sticker-burst.json, authored with
 * the text-to-lottie skill and verified in Skottie). The player loads only when needed,
 * and nothing plays when the visitor prefers reduced motion.
 */
export function LottieBurst({ className = "" }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !box.current) return;
    let anim: { destroy: () => void } | null = null;
    let cancelled = false;
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled || !box.current) return;
      anim = lottie.loadAnimation({
        container: box.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "/lottie/sticker-burst.json",
      });
    });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [reduce]);

  if (reduce) return null;
  return <div ref={box} className={`pointer-events-none ${className}`} aria-hidden />;
}
