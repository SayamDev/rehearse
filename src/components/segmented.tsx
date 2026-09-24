"use client";

/**
 * A row of mutually exclusive choices, used across settings. On narrow screens a long row
 * wraps into an even block (each line fills the width), so it never squashes into an oval.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit max-w-full flex-wrap gap-1 rounded-[1.4rem] border border-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled || o.disabled}
          onClick={() => onChange(o.value)}
          className={`min-h-10 flex-auto rounded-full px-4 text-label font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
            value === o.value ? "bg-ink text-floor" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
