import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Priority = "Low" | "Medium" | "High";
export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type TaskStatus = "Not Started" | "In Progress" | "Completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  priority: Priority;
  status: ProjectStatus;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  date: string;
  projectId: string;
  taskId?: string;
  hours: number;
  description: string;
  challenges: string;
  achievement: string;
  tomorrowPlan: string;
  createdAt: string;
}

export type AuthShape = { email: string; name: string } | null;

type Shape = {
  projects: Project[];
  tasks: Task[];
  logs: DailyLog[];
  auth: AuthShape;
};
type Key = keyof Shape;

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const todayISO = () => new Date().toISOString().slice(0, 10);

// ---------- session tracking ----------
let cachedSession: Session | null = null;
const sessionListeners = new Set<(s: Session | null) => void>();
let sessionInit = false;

function ensureSessionInit() {
  if (sessionInit || typeof window === "undefined") return;
  sessionInit = true;
  supabase.auth.getSession().then(({ data }) => {
    cachedSession = data.session;
    sessionListeners.forEach((cb) => cb(cachedSession));
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    cachedSession = session;
    sessionListeners.forEach((cb) => cb(cachedSession));
  });
}

function useSession() {
  const [session, setSession] = useState<Session | null>(cachedSession);
  useEffect(() => {
    ensureSessionInit();
    setSession(cachedSession);
    const cb = (s: Session | null) => setSession(s);
    sessionListeners.add(cb);
    return () => {
      sessionListeners.delete(cb);
    };
  }, []);
  return session;
}

// ---------- table mappers ----------
type Row = Record<string, unknown>;

interface TableSpec<T extends { id: string }> {
  table: "projects" | "tasks" | "daily_logs";
  fromRow: (r: Row) => T;
  toInsert: (v: T) => Row;
  toUpdate: (v: T) => Row;
}

const projectsSpec: TableSpec<Project> = {
  table: "projects",
  fromRow: (r) => ({
    id: r.id as string,
    name: (r.name as string) ?? "",
    description: (r.description as string) ?? "",
    deadline: (r.deadline as string) ?? "",
    priority: (r.priority as Priority) ?? "Medium",
    status: (r.status as ProjectStatus) ?? "Planning",
    createdAt: (r.created_at as string) ?? "",
  }),
  toInsert: (p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    deadline: p.deadline,
    priority: p.priority,
    status: p.status,
  }),
  toUpdate: (p) => ({
    name: p.name,
    description: p.description,
    deadline: p.deadline,
    priority: p.priority,
    status: p.status,
  }),
};

const tasksSpec: TableSpec<Task> = {
  table: "tasks",
  fromRow: (r) => ({
    id: r.id as string,
    projectId: r.project_id as string,
    name: (r.name as string) ?? "",
    description: (r.description as string) ?? "",
    dueDate: (r.due_date as string) ?? "",
    priority: (r.priority as Priority) ?? "Medium",
    status: (r.status as TaskStatus) ?? "Not Started",
    estimatedHours: Number(r.estimated_hours ?? 0),
    actualHours: Number(r.actual_hours ?? 0),
    createdAt: (r.created_at as string) ?? "",
  }),
  toInsert: (t) => ({
    id: t.id,
    project_id: t.projectId,
    name: t.name,
    description: t.description,
    due_date: t.dueDate,
    priority: t.priority,
    status: t.status,
    estimated_hours: t.estimatedHours,
    actual_hours: t.actualHours,
  }),
  toUpdate: (t) => ({
    project_id: t.projectId,
    name: t.name,
    description: t.description,
    due_date: t.dueDate,
    priority: t.priority,
    status: t.status,
    estimated_hours: t.estimatedHours,
    actual_hours: t.actualHours,
  }),
};

const logsSpec: TableSpec<DailyLog> = {
  table: "daily_logs",
  fromRow: (r) => ({
    id: r.id as string,
    date: (r.date as string) ?? "",
    projectId: r.project_id as string,
    taskId: (r.task_id as string | null) ?? undefined,
    hours: Number(r.hours ?? 0),
    description: (r.description as string) ?? "",
    challenges: (r.challenges as string) ?? "",
    achievement: (r.achievement as string) ?? "",
    tomorrowPlan: (r.tomorrow_plan as string) ?? "",
    createdAt: (r.created_at as string) ?? "",
  }),
  toInsert: (l) => ({
    id: l.id,
    date: l.date,
    project_id: l.projectId,
    task_id: l.taskId ?? null,
    hours: l.hours,
    description: l.description,
    challenges: l.challenges,
    achievement: l.achievement,
    tomorrow_plan: l.tomorrowPlan,
  }),
  toUpdate: (l) => ({
    date: l.date,
    project_id: l.projectId,
    task_id: l.taskId ?? null,
    hours: l.hours,
    description: l.description,
    challenges: l.challenges,
    achievement: l.achievement,
    tomorrow_plan: l.tomorrowPlan,
  }),
};

const specs = { projects: projectsSpec, tasks: tasksSpec, logs: logsSpec } as const;

function orderRows<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

async function syncDiff<T extends { id: string }>(
  spec: TableSpec<T>,
  prev: T[],
  next: T[],
) {
  const prevById = new Map(prev.map((x) => [x.id, x]));
  const nextById = new Map(next.map((x) => [x.id, x]));

  const toInsert: T[] = [];
  const toUpdate: T[] = [];
  for (const item of next) {
    const before = prevById.get(item.id);
    if (!before) toInsert.push(item);
    else if (JSON.stringify(before) !== JSON.stringify(item)) toUpdate.push(item);
  }
  const toDeleteIds: string[] = [];
  for (const item of prev) if (!nextById.has(item.id)) toDeleteIds.push(item.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const ops: Promise<unknown>[] = [];
  if (toInsert.length) {
    ops.push(
      Promise.resolve(
        client.from(spec.table).insert(toInsert.map(spec.toInsert)),
      ).then((res: { error?: unknown }) => {
        if (res?.error) console.error(`[${spec.table}] insert`, res.error);
      }),
    );
  }
  for (const item of toUpdate) {
    ops.push(
      Promise.resolve(
        client.from(spec.table).update(spec.toUpdate(item)).eq("id", item.id),
      ).then((res: { error?: unknown }) => {
        if (res?.error) console.error(`[${spec.table}] update`, res.error);
      }),
    );
  }
  if (toDeleteIds.length) {
    ops.push(
      Promise.resolve(
        client.from(spec.table).delete().in("id", toDeleteIds),
      ).then((res: { error?: unknown }) => {
        if (res?.error) console.error(`[${spec.table}] delete`, res.error);
      }),
    );
  }
  await Promise.all(ops);
}


// ---------- table hook ----------
function useTableStore<K extends "projects" | "tasks" | "logs">(
  key: K,
): [Shape[K], (v: Shape[K] | ((p: Shape[K]) => Shape[K])) => void] {
  const spec = specs[key] as TableSpec<Shape[K][number]>;
  const session = useSession();
  const userId = session?.user.id ?? null;
  const [state, setState] = useState<Shape[K]>([] as unknown as Shape[K]);
  const stateRef = useRef<Shape[K]>(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setState([] as unknown as Shape[K]);
      return;
    }
    (async () => {
      const { data, error } = await supabase.from(spec.table).select("*");
      if (cancelled) return;
      if (error) {
        console.error(`[${spec.table}] load`, error);
        return;
      }
      const rows = orderRows((data ?? []).map((r) => spec.fromRow(r as Row))) as Shape[K];
      setState(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, spec]);

  const update = useCallback(
    (v: Shape[K] | ((p: Shape[K]) => Shape[K])) => {
      const prev = stateRef.current;
      const next =
        typeof v === "function"
          ? (v as (p: Shape[K]) => Shape[K])(prev)
          : v;
      setState(next);
      if (!userId) return;
      void syncDiff(
        spec as unknown as TableSpec<{ id: string }>,
        prev as unknown as { id: string }[],
        next as unknown as { id: string }[],
      );

    },
    [spec, userId],
  );

  return [state, update];
}

// ---------- auth hook ----------
function useAuthStore(): [AuthShape, (v: AuthShape | ((p: AuthShape) => AuthShape)) => void] {
  const session = useSession();
  const [profile, setProfile] = useState<AuthShape>(null);

  useEffect(() => {
    let cancelled = false;
    if (!session?.user) {
      setProfile(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile({
        email: (data?.email as string) ?? session.user.email ?? "",
        name:
          (data?.full_name as string) ||
          (session.user.user_metadata?.full_name as string) ||
          session.user.email?.split("@")[0] ||
          "",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const update = useCallback(
    (v: AuthShape | ((p: AuthShape) => AuthShape)) => {
      const next = typeof v === "function" ? (v as (p: AuthShape) => AuthShape)(profile) : v;
      if (next === null) {
        setProfile(null);
        void supabase.auth.signOut();
        return;
      }
      setProfile(next);
      const uid = session?.user.id;
      if (!uid) return;
      void supabase
        .from("profiles")
        .update({ full_name: next.name, email: next.email })
        .eq("id", uid)
        .then(({ error }) => {
          if (error) console.error("[profiles] update", error);
        });
    },
    [profile, session],
  );

  return [profile, update];
}

// ---------- public API (overloaded) ----------
export function useStore(key: "auth"): ReturnType<typeof useAuthStore>;
export function useStore(key: "projects"): [Project[], (v: Project[] | ((p: Project[]) => Project[])) => void];
export function useStore(key: "tasks"): [Task[], (v: Task[] | ((p: Task[]) => Task[])) => void];
export function useStore(key: "logs"): [DailyLog[], (v: DailyLog[] | ((p: DailyLog[]) => DailyLog[])) => void];
export function useStore(key: Key): unknown {
  if (key === "auth") return useAuthStore();
  return useTableStore(key as "projects" | "tasks" | "logs");
}
