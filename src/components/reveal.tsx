"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const TAGS = { div: m.div, li: m.li, section: m.section };

/**
 * Content that rises into place the first time it scrolls into view. Once only: replaying made
 * sections flicker on phones as the address bar slid in and out. Used below the hero only, so
 * nothing on screen at load moves. Instant under reduced motion.
 */
export function Reveal({
  as = "div",
  delay = 0,
  className,
  children,
}: {
  as?: keyof typeof TAGS;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}
