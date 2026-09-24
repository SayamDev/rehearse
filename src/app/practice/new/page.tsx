import type { Metadata } from "next";
import { SetupForm } from "@/components/setup-form";

export const metadata: Metadata = { title: "Set up practice" };

export default async function NewPracticePage({ searchParams }: PageProps<"/practice/new">) {
  const { role, mode } = await searchParams;
  const initialRole = typeof role === "string" ? role.slice(0, 80) : "";
  const initialMode = mode === "speed" || mode === "boss" || mode === "mock" || mode === "live" ? mode : "quick";
  return <SetupForm initialRole={initialRole} initialMode={initialMode} />;
}
