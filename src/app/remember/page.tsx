import type { Metadata } from "next";
import { RememberView } from "@/components/remember-view";

export const metadata: Metadata = { title: "Remember" };

export default function RememberPage() {
  return <RememberView />;
}
