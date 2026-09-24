import type { Metadata } from "next";
import { SessionView } from "@/components/session-view";

export const metadata: Metadata = { title: "Your results" };

export default async function SummaryPage({ params }: PageProps<"/practice/[id]/summary">) {
  const { id } = await params;
  return <SessionView sessionId={id} heading="Round complete" showTranscripts askFeeling />;
}
