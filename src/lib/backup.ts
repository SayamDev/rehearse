import type { Profile, SavedAnswer, Session } from "./types";

/**
 * Progress backups: one small file the user keeps themselves. No accounts, no servers.
 * Loading it back restores everything in any browser or on any device.
 */

export type BackupData = { sessions: Session[]; profile: Profile; bank: SavedAnswer[] };
type BackupFile = { kind: typeof KIND; version: 1; savedAt: string; data: BackupData };

const KIND = "rehearse-backup";
/** Anything bigger than this isn't a Rehearse backup. */
export const MAX_BACKUP_BYTES = 20_000_000;

export function backupFile(data: BackupData, now = new Date()): string {
  const file: BackupFile = { kind: KIND, version: 1, savedAt: now.toISOString(), data };
  return JSON.stringify(file);
}

/** Dated and timed, so each backup has its own name instead of "(1)", "(2)" copies. */
export function backupFileName(now = new Date()): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `rehearse-progress-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}.json`;
}

/** Reads a backup file, or throws an error with a message fit to show the user. */
export function readBackup(text: string): { data: BackupData; savedAt: string } {
  let file: Partial<BackupFile>;
  try {
    file = JSON.parse(text) as Partial<BackupFile>;
  } catch {
    throw new Error("That file isn't a Rehearse backup. Pick a file that starts with rehearse-progress.");
  }
  const data = file?.data;
  if (file?.kind !== KIND || !data || typeof data !== "object") {
    throw new Error("That file isn't a Rehearse backup. Pick a file that starts with rehearse-progress.");
  }
  if (typeof file.version !== "number" || file.version > 1) {
    throw new Error("This backup was made by a newer version of Rehearse. Reload the page and try again.");
  }
  if (!Array.isArray(data.sessions) || !Array.isArray(data.bank) || !data.profile || typeof data.profile !== "object") {
    throw new Error("This backup looks damaged, so nothing was changed.");
  }
  return { data, savedAt: typeof file.savedAt === "string" ? file.savedAt : "" };
}

/** A one-line summary, for "load this backup?" and "what's here now". */
export function progressSummary(data: Pick<BackupData, "sessions" | "profile">): string {
  const rounds = data.sessions.filter((s) => s.completedAt).length;
  const xp = data.profile.xp ?? 0;
  return `${rounds} ${rounds === 1 ? "round" : "rounds"}, ${xp} XP`;
}

/** Whole days since an ISO time, or null if never. */
export function daysSince(iso: string | undefined, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.round((day(now) - day(then)) / 86_400_000));
}

export function lastBackupLabel(iso: string | undefined, now = new Date()): string {
  const days = daysSince(iso, now);
  if (days === null) return "You haven't made a backup yet.";
  if (days === 0) return "Last backup: today.";
  if (days === 1) return "Last backup: yesterday.";
  return `Last backup: ${days} days ago.`;
}
