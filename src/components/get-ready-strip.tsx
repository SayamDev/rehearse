import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

const LINKS = [
  { href: "/practice/new?mode=mock", label: "Full mock interview", note: "Start to finish, about 15 minutes" },
  { href: "/prepare/intro", label: "“Tell me about yourself”", note: "Build your opening answer" },
  { href: "/prepare/questions", label: "Questions to ask them", note: "For the end of the interview" },
  { href: "/calm", label: "Calm corner", note: "Breathing and help for nerves" },
];

/** Home page band for people with an interview coming up. */
export function GetReadyStrip() {
  return (
    <section aria-labelledby="get-ready" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="get-ready" className="text-title-lg font-bold tracking-[-0.02em]">
          Interview coming up?
        </h2>
        <Link href="/prepare" className="text-label font-semibold underline underline-offset-4">
          All ways to get ready
        </Link>
      </div>
      <ul className="grid border-t border-line md:grid-cols-2 md:gap-x-10">
        {LINKS.map((l) => (
          <li key={l.href} className="border-b border-line">
            <Link href={l.href} className="group flex items-center gap-3 py-4">
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
