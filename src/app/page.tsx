import { RoleForm } from "@/components/role-form";
import { RecentPractice } from "@/components/recent-practice";
import { DeltaSticker } from "@/components/delta-sticker";
import { LandingStickers } from "@/components/landing-stickers";
import { HowItWorks } from "@/components/how-it-works";
import { GetReadyStrip } from "@/components/get-ready-strip";
import { DailyCard } from "@/components/daily-challenge";
import { Score } from "@/components/score";
import { ScoreSticker } from "@/components/score-sticker";

export default function Home() {
  return (
    <div data-wide className="flex flex-col gap-14">
      <div className="grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
        <section aria-labelledby="start" className="flex flex-col gap-5 md:gap-6 md:pt-8">
          <div className="relative w-fit pr-4 pt-7 sm:pt-6">
            <h1 id="start" className="max-w-[16ch] text-display font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-display-lg">
              What job are you practicing for?
            </h1>
            <span className="sticker sticker-lime absolute right-2 top-0 rotate-6 sm:-right-8 sm:-top-1" aria-hidden>
              Free, no signup
            </span>
          </div>
          <RoleForm />
          <p className="max-w-[52ch] text-body leading-relaxed text-muted sm:text-body-lg">
            Answer three real interview questions by voice or typing. Each answer gets a score and one clear fix. Then take it
            again and watch the score move. It&apos;s free and you don&apos;t need an account.
          </p>
        </section>

        <section aria-labelledby="sample" className="flex flex-col gap-3 lg:gap-4 lg:pt-8">
          <h2 id="sample" className="text-title font-bold tracking-[-0.01em]">
            What your notes look like
          </h2>
          <SampleNotes />
        </section>
      </div>

      <div className="grid gap-6 lg:items-start lg:[&:has(>:nth-child(2))]:grid-cols-2">
        <DailyCard />
        <RecentPractice />
      </div>

      <GetReadyStrip />

      <HowItWorks />

      <LandingStickers />
    </div>
  );
}

function SampleNotes() {
  return (
    <figure className="panel relative overflow-hidden p-4 sm:p-6" aria-label="Sample feedback for a practice answer">
      <span className="absolute right-4 top-4 rounded-full border border-line px-2 py-0.5 text-tape text-muted">Sample</span>
      <p className="pr-16 text-body-sm text-muted">
        Retail sales associate · Tell me about a time you dealt with a difficult customer.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3 pt-4 sm:mt-5">
        <div className="flex flex-col gap-1">
          <span className="text-tape font-medium text-muted">Take 1</span>
          <Score value={5.8} className="text-score-sm font-semibold text-muted line-through decoration-1" />
        </div>
        <ScoreSticker value={7.6} tab="Take 2" />
        <DeltaSticker delta={1.8} className="mb-2" />
      </div>

      <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <dt className="text-label font-semibold">What worked</dt>
          <dd className="mt-1 text-body-sm leading-relaxed text-muted">
            <q className="text-ink">I called the supplier and got her a delivery date that afternoon.</q> You named a
            specific action you took yourself.
          </dd>
        </div>
        <div>
          <dt className="text-label font-semibold">Next take</dt>
          <dd className="mt-1 text-body-sm leading-relaxed text-muted">
            Finish with the result: say what changed, like whether she came back.
          </dd>
        </div>
      </dl>
    </figure>
  );
}
