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
import { validateEmail, validateName } from "@/lib/validation";


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
  const [mentorPhone, setMentorPhone] = useState("");
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    setName(auth?.name ?? "");
    setEmail(auth?.email ?? "");
    setMentorPhone(auth?.mentorPhone ?? "");
  }, [auth]);

  const save = () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    if (nameError || emailError) {
      toast.error(nameError ?? emailError ?? "Check your details");
      return;
    }
    setAuth({
      name: name.trim(),
      email: email.trim(),
      mentorPhone: mentorPhone.trim(),
    });
    toast.success("Profile saved");
  };

  const clearAll = () => {
    confirm({
      title: "Clear all workspace data?",
      description: "This removes every project, task, and log in your account. This can't be undone.",
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

      <Card className="card-soft">
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
          
          <div className="space-y-2">
            <Label htmlFor="mentorPhone">Mentor WhatsApp Number</Label>
            <Input
              id="mentorPhone"
              placeholder="919876543210"
              value={mentorPhone}
              onChange={(e) => setMentorPhone(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Enter the number with country code (Example: 919876543210)
            </p>
          </div>

          <div className="sm:col-span-2">
            <Button onClick={save}>Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-soft">
        <CardHeader><CardTitle className="text-base">Danger zone</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="font-medium">Clear all workspace data</p>
              <p className="text-sm text-muted-foreground">Permanently deletes every project, task, and log in your account.</p>
            </div>
            <Button variant="destructive" onClick={clearAll}>Clear data</Button>
          </div>
        </CardContent>
      </Card>
      {dialog}
    </div>
  );
}
