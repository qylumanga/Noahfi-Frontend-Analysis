import type { AuditLogEntry, Case, Partner, Role, SavedView, User } from "@/lib/types";
import { mergeById, upsert } from "@/lib/demo-db";
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

export async function getQueue(): Promise<{ cases: Case[]; users: User[]; partners: Partner[]; analysts: User[] }> {
  const seed = await api<{ cases: Case[]; users: User[]; partners: Partner[]; analysts: User[] }>("/api/internal/queue");
  return {
    cases: mergeById(seed.cases, "cases"),
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
