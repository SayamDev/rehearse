import type { Metadata } from "next";
import { DayOf } from "@/components/day-of";

export const metadata: Metadata = { title: "Interview day", description: "Everything for your interview morning on one calm screen." };

export default function TodayPage() {
  return <DayOf />;
}
