import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRightIcon, FileTextIcon, FlowerLotusIcon, MagnifyingGlassIcon, MicrophoneStageIcon } from "@phosphor-icons/react/dist/ssr";

const LINKS: { href: string; label: string; note: string; icon: Icon; ink: string; tilt: string; isNew?: boolean }[] = [
  { href: "/prepare/advert", label: "Likely questions", note: "Paste the job advert, see what they'll ask", icon: MagnifyingGlassIcon, ink: "bg-tomato", tilt: "-rotate-3", isNew: true },
  { href: "/prepare/cv", label: "Interview from your CV", note: "Upload your CV, practise what's on it", icon: FileTextIcon, ink: "bg-grape", tilt: "rotate-2", isNew: true },
  { href: "/practice/new?mode=mock", label: "Full mock interview", note: "Start to finish, about 15 minutes", icon: MicrophoneStageIcon, ink: "bg-sky", tilt: "rotate-3" },
  { href: "/calm", label: "Calm corner", note: "Breathing and help for nerves", icon: FlowerLotusIcon, ink: "bg-mint", tilt: "-rotate-2" },
];

/**
 * Home page band for people with an interview coming up. It sits straight under the hero,
 * leads with the tools that use their own advert and CV, and points to the full Get ready page.
 */
export function GetReadyStrip() {
  return (
    <section aria-labelledby="get-ready" className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex max-w-[52ch] flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="get-ready" className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">
              Interview coming up?
            </h2>
            <span className="sticker sticker-lime rotate-3" aria-hidden>
              Get ready
            </span>
          </div>
          <p className="text-muted">Practise for your actual job: the questions its advert points to, a mock interview built from your CV, and help with nerves.</p>
        </div>
        <Link href="/prepare" className="btn btn-primary h-12 w-full shrink-0 px-6 sm:w-fit">
          All interview tools <ArrowRightIcon size={18} weight="bold" aria-hidden />
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="panel group flex h-full items-center gap-4 p-4 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-px sm:p-5"
            >
              <span
                className={`flex size-14 shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--die)] text-on-ink shadow-[var(--sticker-shadow)] transition-transform duration-150 group-hover:rotate-0 ${l.ink} ${l.tilt}`}
              >
                <l.icon size={26} weight="fill" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {l.label}
                  {l.isNew && <span className="sticker sticker-sun px-2 py-0 text-micro">New</span>}
                </span>
                <span className="text-body-sm text-muted">{l.note}</span>
              </span>
              <ArrowRightIcon size={18} weight="bold" className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
