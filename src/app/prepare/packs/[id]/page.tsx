import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { PACKS, packById } from "@/lib/packs";
import { PackPractice } from "@/components/pack-practice";
import { PACK_LOOK } from "../icons";

export function generateStaticParams() {
  return PACKS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/prepare/packs/[id]">): Promise<Metadata> {
  const pack = packById((await params).id);
  return pack ? { title: pack.name, description: pack.blurb } : {};
}

export default async function PackPage({ params }: PageProps<"/prepare/packs/[id]">) {
  const pack = packById((await params).id);
  if (!pack) notFound();
  const { icon: PackIcon, ink } = PACK_LOOK[pack.id];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/prepare/packs" className="flex w-fit items-center gap-1.5 text-label font-semibold text-muted hover:text-ink">
          <ArrowLeftIcon size={14} weight="bold" aria-hidden /> Question packs
        </Link>
        <div className="flex items-center gap-4">
          <span className={`sticker ${ink} size-14 shrink-0 -rotate-3 justify-center p-0`} aria-hidden>
            <PackIcon size={28} weight="bold" />
          </span>
          <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">{pack.name}</h1>
        </div>
        <p className="max-w-[58ch] text-muted">{pack.blurb}</p>
      </div>
      <PackPractice packId={pack.id} />
    </div>
  );
}
