import { z } from "zod";
import { CATEGORIES, COMPETENCIES, PERSONAS, SENIORITIES } from "../types";

export const MAX_ANSWER_CHARS = 4000;
export const MAX_JD_CHARS = 6000;

/* ---------- Request bodies (validated in route handlers) ---------- */

export const QuestionsRequest = z.object({
  role: z.string().trim().min(2).max(80),
  seniority: z.enum(SENIORITIES),
  jobDescription: z.string().max(MAX_JD_CHARS).default(""),
  count: z.number().int().min(1).max(5).default(3),
  exclude: z.array(z.string().max(400)).max(50).default([]),
  persona: z.enum(PERSONAS).optional(),
  /** Simpler words, for people learning English or who prefer plain language. */
  plain: z.boolean().default(false),
});
export type QuestionsRequest = z.infer<typeof QuestionsRequest>;

export const QuestionInput = z.object({
  id: z.string().max(64),
  text: z.string().min(5).max(400),
  category: z.enum(CATEGORIES),
  competency: z.enum(COMPETENCIES),
  difficulty: z.number().int().min(1).max(5),
  lookingFor: z.string().max(400),
});

export const GradeRequest = z.object({
  role: z.string().trim().min(2).max(80),
  seniority: z.enum(SENIORITIES),
  jobDescription: z.string().max(MAX_JD_CHARS).default(""),
  question: QuestionInput,
  answer: z.string().trim().min(1).max(MAX_ANSWER_CHARS),
  mode: z.enum(["voice", "type"]),
  plain: z.boolean().default(false),
});
export type GradeRequest = z.infer<typeof GradeRequest>;

/* ---------- Model outputs (structured outputs) ----------
   Numeric ranges are stated in the prompt and clamped in code, so the
   schemas stay within what structured outputs accepts. */

export const GeneratedQuestions = z.object({
  questions: z.array(
    z.object({
      text: z.string(),
      category: z.enum(CATEGORIES),
      competency: z.enum(COMPETENCIES),
      difficulty: z.number().int(),
      looking_for: z.string(),
    }),
  ),
});

const Item = z.object({ score: z.number().int(), why: z.string() });

export const GradingOutput = z.object({
  is_genuine_answer: z.boolean(),
  rubric: z.object({
    relevance: Item,
    structure: Item,
    specificity: Item,
    ownership: Item,
    clarity: Item,
    role_fit: Item,
  }),
  star: z.object({
    situation: z.boolean(),
    task: z.boolean(),
    action: z.boolean(),
    result: z.boolean(),
  }),
  strength: z.object({ quote: z.string(), why: z.string() }),
  fix: z.string(),
  improved_answer: z.string(),
  follow_up_question: z.string(),
  /** The "what a strong answer shows" line broken into 2 to 4 checkable points. */
  criteria: z.array(z.object({ point: z.string(), met: z.boolean() })),
});
export type GradingOutput = z.infer<typeof GradingOutput>;
