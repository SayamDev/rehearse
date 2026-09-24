import "server-only";
import { z } from "zod";

/**
 * Ollama: open AI models running on your own computer (https://ollama.com). Free, no
 * limits, and nothing leaves the machine. Set OLLAMA_URL (usually http://127.0.0.1:11434)
 * and it's tried before Groq for writing questions, notes, Cobi's replies and Live
 * reactions, so Groq's free allowance lasts much longer. Speech and transcription
 * still use Groq, because Ollama doesn't do audio.
 *
 * It only works while the app runs on the same machine (or network) as Ollama, so a
 * hosted copy of the site keeps using Groq.
 */

export function ollamaEnabled(): boolean {
  return Boolean(process.env.OLLAMA_URL);
}

function base() {
  return (process.env.OLLAMA_URL ?? "").replace(/\/$/, "");
}

export function ollamaModel(): string {
  return process.env.OLLAMA_MODEL || "llama3.2";
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function chat(messages: Msg[], opts: { format?: unknown; temperature: number; maxTokens: number; timeoutMs: number }): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(`${base()}/api/chat`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel(),
        messages,
        stream: false,
        ...(opts.format ? { format: opts.format } : {}),
        // Keeps the model loaded between requests so replies stay quick.
        keep_alive: "30m",
        options: { temperature: opts.temperature, num_predict: opts.maxTokens, num_ctx: 8192 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim();
    if (!content) throw new Error("Ollama returned no content");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/** Structured output: Ollama constrains the reply to the JSON schema, then zod checks it. */
export async function ollamaJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  jsonSchema: Record<string, unknown>,
  opts: { maxTokens: number; temperature?: number; timeoutMs?: number },
): Promise<T> {
  const content = await chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { format: jsonSchema, temperature: opts.temperature ?? 0, maxTokens: opts.maxTokens, timeoutMs: opts.timeoutMs ?? 60_000 },
  );
  const parsed = schema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new Error("Ollama output did not match schema");
  return parsed.data;
}

export async function ollamaChat(system: string, messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  return chat([{ role: "system", content: system }, ...messages], { temperature: 0.4, maxTokens: 700, timeoutMs: 60_000 });
}
