import type { Metadata } from "next";
import { CollectionAlbum } from "@/components/collection-album";

export const metadata: Metadata = { title: "Sticker album" };

export default function CollectionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-headline font-extrabold tracking-[-0.03em]">Your sticker album</h1>
        <p className="text-muted">Every sticker you can earn, and how to earn it.</p>
      </div>
      <CollectionAlbum />
    </div>
  );
}
