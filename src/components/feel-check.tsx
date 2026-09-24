"use client";

import Link from "next/link";
import { useState } from "react";
import { WindIcon } from "@phosphor-icons/react";
import { FEELINGS } from "@/lib/calm";
import { setFeel } from "@/lib/store";
import type { Session } from "@/lib/types";
import { CalmMoment } from "./calm-moment";
import { useT } from "@/lib/i18n";

/**
 * One tap: how nervous do you feel? Asked before and after a round, so people can
 * see their nerves settle with practice, not just their scores go up.
 */
export function FeelCheck({
  session,
  when,
  onPicked,
  centered = false,
}: {
  session: Session;
  when: "before" | "after";
  /** Called after a feeling is picked (the ready screen uses it to start the round). */
  onPicked?: () => void;
  centered?: boolean;
}) {
  const value = session.feel?.[when];
  const before = session.feel?.before;
  const [calm, setCalm] = useState(false);
  const t = useT();

  if (value !== undefined) {
    const calmer = when === "after" && before !== undefined && value > before;
    const same = when === "after" && before !== undefined && value === before;
    return (
      <p className="text-body-sm text-muted" role="status">
        {when === "before" ? (
          value <= 1 ? (
            <>
              Thanks for telling us. Nerves are normal. Take it one question at a time, or do the{" "}
              <Link href="/practice/warmup" className="font-semibold text-ink underline underline-offset-4">
                warm-up round
              </Link>{" "}
              first.
            </>
          ) : (
            "Thanks. Let's go."
          )
        ) : calmer ? (
          `You went from "${FEELINGS[before!].toLowerCase()}" to "${FEELINGS[value].toLowerCase()}". Practice is working.`
        ) : same ? (
          "Same as before you started. That's fine: each round makes the next one feel more familiar."
        ) : (
          "Thanks. Every round makes the real thing feel more familiar."
        )}
      </p>
    );
  }

  return (
    <fieldset className={`flex flex-col gap-3 ${centered ? "items-center" : ""}`}>
      <legend className={`mb-3 font-semibold ${centered ? "mx-auto" : ""}`}>
        {when === "before" ? t("feel.before") : t("feel.after")}
      </legend>
      <div className={`flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`}>
        {FEELINGS.map((f, i) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFeel(session.id, when, i);
              onPicked?.();
            }}
            className="min-h-10 rounded-full border-2 border-line px-3.5 text-label font-semibold transition-[border-color,background-color,transform] duration-150 hover:border-ink active:scale-[0.97]"
          >
            {f}
          </button>
        ))}
      </div>
      {when === "before" && (
        <button type="button" className={`btn btn-quiet w-fit min-h-9 text-label ${centered ? "" : "-ml-2"}`} onClick={() => setCalm(true)}>
          <WindIcon size={16} weight="bold" aria-hidden />
          Breathe for a minute first
        </button>
      )}
      <CalmMoment open={calm} onClose={() => setCalm(false)} />
    </fieldset>
  );
}
