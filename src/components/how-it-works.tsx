import Link from "next/link";
import { MicrophoneIcon } from "@phosphor-icons/react/dist/ssr";
import { PersonaAvatar } from "./persona-avatar";
import { ScoreSticker } from "./score-sticker";

/** Explains the mock interview in three pictures, so it's clear before starting. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how" className="flex flex-col gap-5">
      <h2 id="how" className="text-headline font-extrabold tracking-[-0.02em]">
        How practice works
      </h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        <li className="panel flex flex-col items-start gap-3 p-5">
          <PersonaAvatar id="friendly" size={72} />
          <h3 className="text-title font-bold">Sam asks you a question</h3>
          <p className="text-body-sm text-muted">Your interviewer reads each question out loud, just like a real interview.</p>
        </li>
        <li className="panel flex flex-col items-start gap-3 p-5">
          <span className="flex size-[72px] -rotate-3 items-center justify-center rounded-full border-4 border-[var(--die)] bg-tomato text-on-ink shadow-[var(--sticker-shadow)]">
            <MicrophoneIcon size={30} weight="fill" aria-hidden />
          </span>
          <h3 className="text-title font-bold">You answer out loud</h3>
          <p className="text-body-sm text-muted">Tap the mic and speak. Prefer typing? That works too, and it&apos;s scored the same.</p>
        </li>
        <li className="panel flex flex-col items-start gap-3 p-5 pt-7">
          <ScoreSticker value={7.4} tab="Notes" />
          <h3 className="text-title font-bold">Get notes, then try again</h3>
          <p className="text-body-sm text-muted">See your score and one clear fix. Take it again and watch your score go up.</p>
        </li>
      </ol>
      <p className="text-body-sm text-muted">
        Want tips instead? <Link href="/coach" className="font-semibold text-ink underline">Cobi</Link>, your interview coach, is a chat where you can ask anything about interviews.
      </p>
    </section>
  );
}
