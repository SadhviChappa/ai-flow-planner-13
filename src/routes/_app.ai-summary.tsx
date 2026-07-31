import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { AiInsightsPanel } from "@/components/ai-insights-panel";
import { useWorkContext } from "@/hooks/use-work-context";
import { todayISO } from "@/lib/storage";

export const Route = createFileRoute("/_app/ai-summary")({
  head: () => ({
    meta: [
      { title: "AI Summary — AI Work Planner" },
      { name: "description", content: "AI-generated summary of today's work, productivity analysis, and tomorrow's plan." },
      { property: "og:title", content: "AI Summary — AI Work Planner" },
      { property: "og:description", content: "Your day, summarized and analysed by AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiSummaryPage,
});

function AiSummaryPage() {
  const context = useWorkContext(todayISO());

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="AI Summary"
        description="Generate a daily report, productivity analysis, and tomorrow's plan from your logs and tasks."
      />
      <AiInsightsPanel context={context} />
    </div>
  );
}
