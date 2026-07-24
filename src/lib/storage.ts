import { useCallback, useEffect, useState } from "react";

export type Priority = "Low" | "Medium" | "High";
export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type TaskStatus = "Not Started" | "In Progress" | "Completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string; // ISO date
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
  date: string; // ISO date (yyyy-mm-dd)
  projectId: string;
  taskId?: string;
  hours: number;
  description: string;
  challenges: string;
  achievement: string;
  tomorrowPlan: string;
  createdAt: string;
}

const KEYS = {
  projects: "awp.projects",
  tasks: "awp.tasks",
  logs: "awp.logs",
  auth: "awp.auth",
} as const;

type Key = keyof typeof KEYS;
type Shape = {
  projects: Project[];
  tasks: Task[];
  logs: DailyLog[];
  auth: { email: string; name: string } | null;
};

function read<K extends Key>(key: K): Shape[K] {
  if (typeof window === "undefined") return (key === "auth" ? null : []) as Shape[K];
  try {
    const raw = window.localStorage.getItem(KEYS[key]);
    if (!raw) return (key === "auth" ? null : []) as Shape[K];
    return JSON.parse(raw) as Shape[K];
  } catch {
    return (key === "auth" ? null : []) as Shape[K];
  }
}

function write<K extends Key>(key: K, value: Shape[K]) {
  window.localStorage.setItem(KEYS[key], JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(`awp:${key}`));
}

export function useStore<K extends Key>(key: K): [Shape[K], (v: Shape[K] | ((prev: Shape[K]) => Shape[K])) => void] {
  const [state, setState] = useState<Shape[K]>(() => (key === "auth" ? null : []) as Shape[K]);

  useEffect(() => {
    setState(read(key));
    const handler = () => setState(read(key));
    window.addEventListener(`awp:${key}`, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(`awp:${key}`, handler);
      window.removeEventListener("storage", handler);
    };
  }, [key]);

  const update = useCallback(
    (v: Shape[K] | ((prev: Shape[K]) => Shape[K])) => {
      const next = typeof v === "function" ? (v as (p: Shape[K]) => Shape[K])(read(key)) : v;
      write(key, next);
      setState(next);
    },
    [key],
  );

  return [state, update];
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const todayISO = () => new Date().toISOString().slice(0, 10);
