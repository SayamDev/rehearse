import { PERSONAS } from "@/lib/game";
import type { Session } from "@/lib/types";

/** The full Live Interview conversation, saved with the session. */
export function ConversationLog({ session }: { session: Session }) {
  if (!session.conversation?.length) return null;
  const name = PERSONAS[session.persona ?? "friendly"].name;
  return (
    <details className="panel group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-bold sm:p-6 [&::-webkit-details-marker]:hidden">
        Full interview transcript
        <span className="text-label font-medium text-muted group-open:hidden">Show</span>
        <span className="hidden text-label font-medium text-muted group-open:inline">Hide</span>
      </summary>
      <ol className="flex flex-col gap-4 border-t border-line p-5 sm:p-6">
        {session.conversation.map((l, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <span className={`text-label font-semibold ${l.who === "you" ? "text-ink" : "text-muted"}`}>
              {l.who === "you" ? "You" : name}
            </span>
            <p className={`max-w-[62ch] leading-relaxed ${l.who === "you" ? "" : "text-muted"}`}>{l.text}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
