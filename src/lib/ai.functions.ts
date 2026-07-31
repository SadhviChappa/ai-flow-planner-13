import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  AiResponse,
  DailySummaryResult,
  ProductivityResult,
  TomorrowPlanResult,
} from "./ai-types";

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

export const getAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isGeminiConfigured, GEMINI_MODEL } = await import("./ai.server");
  return { configured: isGeminiConfigured(), model: GEMINI_MODEL };
});

export const generateDailySummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkContextSchema.parse(input))
  .handler(async ({ data }): Promise<AiResponse<DailySummaryResult>> => {
    const { generateJson, runAi, describeContext, AI_SYSTEM_PROMPT } = await import("./ai.server");
    return runAi(() =>
      generateJson<DailySummaryResult>({
        system: AI_SYSTEM_PROMPT,
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
      }),
    );
  });

export const analyzeProductivity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkContextSchema.parse(input))
  .handler(async ({ data }): Promise<AiResponse<ProductivityResult>> => {
    const { generateJson, runAi, describeContext, AI_SYSTEM_PROMPT } = await import("./ai.server");
    return runAi(async () => {
      const result = await generateJson<ProductivityResult>({
        system: AI_SYSTEM_PROMPT,
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
    });
  });

export const planTomorrow = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => WorkContextSchema.parse(input))
  .handler(async ({ data }): Promise<AiResponse<TomorrowPlanResult>> => {
    const { generateJson, runAi, describeContext, AI_SYSTEM_PROMPT } = await import("./ai.server");
    return runAi(() =>
      generateJson<TomorrowPlanResult>({
        system: AI_SYSTEM_PROMPT,
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
      }),
    );
  });
