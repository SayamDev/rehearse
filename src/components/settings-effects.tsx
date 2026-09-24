"use client";

import { useEffect } from "react";
import { checkKokoroCache } from "@/lib/kokoro";
import { useStore } from "@/lib/store";

/** Applies app-wide display settings to the page, such as larger text. */
export function SettingsEffects() {
  const { hydrated, profile } = useStore();
  const large = hydrated && profile.settings.largeText;
  useEffect(() => {
    document.documentElement.dataset.text = large ? "large" : "normal";
  }, [large]);

  // Learn early whether the human voice is already saved, so it's used even on mobile data.
  useEffect(() => {
    checkKokoroCache();
  }, []);

  return null;
}
