import type { Metadata } from "next";
import { NumberList } from "@/components/number-list";

export const metadata: Metadata = { title: "Numbers to remember" };

export default function NumbersPage() {
  return <NumberList />;
}
