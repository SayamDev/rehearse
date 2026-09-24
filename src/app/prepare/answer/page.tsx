import type { Metadata } from "next";
import { AnswerBuilder } from "@/components/answer-builder";

export const metadata: Metadata = {
  title: "Answer builder",
  description: "Build a “tell me about a time” answer one small step at a time, then practise saying it.",
};

export default async function AnswerPage({ searchParams }: PageProps<"/prepare/answer">) {
  const { q } = await searchParams;
  return <AnswerBuilder initialQuestion={typeof q === "string" ? q.slice(0, 300) : ""} />;
}
