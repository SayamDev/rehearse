import type { Metadata } from "next";
import { RecallDrill } from "@/components/recall-drill";
import { RECALL_MODES } from "@/lib/kit";

export const metadata: Metadata = { title: "Recall practice" };

export default async function DrillPage({ searchParams }: PageProps<"/remember/drill">) {
  const { id, all, mode } = await searchParams;
  const way = RECALL_MODES.find((m) => m.value === mode)?.value;
  return <RecallDrill onlyId={typeof id === "string" ? id : undefined} all={all === "1"} mode={way} />;
}
