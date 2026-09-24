"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CheckCircleIcon, DownloadSimpleIcon, FloppyDiskIcon, HeadphonesIcon, MicrophoneIcon, ShieldCheckIcon, XIcon } from "@phosphor-icons/react";
import { kokoroAutoOk, kokoroState, kokoroSupported, loadKokoro, onKokoroChange } from "@/lib/kokoro";
import { markWelcomed, updateSettings, useStore } from "@/lib/store";
import { PersonaAvatar } from "./persona-avatar";
import { VoiceProgress } from "./voice-progress";

const SERVER_STATE = { status: "idle" as const, progress: 0, cached: null };

/**
 * First visit only: a short guide to getting the best out of Rehearse, with a
 * one-tap download of the most human voice so it's ready before the first round.
 * Closing it in any way marks it as seen. The download keeps going after it closes.
 */
export function WelcomeGuide() {
  const { hydrated, sessions, profile } = useStore();
  const pathname = usePathname();
  const voice = useSyncExternalStore(onKokoroChange, kokoroState, () => SERVER_STATE);
  const ref = useRef<HTMLDialogElement>(null);
  const [device, setDevice] = useState<{ supported: boolean; metered: boolean } | null>(null);
  const [error, setError] = useState("");

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

  async function download() {
    setError("");
    try {
      await loadKokoro();
      updateSettings({ voiceEngine: "kokoro" });
    } catch {
      setError("The voice couldn't download. Check your connection, or try again later from Me.");
    }
  }

  function close() {
    ref.current?.close();
  }

  const loading = voice.status === "loading";
  // Downloaded on an earlier visit: nothing to fetch, even if it hasn't loaded yet this time.
  const ready = voice.status === "ready" || (voice.status === "idle" && voice.cached === true);

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
            {!ready && (
              <p className="flex gap-2 rounded-control bg-surface p-3 text-body-sm">
                <ShieldCheckIcon size={20} weight="fill" className="mt-0.5 shrink-0 text-up" aria-hidden />
                <span>
                  <strong>Safe and private.</strong> It&apos;s free and open-source, it downloads from Hugging Face (a well-known home for
                  free AI voices), and it runs only on your device. Nothing you say is sent anywhere by it, and you can switch back to the
                  standard voice any time in Me.
                </span>
              </p>
            )}
            {device && !device.supported && (
              <p className="text-body-sm text-muted">
                This device may be a bit slow for it, so I&apos;ll use your device&apos;s own voice instead. Everything else works the same.
              </p>
            )}
            {device?.supported && ready && (
              <p className="flex items-center gap-2 text-body-sm font-semibold" role="status">
                <CheckCircleIcon size={20} weight="fill" className="text-up" aria-hidden /> All set! My voice is already on this device, so
                there&apos;s nothing to download.
              </p>
            )}
            {device?.supported && loading && (
              <div className="flex flex-col gap-2">
                <VoiceProgress progress={voice.progress} cached={voice.cached} name="my voice" />
                <span className="text-label text-muted">You can close this and start; it keeps going.</span>
              </div>
            )}
            {device?.supported && !ready && !loading && (
              <div className="flex flex-col gap-2">
                <button type="button" className="btn btn-go w-full sm:w-fit" onClick={download}>
                  <DownloadSimpleIcon size={18} weight="bold" aria-hidden />
                  Download my voice (90MB)
                </button>
                <span className="text-label text-muted">
                  {device.metered
                    ? "You seem to be on mobile data. Best to wait for Wi-Fi, or download later from Me."
                    : "No rush: if you skip it, it downloads by itself later on Wi-Fi."}
                </span>
              </div>
            )}
            {error && (
              <p role="alert" className="text-label text-down">
                {error}
              </p>
            )}
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
