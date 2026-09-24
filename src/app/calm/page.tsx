import type { Metadata } from "next";
import { CalmView } from "@/components/calm-view";

export const metadata: Metadata = {
  title: "Calm corner",
  description: "Breathing, grounding, and what to say if your mind goes blank. For anyone who gets nervous in interviews.",
};

export default function CalmPage() {
  return <CalmView />;
}
