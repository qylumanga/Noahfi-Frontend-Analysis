import { Check } from "lucide-react";
import type { CaseStatus } from "@/lib/types";
import { MAIN_TIMELINE, STATUS_LABEL, timelineIndex } from "@/lib/utils/status";
import { cn } from "@/lib/utils/cn";

export function StatusTracker({ status }: { status: CaseStatus }) {
  const index = timelineIndex(status);
  return (
    <ol className="grid gap-2 sm:grid-cols-2" aria-label="Case progress">
      {MAIN_TIMELINE.map((step, stepIndex) => {
        const done = index >= stepIndex;
        return (
          <li key={step.status} className="flex items-start gap-2 text-sm">
            <span className={cn("mt-0.5 flex h-5 w-5 items-center justify-center rounded-full", done ? "bg-lake text-white" : "bg-glacier-deep text-ink-soft")} aria-hidden>
              {done ? <Check size={12} /> : stepIndex + 1}
            </span>
            <span>
              <span className={cn(done && "font-semibold")}>{step.label}</span>
              {status === step.status && <span className="mt-0.5 block text-xs text-lake-dark">Current · {STATUS_LABEL[status]}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
