import type { Metadata } from "next";
import { WarmUp } from "@/components/warm-up";

export const metadata: Metadata = {
  title: "Warm-up",
  description: "Three easy, everyday questions to get talking. Nothing is scored.",
};

export default function WarmUpPage() {
  return <WarmUp />;
}
