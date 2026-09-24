import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 pt-8">
      <span className="sticker sticker-tomato">Wrong stage</span>
      <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">This page doesn&apos;t exist</h1>
      <p className="max-w-[52ch] text-muted">The link may be old or mistyped. Your practice sessions are safe.</p>
      <Link href="/" className="btn btn-go">
        Go to practice
      </Link>
    </div>
  );
}
