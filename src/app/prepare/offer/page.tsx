import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { OFFER_TIPS } from "@/lib/offer";
import { OfferPractice } from "@/components/offer-practice";

export const metadata: Metadata = {
  title: "Pay Talk",
  description: "Practise asking for more when you get a job offer, with Mr. Grant.",
};

export default function OfferPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/prepare" className="flex w-fit items-center gap-1.5 text-label font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon size={14} weight="bold" aria-hidden /> Get ready
        </Link>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Pay Talk</h1>
        <p className="max-w-[58ch] text-muted">
          You got the offer, but the pay is lower than you hoped. Practise asking for more, politely, before it happens for
          real. Mr. Grant plays the employer.
        </p>
      </div>

      <OfferPractice />

      <section aria-labelledby="tips" className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 id="tips" className="text-title font-bold">
          Six things that help
        </h2>
        <ol className="flex flex-col gap-3">
          {OFFER_TIPS.map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-sun text-label font-bold text-on-ink" aria-hidden>
                {i + 1}
              </span>
              <span className="max-w-[60ch] leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
