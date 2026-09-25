import type { Metadata } from "next";
import { PocketCards } from "@/components/pocket-cards";

export const metadata: Metadata = { title: "Pocket cards" };

export default function CardsPage() {
  return <PocketCards />;
}
