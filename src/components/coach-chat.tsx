"use client";

import { StickerLoader } from "./sticker-loader";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { PaperPlaneRightIcon } from "@phosphor-icons/react";
import { PersonaAvatar } from "./persona-avatar";
import { countCoachChat, getSettings } from "@/lib/store";

type Msg = { role: "user" | "assistant"; content: string; source?: "ai" | "rules" };

const STARTERS = [
  "How do I answer 'tell me about yourself'?",
  "What should I say for my weakness?",
  "I have no work experience. What do I talk about?",
  "How do I stop feeling nervous?",
  "What questions should I ask at the end?",
];

/**
 * Chat with the interview coach. Messages stay in this tab only and are not saved.
 */
export function CoachChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hi, I'm Cobi, your interview coach. Ask me anything about interviews, or paste an answer and I'll help you make it stronger.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const counted = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    if (!counted.current) {
      counted.current = true;
      countCoachChat();
    }
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The greeting is UI only; send the real conversation, last 12 turns.
        body: JSON.stringify({
          messages: next.slice(1).slice(-12).map(({ role, content: c }) => ({ role, content: c })),
          language: getSettings().language,
        }),
      });
      const data = (await res.json()) as { reply?: string; source?: "ai" | "rules"; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? "Cobi couldn't answer. Try again.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply!, source: data.source }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-4">
        <PersonaAvatar id="coach" size={64} />
        <div>
          <h1 className="text-headline font-extrabold tracking-[-0.03em]">Cobi <span className="text-title-lg font-bold text-muted">your interview coach</span></h1>
          <p className="text-body-sm text-muted">
            Ask for tips here. To practise answering out loud, <Link href="/" className="font-semibold text-ink underline">start a mock interview</Link>. Your chat isn&apos;t saved.
          </p>
        </div>
      </header>

      <ol className="flex flex-col gap-3" aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) => (
          <li key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-[var(--radius-panel)] px-4 py-3 text-body leading-relaxed ${
                m.role === "user"
                  ? "rotate-[0.6deg] border-[3px] border-[var(--die)] bg-sky text-on-ink shadow-[var(--sticker-shadow)]"
                  : "panel"
              }`}
            >
              {m.source === "rules" && (
                <span className="sticker sticker-empty mb-2 flex w-fit">Quick guide</span>
              )}
              <span className="sr-only">{m.role === "user" ? "You: " : "Cobi: "}</span>
              {m.content}
            </div>
          </li>
        ))}
        {busy && (
          <li className="flex justify-start">
            <div className="panel px-4 py-3">
              <StickerLoader size="sm" label="Cobi is thinking..." />
            </div>
          </li>
        )}
      </ol>
      <div ref={endRef} />

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button key={s} type="button" className="btn btn-ghost min-h-10 text-label" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-label text-down">
          {error}
        </p>
      )}

      <form
        className="sticky bottom-[72px] z-20 -mx-4 flex items-end gap-2 border-t border-line bg-floor/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:px-0"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Message Cobi
        </label>
        <textarea
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          maxLength={1500}
          placeholder="Ask Cobi..."
          className="field max-h-40 min-h-12 resize-none leading-relaxed"
        />
        <button type="submit" className="btn btn-go h-12 shrink-0 px-4" disabled={busy || !input.trim()} aria-label="Send">
          <PaperPlaneRightIcon size={20} weight="fill" aria-hidden />
        </button>
      </form>
    </div>
  );
}
