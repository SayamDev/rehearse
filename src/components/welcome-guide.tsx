"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { FloppyDiskIcon, HeadphonesIcon, MicrophoneIcon, XIcon } from "@phosphor-icons/react";
import { KOKORO_SERVER_STATE, kokoroAutoOk, kokoroState, kokoroSupported, onKokoroChange } from "@/lib/kokoro";
import { markWelcomed, useStore } from "@/lib/store";
import { PersonaAvatar } from "./persona-avatar";
import { VoiceOffer, voiceReady, type VoiceDevice } from "./voice-offer";

/**
 * First visit only: a short guide to getting the best out of Rehearse, with a
 * one-tap download of the most human voice so it's ready before the first round.
 * Closing it in any way marks it as seen. The download keeps going after it closes.
 */
export function WelcomeGuide() {
  const { hydrated, sessions, profile } = useStore();
  const pathname = usePathname();
  const voice = useSyncExternalStore(onKokoroChange, kokoroState, () => KOKORO_SERVER_STATE);
  const ref = useRef<HTMLDialogElement>(null);
  const [device, setDevice] = useState<VoiceDevice | null>(null);

  // Only for brand-new visitors: people who already practised know their way around.
  const show = hydrated && !profile.welcomed && sessions.length === 0 && pathname !== "/privacy";

  useEffect(() => {
    const d = ref.current;
    if (!show || !d || d.open) return;
    const supported = kokoroSupported();
    // Device capability can only be read in the browser.
    setDevice({ supported, metered: supported && !kokoroAutoOk() });
    d.showModal();
  }, [show]);

  function close() {
    ref.current?.close();
  }

  // Downloaded on an earlier visit: nothing to fetch, even if it hasn't loaded yet this time.
  const ready = voiceReady(voice);

  return (
    <dialog
      ref={ref}
      onClose={() => markWelcomed()}
      aria-labelledby="welcome-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] border-[3px] border-[var(--die)] bg-surface p-0 text-ink shadow-[var(--sheet-shadow)] backdrop:bg-[color-mix(in_oklab,var(--floor)_70%,transparent)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <PersonaAvatar id="friendly" size={72} />
            <div className="flex flex-col gap-1">
              <span className="sticker sticker-lime w-fit">Welcome!</span>
              <h2 id="welcome-title" className="text-title-lg font-bold tracking-[-0.02em]">
                Hi, I&apos;m Sam
              </h2>
            </div>
          </div>
          <button type="button" className="btn btn-quiet size-11 shrink-0 p-0" onClick={close} aria-label="Close">
            <XIcon size={20} weight="bold" aria-hidden />
          </button>
        </div>
        <p className="text-body text-muted">
          I&apos;ll be your interviewer. Here are three quick tips so practice feels like the real thing.
        </p>

        <ol className="flex flex-col gap-3">
          <li className="flex flex-col gap-3 rounded-control bg-surface-2 p-4">
            <div className="flex gap-3">
              <span className="sticker sticker-sky grid size-9 shrink-0 place-items-center p-0 font-bold" aria-hidden>
                1
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Give me my most human voice</p>
                <p className="text-body-sm text-muted">
                  With it, I sound like a real person instead of a robot.
                  {!ready && " It's a one-time download of about 90MB, then it works offline too."}
                </p>
              </div>
            </div>
            <VoiceOffer device={device} />
          </li>

          <li className="flex gap-3 rounded-control bg-surface-2 p-4">
            <span className="sticker sticker-sun grid size-9 shrink-0 place-items-center p-0 font-bold" aria-hidden>
              2
            </span>
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 font-semibold">
                <MicrophoneIcon size={18} weight="bold" aria-hidden /> Answer out loud
              </p>
              <p className="text-body-sm text-muted">
                Use Chrome, Edge or Safari and tap Allow when asked for the microphone. Rather not speak? Typing works just as well.
              </p>
            </div>
          </li>

          <li className="flex gap-3 rounded-control bg-surface-2 p-4">
            <span className="sticker sticker-grape grid size-9 shrink-0 place-items-center p-0 font-bold" aria-hidden>
              3
            </span>
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-2 font-semibold">
                <HeadphonesIcon size={18} weight="bold" aria-hidden /> Find a quiet spot
              </p>
              <p className="text-body-sm text-muted">
                Headphones help in Live Interview, so I don&apos;t hear myself. And don&apos;t worry about mistakes: try again and watch
                your score go up.
              </p>
            </div>
          </li>
        </ol>

        <p className="flex gap-2.5 rounded-control border-2 border-dashed border-line p-3 text-body-sm text-muted">
          <FloppyDiskIcon size={20} weight="fill" className="mt-0.5 shrink-0 text-ink" aria-hidden />
          <span>
            <strong className="text-ink">Your progress stays in this browser.</strong> Come back in the same browser to keep your streak
            and scores. Private or incognito windows forget everything when you close them.
          </span>
        </p>

        <button type="button" className="btn btn-ghost w-full" onClick={close}>
          Let&apos;s go
        </button>
      </div>
    </dialog>
  );
}
