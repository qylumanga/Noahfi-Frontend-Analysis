"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { CaseStatus } from "@/lib/types";
import { STATUS_LABEL, STATUS_TONE, type StatusTone } from "@/lib/utils/status";

const tones = {
  neutral: "bg-glacier text-ink",
  info: "bg-lake-light text-lake-dark",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-maple",
};

export function Badge({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function StatusTag({ status }: { status: CaseStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

const alertIcon = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle };
const alertTone = { info: "border-lake/30 bg-lake-light/40", success: "border-emerald-200 bg-emerald-50", warning: "border-amber-200 bg-amber-50", error: "border-maple/30 bg-red-50" };

export function Alert({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "error"; title?: string; children?: ReactNode }) {
  const Icon = alertIcon[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-2xl border p-4 text-sm", alertTone[tone])}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-1 text-ink-soft" : ""}>{children}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-glacier-deep/80", className)} aria-hidden />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-normal text-white group-hover:block group-focus-within:block">
        {label}
      </span>
    </span>
  );
}
