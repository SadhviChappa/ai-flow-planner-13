import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — AI Work Planner" },
      { name: "description", content: "Create your AI Work Planner account and start planning." },
      { property: "og:title", content: "Create account — AI Work Planner" },
      { property: "og:description", content: "Create your AI Work Planner account and start planning." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [, setAuth] = useStore("auth");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setAuth({ email, name });
    toast.success("Account created!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
        <form onSubmit={submit} className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            AI Work Planner
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start planning your projects in minutes.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
            </div>
          </div>
          <Button type="submit" className="w-full">Create account</Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have one?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
      <div className="hidden lg:flex flex-col justify-between p-12 gradient-primary text-primary-foreground order-1 lg:order-2">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5" />
          AI Work Planner
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">Bring calm to your workload.</h1>
          <p className="text-primary-foreground/85 max-w-md">
            Everything you need to plan, execute, and reflect on your work — in one focused workspace.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">© {new Date().getFullYear()} AI Work Planner</p>
      </div>
    </div>
  );
}
