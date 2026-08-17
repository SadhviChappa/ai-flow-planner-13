/**
 * Google Gemini AI service (server-only).
 *
 * The API key is read from the environment at call time and is never exposed
 * to the browser. Set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) to enable the
 * AI features — until then every call fails gracefully with `configured: false`.
 */

const GEMINI_BASE_URL =
  process.env["GEMINI_API_BASE_URL"] ?? "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_MODEL =
  process.env["GEMINI_MODEL"] ?? "gemini-1.5-flash";

const FALLBACK_MODELS = [
  GEMINI_MODEL,
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

export function getGeminiApiKey(customKey?: string): string | undefined {
  if (customKey && customKey.trim()) return customKey.trim();
  const key =
    (typeof process !== "undefined" && process.env ? process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"] ?? process.env["VITE_GEMINI_API_KEY"] : undefined) ||
    (typeof import.meta !== "undefined" && import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) : undefined);
  return key && key.trim() ? key.trim() : undefined;
}

export function isGeminiConfigured(customKey?: string): boolean {
  return Boolean(getGeminiApiKey(customKey));
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
  apiKey?: string;
}): Promise<T> {
  const apiKey = getGeminiApiKey(options.apiKey);
  if (!apiKey) throw new AiNotConfiguredError();

  const modelsToTry = Array.from(new Set(FALLBACK_MODELS));
  let lastError: AiRequestError | null = null;

  for (const modelName of modelsToTry) {
    let response: Response;
    try {
      const endpoint = `${GEMINI_BASE_URL}/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
      response = await fetch(endpoint, {
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
      });
    } catch {
      throw new AiRequestError("Could not reach the AI service. Check your connection and try again.", 503);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      if (response.status === 404 && modelName !== modelsToTry[modelsToTry.length - 1]) {
        // Try next fallback model
        continue;
      }
      if (response.status === 429) {
        throw new AiRequestError("AI rate limit reached. Please try again in a moment.", 429);
      }
      if (response.status === 401 || response.status === 403) {
        throw new AiRequestError("The AI API key was rejected. Please check your GEMINI_API_KEY.", response.status);
      }
      lastError = new AiRequestError(
        `AI request failed (${response.status}). ${body.slice(0, 200)}`.trim(),
        response.status,
      );
      continue;
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) {
      lastError = new AiRequestError("The AI returned an empty response. Please try again.");
      continue;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new AiRequestError("The AI returned an unexpected format. Please try again.");
    }
  }

  throw lastError ?? new AiRequestError("Failed to generate AI insights.");
}

/* ------------------------- prompt + execution helpers ---------------------- */

import type { AiInsightsResult, AiResponse, WorkContext } from "./ai-types";

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

/** Rule-based analytical generator when external AI service is unreachable or rate-limited. */
export function generateHeuristicInsights(ctx: WorkContext): AiInsightsResult {
  const completedNames = ctx.completedTasks.map((t) => t.name);
  const pendingNames = ctx.pendingTasks.map((t) => t.name);
  const totalTasks = completedNames.length + pendingNames.length;
  const hours = ctx.hoursLogged;

  const achievements = ctx.logs
    .map((l) => l.achievement?.trim())
    .filter((a): a is string => Boolean(a));
  const challenges = ctx.logs
    .map((l) => l.challenges?.trim())
    .filter((c): c is string => Boolean(c));
  const logTomorrowPlans = ctx.logs
    .map((l) => l.tomorrowPlan?.trim())
    .filter((p): p is string => Boolean(p));

  let score = 70;
  if (hours >= 6) score += 15;
  else if (hours >= 4) score += 10;
  else if (hours >= 2) score += 5;

  if (totalTasks > 0) {
    const ratio = completedNames.length / totalTasks;
    score += Math.round(ratio * 15);
  }
  if (achievements.length > 0) score += 5;
  score = Math.max(20, Math.min(100, score));

  let scoreLabel = "Steady Progress";
  if (score >= 90) scoreLabel = "Exceptional Focus & Output";
  else if (score >= 80) scoreLabel = "High Productivity & Strong Output";
  else if (score >= 70) scoreLabel = "Solid Progress & Good Momentum";
  else if (score >= 50) scoreLabel = "Moderate Momentum";

  const headline = completedNames.length
    ? `Completed ${completedNames.length} task${completedNames.length > 1 ? "s" : ""} with ${hours}h focused execution`
    : `Logged ${hours} hour${hours !== 1 ? "s" : ""} of dedicated project work`;

  const summary =
    `Today's session logged a total of ${hours} hours across assigned initiatives. ` +
    (completedNames.length
      ? `Completed items include ${completedNames.slice(0, 3).join(", ")}. `
      : "Steady progress was recorded on active work streams. ") +
    (pendingNames.length
      ? `There are ${pendingNames.length} pending task${pendingNames.length > 1 ? "s" : ""} scheduled for upcoming delivery. `
      : "All tracked tasks for today are up to date. ") +
    (achievements.length ? `Notable win: ${achievements[0]}.` : "Continued positive momentum across project deliverables.");

  const strengths = [
    `Consistent time tracking with ${hours}h logged today`,
    ...(completedNames.length ? [`Shipped ${completedNames.length} completed deliverables`] : ["Maintained active momentum on core tasks"]),
    ...(achievements.length ? [`Demonstrated impact: ${achievements[0]}`] : ["Structured approach to managing project tasks"]),
  ].slice(0, 4);

  const improvements = [
    ...(pendingNames.length ? [`Prioritize wrapping up top pending items: ${pendingNames.slice(0, 2).join(", ")}`] : ["Define next iteration milestones early"]),
    ...(challenges.length ? [`Address recorded blockers: ${challenges[0]}`] : ["Break down multi-hour efforts into smaller sprint increments"]),
    "Review time estimates vs actual logged duration for future planning",
  ].slice(0, 4);

  const topFocus = pendingNames[0] || (logTomorrowPlans[0] ?? "Sprint execution and milestone completion");

  const schedule = [
    { time: "09:00 - 10:30", item: `Deep Work: ${topFocus}`, why: "Tackle the highest priority item during peak focus hours" },
    { time: "10:45 - 12:30", item: pendingNames[1] ? `Progress on ${pendingNames[1]}` : "Project execution & core implementation", why: "Maintain uninterrupted flow state" },
    { time: "13:30 - 15:00", item: "Review, QA testing & task verification", why: "Ensure quality standards and catch edge cases" },
    { time: "15:15 - 16:30", item: "Daily log entry & tomorrow planning", why: "Synthesize progress and update documentation" },
  ];

  const watchOuts = [
    ...(challenges.length ? [challenges[0]] : ["Avoid context switching across too many tasks simultaneously"]),
    "Ensure timely documentation of daily blockers to avoid sprint delays",
  ];

  return {
    summary: {
      headline,
      summary,
      completed: completedNames.length ? completedNames : ["Active project time logged"],
      pending: pendingNames.length ? pendingNames : ["No pending blockers"],
      highlights: achievements.length ? achievements : [headline],
    },
    productivity: {
      score,
      scoreLabel,
      rationale: `Productivity rated ${score}/100 based on ${hours} hours worked, completion of key milestones, and ongoing task management.`,
      strengths,
      improvements,
    },
    plan: {
      focus: topFocus,
      schedule,
      watchOuts,
    },
  };
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
