import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Lightbulb,
  CalendarDays,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/ai-summary")({
  head: () => ({
    meta: [
      { title: "AI Summary — AI Work Planner" },
      { name: "description", content: "AI-generated summary of today's work, pending items, suggestions, and tomorrow's plan." },
      { property: "og:title", content: "AI Summary — AI Work Planner" },
      { property: "og:description", content: "Your day, summarized by AI." },
    ],
  }),
  component: AiSummaryPage,
});

const placeholder = {
  todaysSummary:
    "You had a focused day with strong momentum on the Mobile App Redesign. Deep-work time held steady around 5.2 hours, mostly split between UI polish and API integration. Meetings were kept short, freeing space for shipping the onboarding flow.",
  completed: [
    "Finalized onboarding screens (v2) for Mobile App Redesign",
    "Reviewed and merged 3 pull requests on the API integration branch",
    "Wrote the weekly status update for stakeholders",
    "Closed 4 tickets in the Sprint 12 backlog",
  ],
  pending: [
    "QA pass on the new checkout flow",
    "Draft the Q3 roadmap doc (outline only so far)",
    "Follow up with design on empty-state illustrations",
    "Refactor the notifications service to use the new event bus",
  ],
  suggestions: [
    "Block a 90-minute deep-work slot tomorrow morning for the Q3 roadmap — your best writing hours look like 9–11am.",
    "Two tasks in Mobile App Redesign are within 2 days of their deadline. Consider re-prioritizing over lower-priority reports work.",
    "You've logged >7 hours for 4 straight days. A lighter Friday will protect next week's throughput.",
    "The notifications refactor keeps slipping — break it into 3 smaller tasks so it can move.",
  ],
  tomorrowsPlan: [
    { time: "09:00 – 10:30", item: "Deep work: Q3 roadmap draft" },
    { time: "10:30 – 11:00", item: "Sync with design on empty states" },
    { time: "11:00 – 12:30", item: "QA pass on checkout flow" },
    { time: "13:30 – 15:00", item: "Notifications refactor — task 1 of 3" },
    { time: "15:00 – 16:00", item: "Review PRs & unblock the team" },
    { time: "16:00 – 16:30", item: "Daily log + plan for Friday" },
  ],
};

function AiSummaryPage() {
  const [generatedAt, setGeneratedAt] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const regenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setGeneratedAt(new Date());
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Summary"
        description="An AI-generated view of your day. Powered by placeholder data for now."
        actions={
          <Button onClick={regenerate} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating…" : "Regenerate"}
          </Button>
        }
      />

      <Card className="overflow-hidden border-primary/20">
        <div className="gradient-primary px-5 py-4 text-primary-foreground">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Today's Summary</span>
            </div>
            <Badge variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/15">
              {format(generatedAt, "MMM d • h:mm a")}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed text-foreground/90">{placeholder.todaysSummary}</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5" />
            Placeholder content — will connect to Gemini / OpenAI.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-success/10 text-[color:var(--success)]">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              Completed Work
              <Badge variant="secondary" className="ml-auto">{placeholder.completed.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {placeholder.completed.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-warning/10 text-[color:var(--warning)]">
                <Clock className="h-4 w-4" />
              </span>
              Pending Work
              <Badge variant="secondary" className="ml-auto">{placeholder.pending.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {placeholder.pending.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--warning)]" />
                  <span className="text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-info/10 text-[color:var(--info)]">
              <Lightbulb className="h-4 w-4" />
            </span>
            Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {placeholder.suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-lg border bg-accent/30 p-4 text-sm text-foreground/90"
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[color:var(--info)]">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Tip {i + 1}
                </div>
                {s}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </span>
            Tomorrow's Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l pl-5">
            {placeholder.tomorrowsPlan.map((p, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold text-primary">{p.time}</span>
                  <span className="text-sm text-foreground/90">{p.item}</span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
