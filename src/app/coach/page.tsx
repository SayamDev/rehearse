import type { Metadata } from "next";
import { CoachChat } from "@/components/coach-chat";

export const metadata: Metadata = { title: "Cobi, your interview coach" };

export default function CoachPage() {
  return <CoachChat />;
}
