import { round1 } from "@/lib/scoring";

/** Classes for the score-change sticker, shared by the live notes and the landing sample. */
export function deltaStickerClass(delta: number): string {
  const tone = delta > 0 ? "sticker-lime" : "sticker-empty";
  return `sticker ${tone} px-3 py-1.5 text-body ${delta < 0 ? "text-down" : ""}`;
}

export function deltaLabel(delta: number): string {
  const d = round1(delta);
  return d > 0 ? `+${d.toFixed(1)}` : d < 0 ? d.toFixed(1) : "Same score";
}

export function DeltaSticker({ delta, className = "" }: { delta: number; className?: string }) {
  return <span className={`${deltaStickerClass(delta)} ${className}`}>{deltaLabel(delta)}</span>;
}
