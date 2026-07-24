import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FolderKanban,
  ListTodo,
  NotebookPen,
  BarChart3,
  Calendar,
  Brain,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

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

const features = [
  {
    icon: FolderKanban,
    title: "Projects, organized",
    desc: "Group work by deadline, priority, and status. See every initiative at a glance.",
  },
  {
    icon: ListTodo,
    title: "Tasks that flow",
    desc: "Search, filter, sort, and complete tasks with estimated vs actual hours tracked.",
  },
  {
    icon: NotebookPen,
    title: "Daily work logs",
    desc: "Capture what you shipped, what blocked you, and what's next — in one place.",
  },
  {
    icon: BarChart3,
    title: "Reports that matter",
    desc: "Weekly productivity, project breakdowns, and 30-day trends without spreadsheets.",
  },
  {
    icon: Brain,
    title: "AI summaries",
    desc: "Get a daily brief of completed work, pending items, and a plan for tomorrow.",
  },
  {
    icon: Calendar,
    title: "Deadline aware",
    desc: "Upcoming deadlines surface automatically so nothing quietly slips.",
  },
];

const steps = [
  {
    n: "01",
    title: "Add your projects",
    desc: "Bring in what you're working on. Set priority, deadline, and status.",
  },
  {
    n: "02",
    title: "Log your day",
    desc: "Quick daily entries capture hours, wins, and blockers as you work.",
  },
  {
    n: "03",
    title: "Let AI plan next",
    desc: "Your copilot turns logs into summaries and a plan for tomorrow.",
  },
];

const stats = [
  { value: "4x", label: "faster weekly reviews" },
  { value: "90%", label: "less status-meeting prep" },
  { value: "12h", label: "saved every week" },
  { value: "100%", label: "of your work, in one place" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <span className="text-base font-semibold tracking-tight">AI Work Planner</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative overflow-hidden">
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center animate-fade-in-up">
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

        {/* Preview mockup */}
        <section className="relative mx-auto -mt-8 max-w-6xl px-6 pb-24">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-elevated)]">
            <div className="rounded-xl bg-gradient-to-br from-[oklch(0.97_0.02_265)] to-[oklch(0.94_0.05_285)] p-8">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Active projects", value: "12", icon: FolderKanban },
                  { label: "Tasks in progress", value: "38", icon: ListTodo },
                  { label: "Hours this week", value: "27.5", icon: Clock },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-background/80 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <s.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-border bg-background/80 p-5 backdrop-blur">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" /> Today's AI Summary
                </div>
                <p className="text-sm text-muted-foreground">
                  You closed 6 tasks across 3 projects. Focus tomorrow on the "Beta launch" milestone — 2 blockers detected.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" /> Everything you need
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            One workspace for the whole plan
          </h2>
          <p className="mt-4 text-muted-foreground">
            From first idea to daily execution — every layer of your work, connected.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition hover-lift"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-white shadow-[var(--shadow-glow)]">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/60 bg-gradient-to-b from-transparent to-[oklch(0.96_0.03_265)]/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Three steps to a calmer week
            </h2>
            <p className="mt-4 text-muted-foreground">
              Set it up in minutes. Feel the difference by Friday.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                <div className="text-sm font-semibold text-primary">{s.n}</div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-semibold tracking-tight text-primary">{s.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-[oklch(0.18_0.03_265)] px-8 py-16 text-center text-white shadow-[var(--shadow-elevated)]">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
              <Shield className="h-3.5 w-3.5" /> Free while in beta
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Ready to end the busywork?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Join teams shipping more with less status noise. Set up your workspace in under two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-[oklch(0.18_0.03_265)] transition hover:bg-white/90"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                I have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-md gradient-primary">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
            © {new Date().getFullYear()} AI Work Planner
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
