import { useMemo } from "react";
import { useStore, todayISO } from "@/lib/storage";
import type { WorkContext } from "@/lib/ai-types";

/** Builds the AI work context (today's tasks, hours, logs) from the live store. */
export function useWorkContext(date: string = todayISO()): WorkContext {
  const [auth] = useStore("auth");
  const [projects] = useStore("projects");
  const [tasks] = useStore("tasks");
  const [logs] = useStore("logs");

  return useMemo(() => {
    const projectName = (id: string) => projects.find((p) => p.id === id)?.name;
    const taskName = (id?: string) => (id ? tasks.find((t) => t.id === id)?.name : undefined);

    const dayLogs = logs.filter((l) => l.date === date);

    return {
      date,
      apiKey: auth?.geminiApiKey || undefined,
      hoursLogged: Number(dayLogs.reduce((s, l) => s + Number(l.hours || 0), 0).toFixed(2)),
      completedTasks: tasks
        .filter((t) => t.status === "Completed")
        .slice(0, 50)
        .map((t) => ({
          name: t.name,
          project: projectName(t.projectId),
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate || undefined,
        })),
      pendingTasks: tasks
        .filter((t) => t.status !== "Completed")
        .slice(0, 50)
        .map((t) => ({
          name: t.name,
          project: projectName(t.projectId),
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate || undefined,
        })),
      logs: dayLogs.slice(0, 50).map((l) => ({
        project: projectName(l.projectId),
        task: taskName(l.taskId),
        hours: Number(l.hours || 0),
        description: l.description,
        challenges: l.challenges || undefined,
        achievement: l.achievement || undefined,
        tomorrowPlan: l.tomorrowPlan || undefined,
      })),
    };
  }, [auth, projects, tasks, logs, date]);
}

export function hasWorkData(ctx: WorkContext) {
  return ctx.logs.length > 0 || ctx.pendingTasks.length > 0 || ctx.completedTasks.length > 0;
}
