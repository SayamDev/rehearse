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
        <h2 className="text-title font-semibold">Where your progress lives</h2>
        <p className="text-muted">
          Because there are no accounts, your progress is only in the browser you practise in. That means it can be lost if you
          clear your browser data, practise in a private or incognito window, or switch to another phone, computer or browser.
          Safari (on iPhone, iPad and Mac) can also clear it after about a week without a visit; adding Rehearse to your Home
          Screen stops that. We also ask your browser to keep this site&apos;s data, which most browsers then do.
        </p>
        <p className="text-muted">
          To keep it safe, use &ldquo;Back up my progress&rdquo; in Me. It saves one small file to your device, and nothing is
          sent to us. Load it in Me on any device to carry on. The file holds your answers, so keep it private.
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
          service is run by Google or Microsoft, so your voice goes to them for transcription. To get your words right
          whatever your accent, the recording of each spoken answer is also sent to Groq (with data retention turned off) to
          check the words, and it isn&apos;t stored. On phones this is how spoken answers become text. You can turn it off
          with &ldquo;More accurate transcripts&rdquo; in Me. We never keep audio on our side. If you turn on &ldquo;Keep recordings&rdquo; in Me, your spoken answers are saved only in this browser
          so you can replay your best ones, and you can delete them any time. The camera check shows your camera only on
          your screen: it is never recorded or sent. In Live Interview, each spoken answer is also sent to Groq (with data
          retention turned off) so the transcript is accurate, and it is not stored. If you&apos;d rather not use it, type your answers: they&apos;re scored the same way.
        </p>
        <p className="text-muted">
          Interviewer voices: the Kokoro voice model downloads once from Hugging Face (on Wi-Fi, or when you ask in Me)
          and then runs on your device, so nothing is sent at all. Until it&apos;s ready, questions (never your answers)
          may be sent to Groq to create a natural voice. You can switch to the standard voice in Me.
        </p>
        <p className="text-muted">
          CVs and job adverts: if you upload a CV file, it is read on your device and the file itself is never sent. Only the
          text, with emails, phone numbers, postcodes and links removed, goes to Groq (with data retention turned off) to
          find your stories and questions. It is not stored.
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
