import type { Profile, Session } from "./types";

export const DEFAULT_WEEKLY_GOAL = 3;

export function weeklyGoal(profile: Profile): number {
  return profile.weeklyGoal ?? DEFAULT_WEEKLY_GOAL;
}

/** The Monday (local, YYYY-MM-DD) that starts the week containing `date`. */
export function weekStart(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Finished rounds per week, keyed by the week's Monday. */
export function roundsByWeek(sessions: Session[]): Map<string, number> {
  const weeks = new Map<string, number>();
  for (const s of sessions) {
    if (!s.completedAt) continue;
    const key = weekStart(new Date(s.completedAt));
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }
  return weeks;
}

export function roundsThisWeek(sessions: Session[], now = new Date()): number {
  return roundsByWeek(sessions).get(weekStart(now)) ?? 0;
}

/** True once any week has reached the goal. */
export function goalEverMet(sessions: Session[], goal: number): boolean {
  return [...roundsByWeek(sessions).values()].some((n) => n >= goal);
}
