"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LottieBurst } from "./lottie-burst";
import { RARITY_LABEL, StickerArt } from "./sticker-art";
import { COLLECTION_BY_ID, earnedIds } from "@/lib/collection";
import { markSeen, useStore } from "@/lib/store";

/**
 * Celebrates each newly earned sticker once: a Lottie burst, the sticker slapping
 * onto the card, and what it was for. Sits above the page without blocking it.
 */
export function StickerCelebration() {
  const { hydrated, sessions, bank, profile } = useStore();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const fresh = useMemo(() => {
    if (!hydrated) return [];
    const seen = new Set(profile.seen);
    return [...earnedIds({ sessions, bank, profile })].filter((id) => !seen.has(id) && COLLECTION_BY_ID[id]);
  }, [hydrated, sessions, bank, profile]);

  if (pathname.startsWith("/dev")) return null;
  const current = fresh[0] ? COLLECTION_BY_ID[fresh[0]] : null;

  return (
    <AnimatePresence>
      {current && (
        <motion.section
          key={current.id}
          role="status"
          aria-label={`New sticker: ${current.name}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-3 bottom-[84px] z-50 mx-auto max-w-md md:bottom-6"
        >
          <div className="panel relative flex items-center gap-4 overflow-visible p-4 pr-5">
            <div className="relative flex size-28 shrink-0 items-center justify-center">
              <LottieBurst className="absolute -inset-16" />
              <motion.span
                initial={reduce ? false : { scale: 1.8, rotate: -24, opacity: 0 }}
                animate={{ scale: 1, rotate: -4, opacity: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 15, delay: reduce ? 0 : 0.1 }}
                className="relative"
              >
                <StickerArt item={current} earned size={104} />
              </motion.span>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-display text-title-lg font-extrabold">New sticker!</span>
                {current.rarity !== "common" && (
                  <span className={`sticker ${current.rarity === "rare" ? "sticker-sky" : ""}`}>{RARITY_LABEL[current.rarity]}</span>
                )}
              </p>
              <p className="text-body">
                <span className="font-semibold">{current.name}.</span> <span className="text-muted">{current.how}</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <button type="button" className="btn btn-go min-h-10 px-4 text-label" onClick={() => markSeen([current.id])}>
                  {fresh.length > 1 ? `Nice! (${fresh.length - 1} more)` : "Nice!"}
                </button>
                <Link href="/collection" className="btn btn-ghost min-h-10 px-4 text-label" onClick={() => markSeen(fresh)}>
                  See album
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
