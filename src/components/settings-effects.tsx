"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/** Applies app-wide display settings to the page, such as larger text. */
export function SettingsEffects() {
  const { hydrated, profile } = useStore();
  const large = hydrated && profile.settings.largeText;
  useEffect(() => {
    document.documentElement.dataset.text = large ? "large" : "normal";
  }, [large]);

  return null;
}
