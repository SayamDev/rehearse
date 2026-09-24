import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="flex max-w-[65ch] flex-col gap-6 leading-relaxed">
      <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Privacy, in plain words</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-title font-semibold">What we keep</h2>
        <p className="text-muted">
          Your sessions, answers, scores, XP, and streak are saved in your own browser (local storage). We don&apos;t have an
          account for you and we don&apos;t keep a copy on our servers.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-title font-semibold">What we send</h2>
        <p className="text-muted">
          To write questions and score answers, we send the job title, level, any job description you paste, and the text of
          your answer to Groq, an AI provider. We use Groq with data retention turned off, so it does not keep what you
          send. When AI notes aren&apos;t available, your answer is scored by built-in rules in this app and isn&apos;t sent
          anywhere else.
        </p>
        <p className="text-muted">
          Voice answers are turned into text by your browser&apos;s built-in speech recognition. In Chrome and Edge that
          service is run by Google or Microsoft, so your voice goes to them for transcription. We never upload or store
          audio. If you turn on &ldquo;Keep recordings&rdquo; in Me, your spoken answers are saved only in this browser
          so you can replay your best ones, and you can delete them any time. The camera check shows your camera only on
          your screen: it is never recorded or sent. In Live Interview, each spoken answer is also sent to Groq (with data
          retention turned off) so the transcript is accurate, and it is not stored. If you&apos;d rather not use it, type your answers: they&apos;re scored the same way.
        </p>
        <p className="text-muted">
          Interviewer voices: the Kokoro voice model downloads once from Hugging Face (on Wi-Fi, or when you ask in Me)
          and then runs on your device, so nothing is sent at all. Until it&apos;s ready, questions (never your answers)
          may be sent to Groq to create a natural voice. You can switch to the standard voice in Me.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-title font-semibold">What we never do</h2>
        <p className="text-muted">We don&apos;t sell data, show ads, or share your answers with employers.</p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-title font-semibold">Deleting your data</h2>
        <p className="text-muted">
          Go to Me and choose &ldquo;Delete all my practice data&rdquo;, or clear this site&apos;s data in your browser.
        </p>
      </section>
      <p className="text-label text-muted">
        Scores and notes are AI coaching to help you practice. They are not a prediction of whether you&apos;ll get a job.
      </p>
    </article>
  );
}
