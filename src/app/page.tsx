import { RoleForm } from "@/components/role-form";
import { RecentPractice } from "@/components/recent-practice";
import { LandingStickers } from "@/components/landing-stickers";
import { HowItWorks } from "@/components/how-it-works";
import { GetReadyStrip } from "@/components/get-ready-strip";
import { DailyCard } from "@/components/daily-challenge";
import { SampleNotes } from "@/components/sample-notes";
import { HeroMic } from "@/components/hero-mic";
import { Reveal } from "@/components/reveal";
import { UiText } from "@/components/ui-text";

export default function Home() {
  return (
    <div data-wide className="flex flex-col gap-14">
      <div className="grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
        <section aria-labelledby="start" className="flex flex-col gap-5 md:gap-6 md:pt-8">
          <HeroMic className="-mb-4 -ml-2 w-32 sm:w-40" />
          <div className="relative w-fit pr-4 pt-7 sm:pt-6">
            <h1 id="start" className="max-w-[16ch] text-display font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-display-lg">
              <UiText k="home.title" />
            </h1>
            <span className="sticker sticker-lime absolute right-2 top-0 rotate-6 sm:-right-8 sm:-top-1" aria-hidden>
              <UiText k="home.free" />
            </span>
          </div>
          <RoleForm />
          <p className="max-w-[52ch] text-body leading-relaxed text-muted sm:text-body-lg">
            <UiText k="home.blurb" />
          </p>
        </section>

        <section aria-labelledby="sample" className="flex flex-col gap-3 lg:gap-4 lg:pt-8">
          <h2 id="sample" className="text-title font-bold tracking-[-0.01em]">
            <UiText k="home.notes" />
          </h2>
          <SampleNotes />
        </section>
      </div>

      <Reveal className="grid gap-6 lg:items-start lg:[&:has(>:nth-child(2))]:grid-cols-2">
        <DailyCard />
        <RecentPractice />
      </Reveal>

      <Reveal>
        <GetReadyStrip />
      </Reveal>

      <HowItWorks />

      <LandingStickers />
    </div>
  );
}
