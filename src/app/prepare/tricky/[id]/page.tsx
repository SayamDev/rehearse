import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowSquareOutIcon, CheckIcon, ScalesIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { TRICKY, trickyById } from "@/lib/tricky";
import { PractiseButton } from "@/components/practise-button";

export function generateStaticParams() {
  return TRICKY.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/prepare/tricky/[id]">): Promise<Metadata> {
  const t = trickyById((await params).id);
  return t ? { title: t.title, description: t.theyWant } : {};
}

export default async function TrickyTopicPage({ params }: PageProps<"/prepare/tricky/[id]">) {
  const t = trickyById((await params).id);
  if (!t) notFound();

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/prepare/tricky" className="flex w-fit items-center gap-1.5 text-label font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon size={14} weight="bold" aria-hidden /> Tricky topics
        </Link>
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">{t.title}</h1>
        <p className="text-body-lg text-muted">{t.worry}</p>
      </div>

      <section aria-labelledby="want" className="flex flex-col gap-2">
        <h2 id="want" className="text-title font-bold">
          What they really want to know
        </h2>
        <p className="max-w-[60ch] leading-relaxed">{t.theyWant}</p>
      </section>

      {t.rights && (
        <section aria-labelledby="rights" className="flex flex-col gap-3 rounded-[var(--radius-panel)] border-2 border-sky bg-surface p-5">
          <h2 id="rights" className="flex items-center gap-2 text-title font-bold">
            <ScalesIcon size={20} weight="bold" className="text-sky" aria-hidden /> Your rights (UK)
          </h2>
          <ul className="flex flex-col gap-2 text-body-sm leading-relaxed">
            {t.rights.map((r) => (
              <li key={r} className="max-w-[62ch]">
                {r}
              </li>
            ))}
          </ul>
          <p className="text-label text-muted">A starting point, not legal advice.</p>
        </section>
      )}

      <section aria-labelledby="shape" className="flex flex-col gap-3">
        <h2 id="shape" className="text-title font-bold">
          How to say it
        </h2>
        <ol className="flex flex-col gap-3">
          {t.shape.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-sun text-label font-bold text-on-ink" aria-hidden>
                {i + 1}
              </span>
              <span className="max-w-[60ch] leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="example" className="panel flex flex-col gap-2 p-5">
        <h2 id="example" className="text-label font-semibold text-muted">
          For example
        </h2>
        <p className="max-w-[62ch] text-body-lg leading-relaxed">{t.example}</p>
        <p className="text-label text-muted">Use your own words and your own story. This is only a shape to follow.</p>
      </section>

      <section aria-labelledby="avoid" className="flex flex-col gap-2">
        <h2 id="avoid" className="text-title font-bold">
          Try to avoid
        </h2>
        <ul className="flex flex-col gap-1.5">
          {t.avoid.map((a) => (
            <li key={a} className="flex items-start gap-2 text-body-sm">
              <XIcon size={16} weight="bold" className="mt-0.5 shrink-0 text-down" aria-hidden />
              {a}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="practise" className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 id="practise" className="text-title font-bold">
          Practise it
        </h2>
        <p className="flex max-w-[60ch] items-start gap-2 text-body-sm text-muted">
          <CheckIcon size={16} weight="bold" className="mt-0.5 shrink-0 text-up" aria-hidden />
          Sam will ask: &ldquo;{t.practice.text}&rdquo;
        </p>
        <PractiseButton items={[t.practice]} label="Practise this question" variant="go" />
      </section>

      {t.support && (
        <section aria-labelledby="support" className="flex flex-col gap-2">
          <h2 id="support" className="text-title font-bold">
            Free help
          </h2>
          <ul className="flex flex-col gap-1.5">
            {t.support.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1.5 font-semibold underline underline-offset-4">
                  {s.label} <ArrowSquareOutIcon size={14} weight="bold" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
