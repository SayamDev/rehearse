"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeviceMobileIcon, DownloadSimpleIcon, LightningIcon, ShareNetworkIcon, XIcon } from "@phosphor-icons/react";
import { cueLine, storyCue } from "@/lib/kit";
import { OPENER } from "@/lib/prepare";
import { useStore } from "@/lib/store";
import type { Profile, SavedAnswer } from "@/lib/types";

export type Pocket = { id: string; kind: "story" | "answer" | "numbers" | "company"; title: string; line: string };

/** Everything worth a last look, each as a title and one line. */
export function pocketCards(profile: Profile, bank: SavedAnswer[]): Pocket[] {
  const cards: Pocket[] = [];
  for (const s of profile.stories ?? []) cards.push({ id: s.id, kind: "story", title: s.title, line: storyCue(s) });
  for (const a of bank) {
    if (a.question.id === OPENER.id || !a.keyPoints.length) continue;
    cards.push({ id: a.id, kind: "answer", title: a.question.text, line: cueLine(a.keyPoints) });
  }
  const numbers = (profile.numbers ?? []).filter((n) => n.value.trim());
  if (numbers.length) cards.push({ id: "numbers", kind: "numbers", title: "Numbers", line: numbers.map((n) => `${n.value} ${n.label}`).join(" · ") });
  const c = profile.company;
  const facts = c?.facts.filter((f) => f.trim()) ?? [];
  if (c?.name.trim() && facts.length) cards.push({ id: "company", kind: "company", title: c.name.trim(), line: facts.join(" · ") });
  return cards;
}

const INK: Record<Pocket["kind"], string> = { story: "sticker-grape", answer: "sticker-sky", numbers: "sticker-sun", company: "sticker-lime" };
const KIND: Record<Pocket["kind"], string> = { story: "Story", answer: "Answer", numbers: "Numbers", company: "Company" };

/** The cards as a simple list; `compact` for Interview-day mode. */
export function PocketList({ cards, compact = false }: { cards: Pocket[]; compact?: boolean }) {
  return (
    <ul className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
      {cards.map((c) => (
        <li key={c.id} className="panel flex flex-col gap-2 p-4">
          <span className={`sticker w-fit text-label ${INK[c.kind]}`}>{KIND[c.kind]}</span>
          <span className={`font-bold leading-snug ${c.kind === "answer" ? "text-body-sm" : ""}`}>{c.title}</span>
          <span className="text-body-sm leading-relaxed text-muted">{c.line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Wallpaper ---------------- */

const W = 1080;
const H = 2340;
const C = { floor: "#171628", surface: "#24233a", ink: "#f4f3ff", muted: "#b4b3cc", grape: "#b28cff", sky: "#3ba7ff", sun: "#ffc83d", lime: "#b8e62e" };
const KIND_INK: Record<Pocket["kind"], string> = { story: C.grape, answer: C.sky, numbers: C.sun, company: C.lime };

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s*\S+$/, "")}…`;
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/**
 * A phone lock-screen image with the most useful cards. The top quarter is left clear
 * for the clock. Made on the device; nothing is uploaded.
 */
async function drawWallpaper(cards: Pocket[], heading: string): Promise<Blob> {
  await document.fonts.ready;
  const display = getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily;
  const body = getComputedStyle(document.body).fontFamily;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 0, W, H);

  const pad = 72;
  let y = 640;
  ctx.fillStyle = C.ink;
  ctx.font = `800 64px ${display}`;
  ctx.fillText(heading, pad, y);
  y += 56;

  for (const card of cards) {
    ctx.font = `700 44px ${display}`;
    const title = wrap(ctx, card.title, W - pad * 2 - 64, 2);
    ctx.font = `500 38px ${body}`;
    const line = wrap(ctx, card.line, W - pad * 2 - 64, 3);
    const h = 72 + title.length * 54 + line.length * 50;
    if (y + h > H - 220) break;
    ctx.fillStyle = C.surface;
    roundRect(ctx, pad, y, W - pad * 2, h, 36);
    ctx.fillStyle = KIND_INK[card.kind];
    roundRect(ctx, pad, y, 14, h, 7);
    let ty = y + 70;
    ctx.fillStyle = C.ink;
    ctx.font = `700 44px ${display}`;
    for (const t of title) {
      ctx.fillText(t, pad + 40, ty);
      ty += 54;
    }
    ctx.fillStyle = C.muted;
    ctx.font = `500 38px ${body}`;
    for (const l of line) {
      ctx.fillText(l, pad + 40, ty);
      ty += 50;
    }
    y += h + 28;
  }

  ctx.fillStyle = C.muted;
  ctx.font = `600 32px ${body}`;
  ctx.fillText("Breathe. You've practised this.", pad, H - 140);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"));
}

function Wallpaper({ cards, heading }: { cards: Pocket[]; heading: string }) {
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  // Stories and numbers first: they cover the most questions.
  const picks = [...cards.filter((c) => c.kind === "story"), ...cards.filter((c) => c.kind === "numbers"), ...cards.filter((c) => c.kind === "answer"), ...cards.filter((c) => c.kind === "company")];

  async function make() {
    setBusy(true);
    setNote("");
    try {
      const blob = await drawWallpaper(picks, heading);
      setImage({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setNote("Couldn't make the image on this device.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.url;
    a.download = "interview-pocket-cards.png";
    a.click();
    setNote("Saved. Set it as your lock screen in your phone's settings.");
  }

  async function share() {
    if (!image) return;
    const file = new File([image.blob], "interview-pocket-cards.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        // Closed the share sheet.
      }
    } else save();
  }

  if (!image) {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" className="btn btn-go w-fit" onClick={make} disabled={busy} aria-busy={busy}>
          <DeviceMobileIcon size={18} weight="bold" aria-hidden />
          {busy ? "Making your wallpaper..." : "Make a phone wallpaper"}
        </button>
        <p className="text-label text-muted">A lock-screen image for a last look on the way. Made on your device.</p>
        {note && (
          <p role="status" className="text-label text-muted">
            {note}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="Phone wallpaper with your pocket cards." className="w-full rounded-[24px] border border-line shadow-[var(--sheet-shadow)]" />
        <button
          type="button"
          className="absolute -right-3 -top-3 flex size-9 items-center justify-center rounded-full border-2 border-line bg-surface"
          onClick={() => setImage(null)}
          aria-label="Close wallpaper"
        >
          <XIcon size={16} weight="bold" aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={share}>
          <ShareNetworkIcon size={18} weight="bold" aria-hidden /> Save or share
        </button>
        <button type="button" className="btn btn-ghost" onClick={save}>
          <DownloadSimpleIcon size={18} weight="bold" aria-hidden /> Download
        </button>
      </div>
      {note && (
        <p role="status" className="text-label text-muted">
          {note}
        </p>
      )}
    </div>
  );
}

/** The Pocket cards page. */
export function PocketCards() {
  const { hydrated, profile, bank } = useStore();
  if (!hydrated) return <div className="skeleton h-64 w-full rounded-[var(--radius-panel)]" aria-hidden />;
  const cards = pocketCards(profile, bank);
  const heading = profile.interview?.role ? `Interview: ${profile.interview.role}` : "My interview";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Pocket cards</h1>
        <p className="max-w-[60ch] text-muted">
          Each story and answer as one line you can take in at a glance. Read them on the bus, or put them on your lock screen.
        </p>
      </header>
      {cards.length === 0 ? (
        <div className="panel flex flex-col items-start gap-3 p-6">
          <p className="max-w-[56ch] text-muted">Your cards come from your stories, saved answers, numbers and company facts. Add one to start.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/remember/stories" className="btn btn-go">
              Add a story
            </Link>
            <Link href="/remember/numbers" className="btn btn-ghost">
              Add numbers
            </Link>
          </div>
        </div>
      ) : (
        <>
          <Wallpaper cards={cards} heading={heading} />
          <PocketList cards={cards} />
          <Link href="/remember/quiz" className="btn btn-ghost w-fit">
            <LightningIcon size={18} weight="fill" aria-hidden /> Quiz my kit
          </Link>
        </>
      )}
    </div>
  );
}
