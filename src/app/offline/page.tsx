import type { Metadata } from "next";
import Link from "next/link";
import { CloudSlashIcon } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Offline" };

const WORKS = [
  { href: "/remember", label: "Remember", note: "Recall your saved answers" },
  { href: "/calm", label: "Calm corner", note: "Breathing and grounding" },
  { href: "/prepare/packs", label: "Question packs", note: "Practise with built-in notes" },
  { href: "/prepare", label: "Get ready", note: "Your countdown and interview tools" },
];

export default function OfflinePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="sticker sticker-sky size-14 -rotate-3 justify-center p-0" aria-hidden>
          <CloudSlashIcon size={28} weight="bold" />
        </span>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">You&apos;re offline</h1>
        <p className="max-w-[56ch] text-muted">
          This page needs the internet. You can still practise: rounds use the built-in questions and notes until you&apos;re
          back online, and your progress is saved on this device.
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {WORKS.map((w) => (
          <li key={w.href}>
            <Link href={w.href} className="flex flex-col gap-0.5 py-4">
              <span className="font-semibold">{w.label}</span>
              <span className="text-body-sm text-muted">{w.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
