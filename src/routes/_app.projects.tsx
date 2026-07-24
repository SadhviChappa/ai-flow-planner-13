import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays, FolderKanban } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CardGridSkeleton } from "@/components/loading-skeletons";
import { useConfirm } from "@/components/confirm-dialog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStore, uid, type Priority, type Project, type ProjectStatus } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({
    meta: [
      { title: "Projects — AI Work Planner" },
      { name: "description", content: "Create, edit and organize your projects." },
      { property: "og:title", content: "Projects — AI Work Planner" },
      { property: "og:description", content: "Create, edit and organize your projects." },
    ],
  }),
  component: ProjectsPage,
});

const emptyForm = {
  name: "",
  description: "",
  deadline: "",
  priority: "Medium" as Priority,
  status: "Planning" as ProjectStatus,
};

function ProjectsPage() {
  const hydrated = useHydrated();
  const [projects, setProjects] = useStore("projects");
  const [tasks, setTasks] = useStore("tasks");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { confirm, dialog } = useConfirm();

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      deadline: p.deadline,
      priority: p.priority,
      status: p.status,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (editing) {
      setProjects((prev) => prev.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)));
      toast.success("Project updated");
    } else {
      const p: Project = { id: uid(), createdAt: new Date().toISOString(), ...form };
      setProjects((prev) => [p, ...prev]);
      toast.success("Project created");
    }
    setOpen(false);
  };

  const remove = (p: Project) => {
    confirm({
      title: `Delete "${p.name}"?`,
      description: "Its tasks will also be removed. This action can't be undone.",
      confirmLabel: "Delete project",
      destructive: true,
      onConfirm: () => {
        setProjects((prev) => prev.filter((x) => x.id !== p.id));
        setTasks((prev) => prev.filter((t) => t.projectId !== p.id));
        toast.success("Project deleted");
      },
    });
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Projects"
        description="Group your work into projects and set the pace."
        actions={
          <Button onClick={openNew} className="shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      {!hydrated ? (
        <CardGridSkeleton count={6} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start planning your work."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> New Project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const projectTasks = tasks.filter((t) => t.projectId === p.id);
            const done = projectTasks.filter((t) => t.status === "Completed").length;
            const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
            return (
              <Card
                key={p.id}
                className="group flex flex-col overflow-hidden card-soft hover-lift animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="h-1.5 gradient-primary" />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate text-base">{p.name}</CardTitle>
                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                    {p.description || "No description."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={p.priority} />
                    <StatusBadge status={p.status} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{done}/{projectTasks.length} tasks</span>
                      <span className="font-medium text-foreground">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full gradient-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t bg-muted/30 py-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {p.deadline ? format(parseISO(p.deadline), "MMM d, yyyy") : "No deadline"}
                  </span>
                  <span>{projectTasks.length} tasks</span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>Give your project a name, deadline, and status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Website redesign" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's this project about?" rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
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
                <Select value={form.status} onValueChange={(v: ProjectStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialog}
    </div>
  );
}
