import type { AuditLogEntry, Case, Partner, RatingAssessment, Role, SavedView, User } from "@/lib/types";
import { mergeById, readBag, upsert } from "@/lib/demo-db";
import { api } from "./api";

export type Metrics = {
  id: string;
  avgTurnaroundHours: number;
  slaCompliancePct: number;
  openCases: number;
  series: { date: string; opened: number; closed: number }[];
  fraudAlerts: number;
  integrationHealth: { name: string; status: "operational" | "degraded" }[];
  analysts: { id: string; name: string; open: number; closed: number }[];
};

const ANALYST_STAGES = new Set(["under_review", "payment_received", "info_requested"]);

function promoteSubmitted(cases: Case[]): Case[] {
  const submitted = new Set(
    readBag<RatingAssessment>("ratings").upserts.filter((rating) => rating.qaStatus === "submitted").map((rating) => rating.caseId),
  );
  return cases.map((item) => {
    if (!submitted.has(item.id) || !ANALYST_STAGES.has(item.status)) return item;
    const next: Case = { ...item, status: "quality_check", updatedAt: new Date().toISOString() };
    upsert("cases", next);
    return next;
  });
}

export async function getQueue(): Promise<{ cases: Case[]; users: User[]; partners: Partner[]; analysts: User[] }> {
  const seed = await api<{ cases: Case[]; users: User[]; partners: Partner[]; analysts: User[] }>("/api/internal/queue");
  return {
    cases: promoteSubmitted(mergeById(seed.cases, "cases")),
    users: mergeById(seed.users, "users"),
    partners: seed.partners,
    analysts: seed.analysts,
  };
}

export async function listUsers(): Promise<User[]> {
  const seed = await api<User[]>("/api/internal/users");
  return mergeById(seed, "users");
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const user = await api<User>(`/api/internal/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
  upsert("users", user);
  return user;
}

export async function getMetrics(): Promise<Metrics> {
  return api("/api/internal/metrics");
}

export function saveQueueView(view: SavedView): void {
  upsert("views", view);
}

export async function listAudit(): Promise<AuditLogEntry[]> {
  const seed = await api<AuditLogEntry[]>("/api/internal/audit-logs");
  return mergeById(seed, "audit").sort((a, b) => b.at.localeCompare(a.at));
}
