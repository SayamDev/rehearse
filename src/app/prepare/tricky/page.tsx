import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { TRICKY } from "@/lib/tricky";

export const metadata: Metadata = {
  title: "Tricky topics",
  description: "Honest, safe ways to talk about CV gaps, being fired, no experience, disability, mental health, a criminal record and more.",
};

export default function TrickyPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/prepare" className="flex w-fit items-center gap-1.5 text-label font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon size={14} weight="bold" aria-hidden /> Get ready
        </Link>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Tricky topics</h1>
        <p className="max-w-[58ch] text-muted">
          The parts of your story you&apos;re worried about. Each one has an honest way to say it, what the interviewer really
          wants to hear, and a question to practise. You never have to share more than you want to.
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {TRICKY.map((t) => (
          <li key={t.id}>
            <Link href={`/prepare/tricky/${t.id}`} className="group flex items-center gap-4 py-4">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-bold">{t.title}</span>
                <span className="text-body-sm text-muted">{t.worry}</span>
              </span>
              <ArrowRightIcon size={18} weight="bold" className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="max-w-[60ch] text-label text-muted">
        Rights notes are about the UK and are a starting point, not legal advice. Rules are different in other countries.
      </p>
    </div>
  );
}
