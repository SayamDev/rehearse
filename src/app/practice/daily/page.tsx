import type { Metadata } from "next";
import { DailyStart } from "@/components/daily-challenge";

export const metadata: Metadata = { title: "Daily Challenge" };

export default function DailyPage() {
  return <DailyStart />;
}
