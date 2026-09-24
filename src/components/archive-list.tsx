"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { CaretRightIcon, MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import { deleteSessions, useStore } from "@/lib/store";
import { formatDate, sessionScore } from "@/lib/session";
import { Score } from "./score";

export function ArchiveList() {
  const { hydrated, sessions } = useStore();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const searchId = useId();
  const roleId = useId();

  const roles = useMemo(() => [...new Set(sessions.map((s) => s.role))].sort(), [sessions]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (role !== "all" && s.role !== role) return false;
      if (!q) return true;
      return (
        s.role.toLowerCase().includes(q) ||
        s.questions.some(
          (sq) => sq.question.text.toLowerCase().includes(q) || sq.takes.some((t) => t.transcript.toLowerCase().includes(q)),
        )
      );
    });
  }, [sessions, query, role]);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading sessions">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton h-20 w-full rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="panel flex flex-col items-start gap-3 p-6">
        <h2 className="text-title font-semibold">No sessions yet</h2>
        <p className="max-w-[52ch] text-muted">
          Every round you finish lands here with your answers, scores, and notes, so you can see how you&apos;re improving.
        </p>
        <Link href="/" className="btn btn-go">
          Start your first round
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search questions and answers
          </label>
          <MagnifyingGlassIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions and answers"
            className="field pl-10"
          />
        </div>
        {roles.length > 1 && (
          <div>
            <label htmlFor={roleId} className="sr-only">
              Filter by job
            </label>
            <select id={roleId} value={role} onChange={(e) => setRole(e.target.value)} className="field sm:w-56">
              <option value="all">All jobs</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {confirmAll ? (
        <div role="alert" className="flex flex-col gap-3 rounded-control border border-down/40 p-4">
          <p className="font-medium">
            {filtered.length === sessions.length
              ? `Delete all ${sessions.length} sessions?`
              : `Delete the ${filtered.length} ${filtered.length === 1 ? "session" : "sessions"} shown?`}{" "}
            Your XP, streak, stickers and saved answers in Remember stay.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn bg-down text-white hover:opacity-90"
              onClick={() => {
                deleteSessions(filtered.map((x) => x.id));
                setConfirmAll(false);
              }}
            >
              Delete sessions
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmAll(false)}>
              Keep them
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-quiet -ml-2 w-fit min-h-10 text-label" onClick={() => setConfirmAll(true)} disabled={filtered.length === 0}>
          <TrashIcon size={16} aria-hidden />
          {filtered.length === sessions.length ? "Clear all sessions" : "Clear the sessions shown"}
        </button>
      )}

      {filtered.length === 0 ? (
        <p className="py-6 text-muted">
          Nothing matches. Try a different word or{" "}
          <button
            type="button"
            className="font-medium text-ink underline"
            onClick={() => {
              setQuery("");
              setRole("all");
            }}
          >
            clear the filters
          </button>
          .
        </p>
      ) : (
        <ul className="panel overflow-hidden">
          {filtered.map((s) => {
            const score = sessionScore(s);
            const answered = s.questions.filter((q) => q.takes.length > 0).length;
            const takes = s.questions.reduce((a, q) => a + q.takes.length, 0);
            const href = s.completedAt ? `/archive/${s.id}` : `/practice/${s.id}`;
            return (
              <li key={s.id} className="flex items-stretch border-b border-line last:border-b-0">
                {confirmId === s.id ? (
                  <div role="alert" className="flex flex-1 flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
                    <span className="mr-auto font-medium">Delete this {s.role} session?</span>
                    <button
                      type="button"
                      className="btn min-h-10 bg-down text-label text-white hover:opacity-90"
                      onClick={() => {
                        deleteSessions([s.id]);
                        setConfirmId(null);
                      }}
                    >
                      Delete
                    </button>
                    <button type="button" className="btn btn-ghost min-h-10 text-label" onClick={() => setConfirmId(null)}>
                      Keep
                    </button>
                  </div>
                ) : (
                  <>
                <Link href={href} className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-5 pr-2 transition-colors hover:bg-surface-2 focus-visible:outline-offset-[-3px] sm:pl-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{s.role}</span>
                    <span className="text-label text-muted">
                      {formatDate(s.createdAt)} · {answered}/{s.questions.length} answered · {takes} {takes === 1 ? "take" : "takes"}
                      {!s.completedAt && " · In progress"}
                    </span>
                  </div>
                  {score !== null ? <Score value={score} className="text-title-lg font-semibold" /> : <span className="text-title-lg font-semibold">--</span>}
                  <CaretRightIcon size={16} className="text-muted" aria-hidden />
                </Link>
                <button
                  type="button"
                  aria-label={`Delete the ${s.role} session from ${formatDate(s.createdAt)}`}
                  onClick={() => setConfirmId(s.id)}
                  className="flex w-12 shrink-0 items-center justify-center text-muted transition-colors hover:bg-surface-2 hover:text-down focus-visible:outline-offset-[-3px] sm:w-14"
                >
                  <TrashIcon size={18} aria-hidden />
                </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
