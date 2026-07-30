import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  Circle,
  ArrowUpDown,
  CheckSquare,
  Folder,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { PriorityBadge, StatusBadge } from "@/components/priority-badge";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeletons";
import { useConfirm } from "@/components/confirm-dialog";
import { formatDate } from "@/lib/date";
import { useStore, uid, type Priority, type Task, type TaskStatus } from "@/lib/storage";
import { useDataLoading } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — AI Work Planner" },
      { name: "description", content: "Manage tasks across your projects." },
      { property: "og:title", content: "Tasks — AI Work Planner" },
      { property: "og:description", content: "Manage tasks across your projects." },
    ],
  }),
  component: TasksPage,
});

const emptyForm = {
  projectId: "",
  name: "",
  description: "",
  dueDate: "",
  priority: "Medium" as Priority,
  status: "Not Started" as TaskStatus,
  estimatedHours: 0,
  actualHours: 0,
};

function TasksPage() {
  const loading = useDataLoading();
  const [projects] = useStore("projects");
  const [tasks, setTasks] = useStore("tasks");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { confirm, dialog } = useConfirm();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const filtered = useMemo(() => {
    let list = tasks;
    if (q) list = list.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase()));
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter);
    list = [...list].sort((a, b) => {
      const av = a.dueDate || "9999";
      const bv = b.dueDate || "9999";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [tasks, q, statusFilter, priorityFilter, sortDir]);

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, projectId: projects[0]?.id ?? "" });
    setOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      projectId: t.projectId,
      name: t.name,
      description: t.description,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      estimatedHours: t.estimatedHours,
      actualHours: t.actualHours,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Task name is required");
    if (!form.projectId) return toast.error("Select a project");
    if (editing) {
      setTasks((prev) => prev.map((t) => (t.id === editing.id ? { ...editing, ...form } : t)));
      toast.success("Task updated");
    } else {
      const t: Task = { id: uid(), createdAt: new Date().toISOString(), ...form };
      setTasks((prev) => [t, ...prev]);
      toast.success("Task created");
    }
    setOpen(false);
  };

  const remove = (t: Task) => {
    confirm({
      title: `Delete "${t.name}"?`,
      description: "This task will be permanently removed.",
      confirmLabel: "Delete task",
      destructive: true,
      onConfirm: () => {
        setTasks((prev) => prev.filter((x) => x.id !== t.id));
        toast.success("Task deleted");
      },
    });
  };

  const toggleComplete = (t: Task) => {
    setTasks((prev) =>
      prev.map((x) =>
        x.id === t.id ? { ...x, status: x.status === "Completed" ? "In Progress" : "Completed" } : x,
      ),
    );
    if (t.status !== "Completed") toast.success("Nice — task completed 🎉");
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Tasks"
        description="Break projects into actionable work."
        actions={
          <Button onClick={openNew} disabled={projects.length === 0} className="shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        }
      />

      <Card className="card-soft">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completed} of {tasks.length} completed
            </span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </CardContent>
      </Card>

      <Card className="card-soft">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            <ArrowUpDown className="h-4 w-4" /> Due {sortDir === "asc" ? "↑" : "↓"}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <ListSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
          description={
            tasks.length === 0
              ? "Create your first task to start tracking work."
              : "Try clearing filters or adjusting your search."
          }
          action={
            tasks.length === 0 && projects.length > 0 ? (
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" /> New Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((t, i) => (
            <Card
              key={t.id}
              className="card-soft transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
            >
              <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 p-4">
                <button
                  onClick={() => toggleComplete(t)}
                  className="mt-0.5 text-muted-foreground transition-transform hover:scale-110 hover:text-primary"
                  aria-label={t.status === "Completed" ? "Mark as in progress" : "Mark as completed"}
                >
                  {t.status === "Completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`truncate font-medium ${t.status === "Completed" ? "text-muted-foreground line-through" : ""}`}>
                      {t.name}
                    </h3>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  {t.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5" />
                      {projectMap[t.projectId] ?? "—"}
                    </span>
                    {t.dueDate && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {t.actualHours}h / {t.estimatedHours}h
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(t)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tname">Task name</Label>
              <Input id="tname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tdesc">Description</Label>
              <Textarea id="tdesc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v: Priority) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: TaskStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input type="number" min={0} step={0.5} value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Actual Hours</Label>
                <Input type="number" min={0} step={0.5} value={form.actualHours} onChange={(e) => setForm({ ...form, actualHours: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialog}
    </div>
  );
}
