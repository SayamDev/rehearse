import type { Metadata } from "next";
import { KitQuiz } from "@/components/kit-quiz";

export const metadata: Metadata = { title: "Quiz my kit" };

export default function QuizPage() {
  return <KitQuiz />;
}
