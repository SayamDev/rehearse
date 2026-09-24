import type { PractiseItem } from "@/components/practise-button";

export type Period = "hour" | "year";

export function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: amount < 100 ? 2 : 0 }).format(amount);
  } catch {
    return `${amount}`;
  }
}

/** A realistic first offer: about 8% under what the user hopes for, rounded to a natural number. */
export function lowOffer(target: number, period: Period): number {
  const raw = target * 0.92;
  if (period === "hour") return Math.round(raw * 4) / 4;
  return Math.round(raw / 500) * 500;
}

/** Mr. Grant's three questions for Pay Talk. */
export function offerQuestions(target: number, period: Period, currency: string): PractiseItem[] {
  const per = period === "hour" ? " an hour" : " a year";
  const offer = `${money(lowOffer(target, period), currency)}${per}`;
  const ask = `${money(target, currency)}${per}`;
  return [
    {
      text: `We'd like to offer you the job, at ${offer}. How does that sound?`,
      category: "situational",
      competency: "communication",
      difficulty: 3,
      looking_for: `Thank them warmly, don't accept or refuse on the spot, and calmly ask for more (around ${ask}) with a reason, or ask for a day to think it over.`,
    },
    {
      text: `That's more than we planned for. Why should we pay you ${ask}?`,
      category: "situational",
      competency: "motivation",
      difficulty: 4,
      looking_for: "Reasons based on value: your skills, experience, results, and the usual pay for this job. Not personal bills or what a friend earns.",
    },
    {
      text: "We can't move much on the salary. Is there anything else that would make this work for you?",
      category: "situational",
      competency: "problem-solving",
      difficulty: 3,
      looking_for: "Polite flexibility: ask for something else of value, like a pay review in six months, training, hours or start date, and keep the door open.",
    },
  ];
}

export const OFFER_TIPS = [
  "Look up the usual pay for this job in your area first (job adverts are a good guide), so your number has a reason.",
  "Say thank you and show you're pleased before you talk numbers.",
  "You don't have to say yes on the spot. “Could I have until tomorrow to think it over?” is completely normal.",
  "Give one number or a narrow range, then stop talking and let them answer.",
  "If the pay can't move, ask about other things: a pay review, training, hours, holidays or start date.",
  "Stay friendly the whole time. Asking politely almost never loses an offer.",
];
