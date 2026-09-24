import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRightIcon, ChatCircleDotsIcon, FlowerLotusIcon, MicrophoneStageIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";

const LINKS: { href: string; label: string; note: string; icon: Icon; ink: string; tilt: string }[] = [
  { href: "/practice/new?mode=mock", label: "Full mock interview", note: "Start to finish, about 15 minutes", icon: MicrophoneStageIcon, ink: "bg-tomato", tilt: "-rotate-3" },
  { href: "/prepare/intro", label: "“Tell me about yourself”", note: "Build your opening answer", icon: ChatCircleDotsIcon, ink: "bg-sky", tilt: "rotate-2" },
  { href: "/prepare/questions", label: "Questions to ask them", note: "For the end of the interview", icon: QuestionIcon, ink: "bg-sun", tilt: "rotate-3" },
  { href: "/calm", label: "Calm corner", note: "Breathing and help for nerves", icon: FlowerLotusIcon, ink: "bg-mint", tilt: "-rotate-2" },
];

/** Home page band for people with an interview coming up: four tools, each its own coloured sticker card. */
export function GetReadyStrip() {
  return (
    <section aria-labelledby="get-ready" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="get-ready" className="text-title-lg font-bold tracking-[-0.02em]">
            Interview coming up?
          </h2>
          <span className="sticker sticker-lime" aria-hidden>
            Get ready
          </span>
        </div>
        <Link href="/prepare" className="text-label font-semibold underline underline-offset-4">
          All ways to get ready
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="panel group flex h-full items-center gap-4 p-4 transition-transform duration-150 hover:-translate-y-0.5 sm:p-5"
            >
              <span
                className={`flex size-14 shrink-0 items-center justify-center rounded-full border-[3px] border-[var(--die)] text-on-ink shadow-[var(--sticker-shadow)] transition-transform duration-150 group-hover:rotate-0 ${l.ink} ${l.tilt}`}
              >
                <l.icon size={26} weight="fill" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold">{l.label}</span>
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
