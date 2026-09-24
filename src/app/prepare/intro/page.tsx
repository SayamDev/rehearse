import type { Metadata } from "next";
import { IntroBuilder } from "@/components/intro-builder";

export const metadata: Metadata = {
  title: "Tell me about yourself",
  description: "Build a one-minute answer to the most common interview opener, then practise saying it.",
};

export default function IntroPage() {
  return <IntroBuilder />;
}
