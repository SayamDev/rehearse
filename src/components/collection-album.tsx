"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon, CheckCircleIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { RARITY_LABEL, StickerArt } from "./sticker-art";
import { COLLECTION, earnedIds, type Collectible } from "@/lib/collection";
import { useStore } from "@/lib/store";

const GROUPS: { key: Collectible["group"]; title: string }[] = [
  { key: "legendary", title: "Legendary" },
  { key: "skills", title: "Skill stickers" },
  { key: "achievements", title: "Achievements" },
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

  return (
    <div className="flex flex-col gap-5">
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
            <h3 className="flex items-baseline gap-2 text-title font-bold">
              {g.title}
              <span className="tnum text-label font-semibold text-muted">
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
