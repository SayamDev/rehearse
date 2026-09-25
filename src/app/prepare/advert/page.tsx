import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { LikelyQuestions } from "@/components/likely-questions";

export const metadata: Metadata = {
  title: "Likely questions",
  description: "Paste a job advert and see the interview questions it's most likely to lead to, then practise them.",
};

export default function AdvertPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/prepare" className="flex w-fit items-center gap-1.5 text-label font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon size={14} weight="bold" aria-hidden /> Get ready
        </Link>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">Likely questions</h1>
        <p className="max-w-[58ch] text-muted">
          A job advert gives away a lot of the interview. Paste it in to see the questions you&apos;re most likely to get, and the
          words in the advert that point to each one.
        </p>
      </div>
      <LikelyQuestions />
    </div>
  );
}
