import type { Metadata } from "next";
import { SavedAnswerEditor } from "@/components/saved-answer-editor";

export const metadata: Metadata = { title: "Saved answer" };

export default async function SavedAnswerPage({ params }: PageProps<"/remember/[id]">) {
  const { id } = await params;
  return <SavedAnswerEditor id={id} />;
}
