import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Sparkles } from "lucide-react";
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkRecoveryAuth() {
      if (typeof window === "undefined") return;

      // 1. Check for explicit error in URL (query params or hash fragment)
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hash);

      const urlError = searchParams.get("error") || hashParams.get("error");
      const urlErrorDesc = searchParams.get("error_description") || hashParams.get("error_description");

      if (urlError || urlErrorDesc) {
        if (!active) return;
        const msg = urlErrorDesc
          ? decodeURIComponent(urlErrorDesc.replace(/\+/g, " "))
          : "This reset link is invalid or has expired.";
        setErrorMessage(msg);
        setHasRecovery(false);
        setReady(true);
        return;
      }

      // 2. Check if a valid session already exists (e.g. from Supabase background auto-detection)
      const { data: initialSession } = await supabase.auth.getSession();
      if (!active) return;
      if (initialSession?.session) {
        setHasRecovery(true);
        setReady(true);
        return;
      }

      // 3. Handle PKCE code in query params (if not auto-exchanged yet)
      const code = searchParams.get("code");
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!active) return;
          if (data?.session) {
            setHasRecovery(true);
            setReady(true);
            return;
          }
          // Re-verify session in case Supabase background listener auto-exchanged it concurrently
          const { data: checkSession } = await supabase.auth.getSession();
          if (checkSession?.session) {
            setHasRecovery(true);
            setReady(true);
            return;
          }
          if (error) {
            setErrorMessage(error.message || "Failed to verify reset code.");
          }
        } catch {
          const { data: checkSession } = await supabase.auth.getSession();
          if (checkSession?.session) {
            setHasRecovery(true);
            setReady(true);
            return;
          }
        }
      }

      // 4. Handle implicit tokens in hash fragment (if not auto-parsed yet)
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!active) return;
          if (data?.session) {
            setHasRecovery(true);
            setReady(true);
            return;
          }
          const { data: checkSession } = await supabase.auth.getSession();
          if (checkSession?.session) {
            setHasRecovery(true);
            setReady(true);
            return;
          }
          if (error) {
            setErrorMessage(error.message || "Invalid or expired recovery token.");
          }
        } catch {
          const { data: checkSession } = await supabase.auth.getSession();
          if (checkSession?.session) {
            setHasRecovery(true);
            setReady(true);
            return;
          }
        }
      }

      // 5. Final fallback check after 1000ms
      const timer = setTimeout(async () => {
        if (!active) return;
        const { data: finalSession } = await supabase.auth.getSession();
        if (finalSession?.session) {
          setHasRecovery(true);
        } else {
          setHasRecovery(false);
        }
        setReady(true);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // Subscribe to auth state changes for PASSWORD_RECOVERY, SIGNED_IN, INITIAL_SESSION
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (
        event === "PASSWORD_RECOVERY" ||
        (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED"))
      ) {
        setHasRecovery(true);
        setReady(true);
      }
    });

    void checkRecoveryAuth();

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

    // Sign out the temporary recovery session so the user can sign in fresh
    await supabase.auth.signOut();

    setIsSuccess(true);
    toast.success("Password updated successfully!", {
      description: "You can now sign in with your new password.",
    });
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

        {isSuccess ? (
          <div className="space-y-5 rounded-xl border bg-card p-6 card-soft">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Password updated successfully</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your password has been changed. You can now sign in with your new credentials.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link to="/login">Go to sign in</Link>
            </Button>
          </div>
        ) : !ready ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border bg-card p-8 text-sm text-muted-foreground card-soft">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Verifying your reset link…
          </div>
        ) : !hasRecovery ? (
          <div className="space-y-4 rounded-xl border bg-card p-6 card-soft">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {errorMessage ? "Reset link error" : "This link is invalid or expired"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {errorMessage || "Password reset links can only be used once and expire after a short period. Please request a new link."}
              </p>
            </div>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
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
                placeholder="••••••••"
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
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating…" : "Update password"}
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
