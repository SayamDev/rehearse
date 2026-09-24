"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { updateSettings, useStore } from "@/lib/store";

/**
 * One-tap light/dark switch in the top bar. It flips whatever is showing now; "Match device"
 * stays available in Me > Settings.
 */
export function ThemeToggle() {
  const { hydrated, profile } = useStore();
  const [deviceDark, setDeviceDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // The device's colour scheme can only be read in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeviceDark(mq.matches);
    const on = (e: MediaQueryListEvent) => setDeviceDark(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  if (!hydrated) return <span className="size-10 shrink-0" aria-hidden />;
  const theme = profile.settings.theme;
  const dark = theme === "dark" || (theme === "system" && deviceDark);

  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: dark ? "light" : "dark" })}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {dark ? <SunIcon size={20} weight="bold" aria-hidden /> : <MoonIcon size={20} weight="bold" aria-hidden />}
    </button>
  );
}
