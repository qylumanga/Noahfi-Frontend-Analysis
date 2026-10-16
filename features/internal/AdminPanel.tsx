"use client";

import { useState } from "react";
import { Alert, Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/fields";
import { SvgBarChart, SvgDonut } from "@/components/ui/charts";
import { Table } from "@/components/ui/data";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { getMetrics, listAudit, listUsers, updateUserRole } from "@/lib/services/internalService";
import { can } from "@/lib/utils/status";
import { downloadCsv, formatWhen } from "@/lib/utils/format";
import type { Role } from "@/lib/types";

function useStaffGate(kind: "admin" | "audit") {
  const { session, ready } = useSession();
  const allowed = session ? can(session.user.role, kind) : false;
  return { ready, allowed };
}

export function PerformancePanel() {
  const { ready, allowed } = useStaffGate("admin");
  const metrics = usePolling(allowed ? "metrics" : null, getMetrics);
  if (!ready) return <Skeleton className="h-40" />;
  if (!allowed) return <Alert tone="warning" title="Admins only">Performance is part of the admin role.</Alert>;
  if (metrics.isLoading || !metrics.data) return <Skeleton className="h-40" />;
  const recent = metrics.data.series.slice(-8).map((row) => ({ label: row.date.slice(5), value: row.opened }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4">
          <h2 className="font-semibold">Case volume</h2>
          <SvgBarChart rows={recent} label="Cases opened" />
          <p className="text-sm text-ink-soft">Average turnaround {metrics.data.avgTurnaroundHours}h.</p>
        </section>
        <section className="rounded-2xl bg-white p-4">
          <h2 className="font-semibold">SLA compliance</h2>
          <SvgDonut value={metrics.data.slaCompliancePct} label="SLA compliance" />
          <p className="text-sm text-ink-soft">{metrics.data.fraudAlerts} open fraud alerts.</p>
          <ul className="mt-3 text-sm">{metrics.data.integrationHealth.map((item) => <li key={item.name}>{item.name}: {item.status}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}

export function RolesPanel() {
  const { ready, allowed } = useStaffGate("admin");
  const users = usePolling(allowed ? "staff" : null, listUsers);
  if (!ready) return <Skeleton className="h-40" />;
  if (!allowed) return <Alert tone="warning" title="Admins only">Roles are part of the admin role.</Alert>;
  if (users.isLoading) return <Skeleton className="h-40" />;
  const staff = (users.data ?? []).filter((user) => user.role !== "customer" && user.role !== "partner");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
      <Table columns={[{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }]} rows={staff.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: <Select aria-label={`Role for ${user.name}`} value={user.role} onChange={(event) => void updateUserRole(user.id, event.target.value as Role).then(() => users.mutate())}>{["analyst", "reviewer", "admin", "compliance"].map((role) => <option key={role} value={role}>{role}</option>)}</Select>,
      }))} />
    </div>
  );
}

export function AuditPanel() {
  const { ready, allowed } = useStaffGate("audit");
  const audit = usePolling(allowed ? "audit-admin" : null, listAudit);
  const [filter, setFilter] = useState("");
  if (!ready) return <Skeleton className="h-40" />;
  if (!allowed) return <Alert tone="warning" title="Restricted">Audit logs are for admin and compliance.</Alert>;
  if (audit.isLoading) return <Skeleton className="h-40" />;
  const logs = (audit.data ?? []).filter((item) => `${item.actorName} ${item.action} ${item.detail}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
      <div className="flex gap-2">
        <Input aria-label="Filter audit logs" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter" />
        <Button type="button" variant="secondary" onClick={() => downloadCsv("noahfi-audit.csv", logs.map((item) => ({ when: item.at, actor: item.actorName, action: item.action, detail: item.detail })))}>Export CSV</Button>
      </div>
      <Table columns={[{ key: "when", label: "When" }, { key: "who", label: "Who" }, { key: "action", label: "Action" }, { key: "detail", label: "Detail" }]} rows={logs.map((item) => ({ id: item.id, when: formatWhen(item.at), who: item.actorName, action: item.action, detail: item.detail }))} />
    </div>
  );
}
