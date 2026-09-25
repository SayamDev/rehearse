import "server-only";
import { z } from "zod";
import { takeSiteBudget } from "../rate-limit";
import { ReactOutput } from "./react";
import { ollamaChat, ollamaEnabled, ollamaJson } from "./ollama";
import { CV_SYSTEM, CvOutput, cvUserPrompt, type CvRequest } from "./cv";
import {
  GeneratedQuestions,
  GradingOutput,
  type GradeRequest,
  type QuestionsRequest,
} from "./schemas";
import { GRADER_SYSTEM, QUESTION_SYSTEM, gradeUserPrompt, questionUserPrompt } from "./prompts";

/**
 * Groq free tier (OpenAI-compatible API). Groq does not keep request data by
 * default; turn on Zero Data Retention in the Groq console as well.
 */
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

function groqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

/** True when any free AI is set up: Ollama on this machine, or Groq's free tier. */
export function groqEnabled(): boolean {
  return groqKey() || ollamaEnabled();
}

/** True only when Groq itself is set up (needed for speech and transcription, which Ollama can't do). */
export function groqAudioEnabled(): boolean {
  return groqKey();
}

/** Thrown when Groq's free daily or per-minute limit is used up. */
export class GroqLimitError extends Error {}
export class GroqError extends Error {}

/** Strict mode needs every property required and closed objects. */
function strictSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  const close = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "object" && n.properties && typeof n.properties === "object") {
      n.required = Object.keys(n.properties);
      n.additionalProperties = false;
      Object.values(n.properties).forEach(close);
    }
    if (n.items) close(n.items);
  };
  close(json);
  return json;
}

type CallOptions = { model?: string; budget?: "chat" | "react"; temperature?: number; timeoutMs?: number; localTimeoutMs?: number };

async function call<T>(
  system: string,
  user: string,
  name: string,
  schema: z.ZodType<T>,
  maxTokens: number,
  opts: CallOptions = {},
): Promise<T> {
  // Ollama first when it's set up: free, unlimited, and it saves Groq's daily allowance.
  if (ollamaEnabled()) {
    try {
      return await ollamaJson(system, user, schema, strictSchema(schema), {
        maxTokens,
        temperature: opts.temperature,
        timeoutMs: opts.localTimeoutMs ?? 60_000,
      });
    } catch (err) {
      console.warn(`${name}: Ollama failed, trying Groq`, err instanceof Error ? err.message : err);
    }
  }
  if (!groqKey()) throw new GroqError("No AI available");
  if (!takeSiteBudget(opts.budget ?? "chat")) throw new GroqLimitError("Free daily share used");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25_000);
  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model ?? GROQ_MODEL,
        temperature: opts.temperature ?? 0,
        reasoning_effort: "low",
        max_completion_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name, strict: true, schema: strictSchema(schema) },
        },
      }),
    });
  } catch (err) {
    throw new GroqError(err instanceof Error ? err.message : "Groq request failed");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) throw new GroqLimitError("Groq rate limit reached");
  if (!res.ok) throw new GroqError(`Groq returned ${res.status}`);

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new GroqError("Groq returned no content");
  const parsed = schema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new GroqError("Groq output did not match schema");
  return parsed.data;
}

export async function groqQuestions(req: QuestionsRequest) {
  const out = await call(QUESTION_SYSTEM, questionUserPrompt(req), "interview_questions", GeneratedQuestions, 3000);
  return out.questions;
}

export async function groqCv(req: CvRequest): Promise<CvOutput> {
  return call(CV_SYSTEM, cvUserPrompt(req), "cv_stories", CvOutput, 4000);
}

export async function groqGrade(req: GradeRequest): Promise<GradingOutput> {
  return call(GRADER_SYSTEM, gradeUserPrompt(req), "answer_grading", GradingOutput, 4000);
}

/**
 * Accurate transcription of a spoken answer with Whisper (free plan: 2,000 requests and
 * 8 hours of audio a day; every request counts as at least 10 seconds).
 */
export async function groqTranscribe(audio: Blob, seconds: number, context: string, language = "en"): Promise<string> {
  if (!takeSiteBudget("transcribe") || !takeSiteBudget("audioSeconds", Math.max(10, Math.ceil(seconds)))) {
    throw new GroqLimitError("Free daily share used");
  }
  const form = new FormData();
  form.append("file", audio, audio instanceof File && audio.name ? audio.name : "answer.webm");
  form.append("model", "whisper-large-v3");
  form.append("language", language);
  form.append("response_format", "json");
  form.append("temperature", "0");
  if (context) form.append("prompt", context.slice(0, 600));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
    });
  } catch (err) {
    throw new GroqError(err instanceof Error ? err.message : "Groq transcription failed");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429) throw new GroqLimitError("Groq transcription limit reached");
  if (!res.ok) throw new GroqError(`Groq transcription returned ${res.status}`);
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}

/**
 * Live Interview reactions: a small, fast model (its own free daily allowance, separate
 * from questions and grading) with a short timeout so the conversation keeps moving.
 */
export async function groqReact(system: string, user: string): Promise<ReactOutput> {
  return call(system, user, "interviewer_reaction", ReactOutput, 300, {
    model: "openai/gpt-oss-20b",
    budget: "react",
    temperature: 0.6,
    timeoutMs: 5000,
    // A local model gets a little longer, but the conversation still can't stall.
    localTimeoutMs: 6000,
  });
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Plain chat reply (used by the interview coach). */
export async function groqChat(system: string, messages: ChatMessage[]): Promise<string> {
  if (ollamaEnabled()) {
    try {
      return await ollamaChat(system, messages);
    } catch (err) {
      console.warn("coach: Ollama failed, trying Groq", err instanceof Error ? err.message : err);
    }
  }
  if (!groqKey()) throw new GroqError("No AI available");
  if (!takeSiteBudget("chat")) throw new GroqLimitError("Free daily share used");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        reasoning_effort: "low",
        max_completion_tokens: 900,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
  } catch (err) {
    throw new GroqError(err instanceof Error ? err.message : "Groq request failed");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429) throw new GroqLimitError("Groq rate limit reached");
  if (!res.ok) throw new GroqError(`Groq returned ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new GroqError("Groq returned no content");
  return content;
}

/** Human-sounding speech from Groq's Orpheus model. Input is capped at 200 characters. */
export async function groqSpeech(text: string, voice: string, model = "canopylabs/orpheus-v1-english"): Promise<ArrayBuffer> {
  if (!takeSiteBudget("speech")) throw new GroqLimitError("Free daily share used");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text, voice, response_format: "wav" }),
    });
  } catch (err) {
    throw new GroqError(err instanceof Error ? err.message : "Groq speech request failed");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429) throw new GroqLimitError("Groq speech limit reached");
  if (!res.ok) throw new GroqError(`Groq speech returned ${res.status}`);
  return res.arrayBuffer();
}
