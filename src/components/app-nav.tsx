"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArchiveIcon, CardsIcon, ChatCircleDotsIcon, FireIcon, MicrophoneStageIcon, UserCircleIcon } from "@phosphor-icons/react";
import { liveStreak, localDay, useStore } from "@/lib/store";
import { isDue } from "@/lib/memory";
import { levelFromXp } from "@/lib/scoring";
import { useT, type UiKey } from "@/lib/i18n";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Practice", key: "nav.practice" as UiKey, icon: MicrophoneStageIcon, match: (p: string) => p === "/" || p.startsWith("/practice") },
  { href: "/remember", label: "Remember", key: "nav.remember" as UiKey, icon: CardsIcon, match: (p: string) => p.startsWith("/remember") },
  { href: "/coach", label: "Cobi", key: null, icon: ChatCircleDotsIcon, match: (p: string) => p.startsWith("/coach") },
  { href: "/archive", label: "Archive", key: "nav.archive" as UiKey, icon: ArchiveIcon, match: (p: string) => p.startsWith("/archive") },
  { href: "/me", label: "Me", key: "nav.me" as UiKey, icon: UserCircleIcon, match: (p: string) => p.startsWith("/me") },
];

export function AppNav() {
  const pathname = usePathname();
  const { hydrated, profile, bank } = useStore();
  const today = localDay();
  const due = hydrated ? bank.filter((a) => isDue(a, today)).length : 0;
  const level = levelFromXp(profile.xp);
  const streak = liveStreak(profile);
  const t = useT();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-floor/90 backdrop-blur supports-[backdrop-filter]:bg-floor/75">
        <nav aria-label="Main" className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="sticker sticker-tomato text-wordmark">
            Rehearse
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label: english, key, match }) => {
              const label = key ? t(key) : english;
              const active = match(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-body-sm font-medium transition-colors ${
                      active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {label}
                    {href === "/remember" && due > 0 && <DueBadge count={due} />}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/me"
              className="flex items-center gap-3 rounded-full py-1 pl-1 pr-1 text-label"
              aria-label={hydrated ? `Level ${level.level}, ${level.title}. ${streak} day streak.` : "Your progress"}
            >
              {hydrated ? (
                <>
                  <span className="flex items-center gap-1 text-muted tnum" title="Daily streak">
                    <FireIcon size={18} weight={streak > 0 ? "fill" : "regular"} className={streak > 0 ? "text-sun-text" : ""} aria-hidden />
                    {streak}
                  </span>
                  <span className="sticker tnum">Lv {level.level}</span>
                </>
              ) : (
                <span className="skeleton h-7 w-24" aria-hidden />
              )}
            </Link>
          </div>
        </nav>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-floor/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {LINKS.map(({ href, label: english, key, icon: Icon, match }) => {
            const label = key ? t(key) : english;
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-tape font-medium ${
                    active ? "text-ink" : "text-muted"
                  }`}
                >
                  <span
                    className={`relative flex size-9 items-center justify-center rounded-full transition-transform ${
                      active ? "-rotate-6 border-[3px] border-[var(--die)] bg-sun text-on-ink shadow-[var(--sticker-shadow)]" : ""
                    }`}
                  >
                    <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden />
                    {href === "/remember" && due > 0 && <DueBadge count={due} className="absolute -right-3 -top-1.5" />}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function DueBadge({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`tnum ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-tomato px-1.5 text-micro font-bold leading-4 text-on-ink ring-2 ring-[var(--die)] ${className}`}>
      {count}
      <span className="sr-only"> due today</span>
    </span>
  );
}
