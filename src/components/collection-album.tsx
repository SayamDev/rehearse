"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { RARITY_LABEL, StickerArt } from "./sticker-art";
import { COLLECTION, earnedIds, type Collectible } from "@/lib/collection";
import { useStore } from "@/lib/store";

const GROUPS: { key: Collectible["group"]; title: string; ink: string }[] = [
  { key: "legendary", title: "Legendary", ink: "sticker-sun" },
  { key: "skills", title: "Skill stickers", ink: "sticker-sky" },
  { key: "achievements", title: "Achievements", ink: "sticker-lime" },
];

/** Deterministic small tilt per sticker so the sheet looks hand-placed. */
function tiltFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 11) - 5) * 1.2;
}

/**
 * The full sticker collection: everything you can earn, with how to earn it.
 * Tap a sticker to see its details.
 */
export function CollectionAlbum({ compact = false }: { compact?: boolean }) {
  const { hydrated, sessions, bank, profile } = useStore();
  const earned = useMemo(
    () => (hydrated ? earnedIds({ sessions, bank, profile }) : new Set<string>()),
    [hydrated, sessions, bank, profile],
  );
  const [selectedId, setSelectedId] = useState(COLLECTION.find((c) => c.group === "legendary")!.id);
  const selected = COLLECTION.find((c) => c.id === selectedId)!;
  const has = earned.has(selected.id);
  const mine = COLLECTION.filter((c) => earned.has(c.id));
  const pct = Math.round((mine.length / COLLECTION.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* The album cover: how much you've collected, and the stickers you already have. */}
      <div className="panel relative flex flex-col gap-4 overflow-hidden p-5">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-sun opacity-[var(--blob)]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-14 right-16 size-28 rounded-full bg-grape opacity-[var(--blob)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-title-lg font-extrabold">
            <span className="tnum">{mine.length}</span> of <span className="tnum">{COLLECTION.length}</span> collected
          </p>
          <span className="sticker sticker-tomato">{pct}%</span>
        </div>
        <div
          className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-label="Stickers collected"
          aria-valuemin={0}
          aria-valuemax={COLLECTION.length}
          aria-valuenow={mine.length}
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--tomato),var(--sun),var(--lime),var(--sky),var(--grape))] transition-[width] duration-500"
            style={{ width: `${Math.max(pct, mine.length ? 4 : 0)}%` }}
          />
        </div>
        {mine.length > 0 ? (
          <ul className="relative flex flex-wrap items-center gap-1" aria-label="Your stickers">
            {mine.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  aria-label={c.name}
                  className="rounded-control p-0.5 transition-transform hover:-translate-y-0.5"
                >
                  <StickerArt item={c} earned size={44} tilt={tiltFor(c.id)} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="relative text-body-sm text-muted">Your first sticker is one answer away.</p>
        )}
      </div>

      <div className="panel flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left" aria-live="polite">
        <StickerArt item={selected} earned={has} size={compact ? 108 : 132} tilt={tiltFor(selected.id)} />
        <div className="flex flex-col gap-1.5">
          <p className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="font-display text-title-lg font-extrabold">{selected.name}</span>
            <span
              className={`sticker ${selected.rarity === "legendary" ? "" : selected.rarity === "rare" ? "sticker-sky" : "sticker-empty"}`}
            >
              {RARITY_LABEL[selected.rarity]}
            </span>
          </p>
          <p className="text-body text-muted">{selected.how}</p>
          <p className={`flex items-center justify-center gap-1.5 text-label font-semibold sm:justify-start ${has ? "text-up" : "text-muted"}`}>
            {has ? <CheckCircleIcon size={16} weight="fill" aria-hidden /> : <LockSimpleIcon size={16} weight="bold" aria-hidden />}
            {has ? "You have this sticker" : "Not earned yet"}
          </p>
        </div>
      </div>

      {GROUPS.map((g) => {
        const items = COLLECTION.filter((c) => c.group === g.key);
        const got = items.filter((c) => earned.has(c.id)).length;
        return (
          <section key={g.key} aria-label={g.title} className="flex flex-col gap-3">
            <h3 className="flex items-center gap-3 text-title font-bold">
              {g.title}
              <span className={`sticker tnum ${g.ink}`}>
                {got} of {items.length}
              </span>
            </h3>
            <ul className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-5 lg:grid-cols-6">
              {items.map((c) => {
                const own = earned.has(c.id);
                const active = c.id === selectedId;
                return (
                  <li key={c.id} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={active}
                      aria-label={`${c.name}, ${RARITY_LABEL[c.rarity]}, ${own ? "earned" : "not earned yet"}`}
                      className={`flex w-full max-w-28 flex-col items-center gap-1.5 rounded-control p-2 transition-colors ${
                        active ? "bg-surface-2" : "hover:bg-surface-2/60"
                      }`}
                    >
                      <StickerArt item={c} earned={own} size={c.group === "legendary" ? 92 : 76} tilt={tiltFor(c.id)} />
                      <span className={`text-label leading-tight ${own ? "font-semibold text-ink" : "text-muted"}`}>{c.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {compact && (
        <Link href="/collection" className="btn btn-ghost w-fit">
          Open your sticker album
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
        </Link>
      )}
    </div>
  );
}
