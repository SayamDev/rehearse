"use client";

import { useEffect } from "react";
import { checkKokoroCache } from "@/lib/kokoro";
import { useStore } from "@/lib/store";
import { useFocusScreen } from "@/lib/focus";

/** Applies app-wide display settings to the page, such as larger text. */
export function SettingsEffects() {
  const { hydrated, profile } = useStore();
  const large = hydrated && profile.settings.largeText;
  const theme = hydrated ? profile.settings.theme : null;
  const focus = useFocusScreen();
  useEffect(() => {
    document.documentElement.dataset.text = large ? "large" : "normal";
  }, [large]);

  useEffect(() => {
    document.documentElement.dataset.focus = focus ? "on" : "off";
  }, [focus]);

  useEffect(() => {
    if (!theme) return;
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Learn early whether the human voice is already saved, so it's used even on mobile data.
  useEffect(() => {
    checkKokoroCache();
  }, []);

  return null;
}
