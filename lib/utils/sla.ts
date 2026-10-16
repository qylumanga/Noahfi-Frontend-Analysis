import type { CaseStatus } from "@/lib/types";

export type SlaState = "ok" | "amber" | "red" | "overdue" | "done";

const DONE: CaseStatus[] = ["ready_to_download", "finalized", "rejected"];

export function slaState(dueIso: string, now: number, status: CaseStatus): SlaState {
  if (DONE.includes(status)) return "done";
  const remain = new Date(dueIso).getTime() - now;
  if (remain < 0) return "overdue";
  if (remain < 8 * 3600_000) return "red";
  if (remain < 24 * 3600_000) return "amber";
  return "ok";
}

export function slaLabel(state: SlaState, dueIso: string, now: number): string {
  if (state === "done") return "Complete";
  const remain = new Date(dueIso).getTime() - now;
  if (state === "overdue") return "Overdue";
  const hours = Math.max(0, Math.floor(remain / 3600_000));
  const mins = Math.max(0, Math.floor((remain % 3600_000) / 60_000));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${mins}m left`;
}
