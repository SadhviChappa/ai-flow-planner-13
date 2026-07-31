import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* ---------------------------------- types --------------------------------- */

const TaskItem = z.object({
  name: z.string(),
  project: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
});

const WorkContextSchema = z.object({
  date: z.string(),
  hoursLogged: z.number(),
  completedTasks: z.array(TaskItem).max(50),
  pendingTasks: z.array(TaskItem).max(50),
  logs: z
    .array(
      z.object({
        project: z.string().optional(),
        task: z.string().optional(),
        hours: z.number(),
        description: z.string(),
        challenges: z.string().optional(),
        achievement: z.string().optional(),
        tomorrowPlan: z.string().optional(),
      }),
    )
    .max(50),
});

export type WorkContext = z.infer<typeof WorkContextSchema>;

export interface DailySummaryResult {
  headline: string;
  summary: string;
  completed: string[];
  pending: string[];
  highlights: string[];
}

export interface ProductivityResult {
  score: number;
  scoreLabel: string;
  rationale: string;
  strengths: string[];
  improvements: string[];
}

export interface TomorrowPlanResult {
  focus: string;
  schedule: { time: string; item: string; why?: string }[];
  watchOuts: string[];
}

export interface AiResponse<T> {
  ok: boolean;
  configured: boolean;
  data?: T;
  error?: string;
}

/* --------------------------------- helpers -------------------------------- */

function describeContext(ctx: WorkContext) {
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

const SYSTEM =
  "You are an experienced engineering productivity coach embedded in a work tracking app. " +
  "You write concise, specific, encouraging feedback grounded strictly in the data you are given. " +
  "Never invent tasks or hours that are not present. Respond only with JSON matching the requested schema.";

async function run<T>(
  build: () => Promise<T>,
): Promise<AiResponse<T>> {
  const { AiNotConfiguredError, AiRequestError, isGeminiConfigured } = await import("./ai.server");
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
    const message =
      error instanceof AiRequestError
        ? error.message
        : "Something went wrong while generating AI insights. Please try again.";
    return { ok: false, configured: true, error: message };
  }
}

/* ------------------------------ server functions --------------------------- */

export const getAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isGeminiConfigured, GEMINI_MODEL } = await import("./ai.server");
  return { configured: isGeminiConfigured(), model: GEMINI_MODEL };
});

export const generateDailySummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkContextSchema.parse(input))
  .handler(async ({ data }): Promise<AiResponse<DailySummaryResult>> =>
    run(async () => {
      const { generateJson } = await import("./ai.server");
      return generateJson<DailySummaryResult>({
        system: SYSTEM,
        prompt:
          "Write a professional daily work report from the data below. " +
          "The summary should be 3-5 sentences in a calm, factual tone.\n\n" +
          describeContext(data),
        schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            summary: { type: "string" },
            completed: { type: "array", items: { type: "string" } },
            pending: { type: "array", items: { type: "string" } },
            highlights: { type: "array", items: { type: "string" } },
          },
          required: ["headline", "summary", "completed", "pending", "highlights"],
        },
      });
    }),
  );

export const analyzeProductivity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkContextSchema.parse(input))
  .handler(async ({ data }): Promise<AiResponse<ProductivityResult>> =>
    run(async () => {
      const { generateJson } = await import("./ai.server");
      const result = await generateJson<ProductivityResult>({
        system: SYSTEM,
        prompt:
          "Analyse today's work and rate productivity from 0 to 100. " +
          "Give a short label for the score (e.g. 'Strong focus day'), a one-paragraph rationale, " +
          "2-4 concrete strengths and 2-4 specific improvement suggestions.\n\n" +
          describeContext(data),
        schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            scoreLabel: { type: "string" },
            rationale: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
          },
          required: ["score", "scoreLabel", "rationale", "strengths", "improvements"],
        },
      });
      return { ...result, score: Math.max(0, Math.min(100, Math.round(result.score ?? 0))) };
    }),
  );

export const planTomorrow = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkContextSchema.parse(input))
  .handler(async ({ data }): Promise<AiResponse<TomorrowPlanResult>> =>
    run(async () => {
      const { generateJson } = await import("./ai.server");
      return generateJson<TomorrowPlanResult>({
        system: SYSTEM,
        prompt:
          "Propose a realistic plan for tomorrow based on pending tasks, deadlines and today's progress. " +
          "Return a one-line primary focus, a schedule of 4-7 time blocks between 09:00 and 17:00, " +
          "and 1-3 things to watch out for.\n\n" +
          describeContext(data),
        schema: {
          type: "object",
          properties: {
            focus: { type: "string" },
            schedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  item: { type: "string" },
                  why: { type: "string" },
                },
                required: ["time", "item"],
              },
            },
            watchOuts: { type: "array", items: { type: "string" } },
          },
          required: ["focus", "schedule", "watchOuts"],
        },
      });
    }),
  );
