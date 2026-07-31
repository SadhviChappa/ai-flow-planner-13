import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Clock, NotebookPen } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { AiInsightsPanel } from "@/components/ai-insights-panel";
import { useWorkContext } from "@/hooks/use-work-context";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeletons";
import { useConfirm } from "@/components/confirm-dialog";
import { formatDate } from "@/lib/date";
import { useStore, uid, todayISO, type DailyLog } from "@/lib/storage";
import { useDataLoading } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/logs")({
  head: () => ({
    meta: [
      { title: "Daily Logs — AI Work Planner" },
      { name: "description", content: "Log your daily work, challenges, and plans." },
      { property: "og:title", content: "Daily Logs — AI Work Planner" },
      { property: "og:description", content: "Log your daily work, challenges, and plans." },
    ],
  }),
  component: LogsPage,
});

const emptyForm = {
  date: todayISO(),
  projectId: "",
  taskId: "",
  hours: 0,
  description: "",
  challenges: "",
  achievement: "",
  tomorrowPlan: "",
};

function LogsPage() {
  const loading = useDataLoading();
  const [projects] = useStore("projects");
  const [tasks] = useStore("tasks");
  const [logs, setLogs] = useStore("logs");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DailyLog | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { confirm, dialog } = useConfirm();
  const aiContext = useWorkContext(todayISO());


  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, date: todayISO(), projectId: projects[0]?.id ?? "" });
    setOpen(true);
  };

  const openEdit = (l: DailyLog) => {
    setEditing(l);
    setForm({
      date: l.date,
      projectId: l.projectId,
      taskId: l.taskId ?? "",
      hours: l.hours,
      description: l.description,
      challenges: l.challenges,
      achievement: l.achievement,
      tomorrowPlan: l.tomorrowPlan,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.projectId) return toast.error("Select a project");
    if (!projects.some((p) => p.id === form.projectId)) return toast.error("That project no longer exists");
    if (!form.date) return toast.error("Pick a date");
    if (form.date > todayISO()) return toast.error("You can't log work for a future date");
    if (form.hours < 0) return toast.error("Hours can't be negative");
    if (form.hours > 24) return toast.error("A single log can't exceed 24 hours");
    if (!form.description.trim()) return toast.error("Describe what you worked on");
    const payload = { ...form, taskId: form.taskId || undefined };
    if (editing) {
      setLogs((prev) => prev.map((l) => (l.id === editing.id ? { ...editing, ...payload } : l)));
      toast.success("Log updated");
    } else {
      const l: DailyLog = { id: uid(), createdAt: new Date().toISOString(), ...payload };
      setLogs((prev) => [l, ...prev]);
      toast.success("Log added");
    }
    setOpen(false);
  };

  const remove = (l: DailyLog) => {
    confirm({
      title: "Delete this log?",
      description: "The entry will be permanently removed.",
      confirmLabel: "Delete log",
      destructive: true,
      onConfirm: () => {
        setLogs((prev) => prev.filter((x) => x.id !== l.id));
        toast.success("Log deleted");
      },
    });
  };

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t.name]));

  const grouped = useMemo(() => {
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, DailyLog[]>();
    sorted.forEach((l) => {
      const arr = map.get(l.date) ?? [];
      arr.push(l);
      map.set(l.date, arr);
    });
    return Array.from(map.entries());
  }, [logs]);

  const todayHours = logs.filter((l) => l.date === todayISO()).reduce((s, l) => s + Number(l.hours || 0), 0);
  const projectTasks = tasks.filter((t) => t.projectId === form.projectId);

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Daily Logs"
        description="Capture what you worked on, what got in the way, and what's next."
        actions={
          <Button onClick={openNew} disabled={projects.length === 0} className="shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" /> Add Log
          </Button>
        }
      />


      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-soft hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{todayHours.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Logged today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-soft hover-lift">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold tracking-tight">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total logs</p>
          </CardContent>
        </Card>
        <Card className="card-soft hover-lift">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold tracking-tight">
              {logs.reduce((s, l) => s + Number(l.hours || 0), 0).toFixed(1)}h
            </p>
            <p className="text-xs text-muted-foreground">All-time hours</p>
          </CardContent>
        </Card>
      </div>

      <AiInsightsPanel context={aiContext} />


      {loading ? (
        <ListSkeleton count={4} />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No logs yet"
          description="Capture your first entry to build a timeline of your work."
          action={
            projects.length > 0 ? (
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" /> Add Log
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="relative space-y-8 border-l pl-6">
          {grouped.map(([date, items]) => {
            const dayHours = items.reduce((s, l) => s + Number(l.hours || 0), 0);
            return (
              <section key={date} className="relative">
                <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {formatDate(date, "d")}
                </span>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{formatDate(date, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">{items.length} entries • {dayHours}h total</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {items.map((l) => (
                    <Card key={l.id} className="card-soft transition-all hover:shadow-[var(--shadow-elevated)] animate-fade-in-up">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{projectMap[l.projectId] ?? "—"}</span>
                              {l.taskId && <span className="text-sm text-muted-foreground">• {taskMap[l.taskId] ?? "Task"}</span>}
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{l.hours}h</span>
                            </div>
                            <p className="mt-2 text-sm">{l.description}</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                              {l.achievement && (
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--success)]">Achievement</p>
                                  <p className="text-muted-foreground">{l.achievement}</p>
                                </div>
                              )}
                              {l.challenges && (
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--warning)]">Challenges</p>
                                  <p className="text-muted-foreground">{l.challenges}</p>
                                </div>
                              )}
                              {l.tomorrowPlan && (
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--info)]">Tomorrow</p>
                                  <p className="text-muted-foreground">{l.tomorrowPlan}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(l)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(l)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit log" : "New daily log"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Hours worked</Label>
              <Input type="number" min={0} step={0.25} value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v, taskId: "" })}>
                <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Task (optional)</Label>
              <Select value={form.taskId || "none"} onValueChange={(v) => setForm({ ...form, taskId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="No task" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {projectTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Work description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What did you work on?" />
            </div>
            <div className="space-y-2">
              <Label>Challenges faced</Label>
              <Textarea rows={2} value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Today's achievement</Label>
              <Textarea rows={2} value={form.achievement} onChange={(e) => setForm({ ...form, achievement: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Tomorrow's plan</Label>
              <Textarea rows={2} value={form.tomorrowPlan} onChange={(e) => setForm({ ...form, tomorrowPlan: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialog}
    </div>
  );
}
