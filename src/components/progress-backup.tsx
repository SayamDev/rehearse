"use client";

import { useRef, useState } from "react";
import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { backupFile, backupFileName, MAX_BACKUP_BYTES, progressSummary, readBackup, type BackupData } from "@/lib/backup";
import { askToKeepData } from "@/lib/popups";
import { exportProgress, importProgress, useStore } from "@/lib/store";

/** Saves this browser's progress as a file, and returns the file's name. */
export function downloadBackup(): string {
  const name = backupFileName();
  const url = URL.createObjectURL(new Blob([backupFile(exportProgress())], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  void askToKeepData(true);
  return name;
}

/** "Back up my progress" button, with a note on where the file went. */
export function BackupButton({ variant = "ghost", className = "" }: { variant?: "ghost" | "go"; className?: string }) {
  const [saved, setSaved] = useState("");
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button type="button" className={`btn btn-${variant} w-full sm:w-fit`} onClick={() => setSaved(downloadBackup())}>
        <DownloadSimpleIcon size={18} weight="bold" aria-hidden />
        Back up my progress
      </button>
      {saved && (
        <p role="status" className="text-label text-muted">
          Saved <span className="font-semibold text-ink">{saved}</span> to your downloads. Keep it somewhere safe, like your email or
          cloud storage. It holds your answers, so don&apos;t share it.
        </p>
      )}
    </div>
  );
}

/** "Load a backup": pick the file, see what's in it, then confirm before it replaces anything. */
export function LoadBackup() {
  const { sessions, profile } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ data: BackupData; savedAt: string } | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setMessage(null);
    setPicked(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) return setMessage({ tone: "error", text: "That file is too big to be a Rehearse backup." });
    try {
      setPicked(readBackup(await file.text()));
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "That file couldn't be read." });
    }
  }

  function load() {
    if (!picked) return;
    importProgress(picked.data);
    setPicked(null);
    setMessage({ tone: "ok", text: "Your progress is back. Welcome back!" });
  }

  const hasProgress = sessions.length > 0 || profile.xp > 0;
  const date = picked?.savedAt
    ? new Date(picked.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="flex flex-col gap-3">
      <input ref={input} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={choose} />
      {!picked && (
        <button type="button" className="btn btn-ghost w-full sm:w-fit" onClick={() => input.current?.click()}>
          <UploadSimpleIcon size={18} weight="bold" aria-hidden />
          Load a backup
        </button>
      )}
      {picked && (
        <div role="alert" className="flex flex-col gap-3 rounded-control border-2 border-line p-4">
          <p className="font-medium">
            Load this backup{date && ` from ${date}`}? It has {progressSummary(picked.data)}.
          </p>
          {hasProgress && (
            <p className="text-body-sm text-muted">
              It replaces what&apos;s in this browser now ({progressSummary({ sessions, profile })}).
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={load}>
              Load it
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPicked(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`text-label ${message.tone === "error" ? "text-down" : "text-up"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
