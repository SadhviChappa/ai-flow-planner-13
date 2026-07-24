import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useStore } from "@/lib/storage";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — AI Work Planner" },
      { name: "description", content: "Analyze productivity, hours, and completion." },
      { property: "og:title", content: "Reports — AI Work Planner" },
      { property: "og:description", content: "Analyze productivity, hours, and completion." },
    ],
  }),
  component: ReportsPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ReportsPage() {
  const [projects] = useStore("projects");
  const [tasks] = useStore("tasks");
  const [logs] = useStore("logs");

  const hoursByProject = useMemo(() => {
    return projects.map((p) => ({
      name: p.name,
      hours: logs.filter((l) => l.projectId === p.id).reduce((s, l) => s + Number(l.hours || 0), 0),
    }));
  }, [projects, logs]);

  const monthly = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const d = subDays(new Date(), 29 - i);
      const iso = d.toISOString().slice(0, 10);
      return {
        day: format(d, "MMM d"),
        hours: logs.filter((l) => l.date === iso).reduce((s, l) => s + Number(l.hours || 0), 0),
      };
    });
  }, [logs]);

  const tasksByPriority = useMemo(() => {
    const groups = { Low: 0, Medium: 0, High: 0 } as Record<string, number>;
    tasks.forEach((t) => (groups[t.priority] = (groups[t.priority] ?? 0) + 1));
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Reports" description="Insights across your projects, tasks, and time." />

      <Card className="card-soft">
        <CardHeader><CardTitle className="text-base">Last 30 days — hours logged</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} interval={3} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-soft">
          <CardHeader><CardTitle className="text-base">Hours by project</CardTitle></CardHeader>
          <CardContent className="h-72">
            {hoursByProject.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByProject} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} width={120} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="hours" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
        <Card className="card-soft">
          <CardHeader><CardTitle className="text-base">Tasks by priority</CardTitle></CardHeader>
          <CardContent className="h-72">
            {tasks.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tasksByPriority} innerRadius={50} outerRadius={90} dataKey="value">
                    {tasksByPriority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="grid h-full place-items-center text-sm text-muted-foreground">Not enough data yet.</div>;
}
