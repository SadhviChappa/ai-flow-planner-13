import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    Low: "bg-info/15 text-info-foreground border-info/30 text-[color:var(--info)]",
    Medium: "bg-warning/15 border-warning/30 text-[color:var(--warning)]",
    High: "bg-destructive/15 border-destructive/30 text-[color:var(--destructive)]",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[priority])}>
      {priority}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Not Started": "bg-muted text-muted-foreground border-border",
    Planning: "bg-muted text-muted-foreground border-border",
    "In Progress": "bg-info/15 border-info/30 text-[color:var(--info)]",
    Active: "bg-info/15 border-info/30 text-[color:var(--info)]",
    "On Hold": "bg-warning/15 border-warning/30 text-[color:var(--warning)]",
    Completed: "bg-success/15 border-success/30 text-[color:var(--success)]",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status] ?? "")}>
      {status}
    </Badge>
  );
}
