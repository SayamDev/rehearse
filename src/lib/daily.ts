import { GENERAL, type BankItem } from "./ai/demo";
import type { Question } from "./types";

/** Extra everyday questions so the Daily Challenge rotates through a longer list. */
const DAILY_EXTRA: BankItem[] = [
  {
    text: "Tell me about yourself.",
    category: "motivation",
    competency: "communication",
    difficulty: 1,
    looking_for: "A short story of who you are, what you've done, and why this job fits, in about a minute.",
  },
  {
    text: "What is your greatest strength, and when did it help at work or school?",
    category: "behavioral",
    competency: "role-knowledge",
    difficulty: 2,
    looking_for: "One real strength with a specific example that proves it.",
  },
  {
    text: "Tell me about a time you went above and beyond for someone.",
    category: "behavioral",
    competency: "ownership",
    difficulty: 2,
    looking_for: "What you did beyond what was expected, and the difference it made.",
  },
  {
    text: "Tell me about a time you had to stay calm under pressure.",
    category: "behavioral",
    competency: "conflict",
    difficulty: 3,
    looking_for: "A real pressured moment, what you did to stay steady, and how it turned out.",
  },
  {
    text: "Where would you like to be in two years?",
    category: "motivation",
    competency: "motivation",
    difficulty: 2,
    looking_for: "Honest goals that connect to growing in this kind of role.",
  },
  {
    text: "Tell me about a time you helped a team reach a goal.",
    category: "behavioral",
    competency: "leadership",
    difficulty: 3,
    looking_for: "Your own part in the team's success, not just what the team did.",
  },
];

const DAILY_BANK = [...GENERAL, ...DAILY_EXTRA];

function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** The same question for everyone on a given local day. */
export function dailyQuestion(day: string): Question {
  const item = DAILY_BANK[dayNumber(day) % DAILY_BANK.length];
  return {
    id: `daily-${day}`,
    text: item.text,
    category: item.category,
    competency: item.competency,
    difficulty: item.difficulty,
    lookingFor: item.looking_for,
  };
}
