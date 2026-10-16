"use client";

import { Timer } from "lucide-react";
import type { CaseStatus } from "@/lib/types";
import { slaLabel, slaState } from "@/lib/utils/sla";
import { useDemoFlags } from "@/lib/hooks/useDemoControls";
import { cn } from "@/lib/utils/cn";

const tones = {
  ok: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-900",
  red: "bg-red-50 text-maple",
  overdue: "bg-maple text-white",
  done: "bg-glacier text-ink-soft",
};

export function SlaBadge({ due, status }: { due: string; status: CaseStatus }) {
  const { now } = useDemoFlags();
  const state = slaState(due, now, status);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", tones[state])}>
      <Timer size={12} aria-hidden />
      {slaLabel(state, due, now)}
    </span>
  );
}
