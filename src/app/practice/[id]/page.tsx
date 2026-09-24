import type { Metadata } from "next";
import { PracticeRunner } from "@/components/practice-runner";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  return <PracticeRunner sessionId={id} />;
}
