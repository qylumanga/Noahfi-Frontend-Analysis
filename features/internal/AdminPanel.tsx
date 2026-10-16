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

export function AdminPanel() {
  const { session } = useSession();
  const metrics = usePolling("metrics", getMetrics);
  const users = usePolling("staff", listUsers);
  const audit = usePolling("audit-admin", listAudit);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState(session?.user.role === "compliance" ? "audit" : "ops");
  if (!session || !can(session.user.role, "audit")) return <Alert tone="warning" title="Restricted">Admin tools are limited to admin and compliance.</Alert>;
  if (metrics.isLoading) return <Skeleton className="h-40" />;
  const series = metrics.data?.series ?? [];
  const recent = series.slice(-8).map((row) => ({ label: row.date.slice(5), value: row.opened }));
  const staff = (users.data ?? []).filter((user) => user.role !== "customer" && user.role !== "partner");
  const logs = (audit.data ?? []).filter((item) => `${item.actorName} ${item.action} ${item.detail}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Operations</h1>
      <div className="flex gap-2">
        {session.user.role === "admin" && <Button type="button" variant={tab === "ops" ? "primary" : "secondary"} onClick={() => setTab("ops")}>Performance</Button>}
        <Button type="button" variant={tab === "audit" ? "primary" : "secondary"} onClick={() => setTab("audit")}>Audit logs</Button>
        {session.user.role === "admin" && <Button type="button" variant={tab === "roles" ? "primary" : "secondary"} onClick={() => setTab("roles")}>Roles</Button>}
      </div>
      {tab === "ops" && metrics.data && (
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
      )}
      {tab === "roles" && session.user.role === "admin" && (
        <Table columns={[{ key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "role", label: "Role" }]} rows={staff.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: <Select aria-label={`Role for ${user.name}`} value={user.role} onChange={(event) => void updateUserRole(user.id, event.target.value as Role).then(() => users.mutate())}>{["analyst", "reviewer", "admin", "compliance"].map((role) => <option key={role} value={role}>{role}</option>)}</Select>,
        }))} />
      )}
      {tab === "audit" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input aria-label="Filter audit logs" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter" />
            <Button type="button" variant="secondary" onClick={() => downloadCsv("noahfi-audit.csv", logs.map((item) => ({ when: item.at, actor: item.actorName, action: item.action, detail: item.detail })))}>Export CSV</Button>
          </div>
          <Table columns={[{ key: "when", label: "When" }, { key: "who", label: "Who" }, { key: "action", label: "Action" }, { key: "detail", label: "Detail" }]} rows={logs.map((item) => ({ id: item.id, when: formatWhen(item.at), who: item.actorName, action: item.action, detail: item.detail }))} />
        </div>
      )}
    </div>
  );
}
