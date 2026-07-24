import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { useConfirm } from "@/components/confirm-dialog";
import { useStore } from "@/lib/storage";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AI Work Planner" },
      { name: "description", content: "Manage your profile and workspace." },
      { property: "og:title", content: "Settings — AI Work Planner" },
      { property: "og:description", content: "Manage your profile and workspace." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [auth, setAuth] = useStore("auth");
  const [, setProjects] = useStore("projects");
  const [, setTasks] = useStore("tasks");
  const [, setLogs] = useStore("logs");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    setName(auth?.name ?? "");
    setEmail(auth?.email ?? "");
  }, [auth]);

  const save = () => {
    setAuth({ name, email });
    toast.success("Profile saved");
  };

  const clearAll = () => {
    confirm({
      title: "Clear all workspace data?",
      description: "This removes all projects, tasks, and logs from this device. This can't be undone.",
      confirmLabel: "Clear everything",
      destructive: true,
      onConfirm: () => {
        setProjects([]);
        setTasks([]);
        setLogs([]);
        toast.success("Workspace cleared");
      },
    });
  };


  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Settings" description="Manage your account and workspace." />

      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="n">Name</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e">Email</Label>
            <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={save}>Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Danger zone</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="font-medium">Clear all workspace data</p>
              <p className="text-sm text-muted-foreground">Removes all projects, tasks, and logs from this device.</p>
            </div>
            <Button variant="destructive" onClick={clearAll}>Clear data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
