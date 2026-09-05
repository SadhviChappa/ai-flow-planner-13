import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MailCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { authErrorMessage, validateEmail } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — AI Work Planner" },
      { name: "description", content: "Request a password reset link for your AI Work Planner account." },
      { property: "og:title", content: "Reset your password — AI Work Planner" },
      { property: "og:description", content: "Request a password reset link for your AI Work Planner account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    const invalid = validateEmail(email);
    setError(invalid);
    if (invalid) return;

    setLoading(true);
    let rawOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : (import.meta.env.VITE_SITE_URL || "https://ai-flow-planner-13.vercel.app");

    // Clean duplicate protocols, malformed prefixes, or duplicate domain suffixes
    rawOrigin = rawOrigin
      .replace(/^(https?:\/\/)+/i, "https://")
      .replace(/(\.vercel\.app)+/i, ".vercel.app")
      .replace(/\/+$/, "");

    const redirectTo = `${rawOrigin}/reset-password`;
    console.log("[Supabase Auth] Requesting reset link with redirectTo:", redirectTo);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    setLoading(false);

    if (err) {
      console.error("[Supabase resetPasswordForEmail error]:", {
        status: (err as unknown as { status?: number }).status,
        name: err.name,
        message: err.message,
      });

      // If rate limited, parse seconds or default to 60s cooldown
      const secondsMatch = err.message.match(/(\d+)\s*seconds?/i);
      const waitSec = secondsMatch ? parseInt(secondsMatch[1], 10) : 60;
      setCooldown(waitSec);

      toast.error("Couldn't send reset link", { description: authErrorMessage(err.message) });
      return;
    }

    setSent(true);
    setCooldown(60); // 60s cooldown before next send
    toast.success("Reset link sent", { description: "Check your inbox for the next step." });
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

        {sent ? (
          <div className="space-y-4 rounded-xl border bg-card p-6 card-soft">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email.trim()}</span>,
                we&apos;ve sent a link to reset your password.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={cooldown > 0}
              onClick={() => setSent(false)}
            >
              {cooldown > 0 ? `Try another email (${cooldown}s)` : "Use a different email"}
            </Button>
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border bg-card p-6 card-soft">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(error)}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading || cooldown > 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Sending…"
                : cooldown > 0
                ? `Please wait ${cooldown}s`
                : "Send reset link"}
            </Button>
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
