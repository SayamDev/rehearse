import type { Metadata } from "next";
import { ArchiveList } from "@/components/archive-list";

export const metadata: Metadata = { title: "Archive" };

export default function ArchivePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-bold leading-[1.1] tracking-[-0.03em]">Your sessions</h1>
        <p className="text-muted">Saved in this browser. Open one to reread your answers and notes.</p>
      </div>
      <ArchiveList />
    </div>
  );
}
