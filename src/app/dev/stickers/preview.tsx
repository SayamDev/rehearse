"use client";

import { StickerArt } from "@/components/sticker-art";
import { COLLECTION } from "@/lib/collection";

export function StickerPreview() {
  return (
    <ul className="grid grid-cols-4 gap-6 sm:grid-cols-6">
      {COLLECTION.map((c, i) => (
        <li key={c.id} className="flex flex-col items-center gap-2 text-center text-label">
          <StickerArt item={c} earned size={104} tilt={((i % 5) - 2) * 3} />
          {c.name}
        </li>
      ))}
    </ul>
  );
}
