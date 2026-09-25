import type { Metadata } from "next";
import { CompanyCard } from "@/components/company-card";

export const metadata: Metadata = { title: "Know the company" };

export default function CompanyPage() {
  return <CompanyCard />;
}
