"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Scrolls to the element a link's #hash names, trying for a moment while the page fills in. */
export function scrollToHash(hash: string, tries = 20) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ block: "start" });
    return;
  }
  if (tries > 0) setTimeout(() => scrollToHash(hash, tries - 1), 100);
}

/**
 * Every button or link that opens another page lands at the top of it, or at the section it
 * names (/me#backup), on phones too. Going back keeps the browser's own scroll position.
 */
export function RouteScroll() {
  const pathname = usePathname();
  const back = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onPop = () => {
      back.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    // The first load is handled by the browser (including #hash links from outside).
    if (first.current) {
      first.current = false;
      if (window.location.hash) scrollToHash(window.location.hash);
      return;
    }
    if (back.current) {
      back.current = false;
      return;
    }
    if (window.location.hash) scrollToHash(window.location.hash);
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
