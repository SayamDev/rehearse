"use client";

import { useEffect, useState } from "react";
import { DownloadSimpleIcon, ShareNetworkIcon, XIcon } from "@phosphor-icons/react";
import { liveStreak, useStore } from "@/lib/store";
import { levelFromXp } from "@/lib/scoring";
import { earnedIds } from "@/lib/collection";
import { scoreGain, scoreHistory } from "@/lib/skills";

/**
 * A progress card image made on this device (no upload). It shows level, streak and
 * how scores have moved, but never job titles or answers, so it's safe to post.
 */

const C = { floor: "#f3f4fb", surface: "#fdfdff", ink: "#1c1b2e", muted: "#56566e", line: "#d8dbee", tomato: "#ff5a3c", sun: "#ffc83d", lime: "#b8e62e", sky: "#3ba7ff" };

type CardData = { level: number; title: string; streak: number; answers: number; stickers: number; scores: number[]; gain: number | null };

function fontOf(selector: string, fallback: string) {
  const el = document.querySelector(selector);
  return el ? getComputedStyle(el).fontFamily : fallback;
}

function sticker(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, font: string, tilt: number) {
  ctx.save();
  ctx.font = font;
  const w = ctx.measureText(text).width + 56;
  const h = 76;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.shadowColor = "rgba(28,27,46,0.25)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = C.surface;
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 22);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 16);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 3);
  ctx.restore();
  return w;
}

async function drawCard(d: CardData): Promise<Blob> {
  await document.fonts.ready;
  const display = fontOf("h1", "system-ui, sans-serif");
  const body = getComputedStyle(document.body).fontFamily;
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 0, S, S);
  // The white sheet.
  ctx.fillStyle = C.surface;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(60, 60, S - 120, S - 120, 44);
  ctx.fill();
  ctx.stroke();

  sticker(ctx, "Rehearse", 110, 110, C.tomato, `800 40px ${display}`, -4);

  ctx.fillStyle = C.muted;
  ctx.font = `600 34px ${body}`;
  ctx.fillText("My interview practice", 116, 272);
  ctx.fillStyle = C.ink;
  ctx.font = `800 96px ${display}`;
  ctx.fillText(`Level ${d.level}`, 110, 372);
  ctx.font = `700 52px ${display}`;
  ctx.fillText(d.title, 116, 440);

  // Stats.
  const stats = [
    [`${d.streak}`, "day streak"],
    [`${d.answers}`, d.answers === 1 ? "answer" : "answers"],
    [`${d.stickers}`, d.stickers === 1 ? "sticker" : "stickers"],
  ];
  stats.forEach(([n, label], i) => {
    const x = 116 + i * 290;
    ctx.fillStyle = C.ink;
    ctx.font = `800 72px ${display}`;
    ctx.fillText(n, x, 560);
    ctx.fillStyle = C.muted;
    ctx.font = `600 30px ${body}`;
    ctx.fillText(label, x, 604);
  });

  // Score line.
  if (d.scores.length >= 2) {
    const x0 = 116;
    const x1 = S - 130;
    const y0 = 690;
    const y1 = 880;
    const px = (i: number) => x0 + (i / (d.scores.length - 1)) * (x1 - x0);
    const py = (s: number) => y1 - (s / 10) * (y1 - y0);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(x0, py(5));
    ctx.lineTo(x1, py(5));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    d.scores.forEach((s, i) => (i ? ctx.lineTo(px(i), py(s)) : ctx.moveTo(px(i), py(s))));
    ctx.stroke();
    d.scores.forEach((s, i) => {
      const last = i === d.scores.length - 1;
      ctx.fillStyle = last ? C.sun : C.surface;
      ctx.beginPath();
      ctx.arc(px(i), py(s), last ? 17 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.stroke();
    });
  }

  if (d.gain !== null && d.gain > 0) {
    sticker(ctx, `Scores up +${d.gain}`, S - 470, 640, C.lime, `800 36px ${display}`, 5);
  }

  ctx.fillStyle = C.muted;
  ctx.font = `600 28px ${body}`;
  ctx.fillText("Free interview practice. No signup.", 116, 960);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"));
}

export function ShareProgress() {
  const { profile, sessions, bank } = useStore();
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  async function make() {
    setBusy(true);
    setNote("");
    try {
      const level = levelFromXp(profile.xp);
      const points = scoreHistory(sessions, 10);
      const blob = await drawCard({
        level: level.level,
        title: level.title,
        streak: liveStreak(profile),
        answers: sessions.reduce((a, s) => a + s.questions.reduce((b, q) => b + q.takes.length, 0), 0),
        stickers: earnedIds({ sessions, bank, profile }).size,
        scores: points.map((p) => p.score),
        gain: scoreGain(points),
      });
      setImage({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setNote("Couldn't make the image on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!image) return;
    const file = new File([image.blob], "my-rehearse-progress.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: "My interview practice progress on Rehearse" });
      } catch {
        // Closed the share sheet.
      }
    } else save();
  }

  function save() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.url;
    a.download = "my-rehearse-progress.png";
    a.click();
    setNote("Saved to your downloads.");
  }

  if (!image) {
    return (
      <button type="button" className="btn btn-ghost w-fit" onClick={make} disabled={busy} aria-busy={busy}>
        <ShareNetworkIcon size={18} weight="bold" aria-hidden />
        {busy ? "Making your card..." : "Share my progress"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full max-w-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="Your progress card: level, streak, answers, stickers and score line." className="w-full rounded-[var(--radius-panel)] border border-line shadow-[var(--sheet-shadow)]" />
        <button
          type="button"
          className="absolute -right-3 -top-3 flex size-9 items-center justify-center rounded-full border-2 border-line bg-surface"
          onClick={() => setImage(null)}
          aria-label="Close progress card"
        >
          <XIcon size={16} weight="bold" aria-hidden />
        </button>
      </div>
      <p className="max-w-[48ch] text-label text-muted">Made on your device. It shows no job titles or answers.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={share}>
          <ShareNetworkIcon size={18} weight="bold" aria-hidden /> Share
        </button>
        <button type="button" className="btn btn-ghost" onClick={save}>
          <DownloadSimpleIcon size={18} weight="bold" aria-hidden /> Save image
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
