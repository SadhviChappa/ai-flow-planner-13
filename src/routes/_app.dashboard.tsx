import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  TrendingUp,
  Timer,
  CalendarClock,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/priority-badge";
import { StatsSkeleton, ChartSkeleton } from "@/components/loading-skeletons";
import { formatDate, isValidDateString } from "@/lib/date";
import { useStore, todayISO } from "@/lib/storage";
import { useDataLoading } from "@/lib/storage";
import { format, isToday, differenceInCalendarDays, subDays, parseISO } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Work Planner" },
      { name: "description", content: "Overview of your projects, tasks, hours, and productivity." },
      { property: "og:title", content: "Dashboard — AI Work Planner" },
      { property: "og:description", content: "Your work at a glance." },
    ],
  }),
  component: DashboardPage,
});

const COLORS = ["var(--chart-2)", "var(--chart-3)", "var(--chart-1)"];

function DashboardPage() {
  const loading = useDataLoading();
  const [projects] = useStore("projects");
  const [tasks] = useStore("tasks");
  const [logs] = useStore("logs");

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const pending = tasks.filter((t) => t.status === "Not Started").length;
  const progressPct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const todayHours = logs.filter((l) => l.date === todayISO()).reduce((s, l) => s + Number(l.hours || 0), 0);

  const pieData = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Not Started", value: pending },
  ].filter((d) => d.value > 0);

  const weekly = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const iso = d.toISOString().slice(0, 10);
      return {
        day: format(d, "EEE"),
        hours: logs.filter((l) => l.date === iso).reduce((s, l) => s + Number(l.hours || 0), 0),
      };
    });
    return days;
  }, [logs]);

  const upcoming = useMemo(() => {
    return [...tasks]
      .filter((t) => t.status !== "Completed" && isValidDateString(t.dueDate))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

  const recentLogs = useMemo(
    () => [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [logs],
  );

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const stats = [
    { label: "Total Projects", value: projects.length, icon: FolderKanban, tone: "bg-primary/10 text-primary" },
    { label: "Total Tasks", value: tasks.length, icon: CheckSquare, tone: "bg-info/10 text-[color:var(--info)]" },
    { label: "Completed", value: completed, icon: TrendingUp, tone: "bg-success/10 text-[color:var(--success)]" },
    { label: "In Progress", value: inProgress, icon: Activity, tone: "bg-warning/10 text-[color:var(--warning)]" },
    { label: "Pending", value: pending, icon: Clock, tone: "bg-muted text-muted-foreground" },
    { label: "Today's Hours", value: todayHours.toFixed(1), icon: Timer, tone: "bg-accent text-accent-foreground" },
  ];

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Dashboard" description="Your work at a glance." />

      {loading ? (
        <>
          <StatsSkeleton />
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartSkeleton className="h-72 lg:col-span-2" />
            <ChartSkeleton className="h-72" />
          </div>
        </>
      ) : (
      <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            className="card-soft hover-lift animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <CardContent className="p-4">
              <div className={`grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="text-base">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{completed} of {tasks.length} tasks completed</span>
            <span className="font-semibold">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="mt-2 h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Weekly Productivity</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader>
            <CardTitle className="text-base">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={90} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No tasks yet — add some to see distribution.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" /> Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length ? (
              <ul className="divide-y">
                {upcoming.map((t) => {
                  const days = differenceInCalendarDays(parseISO(t.dueDate), new Date());
                  return (
                    <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {projectMap[t.projectId] ?? "No project"} • Due {formatDate(t.dueDate, "MMM d")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.status} />
                        <span className={`text-xs font-medium ${days < 0 ? "text-destructive" : days <= 2 ? "text-[color:var(--warning)]" : "text-muted-foreground"}`}>
                          {days < 0 ? `${-days}d overdue` : days === 0 ? "Today" : `${days}d left`}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyRow message="No upcoming deadlines." to="/tasks" cta="Add a task" />
            )}
          </CardContent>
        </Card>

        <Card className="card-soft">
          <CardHeader>
            <CardTitle className="text-base">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="grid place-items-center">
            <Calendar mode="single" selected={new Date()} className="p-0 pointer-events-auto" />
          </CardContent>
        </Card>
      </div>

      <Card className="card-soft">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length ? (
            <ol className="relative space-y-4 border-l pl-5">
              {recentLogs.map((l) => (
                <li key={l.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </span>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {projectMap[l.projectId] ?? "Log"} — {l.hours}h
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {isValidDateString(l.date) && isToday(parseISO(l.date)) ? "Today" : formatDate(l.date, "MMM d")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{l.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyRow message="No logs yet." to="/logs" cta="Add today's log" />
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}

function EmptyRow({ message, to, cta }: { message: string; to: string; cta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed p-6 text-sm">
      <span className="text-muted-foreground">{message}</span>
      <Link to={to} className="font-medium text-primary hover:underline">{cta} →</Link>
    </div>
  );
}
