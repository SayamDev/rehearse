"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

// The animation engine loads after the page, so it doesn't slow the first paint.
const loadFeatures = () => import("./motion-features").then((m) => m.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
