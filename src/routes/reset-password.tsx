import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { authErrorMessage, validatePassword } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — AI Work Planner" },
      { name: "description", content: "Set a new password for your AI Work Planner account." },
      { property: "og:title", content: "Choose a new password — AI Work Planner" },
      { property: "og:description", content: "Set a new password for your AI Work Planner account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    let active = true;
    // Supabase parses the recovery link and emits PASSWORD_RECOVERY / a session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setHasRecovery(Boolean(session));
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasRecovery(Boolean(data.session));
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const nextErrors = {
      password: validatePassword(password) ?? undefined,
      confirm: password !== confirmPassword ? "Passwords don't match" : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Couldn't update password", { description: authErrorMessage(error.message) });
      return;
    }
    toast.success("Password updated", { description: "You're signed in with your new password." });
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          AI Work Planner
        </Link>

        {!ready ? (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground card-soft">
            Verifying your reset link…
          </div>
        ) : !hasRecovery ? (
          <div className="space-y-4 rounded-xl border bg-card p-6 card-soft">
            <h1 className="text-xl font-semibold tracking-tight">This link is invalid or expired</h1>
            <p className="text-sm text-muted-foreground">
              Request a fresh password reset link and try again.
            </p>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border bg-card p-6 card-soft">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Use at least 8 characters, including a letter and a number.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirm)}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
