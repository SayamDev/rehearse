"use client";

import { useId, useState } from "react";
import { PencilSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { cleanName, setName, useStore } from "@/lib/store";

/**
 * The Me page title: your name, so the page feels like yours. Tap the pencil to change it.
 * It stays on this device and isn't sent to the AI or shown on share cards.
 */
export function NameTitle({ fallback }: { fallback: string }) {
  const { profile } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const hintId = useId();
  const name = profile.name;

  function open() {
    setDraft(name ?? "");
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setName(draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-label font-medium">
          What should we call you?
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 24))}
            maxLength={24}
            autoComplete="given-name"
            autoFocus
            aria-describedby={hintId}
            placeholder="First name or nickname"
            className="field max-w-xs flex-1 text-title font-bold"
          />
          <button type="submit" className="btn btn-primary">
            Save
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
        <p id={hintId} className="text-label text-muted">
          Just a first name or nickname. It stays on this device and is never sent to the AI.
          {name && " Clear it to go back to “Me”."}
        </p>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="min-w-0 break-words text-headline font-bold leading-[1.1] tracking-[-0.03em]">{name || fallback}</h1>
      {name ? (
        <button type="button" className="btn btn-quiet size-11 p-0" onClick={open} aria-label="Change your name">
          <PencilSimpleIcon size={18} weight="bold" aria-hidden />
        </button>
      ) : (
        <button type="button" className="btn btn-ghost min-h-10 text-label" onClick={open}>
          <PlusIcon size={16} weight="bold" aria-hidden /> Add your name
        </button>
      )}
    </div>
  );
}

/** "Welcome back, Sayam." on the home page, once a name is set. */
export function WelcomeBack() {
  const { hydrated, profile } = useStore();
  const name = hydrated ? cleanName(profile.name ?? "") : "";
  if (!name) return null;
  return <p className="text-body font-semibold">Welcome back, {name}.</p>;
}
