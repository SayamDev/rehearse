"use client";

import { useId } from "react";
import type { Character, Collectible, Ink, Rarity, Shape } from "@/lib/collection";

/**
 * Sticker artwork, drawn as SVG so every sticker has a real die-cut outline:
 * word stickers on ten different cut shapes, and illustrated character stickers
 * for the legendary rewards. All art is authored for Rehearse.
 */

const INK: Record<Ink, string> = {
  tomato: "var(--tomato)",
  sky: "var(--sky)",
  lime: "var(--lime)",
  sun: "var(--sun)",
  grape: "var(--grape)",
  mint: "var(--mint)",
};

const TWO_PI = Math.PI * 2;

function polygon(points: [number, number][]) {
  return `M${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`;
}

function radial(n: number, r: (i: number, t: number) => number, rot = -Math.PI / 2) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = rot + (i / n) * TWO_PI;
    const rad = r(i, t);
    pts.push([60 + Math.cos(t) * rad, 60 + Math.sin(t) * rad]);
  }
  return pts;
}

const SHAPES: Record<Shape, string> = {
  burst: polygon(radial(32, (i) => (i % 2 ? 44 : 55))),
  star: polygon(radial(10, (i) => (i % 2 ? 35 : 58))),
  scallop: polygon(radial(96, (_, t) => 50 + 4.5 * Math.cos(12 * (t + Math.PI / 2)))),
  pill: "M22,34 H98 A26,26 0 0 1 98,86 H22 A26,26 0 0 1 22,34 Z",
  bubble: "M22,18 H98 Q110,18 110,30 V76 Q110,88 98,88 H54 L34,106 L38,88 H22 Q10,88 10,76 V30 Q10,18 22,18 Z",
  ticket: "M14,28 H106 V48 A12,12 0 0 0 106,72 V92 H14 V72 A12,12 0 0 0 14,48 Z",
  shield: "M60,8 L104,24 V58 C104,84 86,102 60,112 C34,102 16,84 16,58 V24 Z",
  bolt: "M28,24 H112 L92,96 H8 Z",
  blob: "M62,10 C90,8 112,28 110,58 C108,88 88,110 58,110 C28,110 8,90 10,60 C12,30 34,12 62,10 Z",
  banner: "M4,34 H116 L104,60 L116,86 H4 L16,60 Z",
};

/** Usable text width and vertical centre for each cut shape. */
const TEXT_BOX: Record<Shape, { width: number; cy: number }> = {
  burst: { width: 70, cy: 60 },
  star: { width: 62, cy: 63 },
  scallop: { width: 74, cy: 60 },
  pill: { width: 92, cy: 60 },
  bubble: { width: 88, cy: 53 },
  ticket: { width: 82, cy: 60 },
  shield: { width: 66, cy: 56 },
  bolt: { width: 88, cy: 60 },
  blob: { width: 80, cy: 60 },
  banner: { width: 92, cy: 60 },
};

/** Fits one or two lines of words inside the sticker. */
function WordLines({ words, color, shape }: { words: [string] | [string, string]; color: string; shape: Shape }) {
  const box = TEXT_BOX[shape];
  const longest = Math.max(...words.map((w) => w.length));
  // Bricolage ExtraBold caps run about 0.7em wide per letter.
  const size = Math.min(words.length === 1 ? 24 : 21, box.width / (longest * 0.7));
  const lineGap = size * 1.02;
  const firstY = box.cy + (words.length === 2 ? -lineGap / 2 : 0) + size * 0.36;
  return (
    <g fill={color} fontFamily="var(--font-bricolage), sans-serif" fontWeight={800} textAnchor="middle" letterSpacing="-0.02em">
      {words.map((w, i) => (
        <text key={w} x={60} y={firstY + i * lineGap} fontSize={size}>
          {w}
        </text>
      ))}
    </g>
  );
}

function Sparkle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0,-9 C1.2,-2 2,-1.2 9,0 C2,1.2 1.2,2 0,9 C-1.2,2 -2,1.2 -9,0 C-2,-1.2 -1.2,-2 0,-9 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill="var(--die)"
    />
  );
}

/* ---------------- Characters ---------------- */

const FACE = "#1c1b2e";

function CharacterArt({ character, fill }: { character: Character; fill: string }) {
  if (character === "mic") {
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <rect x={51} y={70} width={18} height={30} rx={8} fill={FACE} />
        <rect x={38} y={100} width={44} height={10} rx={5} fill={FACE} />
        <circle cx={60} cy={46} r={32} fill={fill} />
        <path d="M34,36 H86 M30,48 H90 M34,60 H86" stroke={FACE} strokeOpacity={0.18} strokeWidth={3} fill="none" />
        <ellipse cx={49} cy={44} rx={4} ry={5.5} fill={FACE} />
        <ellipse cx={71} cy={44} rx={4} ry={5.5} fill={FACE} />
        <path d="M49,58 Q60,68 71,58" stroke={FACE} strokeWidth={4} fill="none" />
        <circle cx={42} cy={55} r={4} fill="var(--tomato)" opacity={0.55} />
        <circle cx={78} cy={55} r={4} fill="var(--tomato)" opacity={0.55} />
      </g>
    );
  }
  if (character === "tie") {
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M44,14 H76 L69,34 H51 Z" fill={fill} />
        <path d="M51,34 H69 L82,88 L60,110 L38,88 Z" fill={fill} />
        <path d="M51,34 H69 L72,48 H48 Z" fill={FACE} opacity={0.12} />
        <rect x={40} y={54} width={17} height={11} rx={4} fill={FACE} />
        <rect x={63} y={54} width={17} height={11} rx={4} fill={FACE} />
        <path d="M57,58 H63" stroke={FACE} strokeWidth={3} />
        <path d="M51,78 Q60,86 69,78" stroke={FACE} strokeWidth={4} fill="none" />
        <path d="M43,57 L48,57" stroke="var(--die)" strokeWidth={2} opacity={0.8} />
      </g>
    );
  }
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M44,40 V30 Q44,24 50,24 H70 Q76,24 76,30 V40" stroke={FACE} strokeWidth={7} fill="none" />
      <rect x={14} y={38} width={92} height={64} rx={14} fill={fill} />
      <rect x={54} y={36} width={12} height={10} rx={3} fill={FACE} />
      <ellipse cx={46} cy={66} rx={4.5} ry={6} fill={FACE} />
      <ellipse cx={74} cy={66} rx={4.5} ry={6} fill={FACE} />
      <path d="M50,80 Q60,89 70,80" stroke={FACE} strokeWidth={4} fill="none" />
      <circle cx={27} cy={52} r={7} fill="var(--tomato)" stroke="var(--die)" strokeWidth={2.5} />
      <rect x={84} y={84} width={14} height={10} rx={3} fill="var(--sky)" stroke="var(--die)" strokeWidth={2.5} transform="rotate(-14 91 89)" />
      <path d="M92,48 l3,6 6,1 -4.5,4 1,6 -5.5,-3 -5.5,3 1,-6 -4.5,-4 6,-1 Z" fill="var(--lime)" stroke="var(--die)" strokeWidth={2} />
    </g>
  );
}

/* ---------------- Public component ---------------- */

export function StickerArt({
  item,
  earned,
  size = 96,
  tilt = 0,
}: {
  item: Collectible;
  earned: boolean;
  size?: number;
  tilt?: number;
}) {
  const gid = useId().replace(/:/g, "");
  const foil = item.rarity === "legendary";
  const fill = !earned ? "var(--surface-2)" : foil ? `url(#foil-${gid})` : item.art.type === "word" ? INK[item.art.ink] : "var(--sun)";
  const dieStroke = earned ? "var(--die)" : "var(--line)";

  return (
    <svg
      viewBox="-12 -12 144 144"
      width={size}
      height={size}
      className={`shrink-0 ${earned ? "drop-shadow-[0_4px_6px_rgb(28_27_46/0.28)]" : ""}`}
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`foil-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.3" stopColor="#ffb8d9" />
          <stop offset="0.55" stopColor="#9fe3ff" />
          <stop offset="0.8" stopColor="#c8f28b" />
          <stop offset="1" stopColor="#ffd35c" />
        </linearGradient>
      </defs>

      {item.art.type === "word" ? (
        <>
          <path
            d={SHAPES[item.art.shape]}
            fill={fill}
            stroke={dieStroke}
            strokeWidth={earned ? 10 : 3}
            strokeDasharray={earned ? undefined : "7 6"}
            strokeLinejoin="round"
            paintOrder="stroke"
          />
          <WordLines words={item.art.words} shape={item.art.shape} color={earned ? "#1c1b2e" : "var(--muted)"} />
        </>
      ) : earned ? (
        <>
          {/* Die cut: the same art drawn fat in white underneath. */}
          <g stroke="var(--die)" strokeWidth={14} fill="var(--die)" strokeLinejoin="round">
            <CharacterArt character={item.art.character} fill="var(--die)" />
          </g>
          <CharacterArt character={item.art.character} fill={fill} />
        </>
      ) : (
        <g opacity={0.9}>
          <g stroke="var(--line)" strokeWidth={3} strokeDasharray="7 6" fill="var(--surface-2)">
            <CharacterArt character={item.art.character} fill="var(--surface-2)" />
          </g>
          <text x={60} y={70} textAnchor="middle" fontSize={34} fontWeight={800} fill="var(--muted)" fontFamily="var(--font-bricolage), sans-serif">
            ?
          </text>
        </g>
      )}

      {earned && item.rarity !== "common" && (
        <>
          <Sparkle x={102} y={14} s={item.rarity === "legendary" ? 1.3 : 1} />
          {item.rarity === "legendary" && <Sparkle x={14} y={100} s={0.8} />}
        </>
      )}
    </svg>
  );
}

export const RARITY_LABEL: Record<Rarity, string> = { common: "Common", rare: "Rare", legendary: "Legendary" };
