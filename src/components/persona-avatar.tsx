import type { PersonaId } from "@/lib/types";

const FACE = "#1c1b2e";

/** Illustrated die-cut sticker portraits for the three interviewers. Authored for Rehearse. */
function Portrait({ id }: { id: PersonaId | "coach" }) {
  if (id === "coach") {
    // Cobi: mint face, star-shaped quiff, big friendly eyes, speech-bubble badge.
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M60,8 l6,12 13,2 -9.5,9 2.5,13 -12,-6.5 -12,6.5 2.5,-13 -9.5,-9 13,-2 Z" fill="var(--sun)" />
        <circle cx={60} cy={66} r={36} fill="var(--mint)" />
        <circle cx={47} cy={62} r={8} fill="var(--die)" />
        <circle cx={73} cy={62} r={8} fill="var(--die)" />
        <circle cx={48} cy={63} r={4.2} fill={FACE} />
        <circle cx={74} cy={63} r={4.2} fill={FACE} />
        <path d="M49,80 Q60,90 71,80" stroke={FACE} strokeWidth={4} fill="none" />
        <path d="M88,86 h16 a4,4 0 0 1 4,4 v9 a4,4 0 0 1 -4,4 h-9 l-6,5 1,-5 h-2 a4,4 0 0 1 -4,-4 v-9 a4,4 0 0 1 4,-4 Z" fill="var(--sky)" stroke="var(--die)" strokeWidth={2.5} />
      </g>
    );
  }
  if (id === "friendly") {
    // Sam: sun-yellow face, big curly hair, open smile.
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <circle cx={60} cy={40} r={30} fill="var(--tomato)" />
        <circle cx={34} cy={52} r={14} fill="var(--tomato)" />
        <circle cx={86} cy={52} r={14} fill="var(--tomato)" />
        <circle cx={60} cy={64} r={34} fill="var(--sun)" />
        <ellipse cx={48} cy={60} rx={4} ry={5} fill={FACE} />
        <ellipse cx={72} cy={60} rx={4} ry={5} fill={FACE} />
        <path d="M46,74 Q60,88 74,74 Z" fill={FACE} />
        <circle cx={40} cy={72} r={4.5} fill="var(--tomato)" opacity={0.45} />
        <circle cx={80} cy={72} r={4.5} fill="var(--tomato)" opacity={0.45} />
      </g>
    );
  }
  if (id === "busy") {
    // Priya: sky face, top bun, glasses, headset mic.
    return (
      <g strokeLinecap="round" strokeLinejoin="round">
        <circle cx={60} cy={20} r={13} fill={FACE} />
        <path d="M26,58 C26,30 94,30 94,58 V64 H26 Z" fill={FACE} />
        <circle cx={60} cy={66} r={33} fill="var(--sky)" />
        <circle cx={47} cy={63} r={9} fill="none" stroke={FACE} strokeWidth={3.5} />
        <circle cx={73} cy={63} r={9} fill="none" stroke={FACE} strokeWidth={3.5} />
        <path d="M56,63 H64" stroke={FACE} strokeWidth={3.5} />
        <circle cx={47} cy={63} r={3} fill={FACE} />
        <circle cx={73} cy={63} r={3} fill={FACE} />
        <path d="M52,82 H68" stroke={FACE} strokeWidth={4} />
        <path d="M27,62 C22,82 30,94 44,92" stroke={FACE} strokeWidth={3.5} fill="none" />
        <circle cx={46} cy={92} r={4.5} fill="var(--lime)" stroke={FACE} strokeWidth={2} />
      </g>
    );
  }
  // Mr. Grant: tomato face, heavy brows, sunglasses, flat mouth, grape tie.
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M36,34 C40,18 80,18 84,34 Z" fill={FACE} />
      <rect x={27} y={30} width={66} height={66} rx={26} fill="var(--tomato)" />
      <path d="M38,50 L54,55 M82,50 L66,55" stroke={FACE} strokeWidth={5} />
      <rect x={35} y={57} width={21} height={12} rx={4} fill={FACE} />
      <rect x={64} y={57} width={21} height={12} rx={4} fill={FACE} />
      <path d="M56,62 H64" stroke={FACE} strokeWidth={3} />
      <path d="M50,82 H70" stroke={FACE} strokeWidth={4.5} />
      <path d="M53,96 H67 L63,104 L66,114 L60,118 L54,114 L57,104 Z" fill="var(--grape)" />
    </g>
  );
}

export function PersonaAvatar({ id, size = 72, tilt = -4, locked = false }: { id: PersonaId | "coach"; size?: number; tilt?: number; locked?: boolean }) {
  return (
    <svg
      viewBox="-12 -12 144 144"
      width={size}
      height={size}
      className={`shrink-0 ${locked ? "opacity-40 grayscale" : "drop-shadow-[0_4px_6px_rgb(28_27_46/0.28)]"}`}
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden
    >
      <g stroke="var(--die)" strokeWidth={14} fill="var(--die)" strokeLinejoin="round">
        <Portrait id={id} />
      </g>
      <Portrait id={id} />
    </svg>
  );
}
