import { MAX_BOX } from "@/lib/memory";

const LABELS = ["New", "Learning", "Getting there", "Strong", "Solid"];

/** How well an answer is remembered: five sticker segments, one per review box. */
export function StrengthMeter({ box }: { box: number }) {
  const label = LABELS[Math.max(0, Math.min(MAX_BOX, box) - 1)];
  return (
    <span className="flex items-center gap-2 text-tape text-muted">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: MAX_BOX }, (_, i) => (
          <span key={i} className={`h-2.5 w-3.5 rounded-full ${i < box ? "bg-lime" : "bg-surface-2"}`} />
        ))}
      </span>
      <span>
        <span className="sr-only">Memory strength: </span>
        {label}
      </span>
    </span>
  );
}
