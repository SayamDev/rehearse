"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { m, useReducedMotion } from "motion/react";
import { StickerArt } from "./sticker-art";
import { COLLECTION, COLLECTION_BY_ID, earnedIds } from "@/lib/collection";
import { useStore } from "@/lib/store";

/** A handful of stickers shown in full colour, so newcomers see what they can earn. */
const SHOWCASE = ["l:mic", "skill:conflict", "a:comeback", "l:tie", "skill:ownership", "a:speed"];
const TILTS = [-6, 4, -3, 5, -5, 3];

export function LandingStickers() {
  const { hydrated, sessions, bank, profile } = useStore();
  const count = hydrated ? earnedIds({ sessions, bank, profile }).size : 0;
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="stickers" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="stickers" className="text-headline font-extrabold tracking-[-0.02em]">
          Earn stickers as you get better
        </h2>
        <p className="max-w-[60ch] text-body text-muted">
          {COLLECTION.length} to collect, from skill stickers to three rare shiny ones. Here are a few you could win.
        </p>
      </div>
      {/*
        The sheet (not each sticker) decides when to play, and only once: a sticker that grows
        and shrinks changes how much of it is on screen, which made it flicker in and out on phones.
      */}
      <m.ul
        className="grid grid-cols-3 gap-x-3 gap-y-5 overflow-x-clip sm:grid-cols-6"
        initial={reduce ? false : "hidden"}
        whileInView="shown"
        viewport={{ once: true, amount: 0.3 }}
      >
        {SHOWCASE.map((id, i) => {
          const item = COLLECTION_BY_ID[id];
          return (
            <li key={id} className="flex flex-col items-center gap-2 text-center">
              {/* Each sticker slaps onto the page in turn. */}
              <m.span
                variants={{
                  hidden: { scale: 1.4, rotate: TILTS[i] - 14, opacity: 0 },
                  shown: { scale: 1, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 360, damping: 17, delay: i * 0.09 } },
                }}
                className="inline-flex"
              >
                <StickerArt item={item} earned size={item.group === "legendary" ? 104 : 92} tilt={TILTS[i]} />
              </m.span>
              <span className="text-label font-semibold leading-tight">{item.name}</span>
              <span className="text-tape leading-tight text-muted">{item.how}</span>
            </li>
          );
        })}
      </m.ul>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/collection" className="btn btn-ghost w-fit">
          See all {COLLECTION.length} stickers
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
        </Link>
        {count > 0 && (
          <span className="text-label text-muted">
            You have <span className="tnum font-semibold text-ink">{count}</span> so far.
          </span>
        )}
      </div>
    </section>
  );
}
