"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { XIcon } from "@phosphor-icons/react";
import { KOKORO_SERVER_STATE, checkKokoroCache, kokoroAutoOk, kokoroState, kokoroSupported, onKokoroChange } from "@/lib/kokoro";
import { turnOffVoiceNudge, useStore } from "@/lib/store";
import { PersonaAvatar } from "./persona-avatar";
import { VoiceOffer, type VoiceDevice } from "./voice-offer";

/** Remembers the pop-up was shown this visit, so it doesn't open on every page. */
const SHOWN_KEY = "rehearse:voice-nudge";
/** Pages where a pop-up would get in the way. */
const QUIET = ["/practice/", "/privacy", "/offline", "/calm"];

function shownThisVisit() {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {
    // Storage blocked: it may show again next page, which is harmless.
  }
}

/**
 * For people who've been here before but don't have the most human voice yet:
 * a short offer to download it, once per visit, until they tick "Don't show this again".
 * Never during a round, and never for people who chose the standard voice on purpose.
 */
export function VoiceNudge() {
  const { hydrated, sessions, profile } = useStore();
  const pathname = usePathname();
  const voice = useSyncExternalStore(onKokoroChange, kokoroState, () => KOKORO_SERVER_STATE);
  const ref = useRef<HTMLDialogElement>(null);
  const [device, setDevice] = useState<VoiceDevice | null>(null);
  const [stop, setStop] = useState(false);
  const stopId = useId();

  const returning = profile.welcomed || sessions.length > 0;
  const quiet = QUIET.some((p) => pathname.startsWith(p));
  const eligible = hydrated && returning && !profile.voiceNudgeOff && profile.settings.voiceEngine !== "standard" && !quiet;

  useEffect(() => {
    if (!eligible || shownThisVisit() || !kokoroSupported()) return;
    let cancelled = false;
    // A calm pause after the page settles, and only if the voice really isn't saved here.
    const t = setTimeout(async () => {
      const saved = await checkKokoroCache();
      const d = ref.current;
      if (cancelled || saved || !d || d.open || kokoroState().status !== "idle" || document.querySelector("dialog[open]")) return;
      setDevice({ supported: true, metered: !kokoroAutoOk() });
      markShown();
      d.showModal();
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [eligible]);

  function close() {
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      onClose={() => {
        if (stop) turnOffVoiceNudge();
      }}
      aria-labelledby="voice-nudge-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] border-[3px] border-[var(--die)] bg-surface p-0 text-ink shadow-[var(--sheet-shadow)] backdrop:bg-[color-mix(in_oklab,var(--floor)_70%,transparent)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <PersonaAvatar id="friendly" size={64} />
            <h2 id="voice-nudge-title" className="text-title-lg font-bold tracking-[-0.02em]">
              Want me to sound more human?
            </h2>
          </div>
          <button type="button" className="btn btn-quiet size-11 shrink-0 p-0" onClick={close} aria-label="Close">
            <XIcon size={20} weight="bold" aria-hidden />
          </button>
        </div>
        <p className="text-body text-muted">
          My most human voice sounds like a real person instead of a robot. It&apos;s a one-time download of about 90MB, then it works
          offline too.
        </p>
        <div className="flex flex-col gap-3 rounded-control bg-surface-2 p-4">
          <VoiceOffer device={device} />
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor={stopId} className="flex min-h-11 cursor-pointer items-center gap-3 text-body-sm">
            <input id={stopId} type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} className="size-5 accent-[var(--ink)]" />
            Don&apos;t show this again
          </label>
          <button type="button" className="btn btn-ghost w-full sm:w-fit" onClick={close}>
            {voice.status === "loading" ? "Carry on" : "Not now"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
