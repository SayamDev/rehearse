"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckCircleIcon, DownloadSimpleIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { KOKORO_SERVER_STATE, kokoroState, loadKokoro, onKokoroChange } from "@/lib/kokoro";
import { updateSettings } from "@/lib/store";
import { VoiceProgress } from "./voice-progress";

export type VoiceDevice = { supported: boolean; metered: boolean };

/** Whether the most human voice is on this device already (or finished loading this visit). */
export function voiceReady(voice: { status: string; cached: boolean | null }) {
  return voice.status === "ready" || (voice.status === "idle" && voice.cached === true);
}

/**
 * The "most human voice" offer: what it is, why it's safe, and a one-tap download
 * with live progress. Shared by the first-visit welcome and the returning-visitor pop-up.
 */
export function VoiceOffer({ device }: { device: VoiceDevice | null }) {
  const voice = useSyncExternalStore(onKokoroChange, kokoroState, () => KOKORO_SERVER_STATE);
  const [error, setError] = useState("");
  const loading = voice.status === "loading";
  const ready = voiceReady(voice);

  async function download() {
    setError("");
    updateSettings({ voiceEngine: "kokoro" });
    try {
      await loadKokoro();
    } catch {
      setError("The voice couldn't download. Check your connection, or try again later from Me.");
    }
  }

  return (
    <>
      {!ready && (
        <p className="flex gap-2 rounded-control bg-surface p-3 text-body-sm">
          <ShieldCheckIcon size={20} weight="fill" className="mt-0.5 shrink-0 text-up" aria-hidden />
          <span>
            <strong>Safe and private.</strong> It&apos;s free and open-source, it downloads from Hugging Face (a well-known home for free
            AI voices), and it runs only on your device. Nothing you say is sent anywhere by it, and you can switch back to the standard
            voice any time in Me.
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
          <CheckCircleIcon size={20} weight="fill" className="text-up" aria-hidden /> All set! My voice is on this device now.
        </p>
      )}
      {device?.supported && loading && (
        <div className="flex flex-col gap-2">
          <VoiceProgress state={voice} name="my voice" />
          <span className="text-label text-muted">You can close this and carry on; it keeps going.</span>
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
    </>
  );
}
