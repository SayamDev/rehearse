"use client";

import { useId, useState } from "react";
import { CheckIcon, PencilSimpleIcon, PlusIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { MAX_STORIES, STORY_TYPES, coverage, storyFromAnswer, storyTypeLabel, suggestTypes, type Story } from "@/lib/kit";
import { OPENER } from "@/lib/prepare";
import { deleteStory, saveStory, useStore } from "@/lib/store";
import type { Competency } from "@/lib/types";

/**
 * Story bank: a handful of real stories, each tagged with the kinds of question it answers.
 * The map at the top shows which kinds still have no story, so people know what to prepare.
 */
export function StoryBank() {
  const { hydrated, profile, bank } = useStore();
  const [editing, setEditing] = useState<Story | "new" | null>(null);

  if (!hydrated) return <div className="skeleton h-64 w-full rounded-[var(--radius-panel)]" aria-hidden />;

  const stories = profile.stories ?? [];
  const map = coverage(stories);
  const full = stories.length >= MAX_STORIES;
  // Saved answers that could become stories (the intro isn't a story).
  const fromAnswers = bank.filter((a) => a.question.id !== OPENER.id && a.keyPoints.length > 0).slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Story bank</h1>
        <p className="max-w-[60ch] text-muted">
          Most interview questions can be answered with 5 or 6 good stories. Save each one once, with a short name, and remember
          a few stories instead of 30 answers.
        </p>
      </header>

      <section aria-labelledby="covered" className="flex flex-col gap-3">
        <h2 id="covered" className="text-title font-bold tracking-[-0.01em]">
          Which story for which question
        </h2>
        <ul className="panel flex flex-col divide-y divide-line">
          {map.map(({ type, stories: fits }) => (
            <li key={type.id} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
              <span className="flex flex-col">
                <span className="font-semibold">{type.label}</span>
                <span className="text-label text-muted">&ldquo;{type.asks}&rdquo;</span>
              </span>
              {fits.length ? (
                <span className="flex flex-wrap gap-1.5 sm:justify-end">
                  {fits.map((s) => (
                    <span key={s.id} className="sticker sticker-lime text-label">
                      {s.title}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-label text-muted">
                  <WarningCircleIcon size={16} weight="bold" aria-hidden /> No story yet
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="yours" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="yours" className="text-title font-bold tracking-[-0.01em]">
            Your stories <span className="tnum text-muted">{stories.length ? `(${stories.length})` : ""}</span>
          </h2>
          {editing === null && !full && (
            <button type="button" className="btn btn-go" onClick={() => setEditing("new")}>
              <PlusIcon size={18} weight="bold" aria-hidden /> Add a story
            </button>
          )}
        </div>

        {editing === "new" && <StoryForm onDone={() => setEditing(null)} />}

        {stories.length === 0 && editing === null && (
          <p className="text-body-sm text-muted">
            No stories yet. Think of times you were busy, helped someone, fixed something, got something wrong, or were proud of
            yourself. Work, school, volunteering and home all count.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {stories.map((s) =>
            editing !== "new" && editing?.id === s.id ? (
              <li key={s.id}>
                <StoryForm story={s} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={s.id} className="panel flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-title font-bold">{s.title}</h3>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => setEditing(s)} aria-label={`Edit ${s.title}`}>
                      <PencilSimpleIcon size={18} weight="bold" aria-hidden />
                    </button>
                    <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => deleteStory(s.id)} aria-label={`Delete ${s.title}`}>
                      <TrashIcon size={18} weight="bold" aria-hidden />
                    </button>
                  </div>
                </div>
                <p className="max-w-[62ch] whitespace-pre-line text-body-sm leading-relaxed text-muted">{s.summary}</p>
                <p className="flex flex-wrap gap-1.5">
                  <span className="sr-only">Answers questions about: </span>
                  {s.types.map((t) => (
                    <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-label font-medium">
                      {storyTypeLabel(t)}
                    </span>
                  ))}
                </p>
              </li>
            ),
          )}
        </ul>
        {full && <p className="text-label text-muted">That&apos;s {MAX_STORIES} stories, plenty for any interview. Edit one to change it.</p>}
      </section>

      {fromAnswers.length > 0 && !full && (
        <section aria-labelledby="from-answers" className="flex flex-col gap-3">
          <div>
            <h2 id="from-answers" className="text-title font-bold tracking-[-0.01em]">
              From your saved answers
            </h2>
            <p className="text-body-sm text-muted">Turn an answer you already know into a story, then edit it.</p>
          </div>
          <ul className="panel flex flex-col divide-y divide-line">
            {fromAnswers.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span className="text-body-sm font-medium leading-snug">{a.question.text}</span>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 shrink-0 text-label"
                  onClick={() => {
                    const story = storyFromAnswer(a);
                    saveStory(story);
                    setEditing(story);
                  }}
                >
                  <PlusIcon size={16} weight="bold" aria-hidden /> Make a story
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StoryForm({ story, onDone }: { story?: Story; onDone: () => void }) {
  const [title, setTitle] = useState(story?.title ?? "");
  const [summary, setSummary] = useState(story?.summary ?? "");
  const [types, setTypes] = useState<Competency[]>(story?.types ?? []);
  // Suggest question types from the words until the user picks their own.
  const [picked, setPicked] = useState(Boolean(story));
  const [error, setError] = useState("");
  const ids = { title: useId(), summary: useId() };

  function changeSummary(v: string) {
    setSummary(v);
    if (!picked) setTypes(suggestTypes(v));
  }

  function toggle(t: Competency) {
    setPicked(true);
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return setError("Give it a short name, like “Busy Saturday”.");
    if (summary.trim().length < 10) return setError("Add a line about what happened and what you did.");
    if (!types.length) return setError("Pick at least one kind of question it answers.");
    saveStory({ id: story?.id ?? crypto.randomUUID(), title: title.trim().slice(0, 40), summary: summary.trim().slice(0, 400), types, createdAt: story?.createdAt ?? new Date().toISOString() });
    onDone();
  }

  return (
    <form onSubmit={save} className="panel flex flex-col gap-5 border-2 border-ink p-4 sm:p-5" aria-label={story ? `Edit ${story.title}` : "New story"}>
      <div className="flex flex-col gap-2">
        <label htmlFor={ids.title} className="text-label font-medium">
          Short name
        </label>
        <input id={ids.title} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="Busy Saturday" className="field max-w-sm" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={ids.summary} className="text-label font-medium">
          What happened, what you did, how it ended
        </label>
        <textarea
          id={ids.summary}
          value={summary}
          onChange={(e) => changeSummary(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Queue out the door and two people off sick. I trained the new starters on the till. Queue time halved."
          className="field resize-y text-body-sm leading-relaxed"
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">
          Questions it answers {!picked && types.length > 0 && <span className="font-normal text-muted">(suggested, tap to change)</span>}
        </legend>
        <div className="flex flex-wrap gap-2">
          {STORY_TYPES.map((t) => {
            const on = types.includes(t.id);
            return (
              <label
                key={t.id}
                className={`flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border-2 px-3 text-label font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${
                  on ? "border-ink bg-ink text-floor" : "border-line text-muted hover:text-ink"
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(t.id)} className="sr-only" />
                {on && <CheckIcon size={14} weight="bold" aria-hidden />}
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary">
          Save story
        </button>
        <button type="button" className="btn btn-quiet" onClick={onDone}>
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="text-label text-down">
          {error}
        </p>
      )}
    </form>
  );
}
