"use client";

import { usePathname } from "next/navigation";
import { useStore } from "./store";

const ROUND = /^\/practice\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * True while Focus mode is on and a practice round is on screen. Focus mode then hides
 * everything but the question, the answer and the progress: menus, footer, stickers.
 */
export function useFocusScreen(): boolean {
  const { hydrated, profile } = useStore();
  const pathname = usePathname();
  return hydrated && Boolean(profile.settings.focusMode) && ROUND.test(pathname);
}
