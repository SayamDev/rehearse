/**
 * Demo mode: used when no ANTHROPIC_API_KEY is set, so the app runs end to end
 * locally. Questions come from a fixed bank and grading is a transparent
 * heuristic. Everything produced here is labeled "Demo" in the UI.
 */
import type { Category, Competency } from "../types";
import type { GradeRequest, GradingOutput, QuestionsRequest } from "./schemas";
import { contentWords } from "../memory";
import { packForRole } from "../packs";

export type BankItem = {
  text: string;
  category: Category;
  competency: Competency;
  difficulty: number;
  looking_for: string;
};

export const GENERAL: BankItem[] = [
  {
    text: "Tell me about a time you had to solve a problem with very little guidance.",
    category: "behavioral",
    competency: "problem-solving",
    difficulty: 2,
    looking_for: "A specific situation, the steps you chose yourself, and what the result was.",
  },
  {
    text: "Tell me about a time you disagreed with someone you worked with. What did you do?",
    category: "behavioral",
    competency: "conflict",
    difficulty: 3,
    looking_for: "That you can disagree respectfully, listen, and reach an outcome without drama.",
  },
  {
    text: "Describe a mistake you made and what you did about it.",
    category: "behavioral",
    competency: "ownership",
    difficulty: 3,
    looking_for: "Honesty about the mistake, how you fixed it, and what you changed afterwards.",
  },
  {
    text: "Tell me about a time you had to learn something new quickly.",
    category: "behavioral",
    competency: "adaptability",
    difficulty: 2,
    looking_for: "How you learn: the method, the time it took, and how you used what you learned.",
  },
  {
    text: "Why do you want this job, and why now?",
    category: "motivation",
    competency: "motivation",
    difficulty: 1,
    looking_for: "A genuine reason tied to the work itself, not only pay or convenience.",
  },
  {
    text: "Imagine you have two urgent tasks from two different people and can only finish one today. What do you do?",
    category: "situational",
    competency: "communication",
    difficulty: 3,
    looking_for: "That you clarify priorities, tell both people early, and make a clear decision.",
  },
  {
    text: "What would your last manager or teacher say is the one thing you should work on?",
    category: "curveball",
    competency: "adaptability",
    difficulty: 3,
    looking_for: "Self-awareness, a real weakness, and proof you are already working on it.",
  },
  {
    text: "Tell me about a time you worked in a team that was not getting along.",
    category: "behavioral",
    competency: "teamwork",
    difficulty: 3,
    looking_for: "What you personally did to help the team work, and what changed because of it.",
  },
];

function roleQuestions(role: string): BankItem[] {
  return [
    {
      text: `What part of working as a ${role} do you think you would be best at, and why?`,
      category: "role",
      competency: "role-knowledge",
      difficulty: 2,
      looking_for: "A clear strength backed by one concrete example from your experience.",
    },
    {
      text: `Walk me through how you would handle your first week as a ${role} here.`,
      category: "role",
      competency: "role-knowledge",
      difficulty: 3,
      looking_for: "A realistic plan: who you would meet, what you would learn, and one early win.",
    },
    {
      text: `What do you think is the hardest part of being a ${role}?`,
      category: "role",
      competency: "role-knowledge",
      difficulty: 2,
      looking_for: "Honest understanding of the job, and how you would deal with that hard part.",
    },
  ];
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function demoQuestions(req: QuestionsRequest): BankItem[] {
  const excluded = new Set(req.exclude.map((q) => q.toLowerCase()));
  const seed = hash(`${req.role}:${req.seniority}:${req.exclude.length}`);
  const behavioral = GENERAL.filter((q) => q.category === "behavioral" && !excluded.has(q.text.toLowerCase()));
  const other = GENERAL.filter((q) => q.category !== "behavioral" && !excluded.has(q.text.toLowerCase()));
  // A matching question pack gives questions written for this kind of work.
  const role = (packForRole(req.role)?.questions ?? roleQuestions(req.role)).filter((q) => !excluded.has(q.text.toLowerCase()));
  const pick = <T,>(arr: T[], offset: number) => (arr.length ? arr[(seed + offset) % arr.length] : undefined);
  const set = [pick(behavioral, 0), pick(role, 1), pick(other, 2), pick(behavioral, 3), pick(other, 5)]
    .filter((q): q is BankItem => Boolean(q))
    .filter((q, i, all) => all.findIndex((x) => x.text === q.text) === i);
  // Top up from the rest of the bank if picks collided, so every mode gets its full count.
  for (const q of [...role, ...behavioral, ...other]) {
    if (set.length >= req.count) break;
    if (!set.some((x) => x.text === q.text)) set.push(q);
  }
  return set.slice(0, req.count);
}

/* ---------------- Heuristic grader ---------------- */

const SITUATION = /\b(when i|at my|while i|last (year|summer|month)|in my (last|previous|first|second)|during|there was a time|once)\b/i;
const TASK = /\b(my (job|role|task|goal|responsibility) was|i (had|needed) to|i was (asked|responsible)|the goal was)\b/i;
const ACTION = /\b(i (decided|built|called|asked|created|wrote|organi[sz]ed|led|started|fixed|changed|made|spoke|talked|set up|checked|found|trained|helped|offered|explained|listened|suggested|planned|stayed|handled|contacted|emailed|apologi[sz]ed|arranged|sorted|took|gave|showed))\b/i;
const RESULT = /\b(as a result|in the end|result(ed)?|so (the|we|she|he|they)|which (meant|led|helped)|afterwards|came back|increased|reduced|saved|improved|finished|thanked|thanks to|feedback|praised|promoted|on time|was happy|were happy|worked out|turned out|\d+ ?(%|percent|per cent))\b/i;
/** Motivation answers should point at this job, not only at the candidate. */
const JOB_LINK = /\b(this (job|role|company|team|place|position)|your (company|team|shop|store|customers|values)|here|because)\b/i;

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function clamp(n: number) {
  return Math.max(1, Math.min(10, Math.round(n)));
}

export function demoGrade(req: GradeRequest): GradingOutput {
  const text = req.answer.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const lower = text.toLowerCase();
  const genuine = wc >= 8 && /[a-z]/i.test(text);

  const star = {
    situation: SITUATION.test(text),
    task: TASK.test(text),
    // A clear action counts even when it's phrased differently ("I rang", "I stayed late").
    action: ACTION.test(text) || (lower.match(/\bi (\w+ed|did|went|made|took|told|spoke|found|built|led|ran|gave|got|set|kept|brought|wrote|chose)\b/g) ?? []).length >= 2,
    result: RESULT.test(text),
  };
  const starCount = Object.values(star).filter(Boolean).length;
  const numbers = (text.match(/\b\d[\d,.%]*\b|\b(one|two|three|four|five|ten|twenty|hundred)\b/gi) ?? []).length;
  const iCount = (lower.match(/\bi\b|\bmy\b/g) ?? []).length;
  const weCount = (lower.match(/\bwe\b|\bour\b/g) ?? []).length;
  // Relevance: shared meaningful words (allowing word endings) with the question and what it's looking for.
  const said = new Set(contentWords(text));
  const questionWords = [...new Set(contentWords(req.question.text))];
  const overlap = questionWords.filter((w) => said.has(w)).length;

  // Substance checks.
  const VAGUE = /\b(hard[- ]?worker|people person|team player|passionate|perfectionist|go the extra mile|always|never|very good at|i am good at|i'm good at|motivated)\b/gi;
  const vagueClaims = (text.match(VAGUE) ?? []).length;
  const hypothetical = (lower.match(/\b(i would|i'd|i will|i'll|i could|i might)\b/g) ?? []).length;
  const pastActions = (lower.match(/\bi (\w+ed|did|went|made|took|told|spoke|found|built|led|ran|sat|gave|got|saw|set|kept|brought|thought|wrote|chose)\b/g) ?? []).length;
  const isHypothetical = hypothetical > pastActions;

  const isBehavioral = req.question.category === "behavioral";
  // Words from the question pack for this kind of job show the answer fits the role.
  const pack = packForRole(req.role);
  const jobWords = pack ? new Set(pack.questions.flatMap((q) => contentWords(`${q.text} ${q.looking_for}`))) : new Set<string>();
  const jobHits = [...said].filter((w) => jobWords.has(w)).length;
  const sentenceLengths = sentences(text).map((x) => x.split(/\s+/).length);
  const longest = Math.max(0, ...sentenceLengths);
  const lengthFit = wc < 40 ? 3 : wc < 80 ? 6 : wc <= 320 ? 8 : 5;

  const scores = {
    relevance: clamp(4 + Math.min(4, overlap) + (wc >= 40 ? 1 : 0)),
    structure: clamp(isBehavioral ? 2 + starCount * 2 : 3 + (wc >= 60 ? 3 : 1) + (star.result ? 2 : 0)),
    specificity: clamp(3 + Math.min(4, numbers * 2) + (wc >= 80 ? 2 : 0)),
    ownership: clamp(3 + Math.min(5, iCount / 2) - Math.min(3, Math.max(0, weCount - iCount) / 2) + (star.result ? 1 : 0)),
    clarity: clamp(lengthFit - (longest > 45 ? 2 : 0)),
    role_fit: clamp(
      4 +
        (lower.includes(req.role.toLowerCase().split(" ")[0]) ? 2 : 0) +
        Math.min(2, Math.floor(jobHits / 3)) +
        (wc >= 60 ? 1 : 0) +
        (req.question.category === "motivation" && JOB_LINK.test(text) ? 1 : 0),
    ),
  };

  // Very short answers can't show real structure or specifics, whatever words they use.
  if (wc < 40) {
    scores.structure = Math.min(scores.structure, 4);
    scores.specificity = Math.min(scores.specificity, 4);
  }
  // "Tell me about a time" needs a real past example, not what you would do.
  if (isBehavioral && isHypothetical) {
    scores.relevance = Math.min(scores.relevance, 4);
    scores.structure = Math.min(scores.structure, 4);
  }
  // Claims without evidence aren't specifics.
  if (vagueClaims > 0 && numbers === 0 && pastActions < 2) {
    scores.specificity = Math.min(scores.specificity, 4);
    scores.ownership = Math.min(scores.ownership, 5);
  }
  if (!genuine) for (const k of Object.keys(scores) as (keyof typeof scores)[]) scores[k] = 1;

  const why = {
    relevance: overlap >= 2 ? "You stayed on the question that was asked." : "Tie your answer more directly to the question's wording.",
    structure: isBehavioral
      ? `${starCount} of 4 STAR parts are clearly there.`
      : star.result
        ? "There is a clear point and a close."
        : "Open with your point and close with a clear conclusion.",
    specificity:
      numbers > 0
        ? `You gave ${numbers === 1 ? "a number" : `${numbers} numbers or amounts`}, which makes this believable.`
        : "There are no numbers yet. Add one: how many people, how long, or how much.",
    ownership:
      iCount > weCount
        ? "You say what you personally did."
        : `You said \u201cwe\u201d ${weCount} ${weCount === 1 ? "time" : "times"} and \u201cI\u201d ${iCount}. Say more about your own part.`,
    clarity:
      wc < 40
        ? "Too short to judge well. Aim for about a minute."
        : wc > 320
          ? "It runs long. Cut the setup and keep the action."
          : longest > 45
            ? `One sentence runs to ${longest} words. Break it up so it's easier to follow.`
            : "Easy to follow and a good length.",
    role_fit:
      jobHits >= 3
        ? `You used ideas that matter in ${pack?.name.toLowerCase() ?? "this work"}.`
        : `Connect the story to what a ${req.role} does day to day.`,
  };

  const s = sentences(text);
  // The strongest sentence: a number, "I", an action and a result score a point each.
  const signal = (x: string) => Number(/\d/.test(x)) + Number(/\bi\b/i.test(x)) + Number(ACTION.test(x)) + Number(RESULT.test(x));
  const quote =
    s.filter((x) => x.split(/\s+/).length <= 22).sort((a, b) => signal(b) - signal(a))[0] ??
    words.slice(0, Math.min(12, wc)).join(" ");

  const strongest = (Object.keys(scores) as (keyof typeof scores)[]).sort((a, b) => scores[b] - scores[a])[0];
  const STRENGTH_WHY: Record<keyof typeof scores, string> = {
    relevance: "It goes straight at what was asked.",
    structure: "It sets the scene before getting to what happened.",
    specificity: "The concrete detail makes it believable.",
    ownership: "It makes clear what you did yourself.",
    clarity: "It's easy to follow.",
    role_fit: `It shows something a ${req.role} needs.`,
  };
  const weakest = (Object.keys(scores) as (keyof typeof scores)[]).sort((a, b) => scores[a] - scores[b])[0];
  const fixes: Record<keyof typeof scores, string> = {
    relevance: "Start your answer by repeating the key idea of the question, then answer it directly.",
    structure: !star.situation
      ? "Open with one sentence of situation: where you were and what was happening."
      : !star.result
        ? "Finish with the result: say what changed because of what you did."
        : "Say what your task was before you describe what you did.",
    specificity: "Add one number or concrete detail, like how many people, how long, or how much.",
    ownership: "Replace some 'we' with 'I' and name the decision you made yourself.",
    clarity: wc < 40 ? "Give a fuller answer: aim for about 150 words or one minute." : "Cut the background to two sentences and spend the time on your actions.",
    role_fit: `End by linking the story to why it makes you a good ${req.role}.`,
  };

  const opening = s[0] ?? "";
  const middle = s.slice(1, -1).join(" ");
  const closing = s.length > 1 ? s[s.length - 1] : "";
  const improved = genuine
    ? [
        star.situation ? opening : `When I was [where you were], ${opening.charAt(0).toLowerCase()}${opening.slice(1)}`,
        star.task ? "" : "My job was to [what you were responsible for].",
        middle,
        closing,
        star.result ? "" : "As a result, [what changed, ideally with a number].",
        `That experience is why I think I would do well as a ${req.role}.`,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return {
    is_genuine_answer: genuine,
    rubric: {
      relevance: { score: scores.relevance, why: why.relevance },
      structure: { score: scores.structure, why: why.structure },
      specificity: { score: scores.specificity, why: why.specificity },
      ownership: { score: scores.ownership, why: why.ownership },
      clarity: { score: scores.clarity, why: why.clarity },
      role_fit: { score: scores.role_fit, why: why.role_fit },
    },
    star,
    strength: genuine
      ? { quote, why: STRENGTH_WHY[strongest] }
      : { quote: "", why: "" },
    fix: !genuine
      ? "Answer the question with a real example so it can be scored."
      : isBehavioral && isHypothetical
        ? "Use a real example: say what happened and what you did, not what you would do."
        : vagueClaims > 0 && numbers === 0 && pastActions < 2
          ? "Back up your claim with proof: one real moment that shows it, and what happened."
          : fixes[weakest],
    improved_answer: improved,
    criteria: criteriaFor(req.question.lookingFor, said, star, iCount > weCount && pastActions > 0, genuine),
    follow_up_question: isBehavioral
      ? "What would you do differently if it happened again?"
      : "Can you give me a specific example of that?",
  };
}

/** Splits "what a strong answer shows" into points and checks each against the answer's words. */
function criteriaFor(
  lookingFor: string,
  said: Set<string>,
  star: { situation: boolean; task: boolean; action: boolean; result: boolean },
  ownsIt: boolean,
  genuine: boolean,
): { point: string; met: boolean }[] {
  const points = lookingFor
    .replace(/\.$/, "")
    .split(/,|;|:| and (?=[a-z])/i)
    .map((p) => p.trim())
    .filter((p) => p.split(" ").length >= 2)
    .slice(0, 4);
  return points.map((point) => {
    const p = point.toLowerCase();
    let met: boolean;
    if (/result|changed|outcome|turned out|happened/.test(p)) met = star.result;
    else if (/example|situation|time|moment/.test(p)) met = star.situation;
    else if (/you did|yourself|personally|your own|your part|steps/.test(p)) met = ownsIt && star.action;
    else {
      const words = [...new Set(contentWords(point))];
      met = words.length > 0 && words.filter((w) => said.has(w)).length >= Math.ceil(words.length * 0.4);
    }
    return { point: point.charAt(0).toUpperCase() + point.slice(1), met: genuine && met };
  });
}
