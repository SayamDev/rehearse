import type { UpcomingInterview } from "./types";

/** Whole calendar days from `now` to the interview day (0 = today, negative = past). */
export function daysUntil(when: string, now = new Date()): number {
  const [date] = when.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}

export function interviewDate(when: string): Date {
  const [date, time = "09:00"] = when.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

/** The headline: "In 5 days", "Tomorrow", "Today at 10:00", "In 2 hours". */
export function countdownLabel(when: string, now = new Date()): string {
  const days = daysUntil(when, now);
  if (days > 1) return `In ${days} days`;
  if (days === 1) return "Tomorrow";
  if (days < 0) return "Done";
  const mins = Math.round((interviewDate(when).getTime() - now.getTime()) / 60_000);
  if (mins <= 0) return "Today";
  if (mins < 60) return `In ${mins} minutes`;
  if (mins < 180) return `In ${Math.round(mins / 60)} ${Math.round(mins / 60) === 1 ? "hour" : "hours"}`;
  return `Today at ${when.split("T")[1] ?? ""}`.trim();
}

export type PlanStep = { label: string; href: string };

/** What to do next, depending on how close the interview is. */
export function planFor(days: number, packHref: string): { title: string; steps: PlanStep[] } {
  if (days >= 7)
    return {
      title: "Plenty of time. Build good habits",
      steps: [
        { label: "Practise the questions for your kind of job", href: packHref },
        { label: "Build your “tell me about yourself” answer", href: "/prepare/intro" },
        { label: "Do a short round most days to keep your streak", href: "/practice/new" },
      ],
    };
  if (days >= 3)
    return {
      title: "This week: rehearse the real thing",
      steps: [
        { label: "Do a full mock interview, start to finish", href: "/practice/new?mode=mock" },
        { label: "Pick two or three questions to ask them", href: "/prepare/questions" },
        { label: "Save your best answers so you remember them", href: "/remember" },
      ],
    };
  if (days >= 1)
    return {
      title: "Nearly there: keep it light",
      steps: [
        { label: "Go over your saved answers once", href: "/remember" },
        { label: "Print or save your interview-day card", href: "/prepare/card" },
        { label: "Check your body language tips", href: "/prepare/body" },
      ],
    };
  return {
    title: "Today: warm up and stay calm",
    steps: [
      { label: "Do the warm-up round to get talking", href: "/practice/warmup" },
      { label: "Breathe for a minute before you go in", href: "/calm" },
      { label: "Read your interview-day card", href: "/prepare/card" },
    ],
  };
}

function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

/** A calendar file with two reminders (the day before and two hours before). Nothing is sent anywhere. */
export function interviewIcs(i: UpcomingInterview, link: string, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const start = `${i.when.replace(/[-:]/g, "")}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rehearse//Interview//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${stamp}-${Math.random().toString(36).slice(2)}@rehearse`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    "DURATION:PT1H",
    `SUMMARY:${icsText(`Interview: ${i.role}`)}`,
    i.where ? `LOCATION:${icsText(i.where)}` : "",
    `DESCRIPTION:${icsText(`Good luck! Warm up first: ${link}`)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P1D",
    `DESCRIPTION:${icsText(`Interview tomorrow: ${i.role}. One practice round tonight, then rest.`)}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT2H",
    `DESCRIPTION:${icsText(`Interview in 2 hours: ${i.role}. Do the warm-up round and breathe.`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
