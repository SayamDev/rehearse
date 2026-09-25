import type { Metadata } from "next";
import { StoryBank } from "@/components/story-bank";

export const metadata: Metadata = { title: "Story bank" };

export default function StoriesPage() {
  return <StoryBank />;
}
