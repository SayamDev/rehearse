import type { Metadata } from "next";
import { InterviewCard } from "@/components/interview-card";

export const metadata: Metadata = {
  title: "Interview-day card",
  description: "Your intro, key stories and questions to ask on one printable page.",
};

export default function CardPage() {
  return <InterviewCard />;
}
