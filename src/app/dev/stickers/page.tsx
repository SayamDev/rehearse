import { notFound } from "next/navigation";
import { StickerPreview } from "./preview";

/** Development-only preview of every sticker in its earned state. */
export default function DevStickers() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StickerPreview />;
}
