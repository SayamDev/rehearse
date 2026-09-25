"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";
import { AppleLogoIcon, BroomIcon, DevicesIcon, DeviceMobileIcon, ExportIcon, PlusSquareIcon, XIcon } from "@phosphor-icons/react";
import { daysSince } from "@/lib/backup";
import { askToKeepData, markPopupShown, popupBlocked } from "@/lib/popups";
import { turnOffSaveNudge, useStore } from "@/lib/store";
import { PersonaAvatar } from "./persona-avatar";
import { BackupButton } from "./progress-backup";
import { useInstall } from "./pwa";
import { QUIET_PAGES } from "./voice-nudge";

/** Rounds finished before the pop-up appears: by then there's something worth keeping. */
const AFTER_ROUNDS = 2;
/** A backup newer than this counts as safe enough. */
const BACKUP_FRESH_DAYS = 30;

/** Safari on a Mac also clears site data after about a week away. */
function isDesktopSafari() {
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|chromium|crios|fxios|edg|android/i.test(ua);
}

/**
 * "Keep your progress safe": progress lives only in this browser, so after a couple of
 * rounds we explain what can wipe it and offer the fix that suits the device (Home Screen
 * on iPhone, install on Chrome, a backup file everywhere). Once per visit at most, until
 * they tick "Don't show this again" or make a backup.
 */
export function SaveNudge() {
  const { hydrated, sessions, profile } = useStore();
  const pathname = usePathname();
  const { state: install, install: runInstall } = useInstall();
  const ref = useRef<HTMLDialogElement>(null);
  const [stop, setStop] = useState(false);
  const [steps, setSteps] = useState(false);
  const [safari, setSafari] = useState(false);
  const stopId = useId();

  const rounds = sessions.filter((s) => s.completedAt).length;
  const backupAge = daysSince(profile.lastBackup);
  const needsBackup = backupAge === null || backupAge > BACKUP_FRESH_DAYS;
  const quiet = QUIET_PAGES.some((p) => pathname.startsWith(p));
  const eligible = hydrated && rounds >= AFTER_ROUNDS && needsBackup && !profile.saveNudgeOff && !quiet;

  // Quietly ask the browser to keep this site's data, once there's progress to keep.
  useEffect(() => {
    if (hydrated && sessions.length > 0) void askToKeepData();
  }, [hydrated, sessions.length]);

  useEffect(() => {
    if (!eligible) return;
    // After the voice pop-up's turn, so the two never stack.
    const t = setTimeout(() => {
      const d = ref.current;
      if (!d || popupBlocked()) return;
      setSafari(isDesktopSafari());
      markPopupShown();
      d.showModal();
    }, 1600);
    return () => clearTimeout(t);
  }, [eligible]);

  function close() {
    ref.current?.close();
  }

  const ios = install === "ios";

  return (
    <dialog
      ref={ref}
      onClose={() => {
        if (stop) turnOffSaveNudge();
        setSteps(false);
      }}
      aria-labelledby="save-nudge-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-panel)] border-[3px] border-[var(--die)] bg-surface p-0 text-ink shadow-[var(--sheet-shadow)] backdrop:bg-[color-mix(in_oklab,var(--floor)_70%,transparent)]"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <PersonaAvatar id="friendly" size={64} />
            <h2 id="save-nudge-title" className="text-title-lg font-bold tracking-[-0.02em]">
              Keep your progress safe
            </h2>
          </div>
          <button type="button" className="btn btn-quiet size-11 shrink-0 p-0" onClick={close} aria-label="Close">
            <XIcon size={20} weight="bold" aria-hidden />
          </button>
        </div>
        <p className="text-body text-muted">
          Nice work so far! Your progress is saved in this browser, not in an account, so a few things can wipe it:
        </p>

        <ul className="flex flex-col gap-2">
          <Risk icon={BroomIcon} ink="bg-sky">
            <strong>Clearing your browser data</strong>, or practising in a private or incognito window.
          </Risk>
          <Risk icon={DevicesIcon} ink="bg-sun">
            <strong>Another phone, computer or browser</strong> starts fresh.
          </Risk>
          {ios && (
            <Risk icon={AppleLogoIcon} ink="bg-grape">
              <strong>On iPhone and iPad</strong>, Safari can clear it after about a week away. Adding Rehearse to your Home Screen stops
              that.
            </Risk>
          )}
          {safari && !ios && (
            <Risk icon={AppleLogoIcon} ink="bg-grape">
              <strong>Safari</strong> can clear it after about a week away. A backup keeps it safe.
            </Risk>
          )}
        </ul>

        {ios && steps ? (
          <ol className="flex flex-col gap-3 rounded-control bg-surface-2 p-4">
            <Step n={1}>
              <span>
                <strong>Back up first.</strong> The Home Screen app starts empty, so you&apos;ll load this into it.
              </span>
              <BackupButton />
            </Step>
            <Step n={2}>
              <span>
                Tap the Share button{" "}
                <ExportIcon size={18} weight="bold" className="inline -translate-y-0.5" aria-label="(a square with an arrow)" /> in Safari,
                then <strong>Add to Home Screen</strong>{" "}
                <PlusSquareIcon size={18} weight="bold" className="inline -translate-y-0.5" aria-hidden />.
              </span>
            </Step>
            <Step n={3}>
              <span>
                Open Rehearse from your Home Screen, go to <strong>Me</strong>, and tap <strong>Load a backup</strong>.
              </span>
            </Step>
          </ol>
        ) : (
          <div className="flex flex-col gap-3">
            {ios && (
              <button type="button" className="btn btn-go w-full sm:w-fit" onClick={() => setSteps(true)}>
                <DeviceMobileIcon size={18} weight="bold" aria-hidden />
                Add to Home Screen
              </button>
            )}
            {install === "ready" && (
              <button type="button" className="btn btn-go w-full sm:w-fit" onClick={runInstall}>
                <DeviceMobileIcon size={18} weight="bold" aria-hidden />
                Install the app
              </button>
            )}
            <BackupButton variant={ios || install === "ready" ? "ghost" : "go"} />
            <p className="text-label text-muted">A backup is one small file. Load it in Me on any device to carry on where you left off.</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor={stopId} className="flex min-h-11 cursor-pointer items-center gap-3 text-body-sm">
            <input id={stopId} type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} className="size-5 accent-[var(--ink)]" />
            Don&apos;t show this again
          </label>
          <button type="button" className="btn btn-ghost w-full sm:w-fit" onClick={close}>
            {profile.lastBackup && !needsBackup ? "Done" : "Not now"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function Risk({ icon: RiskIcon, ink, children }: { icon: Icon; ink: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-control bg-surface-2 p-3 text-body-sm">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--die)] text-on-ink ${ink}`}>
        <RiskIcon size={16} weight="fill" aria-hidden />
      </span>
      <span className="pt-1">{children}</span>
    </li>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="sticker sticker-sky grid size-8 shrink-0 place-items-center p-0 font-bold" aria-hidden>
        {n}
      </span>
      <div className="flex min-w-0 flex-col gap-2 pt-1 text-body-sm">{children}</div>
    </li>
  );
}
