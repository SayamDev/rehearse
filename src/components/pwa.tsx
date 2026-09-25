"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Installable app support. The service worker (public/sw.js) is only registered in
 * production builds, so it never gets in the way while developing.
 */

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: InstallEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

type InstallState = "installed" | "ready" | "ios" | "unavailable";

function snapshot(): InstallState {
  if (installed || window.matchMedia("(display-mode: standalone)").matches) return "installed";
  if (deferred) return "ready";
  // iPads on iPadOS say "Macintosh", but Macs have no touch screen.
  const apple = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return apple ? "ios" : "unavailable";
}

export function useInstall(): { state: InstallState; install: () => Promise<void> } {
  const state = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    snapshot,
    () => "unavailable" as InstallState,
  );
  return {
    state,
    install: async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice.catch(() => undefined);
      deferred = null;
      notify();
    },
  };
}
