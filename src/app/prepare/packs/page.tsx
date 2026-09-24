import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PACKS } from "@/lib/packs";
import { PACK_LOOK } from "./icons";

export const metadata: Metadata = {
  title: "Question packs",
  description: "Real interview questions for retail, care, hospitality, warehouse, office, tech, creative, trades and leadership jobs.",
};

export default function PacksPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/prepare" className="flex w-fit items-center gap-1.5 text-label font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon size={14} weight="bold" aria-hidden /> Get ready
        </Link>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Question packs</h1>
        <p className="max-w-[56ch] text-muted">
          Questions that really come up for each kind of work, with what the interviewer is looking for. They work without
          internet too.
        </p>
      </div>

      <ul className="grid gap-x-8 border-t border-line sm:grid-cols-2">
        {PACKS.map((p) => {
          const { icon: PackIcon, ink } = PACK_LOOK[p.id];
          return (
            <li key={p.id} className="border-b border-line">
              <Link href={`/prepare/packs/${p.id}`} className="group flex items-center gap-4 py-4">
                <span className={`sticker ${ink} size-11 shrink-0 justify-center p-0`} aria-hidden>
                  <PackIcon size={22} weight="bold" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-label text-muted">{p.questions.length} questions</span>
                </span>
                <ArrowRightIcon size={18} weight="bold" className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
