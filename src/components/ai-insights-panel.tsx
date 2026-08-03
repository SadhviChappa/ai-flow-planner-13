import { exportPdfReport } from "@/services/pdf.service";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lightbulb,
  CalendarDays,
  Gauge,
  AlertTriangle,
  KeyRound,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { generateWorkInsights } from "@/lib/ai.functions";
import type {
  DailySummaryResult,
  ProductivityResult,
  TomorrowPlanResult,
  WorkContext,
} from "@/lib/ai-types";
import { hasWorkData } from "@/hooks/use-work-context";

interface Props {
  context: WorkContext;
  /** Hide the internal header (when the page already has a header + button). */
  compact?: boolean;
}

export function AiInsightsPanel({ context, compact }: Props) {
  const runInsights = useServerFn(generateWorkInsights);

  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [summary, setSummary] = useState<DailySummaryResult | null>(null);
  const [productivity, setProductivity] = useState<ProductivityResult | null>(null);
  const [plan, setPlan] = useState<TomorrowPlanResult | null>(null);

  const generate = async () => {
    if (loading) return;
    if (!hasWorkData(context)) {
      toast.error("Add a task or a daily log first — there's nothing to analyse yet.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const result = await runInsights({ data: context });

      if (!result.ok) {
        setNotConfigured(!result.configured);
        setError(result.error ?? "AI generation failed.");
        if (result.configured) toast.error(result.error ?? "AI generation failed.");
        return;
      }

      setSummary(result.data?.summary ?? null);
      setProductivity(result.data?.productivity ?? null);
      setPlan(result.data?.plan ?? null);
      setGeneratedAt(new Date());
      toast.success("AI insights generated");
    } catch {
      setError("Could not reach the AI service. Please try again.");
      toast.error("Could not reach the AI service.");
    } finally {
      setLoading(false);
    }
  };

  const hasResult = summary || productivity || plan;
  const exportReport = () => {
  if (!summary || !productivity || !plan) {
    toast.error("Generate AI Summary first.");
    return;
  }

  exportPdfReport({
    date: format(new Date(), "dd-MM-yyyy"),
    hours: context.hoursLogged,
    completed: summary.completed.length,
    pending: summary.pending.length,
    summary: summary.summary,
    productivityScore: productivity.score,
    strengths: productivity.strengths,
    improvements: productivity.improvements,
    tomorrowPlan: plan.schedule.map(
      (item) => `${item.time} - ${item.item}`
    ),
  });
}; 

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Sparkles className="h-4 w-4 text-primary" /> AI Insights
            </h2>
            <p className="text-sm text-muted-foreground">
              Summary, productivity analysis and tomorrow's plan from today's work.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Generating…" : hasResult ? "Regenerate" : "Generate AI Summary"}
            </Button>
            <Button variant="outline" onClick={exportReport} disabled={!hasResult}>
              Export PDF
            </Button>
          </div>
        </div>
      )}

      {compact && (
        <Button onClick={generate} disabled={loading} className="gap-2">
          <Sparkles className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Generating…" : hasResult ? "Regenerate AI Summary" : "Generate AI Summary"}
        </Button>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            {notConfigured ? (
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            )}
            <div>
              <p className="font-medium">{notConfigured ? "AI not configured yet" : "AI generation failed"}</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !hasResult && (
        <div className="space-y-4">
          <Card className="card-soft">
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      )}

      {summary && (
        <Card className="overflow-hidden border-primary/20 animate-fade-in-up">
          <div className="gradient-primary px-5 py-4 text-primary-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">{summary.headline || "Today's Summary"}</span>
              </div>
              {generatedAt && (
                <Badge variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/15">
                  {format(generatedAt, "MMM d • h:mm a")}
                </Badge>
              )}
            </div>
          </div>
          <CardContent className="space-y-5 p-5">
            <p className="text-sm leading-relaxed text-foreground/90">{summary.summary}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--success)]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed work
                </p>
                <ul className="space-y-2">
                  {(summary.completed.length ? summary.completed : ["Nothing recorded"]).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--warning)]">
                  <Clock className="h-3.5 w-3.5" /> Pending work
                </p>
                <ul className="space-y-2">
                  {(summary.pending.length ? summary.pending : ["Nothing pending"]).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--warning)]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {summary.highlights?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {summary.highlights.map((h, i) => (
                  <Badge key={i} variant="secondary">{h}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {productivity && (
        <Card className="card-soft animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-info/10 text-[color:var(--info)]">
                <Gauge className="h-4 w-4" />
              </span>
              Productivity Analysis
              <Badge variant="secondary" className="ml-auto">{productivity.score}/100</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{productivity.scoreLabel}</span>
                <span className="text-2xl font-semibold tracking-tight">{productivity.score}</span>
              </div>
              <Progress value={productivity.score} />
              <p className="text-sm text-muted-foreground">{productivity.rationale}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-accent/30 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--success)]">Strengths</p>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {productivity.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border bg-accent/30 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--info)]">Improvements</p>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {productivity.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--info)]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {plan && (
        <Card className="card-soft animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-4 w-4" />
              </span>
              Tomorrow's Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-lg border bg-accent/30 p-3 text-sm font-medium">{plan.focus}</p>
            <ol className="relative space-y-4 border-l pl-5">
              {plan.schedule.map((p, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xs font-semibold text-primary">{p.time}</span>
                    <span className="text-sm text-foreground/90">{p.item}</span>
                    {p.why && <span className="text-xs text-muted-foreground">— {p.why}</span>}
                  </div>
                </li>
              ))}
            </ol>
            {plan.watchOuts?.length > 0 && (
              <div className="rounded-lg border border-[color:var(--warning)]/30 bg-warning/5 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--warning)]">Watch out for</p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  {plan.watchOuts.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
