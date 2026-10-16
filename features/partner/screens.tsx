"use client";

import { useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/data";
import { Table } from "@/components/ui/data";
import { Alert, EmptyState, Skeleton, StatusTag } from "@/components/ui/feedback";
import { Drawer, Modal } from "@/components/ui/overlay";
import { Button } from "@/components/ui/Button";
import { Input, Switch } from "@/components/ui/fields";
import { FileDropzone } from "@/components/ui/files";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { SvgSparkline } from "@/components/ui/charts";
import { CopyButton } from "@/components/ui/files";
import { HashChip } from "@/components/trust/HashChip";
import { IntegrityBadge } from "@/components/trust/IntegrityBadge";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { getPartner, listConsents, listIntegrations, listPartnerCases, saveConsents, uploadEvidence } from "@/lib/services/partnerService";
import { listAudit } from "@/lib/services/internalService";
import { getWorkspace } from "@/lib/services/casesService";
import { downloadCsv, formatWhen } from "@/lib/utils/format";
import type { Case, ConsentGrant } from "@/lib/types";

export function PartnerDashboard() {
  const cases = usePolling("partner-cases", listPartnerCases, { intervalMs: 8000 });
  const consents = usePolling("partner-consents", listConsents, { intervalMs: 10000 });
  if (cases.isLoading) return <Skeleton className="h-40" />;
  if (cases.error) return <Alert tone="error" title="Could not load the portal"><button type="button" className="underline" onClick={() => void cases.mutate()}>Retry</button></Alert>;
  const rows = cases.data ?? [];
  const open = rows.filter((item) => !["ready_to_download", "rejected", "finalized"].includes(item.status)).length;
  const waiting = (consents.data ?? []).filter((item) => !item.granted).length;
  const done = rows.filter((item) => item.status === "ready_to_download").length;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tightest">Partner dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open submissions" value={String(open)} />
        <KpiCard label="Awaiting consent" value={String(waiting)} />
        <KpiCard label="Completed" value={String(done)} />
        <KpiCard label="Avg turnaround" value="31h" hint="Across the demo book" />
      </div>
      <section className="rounded-3xl border border-ink/10 bg-white p-5">
        <h2 className="font-semibold">Recent activity</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rows.slice(0, 5).map((item) => <li key={item.id} className="flex justify-between gap-3"><span>{item.reference}</span><StatusTag status={item.status} /></li>)}
          {rows.length === 0 && <li>No submissions yet.</li>}
        </ul>
      </section>
    </div>
  );
}

export function EvidenceUpload() {
  const { session } = useSession();
  const cases = usePolling("partner-cases", listPartnerCases);
  const partner = usePolling("partner-me", getPartner);
  const [query, setQuery] = useState("");
  const [caseId, setCaseId] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const filtered = (cases.data ?? []).filter((item) => `${item.reference} ${item.countryName}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold tracking-tightest">Upload evidence</h1>
      <p className="text-sm text-ink-soft">Files are marked Verified source: {partner.data?.partner.name ?? "your institution"} and fingerprinted on the Trust Ledger.</p>
      <Input aria-label="Search applicant or case" placeholder="Search case reference or country" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul className="max-h-48 space-y-1 overflow-auto rounded-2xl border border-ink/10 bg-white p-2">
        {filtered.map((item) => (
          <li key={item.id}><button type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm ${caseId === item.id ? "bg-ink text-white" : ""}`} onClick={() => setCaseId(item.id)}>{item.reference} · {item.countryName}</button></li>
        ))}
      </ul>
      {caseId && <FileDropzone label="Upload evidence" onFile={(file) => void (async () => {
        if (!session) return;
        setError("");
        try {
          const doc = await uploadEvidence(caseId, file, session.user.id, partner.data?.partner.name ?? "Maple Harbour Bank");
          setDone(doc.fileName);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed.");
        }
      })()} />}
      {done && <Alert tone="success" title="Verified source recorded">{done} is on the case with a signature badge.</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}

export function Submissions() {
  const cases = usePolling("partner-cases", listPartnerCases, { intervalMs: 8000 });
  const consents = usePolling("consents", listConsents);
  const [open, setOpen] = useState<Case | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getWorkspace>> | null>(null);
  if (cases.isLoading) return <Skeleton className="h-40" />;
  if (cases.error) return <Alert tone="error"><button type="button" className="underline" onClick={() => void cases.mutate()}>Retry</button></Alert>;
  const rows = cases.data ?? [];
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tightest">Submissions</h1>
      {rows.length === 0 ? <EmptyState title="No submissions" body="Cases appear here after a customer pays or a bank links evidence." /> : (
        <Table
          columns={[{ key: "ref", label: "Case", sortable: true }, { key: "status", label: "Status" }, { key: "sla", label: "SLA" }, { key: "updated", label: "Updated", sortable: true }]}
          rows={rows.map((item) => ({
            id: item.id,
            ref: <button type="button" className="font-semibold underline" onClick={() => { setOpen(item); void getWorkspace(item.id).then(setDetail); }}>{item.reference}</button>,
            refSort: item.reference,
            status: <StatusTag status={item.status} />,
            sla: <SlaBadge due={item.slaDueAt} status={item.status} />,
            updated: formatWhen(item.updatedAt),
            updatedSort: item.updatedAt,
          }))}
        />
      )}
      <Drawer open={!!open} title={open?.reference ?? "Case"} onClose={() => setOpen(null)}>
        {open && <CasePeek item={open} consent={(consents.data ?? []).find((grant) => grant.caseId === open.id)} detail={detail} />}
      </Drawer>
    </div>
  );
}

function CasePeek({ item, consent, detail }: { item: Case; consent?: ConsentGrant; detail: Awaited<ReturnType<typeof getWorkspace>> | null }) {
  const locked = !consent?.granted;
  return (
    <div className="space-y-3 text-sm">
      <StatusTag status={item.status} />
      <SlaBadge due={item.slaDueAt} status={item.status} />
      {locked ? <Alert tone="warning" title="Locked">This applicant has not granted consent. You can see status, not the report.</Alert> : <p>{detail?.report?.summary ?? "Report not ready yet."}</p>}
      <ul className="space-y-2">
        {(detail?.documents ?? []).map((doc) => (
          <li key={doc.id} className="rounded-xl bg-white p-3">
            <div className="flex items-center justify-between gap-2"><span>{doc.fileName}</span><IntegrityBadge state={doc.source === "partner" ? "verified_source" : doc.tampered ? "tampered" : "verified"} /></div>
            <HashChip hash={doc.sha256} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConsentControls() {
  const query = usePolling("consents-edit", async () => ({ consents: await listConsents(), cases: await listPartnerCases() }));
  const [pending, setPending] = useState<ConsentGrant | null>(null);
  if (query.isLoading) return <Skeleton className="h-40" />;
  if (query.error || !query.data) return <Alert tone="error"><button type="button" className="underline" onClick={() => void query.mutate()}>Retry</button></Alert>;
  const { consents, cases } = query.data;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tightest">Consent</h1>
      <ul className="space-y-3">
        {cases.slice(0, 8).map((item) => {
          const grant = consents.find((row) => row.caseId === item.id);
          const granted = Boolean(grant?.granted);
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4">
              <div>
                <p className="font-semibold">{item.reference}</p>
                <p className="text-sm text-ink-soft">{granted ? `Can see ${grant?.scope.replaceAll("_", " ")}` : "Nothing shared"} {grant?.expiresAt ? `· until ${formatWhen(grant.expiresAt)}` : ""}</p>
              </div>
              <Switch label={`Consent for ${item.reference}`} checked={granted} onChange={() => setPending(grant ?? { id: `local-${item.id}`, caseId: item.id, userId: item.userId, partnerId: item.partnerId ?? "cl_prt_maple", scope: "none", granted: false, grantedAt: null, expiresAt: null, createdAt: item.createdAt, updatedAt: item.updatedAt })} />
            </li>
          );
        })}
      </ul>
      <Modal open={!!pending} title="Change consent" onClose={() => setPending(null)}>
        <p className="text-sm text-ink-soft">This mirrors the customer&apos;s choice. Turning it off locks the report.</p>
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={() => void (async () => {
            if (!pending) return;
            const next = { ...pending, granted: !pending.granted, scope: !pending.granted ? "report" as const : "none" as const, grantedAt: !pending.granted ? new Date().toISOString() : null, updatedAt: new Date().toISOString() };
            await saveConsents([next]);
            setPending(null);
            await query.mutate();
          })()}>Confirm</Button>
          <Button type="button" variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

export function IntegrationsPanel() {
  const query = usePolling("integrations", listIntegrations);
  const partner = usePolling("partner-me", getPartner);
  if (query.isLoading) return <Skeleton className="h-32" />;
  const row = (query.data ?? []).find((item) => item.partnerId === partner.data?.partner.id) ?? query.data?.[0];
  if (!row) return <EmptyState title="No integration" body="An API key appears here for approved institutions." />;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tightest">API and integration</h1>
      <section className="rounded-3xl border border-ink/10 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">{row.status === "operational" ? "Operational" : "Degraded"}</p>
          <IntegrityBadge state={row.status === "operational" ? "verified" : "pending"} />
        </div>
        <p className="mt-3 font-mono text-sm">{row.apiKeyMasked}</p>
        <CopyButton value={row.apiKeyFull} label="Copy demo key" />
        <p className="mt-3 text-sm">Webhook {row.webhookUrl}</p>
        <p className="text-sm text-ink-soft">Health: {row.webhookHealth}. Last sync {formatWhen(row.lastSyncAt)}.</p>
        <SvgSparkline values={row.requestVolume} label="Request volume" />
      </section>
    </div>
  );
}

export function PartnerAudit() {
  const query = usePolling("audit", listAudit);
  const [actor, setActor] = useState("");
  const rows = useMemo(() => (query.data ?? []).filter((item) => item.actorName.toLowerCase().includes(actor.toLowerCase()) || item.action.includes(actor.toLowerCase())), [query.data, actor]);
  if (query.isLoading) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tightest">Audit trail</h1>
        <Button type="button" variant="secondary" onClick={() => downloadCsv("noahfi-partner-audit.csv", rows.map((item) => ({ when: item.at, who: item.actorName, action: item.action, detail: item.detail })))}>Export CSV</Button>
      </div>
      <Input aria-label="Filter audit" placeholder="Filter by person or action" value={actor} onChange={(event) => setActor(event.target.value)} />
      {rows.length === 0 ? <EmptyState title="No audit events" body="Uploads and consent changes are recorded here." /> : (
        <Table columns={[{ key: "when", label: "When", sortable: true }, { key: "who", label: "Who" }, { key: "action", label: "What" }, { key: "hash", label: "Record" }]} rows={rows.map((item) => ({ id: item.id, when: formatWhen(item.at), whenSort: item.at, who: item.actorName, action: item.detail, hash: item.entityId.slice(0, 12) }))} />
      )}
    </div>
  );
}
