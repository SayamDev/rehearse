"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { kokoroState, kokoroSupported, loadKokoro, onKokoroChange } from "@/lib/kokoro";
import { updateSettings } from "@/lib/store";
import { Segmented } from "./segmented";

const SERVER_STATE = { status: "idle" as const, progress: 0, cached: null };

/** Me setting: the on-device Kokoro voice (default, one-time download) or the standard voice. */
export function VoiceSetting({ engine }: { engine: "standard" | "kokoro" }) {
  const state = useSyncExternalStore(onKokoroChange, kokoroState, () => SERVER_STATE);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Device capability can only be read in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(kokoroSupported());
  }, []);

  async function choose(next: "standard" | "kokoro") {
    setError("");
    if (next === "standard") return updateSettings({ voiceEngine: "standard" });
    try {
      await loadKokoro();
      updateSettings({ voiceEngine: "kokoro" });
    } catch {
      setError("The voice couldn't download. Check your connection and try again.");
    }
  }

  const loading = state.status === "loading";

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Voice quality"
        value={engine}
        onChange={choose}
        disabled={loading}
        options={[
          { value: "kokoro", label: "Most human", disabled: supported === false && engine !== "kokoro" },
          { value: "standard", label: "Standard" },
        ]}
      />
      {loading && (
        <div className="flex flex-col gap-2" role="status" aria-live="polite">
          <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-sky transition-[width] duration-300" style={{ width: `${state.progress}%` }} />
          </div>
          <span className="tnum text-label text-muted">{state.cached ? "Getting the voice ready..." : "Downloading the voice..."} {state.progress}%</span>
        </div>
      )}
      {(state.status === "ready" || (state.status === "idle" && state.cached)) && (
        <p className="flex items-center gap-2 text-label text-muted">
          <span className="sticker sticker-lime">Installed</span>
          {engine === "kokoro" ? "Already saved on this device, so it works offline too." : "Already saved on this device. Pick Most human to use it."}
        </p>
      )}
      {engine === "kokoro" && (state.status === "error" || (state.status === "idle" && state.cached === false)) && supported !== false && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-ghost min-h-10 text-label" onClick={() => choose("kokoro")}>
            <DownloadSimpleIcon size={16} weight="bold" aria-hidden />
            Download now (about 90MB)
          </button>
          <span className="text-label text-muted">Otherwise it downloads by itself next time you&apos;re on Wi-Fi.</span>
        </div>
      )}
      {supported === false && (
        <p className="text-label text-muted">This device may be too slow for the most human voice, so the standard voice is used.</p>
      )}
      {error && (
        <p role="alert" className="text-label text-down">
          {error}
        </p>
      )}
    </div>
  );
}
