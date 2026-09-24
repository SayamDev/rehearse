"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { JobCombobox } from "./job-combobox";
import { useT } from "@/lib/i18n";


export function RoleForm({ initialRole = "" }: { initialRole?: string }) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState("");
  const inputId = useId();
  const errorId = useId();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = role.trim();
    if (value.length < 2) {
      setError("Type a job title, like \"Barista\" or \"Data analyst\".");
      return;
    }
    router.push(`/practice/new?role=${encodeURIComponent(value)}`);
  }

  const t = useT();
  return (
    <form onSubmit={submit} className="flex w-full max-w-xl flex-col gap-2" noValidate>
      <label htmlFor={inputId} className="text-label font-medium">
        {t("form.job")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <JobCombobox
          id={inputId}
          value={role}
          onChange={(v) => {
            setRole(v);
            if (error) setError("");
          }}
          invalid={Boolean(error)}
          describedBy={error ? errorId : undefined}
        />
        <button type="submit" className="btn btn-go h-12 shrink-0 px-6">
          {t("form.start")}
          <ArrowRightIcon size={18} weight="bold" aria-hidden />
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-label text-down">
          {error}
        </p>
      )}
    </form>
  );
}
