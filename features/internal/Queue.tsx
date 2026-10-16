"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert, Skeleton, StatusTag } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { Pagination, Table } from "@/components/ui/data";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { useDemoFlags } from "@/lib/hooks/useDemoControls";
import { getQueue, saveQueueView } from "@/lib/services/internalService";
import { assignCase } from "@/lib/services/casesService";
import type { SavedView } from "@/lib/types";
import { slaState } from "@/lib/utils/sla";
import { can } from "@/lib/utils/status";
import { nowIso } from "@/lib/utils/id";

export function Queue() {
  const { session } = useSession();
  const { now } = useDemoFlags();
  const query = usePolling("queue", getQueue, { intervalMs: 7000 });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [risk, setRisk] = useState("");
  const [sla, setSla] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [analystId, setAnalystId] = useState("");
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [assignTo, setAssignTo] = useState("");
  const readOnly = session?.user.role === "compliance";

  const filtered = useMemo(() => {
    const data = query.data;
    if (!data) return [];
    return data.cases.filter((item) => {
      const user = data.users.find((person) => person.id === item.userId);
      const partner = data.partners.find((bank) => bank.id === item.partnerId);
      const hay = `${user?.name ?? ""} ${item.reference} ${item.id} ${partner?.name ?? ""} ${item.countryName}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (status && item.status !== status) return false;
      if (country && item.country !== country) return false;
      if (risk && item.riskLevel !== risk) return false;
      if (partnerId && item.partnerId !== partnerId) return false;
      if (analystId && item.assignedAnalystId !== analystId) return false;
      if (sla && slaState(item.slaDueAt, now, item.status) !== sla) return false;
      return true;
    });
  }, [query.data, q, status, country, risk, sla, partnerId, analystId, now]);

  if (query.isLoading) return <Skeleton className="h-64" />;
  if (query.error || !query.data) return <Alert tone="error" title="Queue unavailable"><button type="button" className="underline" onClick={() => void query.mutate()}>Retry</button></Alert>;
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  function saveView() {
    const view: SavedView = { id: `view-${Date.now()}`, name: q || status || "Saved view", query: q, status, country, risk, sla, partnerId, analystId, createdAt: nowIso(), updatedAt: nowIso() };
    saveQueueView(view);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Case queue</h1>
        <p className="text-xs text-ink-soft">{query.isValidating ? "Refreshing…" : "Auto-refresh on"}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
        <Input aria-label="Search" placeholder="Name, case, bank, country" value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} />
        <Select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="under_review">Under review</option><option value="quality_check">Quality check</option><option value="info_requested">Info requested</option><option value="ready_to_download">Ready</option><option value="escalated">Escalated</option></Select>
        <Select aria-label="Country" value={country} onChange={(event) => setCountry(event.target.value)}><option value="">All countries</option>{["IN", "NG", "PH", "BR", "MX", "GB", "PK", "CO"].map((code) => <option key={code} value={code}>{code}</option>)}</Select>
        <Select aria-label="Risk" value={risk} onChange={(event) => setRisk(event.target.value)}><option value="">All risk</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select>
        <Select aria-label="SLA" value={sla} onChange={(event) => setSla(event.target.value)}><option value="">All SLA</option><option value="red">Under 8 hours</option><option value="overdue">Overdue</option><option value="amber">Under 24 hours</option><option value="ok">On track</option></Select>
        <Select aria-label="Bank" value={partnerId} onChange={(event) => setPartnerId(event.target.value)}><option value="">All banks</option>{query.data.partners.map((bank) => <option key={bank.id} value={bank.id}>{bank.shortName}</option>)}</Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select aria-label="Analyst filter" value={analystId} onChange={(event) => setAnalystId(event.target.value)}><option value="">Any analyst</option>{query.data.analysts.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</Select>
        <Button type="button" variant="secondary" onClick={saveView}>Save view</Button>
        <Button type="button" variant="ghost" onClick={() => { setQ(""); setStatus(""); setCountry(""); setRisk(""); setSla(""); setPartnerId(""); setAnalystId(""); }}>Clear</Button>
        {session && can(session.user.role, "assign") && (
          <>
            <Select aria-label="Bulk assign" value={assignTo} onChange={(event) => setAssignTo(event.target.value)}><option value="">Assign selected</option>{query.data.analysts.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</Select>
            <Button type="button" disabled={!assignTo || !picked.length || readOnly} onClick={() => void (async () => {
              if (!session) return;
              for (const id of picked) await assignCase(id, assignTo, session.user);
              setPicked([]);
              await query.mutate();
            })()}>Apply</Button>
          </>
        )}
      </div>
      <Table
        empty="No cases match these filters."
        columns={[{ key: "pick", label: "" }, { key: "ref", label: "Case", sortable: true }, { key: "who", label: "Customer" }, { key: "country", label: "Country" }, { key: "status", label: "Status" }, { key: "risk", label: "Risk" }, { key: "sla", label: "SLA" }, { key: "analyst", label: "Analyst" }]}
        rows={slice.map((item) => {
          const user = query.data!.users.find((person) => person.id === item.userId);
          const analyst = query.data!.users.find((person) => person.id === item.assignedAnalystId);
          return {
            id: item.id,
            pick: <input type="checkbox" aria-label={`Select ${item.reference}`} checked={picked.includes(item.id)} onChange={(event) => setPicked((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />,
            ref: <Link className="font-semibold underline" href={`/internal/cases/${item.id}`}>{item.reference}</Link>,
            refSort: item.reference,
            who: user?.name ?? "Unknown",
            country: item.countryName,
            status: <StatusTag status={item.status} />,
            risk: <span className="capitalize">{item.priority === "urgent" ? "Urgent · " : ""}{item.riskLevel}</span>,
            sla: <SlaBadge due={item.slaDueAt} status={item.status} />,
            analyst: analyst?.name ?? "Unassigned",
          };
        })}
      />
      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}
