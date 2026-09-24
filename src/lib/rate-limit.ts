import "server-only";

/**
 * Fixed-window daily limiter kept in memory. It shares the free AI quota
 * fairly between visitors: past their share, a visitor gets rule-based notes
 * instead of AI notes. Nobody is ever blocked. On serverless hosts each
 * instance keeps its own counts, so this is a soft guard.
 */
type Bucket = { day: string; count: number };
const buckets = new Map<string, Bucket>();

export const LIMITS = {
  grade: Number(process.env.DAILY_GRADE_LIMIT ?? 20),
  questions: Number(process.env.DAILY_QUESTION_LIMIT ?? 10),
  coach: Number(process.env.DAILY_COACH_LIMIT ?? 20),
  speak: Number(process.env.DAILY_SPEAK_LIMIT ?? 40),
  react: Number(process.env.DAILY_REACT_LIMIT ?? 60),
  transcribe: Number(process.env.DAILY_TRANSCRIBE_LIMIT ?? 120),
};

/**
 * Site-wide daily ceilings on Groq calls, kept just under Groq's free plan
 * (1,000 chat and 100 speech requests a day; Live Interview reactions use a separate
 * small model with its own 1,000 a day). A free account can't be billed, but
 * this also keeps usage free if the account is ever upgraded.
 */
const SITE_CAPS = { chat: 900, speech: 95, react: 950, transcribe: 1900, audioSeconds: 27_000 };
const siteUse = { day: "", chat: 0, speech: 0, react: 0, transcribe: 0, audioSeconds: 0 };

/** Counts one Groq call (or, for audioSeconds, that many seconds) for the whole site. False once today's free share is used. */
export function takeSiteBudget(kind: keyof typeof SITE_CAPS, amount = 1): boolean {
  const d = today();
  if (siteUse.day !== d) Object.assign(siteUse, { day: d, chat: 0, speech: 0, react: 0, transcribe: 0, audioSeconds: 0 });
  if (siteUse[kind] + amount > SITE_CAPS[kind]) return false;
  siteUse[kind] += amount;
  return true;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export function takeToken(kind: keyof typeof LIMITS, key: string): { ok: boolean; remaining: number } {
  const id = `${kind}:${key}`;
  const d = today();
  const bucket = buckets.get(id);
  const current = bucket && bucket.day === d ? bucket : { day: d, count: 0 };
  if (current.count >= LIMITS[kind]) return { ok: false, remaining: 0 };
  current.count += 1;
  buckets.set(id, current);
  if (buckets.size > 50_000) {
    for (const [k, b] of buckets) if (b.day !== d) buckets.delete(k);
  }
  return { ok: true, remaining: LIMITS[kind] - current.count };
}
