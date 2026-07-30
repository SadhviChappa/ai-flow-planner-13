import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { authErrorMessage, validateEmail, validateName, validatePassword } from "@/lib/validation";

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
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const nextErrors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Couldn't create account", { description: authErrorMessage(error.message) });
      return;
    }
    // Supabase returns an obfuscated user with no identities when the email is taken.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("Email already registered", { description: "Try signing in instead." });
      navigate({ to: "/login" });
      return;
    }
    if (!data.session) {
      toast.success("Account created", {
        description: "Check your inbox to confirm your email, then sign in.",
      });
      navigate({ to: "/login", replace: true });
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/dashboard", replace: true });
  };


  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, oklch(0.55 0.24 285) 0%, oklch(0.55 0.28 320) 100%)",
        }}
      >
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>AI Work Planner</span>
        </div>

        <div className="space-y-5 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight">
            Plan your week with an AI copilot that actually understands your work.
          </h1>
          <p className="text-white/85 text-base xl:text-lg">
            Turn scattered notes into structured projects, tasks, and daily focus — automatically.
          </p>
        </div>

        <div />
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <form onSubmit={submit} noValidate className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            AI Work Planner
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start planning your work with AI in minutes.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@work.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-[oklch(0.2_0.04_265)] text-white hover:bg-[oklch(0.15_0.04_265)]"
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <a href="#" className="font-medium text-foreground hover:underline">Terms</a>{" "}
            and{" "}
            <a href="#" className="font-medium text-foreground hover:underline">Privacy Policy</a>.
          </p>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-foreground hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
