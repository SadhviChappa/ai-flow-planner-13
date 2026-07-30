import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
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
};
type DataKey = keyof Shape;

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const todayISO = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- session ---
let cachedSession: Session | null = null;
let sessionReady = false;
const sessionListeners = new Set<() => void>();
let sessionInit = false;

function emitSession() {
  sessionListeners.forEach((cb) => cb());
}

function setSession(next: Session | null) {
  const changedUser = cachedSession?.user.id !== next?.user.id;
  cachedSession = next;
  sessionReady = true;
  if (changedUser) resetAllSlices();
  emitSession();
  if (changedUser) void loadAll();
}

function ensureSessionInit() {
  if (sessionInit || typeof window === "undefined") return;
  sessionInit = true;
  supabase.auth.getSession().then(({ data }) => setSession(data.session));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") {
      cachedSession = session;
      return;
    }
    setSession(session);
  });
}

export function useSession() {
  useEffect(ensureSessionInit, []);
  return useSyncExternalStore(
    (cb) => {
      sessionListeners.add(cb);
      return () => sessionListeners.delete(cb);
    },
    () => cachedSession,
    () => null,
  );
}

export function useSessionReady() {
  useEffect(ensureSessionInit, []);
  return useSyncExternalStore(
    (cb) => {
      sessionListeners.add(cb);
      return () => sessionListeners.delete(cb);
    },
    () => sessionReady,
    () => false,
  );
}

// ------------------------------------------------------------------ specs ---
type Row = Record<string, unknown>;

interface TableSpec<T extends { id: string }> {
  table: "projects" | "tasks" | "daily_logs";
  fromRow: (r: Row) => T;
  toInsert: (v: T) => Row;
  toUpdate: (v: T) => Row;
}

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

const projectsSpec: TableSpec<Project> = {
  table: "projects",
  fromRow: (r) => ({
    id: r.id as string,
    name: str(r.name),
    description: str(r.description),
    deadline: str(r.deadline),
    priority: (str(r.priority, "Medium") as Priority),
    status: (str(r.status, "Planning") as ProjectStatus),
    createdAt: str(r.created_at),
  }),
  toInsert: (p) => ({ id: p.id, ...projectsSpec.toUpdate(p) }),
  toUpdate: (p) => ({
    name: p.name.trim(),
    description: p.description.trim(),
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
    name: str(r.name),
    description: str(r.description),
    dueDate: str(r.due_date),
    priority: (str(r.priority, "Medium") as Priority),
    status: (str(r.status, "Not Started") as TaskStatus),
    estimatedHours: Number(r.estimated_hours ?? 0),
    actualHours: Number(r.actual_hours ?? 0),
    createdAt: str(r.created_at),
  }),
  toInsert: (t) => ({ id: t.id, ...tasksSpec.toUpdate(t) }),
  toUpdate: (t) => ({
    project_id: t.projectId,
    name: t.name.trim(),
    description: t.description.trim(),
    due_date: t.dueDate,
    priority: t.priority,
    status: t.status,
    estimated_hours: Number.isFinite(t.estimatedHours) ? t.estimatedHours : 0,
    actual_hours: Number.isFinite(t.actualHours) ? t.actualHours : 0,
  }),
};

const logsSpec: TableSpec<DailyLog> = {
  table: "daily_logs",
  fromRow: (r) => ({
    id: r.id as string,
    date: str(r.date),
    projectId: r.project_id as string,
    taskId: (r.task_id as string | null) ?? undefined,
    hours: Number(r.hours ?? 0),
    description: str(r.description),
    challenges: str(r.challenges),
    achievement: str(r.achievement),
    tomorrowPlan: str(r.tomorrow_plan),
    createdAt: str(r.created_at),
  }),
  toInsert: (l) => ({ id: l.id, ...logsSpec.toUpdate(l) }),
  toUpdate: (l) => ({
    date: l.date,
    project_id: l.projectId,
    task_id: l.taskId ?? null,
    hours: Number.isFinite(l.hours) ? l.hours : 0,
    description: l.description.trim(),
    challenges: l.challenges.trim(),
    achievement: l.achievement.trim(),
    tomorrow_plan: l.tomorrowPlan.trim(),
  }),
};

const specs: Record<DataKey, TableSpec<{ id: string }>> = {
  projects: projectsSpec as unknown as TableSpec<{ id: string }>,
  tasks: tasksSpec as unknown as TableSpec<{ id: string }>,
  logs: logsSpec as unknown as TableSpec<{ id: string }>,
};

// ------------------------------------------------------------ shared store ---
type Slice = { data: { id: string }[]; loading: boolean };

const emptySlice: Slice = { data: [], loading: true };

const slices: Record<DataKey, Slice> = {
  projects: { data: [], loading: true },
  tasks: { data: [], loading: true },
  logs: { data: [], loading: true },
};
const sliceListeners: Record<DataKey, Set<() => void>> = {
  projects: new Set(),
  tasks: new Set(),
  logs: new Set(),
};
const inFlight: Partial<Record<DataKey, Promise<void>>> = {};

function setSlice(key: DataKey, next: Slice) {
  slices[key] = next;
  sliceListeners[key].forEach((cb) => cb());
}

function resetAllSlices() {
  (Object.keys(slices) as DataKey[]).forEach((k) =>
    setSlice(k, { data: [], loading: Boolean(cachedSession) }),
  );
}

function orderRows<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

function friendly(error: { message?: string; code?: string } | null | undefined) {
  const msg = error?.message ?? "Unexpected error";
  if (error?.code === "23505") return "That record already exists.";
  if (error?.code === "23503") return "Related project or task no longer exists.";
  if (/JWT|token|session/i.test(msg)) return "Your session expired — please sign in again.";
  if (/fetch|network/i.test(msg)) return "Network problem — check your connection and retry.";
  return msg;
}

async function loadSlice(key: DataKey): Promise<void> {
  if (!cachedSession) {
    setSlice(key, { data: [], loading: false });
    return;
  }
  if (inFlight[key]) return inFlight[key];
  const spec = specs[key];
  const p = (async () => {
    setSlice(key, { data: slices[key].data, loading: true });
    const { data, error } = await supabase
      .from(spec.table)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(`[${spec.table}] load`, error);
      toast.error(`Couldn't load ${key}`, { description: friendly(error) });
      setSlice(key, { data: slices[key].data, loading: false });
      return;
    }
    const rows = orderRows(
      (data ?? []).map((r) => spec.fromRow(r as Row)) as { id: string; createdAt: string }[],
    );
    setSlice(key, { data: rows, loading: false });
  })().finally(() => {
    delete inFlight[key];
  });
  inFlight[key] = p;
  return p;
}

async function loadAll() {
  await Promise.all((Object.keys(slices) as DataKey[]).map(loadSlice));
}

export async function refreshAll() {
  await loadAll();
}

async function syncDiff(key: DataKey, prev: { id: string }[], next: { id: string }[]) {
  const spec = specs[key];
  const prevById = new Map(prev.map((x) => [x.id, x]));
  const nextById = new Map(next.map((x) => [x.id, x]));

  const toInsert: { id: string }[] = [];
  const toUpdate: { id: string }[] = [];
  for (const item of next) {
    const before = prevById.get(item.id);
    if (!before) toInsert.push(item);
    else if (JSON.stringify(before) !== JSON.stringify(item)) toUpdate.push(item);
  }
  const toDeleteIds = prev.filter((item) => !nextById.has(item.id)).map((x) => x.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const ops: Promise<{ error?: unknown }>[] = [];

  if (toInsert.length) {
    ops.push(
      Promise.resolve(
        client.from(spec.table).upsert(toInsert.map(spec.toInsert), { onConflict: "id" }),
      ),
    );
  }
  for (const item of toUpdate) {
    ops.push(Promise.resolve(client.from(spec.table).update(spec.toUpdate(item)).eq("id", item.id)));
  }
  if (toDeleteIds.length) {
    ops.push(Promise.resolve(client.from(spec.table).delete().in("id", toDeleteIds)));
  }

  const results = await Promise.all(ops);
  const failed = results.find((r) => r?.error) as { error?: { message?: string } } | undefined;
  if (failed?.error) {
    console.error(`[${spec.table}] sync`, failed.error);
    toast.error("Changes couldn't be saved", { description: friendly(failed.error) });
    // Roll back to server truth so the UI never shows phantom data.
    await loadSlice(key);
    return false;
  }
  return true;
}

function useSlice<K extends DataKey>(
  key: K,
): [Shape[K], (v: Shape[K] | ((p: Shape[K]) => Shape[K])) => void] {
  const session = useSession();
  const slice = useSyncExternalStore(
    (cb) => {
      sliceListeners[key].add(cb);
      return () => sliceListeners[key].delete(cb);
    },
    () => slices[key],
    () => emptySlice,
  );

  useEffect(() => {
    if (session && slices[key].loading && !inFlight[key]) void loadSlice(key);
  }, [session, key]);

  const update = useCallback(
    (v: Shape[K] | ((p: Shape[K]) => Shape[K])) => {
      const prev = slices[key].data as unknown as Shape[K];
      const next = typeof v === "function" ? (v as (p: Shape[K]) => Shape[K])(prev) : v;
      setSlice(key, { data: next as unknown as { id: string }[], loading: false });
      if (!cachedSession) return;
      void syncDiff(key, prev as unknown as { id: string }[], next as unknown as { id: string }[]);
    },
    [key],
  );

  return [slice.data as unknown as Shape[K], update];
}

/** True while any of the workspace collections are still loading. */
export function useDataLoading(...keys: DataKey[]): boolean {
  const watched = keys.length ? keys : (Object.keys(slices) as DataKey[]);
  const sessionKnown = useSessionReady();
  const projects = useSyncExternalStore(
    (cb) => {
      watched.forEach((k) => sliceListeners[k].add(cb));
      return () => watched.forEach((k) => sliceListeners[k].delete(cb));
    },
    () => watched.map((k) => slices[k].loading).join(","),
    () => "true",
  );
  return !sessionKnown || projects.includes("true");
}

// -------------------------------------------------------------- auth store ---
function useAuthStore(): [AuthShape, (v: AuthShape | ((p: AuthShape) => AuthShape)) => void] {
  const session = useSession();
  const [profile, setProfile] = useState<AuthShape>(null);

  useEffect(() => {
    let cancelled = false;
    const user = session?.user;
    if (!user) {
      setProfile(null);
      return;
    }
    const fallback: AuthShape = {
      email: user.email ?? "",
      name:
        (user.user_metadata?.full_name as string) ||
        user.email?.split("@")[0] ||
        "",
    };
    setProfile(fallback);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || error || !data) return;
      setProfile({
        email: str(data.email) || fallback.email,
        name: str(data.full_name) || fallback.name,
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
      const userId = session?.user.id;
      setProfile(next);
      if (!userId) return;
      void (async () => {
        const { error } = await supabase
          .from("profiles")
          .upsert({ id: userId, full_name: next.name.trim(), email: next.email.trim() })
          .eq("id", userId);
        if (error) {
          console.error("[profiles] update", error);
          toast.error("Profile not saved", { description: friendly(error) });
        }
      })();
    },
    [profile, session],
  );

  return [profile, update];
}

// ------------------------------------------------------------- public API ---
export function useStore(key: "auth"): ReturnType<typeof useAuthStore>;
export function useStore(key: "projects"): [Project[], (v: Project[] | ((p: Project[]) => Project[])) => void];
export function useStore(key: "tasks"): [Task[], (v: Task[] | ((p: Task[]) => Task[])) => void];
export function useStore(key: "logs"): [DailyLog[], (v: DailyLog[] | ((p: DailyLog[]) => DailyLog[])) => void];
export function useStore(key: DataKey | "auth"): unknown {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (key === "auth") return useAuthStore();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSlice(key);
}
