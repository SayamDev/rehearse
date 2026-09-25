import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { CvHelper } from "@/components/cv-helper";

export const metadata: Metadata = {
  title: "CV helper",
  description: "Find the best stories in your CV and the interview questions they answer, then practise them.",
};

export default function CvPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/prepare" className="flex w-fit items-center gap-1.5 text-label font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon size={14} weight="bold" aria-hidden /> Get ready
        </Link>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em] sm:text-headline-lg">CV helper</h1>
        <p className="max-w-[58ch] text-muted">
          Your CV is full of interview answers. Upload or paste it to find your strongest stories and the questions they answer, then
          practise saying them.
        </p>
      </div>
      <CvHelper />
    </div>
  );
}
