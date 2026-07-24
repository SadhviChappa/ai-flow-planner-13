import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed card-soft animate-fade-in">
      <CardContent className="grid place-items-center gap-4 py-16 text-center">
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full gradient-primary opacity-20 blur-2xl" />
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]">
            <Icon className="h-7 w-7" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">{title}</p>
          {description && (
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
