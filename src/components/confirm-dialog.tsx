import { useState, useCallback, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type Options = {
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function useConfirm() {
  const [opts, setOpts] = useState<Options | null>(null);
  const confirm = useCallback((o: Options) => setOpts(o), []);
  const dialog = (
    <AlertDialog open={!!opts} onOpenChange={(v) => !v && setOpts(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {opts?.destructive && (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <AlertDialogTitle>{opts?.title ?? "Are you sure?"}</AlertDialogTitle>
              {opts?.description && (
                <AlertDialogDescription className="mt-1">
                  {opts.description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{opts?.cancelLabel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              opts?.onConfirm();
              setOpts(null);
            }}
            className={
              opts?.destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {opts?.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm, dialog };
}
