import type { Metadata } from "next";
import { AskQuestions } from "@/components/ask-questions";

export const metadata: Metadata = {
  title: "Questions to ask",
  description: "Good questions to ask at the end of an interview, sorted by topic.",
};

export default function AskPage() {
  return <AskQuestions />;
}
