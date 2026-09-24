"use client";

import { useId, useState } from "react";
import { money, lowOffer, offerQuestions, type Period } from "@/lib/offer";
import { useStore } from "@/lib/store";
import { JobCombobox } from "./job-combobox";
import { PractiseButton } from "./practise-button";
import { PersonaAvatar } from "./persona-avatar";

const CURRENCIES = ["GBP", "EUR", "USD", "CAD", "AUD", "INR", "PKR", "NGN"];

export function OfferPractice() {
  const { sessions } = useStore();
  const [role, setRole] = useState(sessions[0]?.role ?? "");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<Period>("hour");
  const [currency, setCurrency] = useState("GBP");
  const ids = { role: useId(), amount: useId(), period: useId(), currency: useId() };
  const target = Number(amount);
  const ready = role.trim().length >= 2 && target > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={ids.role} className="text-label font-medium">
          Job title
        </label>
        <JobCombobox id={ids.role} value={role} onChange={setRole} className="max-w-md" />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label font-medium">The pay you&apos;re hoping for</legend>
        <div className="flex max-w-md flex-wrap gap-2">
          <label htmlFor={ids.currency} className="sr-only">
            Currency
          </label>
          <select id={ids.currency} value={currency} onChange={(e) => setCurrency(e.target.value)} className="field w-28">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label htmlFor={ids.amount} className="sr-only">
            Amount
          </label>
          <input
            id={ids.amount}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 9))}
            placeholder={period === "hour" ? "13.50" : "28000"}
            className="field min-w-0 flex-1"
          />
          <label htmlFor={ids.period} className="sr-only">
            Per
          </label>
          <select id={ids.period} value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="field w-36">
            <option value="hour">an hour</option>
            <option value="year">a year</option>
          </select>
        </div>
      </fieldset>

      {ready && (
        <div className="flex items-center gap-4 rounded-[var(--radius-panel)] border-2 border-dashed border-line p-4">
          <PersonaAvatar id="tough" size={56} />
          <p className="text-body-sm leading-relaxed text-muted">
            Mr. Grant will offer you <span className="font-semibold text-ink">{money(lowOffer(target, period), currency)}</span>{" "}
            {period === "hour" ? "an hour" : "a year"}. Your job: ask for {money(target, currency)} without losing the offer.
          </p>
        </div>
      )}

      <PractiseButton
        items={ready ? offerQuestions(target, period, currency) : []}
        role={role.trim() || undefined}
        mode="offer"
        persona="tough"
        variant="go"
        label="Start Pay Talk with Mr. Grant"
      />
      {!ready && <p className="text-label text-muted">Add the job and the pay you&apos;re hoping for to start.</p>}
    </div>
  );
}
