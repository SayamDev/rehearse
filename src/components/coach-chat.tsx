"use client";

import { StickerLoader } from "./sticker-loader";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon, ArrowCounterClockwiseIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import { PersonaAvatar } from "./persona-avatar";
import { countCoachChat, getSettings, useStore } from "@/lib/store";
import { daysUntil } from "@/lib/countdown";
import { roundsThisWeek, weeklyGoal } from "@/lib/goal";
import { skillAverages, weakestSkill } from "@/lib/skills";
import { useT } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string; source?: "ai" | "rules" };

const STARTERS = [
  "How do I answer 'tell me about yourself'?",
  "What should I say for my weakness?",
  "I have no work experience. What do I talk about?",
  "How do I stop feeling nervous?",
  "How do I explain a gap in my CV?",
  "What questions should I ask at the end?",
];

/** When Cobi mentions a tool in the app, a button to open it appears under the reply. */
const TOOLS = [
  { match: /calm corner/i, label: "Calm corner", href: "/calm" },
  { match: /answer builder/i, label: "Answer builder", href: "/prepare/answer" },
  { match: /tricky topics/i, label: "Tricky topics", href: "/prepare/tricky" },
  { match: /cv helper/i, label: "CV helper", href: "/prepare/cv" },
  { match: /question packs?/i, label: "Question packs", href: "/prepare/packs" },
  { match: /pay talk/i, label: "Pay Talk", href: "/prepare/offer" },
  { match: /mock interview/i, label: "Mock interview", href: "/practice/new?mode=mock" },
  { match: /live interview/i, label: "Live Interview", href: "/practice/new?mode=live" },
  { match: /phone interview/i, label: "Phone Interview", href: "/practice/new?mode=phone" },
  { match: /video interview/i, label: "Video Interview", href: "/practice/new?mode=video" },
  { match: /interview-day mode|interview day mode/i, label: "Interview-day mode", href: "/prepare/today" },
  { match: /\bremember\b.*(app|tab|section)|in remember\b/i, label: "Remember", href: "/remember" },
  { match: /tell me about yourself.{0,20}builder|intro builder/i, label: "Intro builder", href: "/prepare/intro" },
];

const SAVE_KEY = "rehearse:cobi";
const GREETING: Msg = {
  role: "assistant",
  content: "Hi, I'm Cobi, your interview coach. Ask me anything about interviews, or paste an answer and I'll help you make it stronger.",
};

function loadChat(): Msg[] | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    const msgs = raw ? (JSON.parse(raw) as Msg[]) : null;
    return Array.isArray(msgs) && msgs.length ? msgs : null;
  } catch {
    return null;
  }
}

/**
 * Chat with the interview coach. The conversation is kept on this device only, so it's
 * still there next time; "New chat" clears it.
 */
export function CoachChat() {
  const { hydrated, sessions, profile } = useStore();
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const t = useT();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const counted = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  // Pick up the last conversation (it never leaves this device).
  useEffect(() => {
    const saved = loadChat();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setMessages(saved);
  }, []);

  useEffect(() => {
    try {
      if (messages.length > 1) window.localStorage.setItem(SAVE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Storage blocked: the chat lasts for this visit only.
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, busy]);

  // A few facts about their practice, so Cobi's advice fits them. No answers or personal details.
  const weakest = hydrated ? weakestSkill(skillAverages(sessions)) : null;
  const interviewInDays = profile.interview ? daysUntil(profile.interview.when) : undefined;
  const context = hydrated
    ? {
        role: profile.interview?.role ?? sessions[0]?.role,
        focus: weakest?.label,
        interviewInDays: interviewInDays !== undefined && interviewInDays >= 0 ? interviewInDays : undefined,
        roundsThisWeek: roundsThisWeek(sessions),
        weeklyGoal: weeklyGoal(profile),
      }
    : undefined;

  const starters = [
    ...(interviewInDays !== undefined && interviewInDays >= 0
      ? [`My interview is ${interviewInDays === 0 ? "today" : interviewInDays === 1 ? "tomorrow" : `in ${interviewInDays} days`}. What should I do?`]
      : []),
    ...(weakest ? [`How do I get better at ${weakest.label.toLowerCase()}?`] : []),
    ...STARTERS,
  ].slice(0, 6);

  function newChat() {
    setMessages([GREETING]);
    setError("");
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      // Nothing saved.
    }
  }

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
          context,
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
            Ask for tips here. To practise answering out loud,{" "}
            <Link href="/practice/new?mode=mock" className="font-semibold text-ink underline">
              start a mock interview
            </Link>
            . Your chat stays on this device.
          </p>
        </div>
      </header>
      {messages.length > 1 && (
        <button type="button" className="btn btn-quiet -mt-2 w-fit min-h-9 text-label" onClick={newChat} disabled={busy}>
          <ArrowCounterClockwiseIcon size={16} weight="bold" aria-hidden /> {t("coach.new")}
        </button>
      )}

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
              {m.role === "assistant" ? plain(m.content) : m.content}
              {m.role === "assistant" && i > 0 && <ToolLinks text={m.content} />}
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
          {starters.map((s) => (
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
          placeholder={t("coach.ask")}
          className="field max-h-40 min-h-12 resize-none leading-relaxed"
        />
        <button type="submit" className="btn btn-go h-12 shrink-0 px-4" disabled={busy || !input.trim()} aria-label="Send">
          <PaperPlaneRightIcon size={20} weight="fill" aria-hidden />
        </button>
      </form>
    </div>
  );
}

/** Models sometimes answer in Markdown; the chat shows plain text, so drop the symbols. */
function plain(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\s)\*(\S.*?)\*(?=\s|$)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*]\s+/gm, "- ");
}

function ToolLinks({ text }: { text: string }) {
  const found = TOOLS.filter((t) => t.match.test(text)).slice(0, 3);
  if (!found.length) return null;
  return (
    <span className="mt-3 flex flex-wrap gap-2">
      {found.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-line px-3 text-label font-semibold transition-colors hover:border-ink"
        >
          {t.label} <ArrowRightIcon size={14} weight="bold" aria-hidden />
        </Link>
      ))}
    </span>
  );
}
