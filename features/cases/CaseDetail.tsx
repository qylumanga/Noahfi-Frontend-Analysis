"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, EmptyState, Skeleton } from "@/components/ui/feedback";
import { StatusTag } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/overlay";
import { Switch } from "@/components/ui/fields";
import { ScoreGauge } from "@/components/ui/charts";
import { DocumentCard } from "@/components/ui/files";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { HashChip } from "@/components/trust/HashChip";
import { ProvenanceViewer } from "@/components/trust/ProvenanceViewer";
import { StatusTracker } from "./StatusTracker";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { getWorkspace, shareCase } from "@/lib/services/casesService";
import { formatWhen } from "@/lib/utils/format";
import type { Document } from "@/lib/types";

const BANKS = [
  { id: "cl_prt_maple", name: "Maple Harbour Bank" },
  { id: "cl_prt_northern", name: "Northern Crest Credit Union" },
];

export function CaseDetail({ caseId }: { caseId: string }) {
  const { session } = useSession();
  const query = usePolling(`case-${caseId}`, () => getWorkspace(caseId), { intervalMs: 7000 });
  const [shareOpen, setShareOpen] = useState(false);
  const [viewer, setViewer] = useState<Document | null>(null);
  const [grants, setGrants] = useState<Record<string, boolean>>({ cl_prt_maple: true });
  const [message, setMessage] = useState("");
  const data = query.data;
  const kase = data?.case;

  if (query.isLoading) return <div className="space-y-3" aria-busy="true"><Skeleton className="h-10 w-64" /><Skeleton className="h-48" /></div>;
  if (query.error || !kase) return <Alert tone="error" title="Case unavailable">{query.error?.message ?? "We could not find that case."} <button type="button" className="font-semibold underline" onClick={() => void query.mutate()}>Retry</button></Alert>;

  const ready = kase.status === "ready_to_download" || kase.status === "finalized";
  const report = data.report;

  async function share() {
    if (!session) return;
    const payload = BANKS.map((bank) => ({
      partnerId: bank.id,
      scope: grants[bank.id] ? "report" as const : "none" as const,
      granted: Boolean(grants[bank.id]),
      expiresAt: grants[bank.id] ? new Date(Date.now() + 90 * 86400_000).toISOString() : null,
    }));
    await shareCase(kase!.id, payload, session.user.id);
    setMessage("Sharing preferences saved.");
    setShareOpen(false);
    await query.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">Case reference</p>
          <h1 className="text-3xl font-bold tracking-tightest">{kase.reference}</h1>
          <p className="mt-1 text-sm text-ink-soft">Updated {formatWhen(kase.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {ready && <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">Completed</span>}
          <StatusTag status={kase.status} />
          <SlaBadge due={kase.slaDueAt} status={kase.status} />
        </div>
      </div>
      {message && <Alert tone="success">{message}</Alert>}
      {kase.status === "info_requested" && <Alert tone="warning" title="We need a bit more information">Check your notifications for the request, then reply with a clearer document.</Alert>}
      <section className="rounded-3xl border border-ink/10 bg-white p-6">
        <h2 className="text-lg font-semibold">Status</h2>
        <div className="mt-4"><StatusTracker status={kase.status} /></div>
      </section>
      {ready && report ? (
        <section className="grid gap-4 rounded-3xl border border-ink/10 bg-white p-6 lg:grid-cols-[240px_1fr]">
          <ScoreGauge score={report.score} band={report.band} />
          <div>
            <h2 className="text-xl font-semibold">Canadian-equivalent profile</h2>
            <p className="mt-2 text-ink-soft">{report.summary}</p>
            <p className="mt-2 text-sm font-semibold">Confidence {report.confidence}%</p>
            <ul className="mt-4 space-y-2 text-sm">
              {report.factors.map((factor) => (
                <li key={factor.key} className="flex justify-between gap-4 border-b border-ink/5 py-2">
                  <span>{factor.label}</span>
                  <span className="font-semibold tabular-nums">{factor.key === "fraud" ? (factor.score === 0 ? "None" : factor.score) : `${factor.score}/${factor.max}`}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">{report.feedback}</p>
            <div className="no-print mt-4 flex flex-wrap gap-3">
              <Link className="btn-secondary" href={`/cases/${kase.id}/report`}>Download report</Link>
              <Link className="btn-secondary" href={`/cases/${kase.id}/certificate`}>Verification certificate</Link>
              <Button type="button" onClick={() => setShareOpen(true)}>Share securely with participating banks</Button>
            </div>
          </div>
        </section>
      ) : (
        <Alert tone="info" title="What happens next">
          {kase.status === "under_review" ? "An analyst is reading your documents. Result within 48 hours." : "Finish any open step, including payment, to start the 48-hour review."}
          {["account_verified", "documents_uploaded", "identity_verified"].includes(kase.status) && <Link className="ml-2 font-semibold underline" href={`/requests/${kase.id}/payment`}>Go to payment</Link>}
        </Alert>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Documents</h2>
        {data.documents.length === 0 && <EmptyState title="No documents yet" body="Upload them from a new request." />}
        {data.documents.map((doc) => (
          <div key={doc.id}>
            <button type="button" className="w-full text-left" onClick={() => setViewer(doc)}>
              <DocumentCard document={doc} integrity={doc.tampered ? "tampered" : doc.source === "partner" ? "verified_source" : "verified"} />
            </button>
            <div className="mt-2"><HashChip hash={doc.sha256} /></div>
          </div>
        ))}
      </section>
      {viewer && (
        <ProvenanceViewer
          open
          document={viewer}
          entries={data.ledger.filter((entry) => entry.documentId === viewer.id)}
          result={viewer.tampered ? "tampered" : "verified"}
          onClose={() => setViewer(null)}
        />
      )}
      <Modal open={shareOpen} title="Share securely with participating banks" onClose={() => setShareOpen(false)}>
        <p className="text-sm text-ink-soft">Nothing is shared unless you turn a bank on. Access expires in 90 days.</p>
        <ul className="mt-4 space-y-3">
          {BANKS.map((bank) => (
            <li key={bank.id} className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{bank.name}</span>
              <Switch label={`Share report with ${bank.name}`} checked={Boolean(grants[bank.id])} onChange={(value) => setGrants((current) => ({ ...current, [bank.id]: value }))} />
            </li>
          ))}
        </ul>
        <Button className="mt-5" type="button" onClick={() => void share()}>Save sharing</Button>
      </Modal>
    </div>
  );
}
