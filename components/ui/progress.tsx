import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="tabular-nums">{width}%</span></div>}
      <div className="h-2 rounded-full bg-glacier-deep" role="progressbar" aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 rounded-full bg-lake" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-4" aria-label="Progress">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li key={step} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold", state === "upcoming" ? "bg-glacier-deep text-ink-soft" : "bg-ink text-white")}>
              {state === "done" ? <Check size={14} aria-hidden /> : index + 1}
            </span>
            <span className={cn("text-sm", state === "current" ? "font-semibold" : "text-ink-soft")}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Timeline({ items }: { items: { title: string; detail?: string; at?: string; icon?: ReactNode; done?: boolean }[] }) {
  return (
    <ol className="relative space-y-4">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="flex gap-3">
          <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", item.done ? "border-lake bg-lake-light text-lake-dark" : "border-ink/15 bg-white text-ink-soft")}>{item.icon ?? index + 1}</span>
          <div>
            <p className="font-semibold">{item.title}</p>
            {item.detail && <p className="text-sm text-ink-soft">{item.detail}</p>}
            {item.at && <p className="text-xs text-ink-soft tabular-nums">{item.at}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
