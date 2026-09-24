import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { SessionView } from "@/components/session-view";

export const metadata: Metadata = { title: "Session" };

export default async function ArchiveSessionPage({ params }: PageProps<"/archive/[id]">) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <Link href="/archive" className="btn btn-quiet -ml-2 w-fit">
        <ArrowLeftIcon size={16} aria-hidden />
        All sessions
      </Link>
      <SessionView sessionId={id} heading="Session review" showTranscripts />
    </div>
  );
}
