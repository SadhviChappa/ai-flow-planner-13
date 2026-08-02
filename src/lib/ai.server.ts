/**
 * Google Gemini AI service (server-only).
 *
 * The API key is read from the environment at call time and is never exposed
 * to the browser. Set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) to enable the
 * AI features — until then every call fails gracefully with `configured: false`.
 */

const GEMINI_BASE_URL =
  process.env["GEMINI_API_BASE_URL"] ?? "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_MODEL = process.env["GEMINI_MODEL"] ?? "gemini-3.6-flash";

export function getGeminiApiKey(): string | undefined {
  const key = process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"];
  return key && key.trim() ? key.trim() : undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "AI is not configured yet. Add a GEMINI_API_KEY environment variable to enable AI features.",
    );
    this.name = "AiNotConfiguredError";
  }
}

export class AiRequestError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

type JsonSchema = Record<string, unknown>;

/**
 * Calls Gemini `generateContent` and parses a JSON response matching `schema`.
 */
export async function generateJson<T>(options: {
  system: string;
  prompt: string;
  schema: JsonSchema;
  temperature?: number;
}): Promise<T> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new AiNotConfiguredError();

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.system }] },
          contents: [{ role: "user", parts: [{ text: options.prompt }] }],
          generationConfig: {
            temperature: options.temperature ?? 0.6,
            responseMimeType: "application/json",
            responseSchema: options.schema,
          },
        }),
      },
    );
  } catch {
    throw new AiRequestError("Could not reach the AI service. Check your connection and try again.", 503);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new AiRequestError("AI rate limit reached. Please try again in a moment.", 429);
    }
    if (response.status === 401 || response.status === 403) {
      throw new AiRequestError("The AI API key was rejected. Please check your GEMINI_API_KEY.", response.status);
    }
    throw new AiRequestError(
      `AI request failed (${response.status}). ${body.slice(0, 200)}`.trim(),
      response.status,
    );
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new AiRequestError("The AI returned an empty response. Please try again.");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiRequestError("The AI returned an unexpected format. Please try again.");
  }
}

/* ------------------------- prompt + execution helpers ---------------------- */

import type { AiResponse, WorkContext } from "./ai-types";

export const AI_SYSTEM_PROMPT =
  "You are an experienced engineering productivity coach embedded in a work tracking app. " +
  "You write concise, specific, encouraging feedback grounded strictly in the data you are given. " +
  "Never invent tasks or hours that are not present. Respond only with JSON matching the requested schema.";

export function describeContext(ctx: WorkContext) {
  const list = (items: { name: string; project?: string; priority?: string; dueDate?: string }[]) =>
    items.length
      ? items
          .map(
            (t) =>
              `- ${t.name}${t.project ? ` (project: ${t.project})` : ""}${t.priority ? ` [${t.priority} priority]` : ""}${t.dueDate ? ` due ${t.dueDate}` : ""}`,
          )
          .join("\n")
      : "- (none)";

  const logs = ctx.logs.length
    ? ctx.logs
        .map(
          (l, i) =>
            `Entry ${i + 1}: ${l.hours}h on ${l.project ?? "unknown project"}${l.task ? ` / ${l.task}` : ""}\n  Work: ${l.description || "—"}\n  Challenges: ${l.challenges || "—"}\n  Achievement: ${l.achievement || "—"}\n  Tomorrow's plan: ${l.tomorrowPlan || "—"}`,
        )
        .join("\n")
    : "(no log entries)";

  return [
    `Date: ${ctx.date}`,
    `Total hours logged: ${ctx.hoursLogged}`,
    `Completed tasks:\n${list(ctx.completedTasks)}`,
    `Pending tasks:\n${list(ctx.pendingTasks)}`,
    `Daily log entries:\n${logs}`,
  ].join("\n\n");
}

/** Runs an AI call, converting configuration/API failures into a safe result. */
export async function runAi<T>(build: () => Promise<T>): Promise<AiResponse<T>> {
  if (!isGeminiConfigured()) {
    return {
      ok: false,
      configured: false,
      error:
        "AI is not configured yet. Add a GEMINI_API_KEY environment variable to switch these insights on.",
    };
  }
  try {
    return { ok: true, configured: true, data: await build() };
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return { ok: false, configured: false, error: error.message };
    }
    return {
      ok: false,
      configured: true,
      error:
        error instanceof AiRequestError
          ? error.message
          : "Something went wrong while generating AI insights. Please try again.",
    };
  }
}
