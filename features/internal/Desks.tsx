"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Alert, EmptyState, Skeleton, StatusTag } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/fields";
import { Modal } from "@/components/ui/overlay";
import { usePolling } from "@/lib/hooks/usePolling";
import { useSession } from "@/lib/hooks/useSession";
import { getQueue } from "@/lib/services/internalService";
import { assignCase, decideCase, requestInfo } from "@/lib/services/casesService";
import { FeedbackComposer, QaScreen, RatingWorkspace } from "./RatingQa";
import type { CaseStatus, Role } from "@/lib/types";

function Gate({ allow, title, children }: { allow: Role; title: string; children: ReactNode }) {
  const { session, ready } = useSession();
  if (!ready || !session) return <Skeleton className="h-40" />;
  if (session.user.role !== allow) return <Alert tone="warning" title={title}>This section is not part of your role.</Alert>;
  return <>{children}</>;
}

function CaseList({
  rows,
  selected,
  onSelect,
  empty,
}: {
  rows: { id: string; reference: string; who: string; status: CaseStatus; meta: string }[];
  selected: string;
  onSelect: (id: string) => void;
  empty: string;
}) {
  if (!rows.length) return <EmptyState title="Nothing waiting" body={empty} />;
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id}>
          <button type="button" onClick={() => onSelect(row.id)} className={`w-full rounded-2xl border p-3 text-left ${selected === row.id ? "border-lake bg-white" : "border-transparent bg-white hover:border-lake/40"}`}>
            <span className="flex items-center justify-between gap-2">
              <span className="font-semibold">{row.reference}</span>
              <StatusTag status={row.status} />
            </span>
            <span className="mt-1 block text-sm text-ink-soft">{row.who}</span>
            <span className="block text-xs text-ink-soft">{row.meta}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AnalyzeDesk() {
  const { session } = useSession();
  const query = usePolling("queue", getQueue, { intervalMs: 8000 });
  const [selected, setSelected] = useState("");
  return (
    <Gate allow="analyst" title="Analysts only">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analyze</h1>
          <p className="text-sm text-ink-soft">Cases assigned to you. Submit the rating from here.</p>
        </div>
        {query.isLoading && <Skeleton className="h-40" />}
        {query.error && <Alert tone="error" title="Queue unavailable"><button type="button" className="underline" onClick={() => void query.mutate()}>Retry</button></Alert>}
        {query.data && session && (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <CaseList
              selected={selected}
              onSelect={setSelected}
              empty="No cases are assigned to you yet. A reviewer assigns them from Review."
              rows={query.data.cases.filter((item) => item.assignedAnalystId === session.user.id).map((item) => ({
                id: item.id,
                reference: item.reference,
                who: query.data!.users.find((person) => person.id === item.userId)?.name ?? "Unknown",
                status: item.status,
                meta: item.countryName,
              }))}
            />
            {selected ? <RatingWorkspace caseId={selected} /> : <p className="text-sm text-ink-soft">Choose an assigned case to score it.</p>}
          </div>
        )}
      </div>
    </Gate>
  );
}

export function ReviewDesk() {
  const { session } = useSession();
  const query = usePolling("queue", getQueue, { intervalMs: 8000 });
  const [selected, setSelected] = useState("");
  const [analyst, setAnalyst] = useState("");
  const [modal, setModal] = useState<"info" | "approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const intake = (query.data?.cases ?? []).filter((item) => ["payment_received", "under_review", "info_requested", "escalated"].includes(item.status));
  const current = intake.find((item) => item.id === selected) ?? null;

  async function confirm() {
    if (!modal || !session || !current) return;
    if (modal === "info") await requestInfo(current.id, reason, session.user);
    else await decideCase(current.id, modal, reason, session.user);
    setModal(null);
    setReason("");
    setMessage(modal === "info" ? "Information requested." : modal === "approve" ? "Approved." : "Rejected.");
    await query.mutate();
  }

  return (
    <Gate allow="reviewer" title="Reviewers only">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review</h1>
          <p className="text-sm text-ink-soft">Assign unassigned cases, request more information, approve, or reject.</p>
        </div>
        {message && <Alert tone="success">{message}</Alert>}
        {query.isLoading && <Skeleton className="h-40" />}
        {query.data && (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <CaseList
              selected={selected}
              onSelect={(id) => { setSelected(id); setMessage(""); }}
              empty="No cases are waiting on a reviewer decision."
              rows={intake.map((item) => ({
                id: item.id,
                reference: item.reference,
                who: query.data!.users.find((person) => person.id === item.userId)?.name ?? "Unknown",
                status: item.status,
                meta: item.assignedAnalystId ? "Assigned" : "Unassigned",
              }))}
            />
            {current ? (
              <section className="space-y-4 rounded-2xl bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold">{current.reference}</h2>
                    <p className="text-sm text-ink-soft">{current.countryName} · risk {current.riskLevel}</p>
                  </div>
                  <Link className="text-sm font-semibold text-lake-dark" href={`/internal/cases/${current.id}`}>Open case</Link>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <Select aria-label="Assign analyst" value={analyst} onChange={(event) => setAnalyst(event.target.value)} disabled={!!current.assignedAnalystId}>
                    <option value="">{current.assignedAnalystId ? "Already assigned" : "Choose an analyst"}</option>
                    {(query.data?.analysts ?? []).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </Select>
                  <Button type="button" disabled={!analyst || !session || !!current.assignedAnalystId} onClick={() => void assignCase(current.id, analyst, session!.user).then(async () => { setAnalyst(""); setMessage("Assigned."); await query.mutate(); })}>Assign</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => setModal("info")}>Request information</Button>
                  <Button type="button" onClick={() => setModal("approve")}>Approve</Button>
                  <Button type="button" variant="danger" onClick={() => setModal("reject")}>Reject</Button>
                </div>
              </section>
            ) : <p className="text-sm text-ink-soft">Choose an unassigned case.</p>}
          </div>
        )}
        <Modal open={!!modal} title="Confirm action" onClose={() => setModal(null)}>
          <Textarea aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (required)" />
          <Button className="mt-3" type="button" disabled={reason.trim().length < 3} onClick={() => void confirm()}>Confirm</Button>
        </Modal>
      </div>
    </Gate>
  );
}

export function QaDesk() {
  const query = usePolling("queue", getQueue, { intervalMs: 8000 });
  const [selected, setSelected] = useState("");
  const rows = (query.data?.cases ?? []).filter((item) => item.status === "quality_check");
  return (
    <Gate allow="reviewer" title="Reviewers only">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QA</h1>
          <p className="text-sm text-ink-soft">Quality-check the rating, then continue to feedback.</p>
        </div>
        {query.isLoading && <Skeleton className="h-40" />}
        {query.data && (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <CaseList
              selected={selected}
              onSelect={setSelected}
              empty="No cases are in quality check. They arrive after an analyst submits a rating."
              rows={rows.map((item) => ({
                id: item.id,
                reference: item.reference,
                who: query.data!.users.find((person) => person.id === item.userId)?.name ?? "Unknown",
                status: item.status,
                meta: item.countryName,
              }))}
            />
            {selected ? <QaScreen caseId={selected} /> : <p className="text-sm text-ink-soft">Choose a case to review the analyst’s rating.</p>}
          </div>
        )}
      </div>
    </Gate>
  );
}

export function FeedbackDesk() {
  const query = usePolling("queue", getQueue, { intervalMs: 8000 });
  const [selected, setSelected] = useState("");
  const rows = (query.data?.cases ?? []).filter((item) => item.status === "finalized");
  return (
    <Gate allow="reviewer" title="Reviewers only">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
          <p className="text-sm text-ink-soft">After QA approval, write the note the customer receives.</p>
        </div>
        {query.isLoading && <Skeleton className="h-40" />}
        {query.data && (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <CaseList
              selected={selected}
              onSelect={setSelected}
              empty="No cases are waiting on feedback. Approve a case in QA first."
              rows={rows.map((item) => ({
                id: item.id,
                reference: item.reference,
                who: query.data!.users.find((person) => person.id === item.userId)?.name ?? "Unknown",
                status: item.status,
                meta: item.countryName,
              }))}
            />
            {selected ? <FeedbackComposer caseId={selected} /> : <p className="text-sm text-ink-soft">Choose a finalized case to write feedback.</p>}
          </div>
        )}
      </div>
    </Gate>
  );
}
