"use client";

import { useT, type UiKey } from "@/lib/i18n";

/** Menu text in the practice language, for use inside server components. */
export function UiText({ k }: { k: UiKey }) {
  const t = useT();
  return <>{t(k)}</>;
}
