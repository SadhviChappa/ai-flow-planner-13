import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { authErrorMessage, validateEmail } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AI Work Planner" },
      { name: "description", content: "Sign in to your AI Work Planner workspace." },
      { property: "og:title", content: "Sign in — AI Work Planner" },
      { property: "og:description", content: "Sign in to your AI Work Planner workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const nextErrors = {
      email: validateEmail(email) ?? undefined,
      password: password ? undefined : "Password is required",
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Sign in failed", { description: authErrorMessage(error.message) });
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 gradient-primary text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5" />
          AI Work Planner
        </Link>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Turn scattered work into shipped outcomes.
          </h1>
          <p className="text-primary-foreground/85 max-w-md">
            Plan projects, break them into tasks, log daily progress, and watch productivity trends come to life.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">© {new Date().getFullYear()} AI Work Planner</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} noValidate className="w-full max-w-md space-y-6">
          <Link to="/" className="lg:hidden flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            AI Work Planner
          </Link>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back — let&apos;s get some work done.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
