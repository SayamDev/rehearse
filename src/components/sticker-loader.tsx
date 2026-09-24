/**
 * The app's loader: three die-cut sticker dots hopping in turn, like stickers
 * being peeled off a sheet. Holds still (and gently fades) under reduced motion.
 */
export function StickerLoader({
  label,
  size = "md",
  delayed = false,
  className = "",
}: {
  label?: string;
  size?: "sm" | "md";
  /** Only appear if the wait lasts more than a moment, so quick waits don't flash. */
  delayed?: boolean;
  className?: string;
}) {
  const dot = size === "sm" ? "size-2.5 border-[2px]" : "size-3.5 border-[3px]";
  return (
    <span role="status" className={`inline-flex items-center gap-2.5 ${delayed ? "appear-late" : ""} ${className}`}>
      <span aria-hidden className={`inline-flex items-end ${size === "sm" ? "h-4 gap-1" : "h-6 gap-1.5"}`}>
        {["bg-tomato", "bg-sky", "bg-lime"].map((c, i) => (
          <span key={c} className={`sticker-hop rounded-full border-[var(--die)] ${dot} ${c}`} style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </span>
      {label ? <span className="text-label font-medium text-muted">{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}

/** Sound bars beside an interviewer while they're talking. */
export function VoiceBars({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex h-4 items-center gap-[3px] ${className}`}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="voice-bar h-full w-[3px] rounded-full bg-current" style={{ animationDelay: `${i * 110}ms` }} />
      ))}
    </span>
  );
}
