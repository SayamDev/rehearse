"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ArrowRightIcon, CalendarPlusIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { localDay, setInterview, useStore } from "@/lib/store";
import { countdownLabel, daysUntil, interviewDate, interviewIcs, planFor } from "@/lib/countdown";
import { packForRole } from "@/lib/packs";
import { JobCombobox } from "./job-combobox";

/**
 * "My interview": the date of the real thing, a countdown, and what to do next.
 * Reminders come from the user's own calendar (a downloaded .ics file), so they
 * work without accounts, servers or notifications.
 */
export function InterviewCountdown() {
  const { hydrated, profile, sessions } = useStore();
  const interview = profile.interview;
  const [editing, setEditing] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Keeps "In 2 hours" fresh while the page is open.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!hydrated) return <div className="skeleton h-40 w-full rounded-[var(--radius-panel)]" aria-hidden />;

  if (!interview || editing) {
    return (
      <InterviewForm
        initial={interview ?? { role: sessions[0]?.role ?? "", when: "", where: "" }}
        onDone={() => setEditing(false)}
        onCancel={interview ? () => setEditing(false) : undefined}
      />
    );
  }

  const days = daysUntil(interview.when, now);
  const past = days < 0;
  const pack = packForRole(interview.role);
  const plan = planFor(days, pack ? `/prepare/packs/${pack.id}` : "/prepare/packs");
  const date = interviewDate(interview.when).toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  function addToCalendar() {
    const ics = interviewIcs(interview!, `${window.location.origin}/prepare`);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section aria-labelledby="my-interview" className="panel flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="my-interview" className="text-label font-semibold text-muted">
            Your interview
          </h2>
          <p className="font-display text-headline font-bold leading-none tracking-[-0.03em]" aria-live="polite">
            {past ? "How did it go?" : countdownLabel(interview.when, now)}
          </p>
          <p className="mt-1 text-body-sm text-muted">
            <span className="font-semibold text-ink">{interview.role}</span> · {date}
            {interview.where && ` · ${interview.where}`}
          </p>
        </div>
        <div className="flex gap-1">
          <button type="button" className="btn btn-quiet min-h-10" onClick={() => setEditing(true)} aria-label="Change interview details">
            <PencilSimpleIcon size={18} weight="bold" aria-hidden />
          </button>
          <button type="button" className="btn btn-quiet min-h-10" onClick={() => setInterview(null)} aria-label="Remove this interview">
            <XIcon size={18} weight="bold" aria-hidden />
          </button>
        </div>
      </div>

      {past ? (
        <div className="flex flex-col gap-3">
          <p className="max-w-[58ch] text-body-sm leading-relaxed text-muted">
            Well done for going. Whatever happens, every interview makes the next one easier. Tell Cobi what they asked, and
            practise the ones that felt hard.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/coach" className="btn btn-ghost">
              Talk it through with Cobi
            </Link>
            <button type="button" className="btn btn-quiet" onClick={() => setInterview(null)}>
              Clear it
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">{plan.title}</h3>
            <ol className="flex flex-col divide-y divide-line border-y border-line">
              {plan.steps.map((s, i) => (
                <li key={s.href}>
                  <Link href={s.href} className="group flex items-center gap-3 py-3">
                    <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-label font-bold" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-body-sm font-medium">{s.label}</span>
                    <ArrowRightIcon size={16} weight="bold" className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          {days <= 1 && (
            <Link href="/prepare/today" className="btn btn-primary w-fit">
              Open interview-day mode <ArrowRightIcon size={18} weight="bold" aria-hidden />
            </Link>
          )}
          <div className="flex flex-col gap-1.5">
            <button type="button" className="btn btn-ghost w-fit" onClick={addToCalendar}>
              <CalendarPlusIcon size={18} weight="bold" aria-hidden /> Add reminders to my calendar
            </button>
            <p className="text-label text-muted">Reminds you the day before and two hours before. Works with any calendar app.</p>
          </div>
        </>
      )}
    </section>
  );
}

function InterviewForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: { role: string; when: string; where: string };
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [role, setRole] = useState(initial.role);
  const [date, setDate] = useState(initial.when.split("T")[0] ?? "");
  const [time, setTime] = useState(initial.when.split("T")[1] ?? "10:00");
  const [where, setWhere] = useState(initial.where);
  const [error, setError] = useState("");
  const ids = { role: useId(), date: useId(), time: useId(), where: useId() };

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (role.trim().length < 2) return setError("Add the job title.");
    if (!date) return setError("Pick the date of your interview.");
    if (date < localDay()) return setError("That date has passed. Pick the day of your interview.");
    setInterview({ role: role.trim().slice(0, 80), when: `${date}T${time || "10:00"}`, where: where.trim().slice(0, 120) });
    onDone();
  }

  return (
    <form onSubmit={save} aria-labelledby="interview-form" className="panel flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="interview-form" className="text-title-lg font-bold tracking-[-0.02em]">
          Got an interview date?
        </h2>
        <p className="max-w-[56ch] text-body-sm text-muted">
          Add it for a countdown and a simple plan for each day until then. It stays on this device.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={ids.role} className="text-label font-medium">
          Job title
        </label>
        <JobCombobox id={ids.role} value={role} onChange={setRole} className="max-w-md" />
      </div>
      <div className="grid max-w-md grid-cols-[1.4fr_1fr] gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.date} className="text-label font-medium">
            Date
          </label>
          <input id={ids.date} type="date" value={date} min={localDay()} onChange={(e) => setDate(e.target.value)} className="field" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={ids.time} className="text-label font-medium">
            Time
          </label>
          <input id={ids.time} type="time" value={time} onChange={(e) => setTime(e.target.value)} className="field" />
        </div>
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <label htmlFor={ids.where} className="text-label font-medium">
          Where <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={ids.where}
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          maxLength={120}
          placeholder="Address, or video call"
          className="field"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary">
          Save my interview
        </button>
        {onCancel && (
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-label text-down">
          {error}
        </p>
      )}
    </form>
  );
}
