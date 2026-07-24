import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Work Planner — Plan your work. Let AI handle the busywork." },
      {
        name: "description",
        content:
          "Projects, tasks, daily logs, and reports — all organized by an intelligent copilot that learns how you work.",
      },
      { property: "og:title", content: "AI Work Planner" },
      {
        property: "og:description",
        content: "An AI-first workspace for planning projects, tasks, and daily work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="text-base font-semibold tracking-tight">AI Work Planner</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center rounded-md bg-[oklch(0.18_0.03_265)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative overflow-hidden">
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 text-center animate-fade-in-up">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Powered by <span className="text-primary font-medium">AI planning</span>
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            Plan your work. Let AI handle
            <br className="hidden sm:block" /> the busywork.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Projects, tasks, daily logs, and reports — all organized by an intelligent
            copilot that learns how you work.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-[oklch(0.18_0.03_265)] px-6 py-3 text-sm font-medium text-white shadow-[var(--shadow-elevated)] transition hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-md border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Explore dashboard
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {["No credit card", "Cancel anytime", "AI-first workflow"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Gradient wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-[oklch(0.94_0.04_265)]/40 to-[oklch(0.9_0.06_265)]/60"
        />
      </main>
    </div>
  );
}
