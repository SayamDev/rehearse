import type { Metadata } from "next";
import { RecallDrill } from "@/components/recall-drill";

export const metadata: Metadata = { title: "Recall practice" };

export default async function DrillPage({ searchParams }: PageProps<"/remember/drill">) {
  const { id, all } = await searchParams;
  return <RecallDrill onlyId={typeof id === "string" ? id : undefined} all={all === "1"} />;
}
