import { FlagPennantIcon } from "@phosphor-icons/react/dist/ssr";

/** A small tilted flag sticker marking where you stopped. */
export function FlagSticker({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-[3px] border-[var(--die)] bg-sky px-1.5 py-1 text-on-ink shadow-[var(--sticker-shadow)] ${
        label ? "pr-2.5" : ""
      } -rotate-6 ${className}`}
    >
      <FlagPennantIcon size={14} weight="fill" aria-hidden />
      {label && <span className="font-display text-tape font-bold leading-none">{label}</span>}
    </span>
  );
}
