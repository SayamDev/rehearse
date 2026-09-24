import type { Metadata } from "next";
import { SetupForm } from "@/components/setup-form";
import { RUBRIC_KEYS, type RubricKey } from "@/lib/types";

export const metadata: Metadata = { title: "Set up practice" };

export default async function NewPracticePage({ searchParams }: PageProps<"/practice/new">) {
  const { role, mode, focus } = await searchParams;
  const initialRole = typeof role === "string" ? role.slice(0, 80) : "";
  const initialMode = mode === "speed" || mode === "boss" || mode === "mock" || mode === "live" ? mode : "quick";
  const initialFocus = RUBRIC_KEYS.includes(focus as RubricKey) ? (focus as RubricKey) : undefined;
  return <SetupForm initialRole={initialRole} initialMode={initialMode} initialFocus={initialFocus} />;
}
