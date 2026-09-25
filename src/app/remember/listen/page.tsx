import type { Metadata } from "next";
import { ListenMode } from "@/components/listen-mode";

export const metadata: Metadata = { title: "Listen mode" };

export default function ListenPage() {
  return <ListenMode />;
}
